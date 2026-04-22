// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {RumbleAccessControl} from "./access/RumbleAccessControl.sol";
import {IRumbleXPass} from "./interfaces/IRumbleXPass.sol";
import {ISeasonVault} from "./interfaces/ISeasonVault.sol";
import {IClaimVault} from "./interfaces/IClaimVault.sol";

contract RoundRoom is RumbleAccessControl, ReentrancyGuard {
    // Canonical round states from 6_DataModalSpec.md
    enum RoundState {
        SignupOpen,
        SignupLocked,
        Live,
        SettlementPending,
        Settled,
        FallbackClaimOpen,
        Closed
    }

    struct Participation {
        bool joined;
        uint256 paidAmount;
    }

    struct ParticipantSettlement {
        address player;
        bool isSurvivor;
        uint256 kills;
        uint256 finalHolding;
        uint256 payoutAmount;
    }

    struct ParticipantResult {
        bool isProcessed;
        bool isSurvivor;
        uint256 kills;
        uint256 finalHolding;
        uint256 payoutAmount;
        bool payoutSent;
        bool fallbackRecorded;
    }

    uint256 public constant MAX_PLAYERS_CAP = 333;
    uint256 public constant PROTOCOL_FEE_BPS = 1000;
    uint256 public constant SEASON_FEE_BPS = 1000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    uint256 public immutable roundId;
    uint256 public immutable seasonId;
    uint256 public immutable entryFee;
    uint256 public immutable maxPlayers;

    address public immutable rumbleXPass;
    address public immutable seasonVault;

    address public claimVault;
    address public protocolTreasury;

    RoundState public state;

    uint256 public settlementVersion;
    uint256 public totalEntryCollected;
    uint256 public protocolFeeAmount;
    uint256 public seasonFeeAmount;
    uint256 public playerPoolAmount;
    uint256 public totalPayoutAssigned;
    uint256 public totalPaidOut;
    uint256 public totalFallbackClaimable;
    bytes32 public settlementResultHash;
    uint256 public totalParticipantsExpected;
    uint256 public totalParticipantsProcessed;

    bool public totalsCommitted;
    bool public settlementFinalized;

    address[] private _participants;
    mapping(address player => Participation) public participationByPlayer;
    mapping(address player => ParticipantResult) public participantResults;

    error InvalidConfig();
    error RoundNotOpen();
    error MissingPass();
    error AlreadyJoined();
    error MaxPlayersReached();
    error IncorrectEntryAmount();
    error SettlementNotPending();
    error SettlementAlreadyFinalized();
    error EmptySettlementBatch();
    error ResultHashMismatch();
    error NonParticipantInSettlement();
    error DuplicateParticipantSettlement();
    error EliminatedNonzeroPayout();
    error NonSurvivorPositivePayout();
    error ProcessedParticipantsOverflow();
    error IncompleteSettlementBatches();
    error PayoutSumMismatch();
    error FallbackConservationMismatch();
    error ProtocolFeeTransferFailed();
    error ClaimVaultNotConfigured();
    error ProtocolTreasuryNotConfigured();
    error SettlementStateImmutable();

    event PlayerJoined(uint256 indexed roundId, address indexed player, uint256 amount);
    event RoundStateUpdated(uint256 indexed roundId, RoundState state);
    event SettlementTargetsUpdated(address indexed claimVault, address indexed protocolTreasury);

    event RoundSettled(
        uint256 indexed roundId,
        bytes32 indexed resultHash,
        uint256 protocolFeeAmount,
        uint256 seasonFeeAmount,
        uint256 playerPoolAmount,
        uint256 totalPaidOut,
        uint256 totalFallbackClaimable
    );
    event PayoutSent(uint256 indexed roundId, address indexed player, uint256 amount);
    event FallbackRecorded(uint256 indexed roundId, address indexed player, uint256 amount);

    constructor(
        address owner_,
        uint256 roundId_,
        uint256 seasonId_,
        uint256 entryFee_,
        uint256 maxPlayers_,
        address rumbleXPass_,
        address seasonVault_,
        address roundOperator_,
        address settlementOperator_
    ) RumbleAccessControl(owner_) {
        if (roundId_ == 0 || seasonId_ == 0 || entryFee_ == 0) revert InvalidConfig();
        if (rumbleXPass_ == address(0) || seasonVault_ == address(0)) revert InvalidConfig();
        if (maxPlayers_ == 0 || maxPlayers_ > MAX_PLAYERS_CAP) revert InvalidConfig();

        roundId = roundId_;
        seasonId = seasonId_;
        entryFee = entryFee_;
        maxPlayers = maxPlayers_;
        rumbleXPass = rumbleXPass_;
        seasonVault = seasonVault_;

        state = RoundState.SignupOpen;

        if (roundOperator_ != address(0)) {
            _grantRole(ROUND_OPERATOR_ROLE, roundOperator_);
        }
        if (settlementOperator_ != address(0)) {
            _grantRole(SETTLEMENT_OPERATOR_ROLE, settlementOperator_);
        }
    }

    function configureSettlementTargets(address claimVault_, address protocolTreasury_) external onlyRole(OWNER_ROLE) {
        if (claimVault_ == address(0) || protocolTreasury_ == address(0)) revert InvalidConfig();

        claimVault = claimVault_;
        protocolTreasury = protocolTreasury_;

        emit SettlementTargetsUpdated(claimVault_, protocolTreasury_);
    }

    function join() external payable whenNotPaused nonReentrant {
        if (state != RoundState.SignupOpen) revert RoundNotOpen();
        if (!IRumbleXPass(rumbleXPass).hasPass(msg.sender)) revert MissingPass();

        Participation storage participation = participationByPlayer[msg.sender];
        if (participation.joined) revert AlreadyJoined();
        if (_participants.length >= maxPlayers) revert MaxPlayersReached();
        if (msg.value != entryFee) revert IncorrectEntryAmount();

        participation.joined = true;
        participation.paidAmount = msg.value;
        _participants.push(msg.sender);

        emit PlayerJoined(roundId, msg.sender, msg.value);
    }

    function participantCount() external view returns (uint256) {
        return _participants.length;
    }

    function participants() external view returns (address[] memory) {
        return _participants;
    }

    function setRoundState(RoundState newState) external onlyRole(ROUND_OPERATOR_ROLE) {
        if (settlementFinalized) revert SettlementStateImmutable();

        state = newState;
        emit RoundStateUpdated(roundId, newState);
    }

    /// @dev Batch settlement flow, enforcing 3_RoundSettlementSpec.md invariants.
    function settleRoundBatch(bytes32 resultHash, ParticipantSettlement[] calldata participantBatch)
        external
        whenNotPaused
        onlyRole(SETTLEMENT_OPERATOR_ROLE)
        nonReentrant
    {
        if (state != RoundState.SettlementPending) revert SettlementNotPending();
        if (settlementFinalized) revert SettlementAlreadyFinalized();
        if (participantBatch.length == 0) revert EmptySettlementBatch();
        if (claimVault == address(0)) revert ClaimVaultNotConfigured();
        if (protocolTreasury == address(0)) revert ProtocolTreasuryNotConfigured();

        if (!totalsCommitted) {
            _commitSettlementTotals(resultHash);
        } else if (resultHash != settlementResultHash) {
            revert ResultHashMismatch();
        }

        _processSettlementBatch(participantBatch);

        if (totalParticipantsProcessed == totalParticipantsExpected) {
            _finalizeSettlement();
        }
    }

    function _commitSettlementTotals(bytes32 resultHash) internal {
        totalParticipantsExpected = _participants.length;

        totalEntryCollected = entryFee * totalParticipantsExpected;
        protocolFeeAmount = (totalEntryCollected * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        seasonFeeAmount = (totalEntryCollected * SEASON_FEE_BPS) / BPS_DENOMINATOR;
        // Keep rounding dust in player pool to preserve exact conservation.
        playerPoolAmount = totalEntryCollected - protocolFeeAmount - seasonFeeAmount;

        if (protocolFeeAmount + seasonFeeAmount + playerPoolAmount != totalEntryCollected) {
            revert PayoutSumMismatch();
        }

        settlementVersion += 1;
        totalsCommitted = true;
        settlementResultHash = resultHash;
    }

    function _processSettlementBatch(ParticipantSettlement[] calldata participantBatch) internal {
        uint256 batchLength = participantBatch.length;

        for (uint256 i = 0; i < batchLength; i++) {
            ParticipantSettlement calldata participant = participantBatch[i];

            if (!participationByPlayer[participant.player].joined) {
                revert NonParticipantInSettlement();
            }

            ParticipantResult storage existing = participantResults[participant.player];
            if (existing.isProcessed) {
                revert DuplicateParticipantSettlement();
            }

            if (!participant.isSurvivor && participant.payoutAmount != 0) {
                revert EliminatedNonzeroPayout();
            }
            if (participant.payoutAmount > 0 && !participant.isSurvivor) {
                revert NonSurvivorPositivePayout();
            }

            existing.isProcessed = true;
            existing.isSurvivor = participant.isSurvivor;
            existing.kills = participant.kills;
            existing.finalHolding = participant.finalHolding;
            existing.payoutAmount = participant.payoutAmount;

            totalParticipantsProcessed += 1;
            if (totalParticipantsProcessed > totalParticipantsExpected) {
                revert ProcessedParticipantsOverflow();
            }

            totalPayoutAssigned += participant.payoutAmount;

            if (participant.payoutAmount == 0) {
                continue;
            }

            (bool sent,) = payable(participant.player).call{value: participant.payoutAmount}("");
            if (sent) {
                existing.payoutSent = true;
                totalPaidOut += participant.payoutAmount;
                emit PayoutSent(roundId, participant.player, participant.payoutAmount);
                continue;
            }

            IClaimVault(claimVault).recordFallbackRoundPayout{value: participant.payoutAmount}(
                participant.player, roundId, participant.payoutAmount
            );

            existing.fallbackRecorded = true;
            totalFallbackClaimable += participant.payoutAmount;
            emit FallbackRecorded(roundId, participant.player, participant.payoutAmount);
        }
    }

    function _finalizeSettlement() internal {
        if (totalParticipantsProcessed != totalParticipantsExpected) {
            revert IncompleteSettlementBatches();
        }

        if (totalPayoutAssigned != playerPoolAmount) {
            revert PayoutSumMismatch();
        }

        if (totalPaidOut + totalFallbackClaimable != playerPoolAmount) {
            revert FallbackConservationMismatch();
        }

        (bool sentProtocol,) = payable(protocolTreasury).call{value: protocolFeeAmount}("");
        if (!sentProtocol) revert ProtocolFeeTransferFailed();

        ISeasonVault(seasonVault).receiveSeasonFee{value: seasonFeeAmount}(seasonId);

        settlementFinalized = true;

        if (totalFallbackClaimable > 0) {
            state = RoundState.FallbackClaimOpen;
        } else {
            state = RoundState.Settled;
        }

        emit RoundStateUpdated(roundId, state);
        emit RoundSettled(
            roundId,
            settlementResultHash,
            protocolFeeAmount,
            seasonFeeAmount,
            playerPoolAmount,
            totalPaidOut,
            totalFallbackClaimable
        );
    }
}
