// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {RumbleAccessControl} from "./access/RumbleAccessControl.sol";
import {IClaimVault} from "./interfaces/IClaimVault.sol";

contract SeasonVault is RumbleAccessControl, ReentrancyGuard {
    struct SeasonState {
        uint256 poolBalance;
        uint256 qualificationThreshold;
        bool rewardsAssigned;
        bool closed;
    }

    struct AssignmentContext {
        uint256 seasonId;
        uint256 threshold;
        uint256 totalValue;
        uint256 totalQualifiedKills;
    }

    mapping(uint256 seasonId => uint256 seasonPoolBalance) public seasonPoolBalance;
    mapping(uint256 seasonId => SeasonState season) public seasons;
    mapping(uint256 seasonId => mapping(address player => uint256 reward)) public assignedRewards;
    mapping(address room => bool authorized) public authorizedRoundRooms;

    address public claimVault;

    error UnauthorizedSeasonFeeSender();
    error UnauthorizedSeasonConfigurator();
    error InvalidAmount();
    error InvalidClaimVault();
    error InvalidArrayLength();
    error InvalidPlayer();
    error DuplicatePlayerInput();
    error SeasonRewardsAlreadyAssigned();
    error ClaimVaultNotConfigured();

    event SeasonFunded(uint256 indexed seasonId, uint256 amount, address indexed sender);
    event RoundRoomAuthorizationUpdated(address indexed roundRoom, bool authorized);
    event ClaimVaultUpdated(address indexed claimVault);
    event SeasonConfigured(uint256 indexed seasonId, uint256 qualificationThreshold);
    event QualificationThresholdUpdated(uint256 indexed seasonId, uint256 qualificationThreshold);
    event SeasonRewardsAssigned(
        uint256 indexed seasonId,
        uint256 qualificationThreshold,
        uint256 totalValue,
        uint256 totalQualifiedKills,
        uint256 sumAssigned,
        uint256 remainder
    );
    event SeasonRewardEntitlement(
        uint256 indexed seasonId, address indexed player, uint256 totalKills, uint256 rewardAmount
    );

    constructor(address owner_) RumbleAccessControl(owner_) {}

    modifier onlySeasonConfigurator() {
        if (!hasRole(OWNER_ROLE, msg.sender) && !hasRole(SEASON_OPERATOR_ROLE, msg.sender)) {
            revert UnauthorizedSeasonConfigurator();
        }
        _;
    }

    function setAuthorizedRoundRoom(address roundRoom, bool authorized) external onlyRole(OWNER_ROLE) {
        authorizedRoundRooms[roundRoom] = authorized;
        emit RoundRoomAuthorizationUpdated(roundRoom, authorized);
    }

    function setClaimVault(address claimVault_) external onlyRole(OWNER_ROLE) {
        if (claimVault_ == address(0)) revert InvalidClaimVault();
        claimVault = claimVault_;
        emit ClaimVaultUpdated(claimVault_);
    }

    function configureSeason(uint256 seasonId, uint256 qualificationThreshold) external onlySeasonConfigurator {
        SeasonState storage season = seasons[seasonId];
        season.qualificationThreshold = qualificationThreshold;

        emit SeasonConfigured(seasonId, qualificationThreshold);
    }

    function setQualificationThreshold(uint256 seasonId, uint256 threshold) external onlySeasonConfigurator {
        seasons[seasonId].qualificationThreshold = threshold;
        emit QualificationThresholdUpdated(seasonId, threshold);
    }

    function receiveSeasonFee(uint256 seasonId) external payable whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (!authorizedRoundRooms[msg.sender] && !hasRole(ROUND_OPERATOR_ROLE, msg.sender)) {
            revert UnauthorizedSeasonFeeSender();
        }

        SeasonState storage season = seasons[seasonId];
        season.poolBalance += msg.value;
        seasonPoolBalance[seasonId] += msg.value;
        emit SeasonFunded(seasonId, msg.value, msg.sender);
    }

    function getSeasonBalance(uint256 seasonId) external view returns (uint256) {
        return seasons[seasonId].poolBalance;
    }

    /// @dev Deterministic proportional assignment, see 5_ContractScopeSpec.md §6.
    function assignSeasonRewards(uint256 seasonId, address[] calldata players, uint256[] calldata totalKills)
        external
        onlyRole(SEASON_OPERATOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        if (players.length != totalKills.length) revert InvalidArrayLength();

        SeasonState storage season = seasons[seasonId];
        if (season.rewardsAssigned) revert SeasonRewardsAlreadyAssigned();

        uint256 threshold = season.qualificationThreshold;
        _validatePlayersUnique(players);

        uint256 totalValue = season.poolBalance;
        uint256 totalQualifiedKills = _computeQualifiedKills(totalKills, threshold);

        if (totalQualifiedKills == 0 || totalValue == 0) {
            season.rewardsAssigned = true;
            emit SeasonRewardsAssigned(seasonId, threshold, totalValue, totalQualifiedKills, 0, totalValue);
            return;
        }

        if (claimVault == address(0)) revert ClaimVaultNotConfigured();

        AssignmentContext memory context = AssignmentContext({
            seasonId: seasonId,
            threshold: threshold,
            totalValue: totalValue,
            totalQualifiedKills: totalQualifiedKills
        });
        uint256 sumAssigned = _assignQualifiedRewards(context, players, totalKills);

        uint256 remainder = totalValue - sumAssigned;
        season.poolBalance = remainder;
        seasonPoolBalance[seasonId] = remainder;
        season.rewardsAssigned = true;

        emit SeasonRewardsAssigned(seasonId, threshold, totalValue, totalQualifiedKills, sumAssigned, remainder);
    }

    function _validatePlayersUnique(address[] calldata players) internal pure {
        uint256 playerCount = players.length;

        for (uint256 i = 0; i < playerCount; i++) {
            if (players[i] == address(0)) revert InvalidPlayer();
            for (uint256 j = i + 1; j < playerCount; j++) {
                if (players[i] == players[j]) revert DuplicatePlayerInput();
            }
        }
    }

    function _computeQualifiedKills(uint256[] calldata totalKills, uint256 threshold)
        internal
        pure
        returns (uint256 totalQualifiedKills)
    {
        uint256 playerCount = totalKills.length;
        for (uint256 i = 0; i < playerCount; i++) {
            if (totalKills[i] >= threshold) {
                totalQualifiedKills += totalKills[i];
            }
        }
    }

    function _assignQualifiedRewards(
        AssignmentContext memory context,
        address[] calldata players,
        uint256[] calldata totalKills
    ) internal returns (uint256 sumAssigned) {
        uint256 playerCount = players.length;
        for (uint256 i = 0; i < playerCount; i++) {
            uint256 kills = totalKills[i];
            if (kills < context.threshold) continue;

            uint256 reward = (context.totalValue * kills) / context.totalQualifiedKills;
            assignedRewards[context.seasonId][players[i]] = reward;
            sumAssigned += reward;

            emit SeasonRewardEntitlement(context.seasonId, players[i], kills, reward);

            if (reward > 0) {
                IClaimVault(claimVault).recordSeasonReward{value: reward}(players[i], context.seasonId, reward);
            }
        }
    }

    /// @dev TODO: add season close and rollover governance workflow.
}
