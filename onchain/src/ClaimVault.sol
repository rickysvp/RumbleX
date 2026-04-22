// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {RumbleAccessControl} from "./access/RumbleAccessControl.sol";

contract ClaimVault is RumbleAccessControl, ReentrancyGuard {
    // Canonical claim types from 6_DataModalSpec.md:
    // fallback_round_payout, season_reward
    enum ClaimType {
        FallbackRoundPayout,
        SeasonReward
    }

    struct ClaimRecord {
        address player;
        ClaimType claimType;
        uint256 sourceId;
        uint256 amount;
        bool claimed;
        uint256 createdAt;
        uint256 claimedAt;
    }

    mapping(bytes32 claimKey => ClaimRecord) public claimRecords;
    mapping(address roundRoom => bool authorized) public authorizedRoundRooms;

    mapping(address player => bytes32[] claimKeys) private _playerClaimKeys;
    mapping(bytes32 claimKey => bool tracked) private _claimKeyTracked;

    error InvalidClaimInput();
    error ClaimAlreadyFinalized(bytes32 claimKey);
    error UnauthorizedClaimRecorder();
    error InvalidFundedAmount();
    error EmptyClaimKeys();
    error ClaimNotOwned(bytes32 claimKey);
    error ClaimAlreadyClaimed(bytes32 claimKey);
    error InvalidClaimAmount(bytes32 claimKey);
    error NoClaimableRecords();
    error ClaimTransferFailed();

    // Canonical indexer-facing event shape.
    event ClaimRecorded(address indexed player, uint8 indexed claimType, uint256 indexed sourceId, uint256 amount);

    event Claimed(address indexed player, uint256 totalAmount, uint256 claimedCount);
    event ClaimAll(address indexed player, uint256 totalAmount, uint256 claimedCount);

    event RoundRoomAuthorizationUpdated(address indexed roundRoom, bool authorized);

    constructor(address owner_) RumbleAccessControl(owner_) {}

    function getClaimKey(address player, ClaimType claimType, uint256 sourceId) public pure returns (bytes32) {
        return keccak256(abi.encode(player, claimType, sourceId));
    }

    function setAuthorizedRoundRoom(address roundRoom, bool authorized) external onlyRole(OWNER_ROLE) {
        authorizedRoundRooms[roundRoom] = authorized;
        emit RoundRoomAuthorizationUpdated(roundRoom, authorized);
    }

    function getPlayerClaimKeys(address player) external view returns (bytes32[] memory) {
        return _playerClaimKeys[player];
    }

    function totalClaimableFor(address player) external view returns (uint256 total) {
        bytes32[] storage keys = _playerClaimKeys[player];

        for (uint256 i = 0; i < keys.length; i++) {
            ClaimRecord storage record = claimRecords[keys[i]];
            if (!record.claimed) {
                total += record.amount;
            }
        }
    }

    function recordClaim(address player, ClaimType claimType, uint256 sourceId, uint256 amount)
        external
        onlyRole(CLAIM_OPERATOR_ROLE)
        whenNotPaused
        returns (bytes32)
    {
        return _recordClaim(player, claimType, sourceId, amount);
    }

    function recordFallbackRoundPayout(address player, uint256 roundId, uint256 amount)
        external
        payable
        whenNotPaused
        returns (bytes32)
    {
        if (!authorizedRoundRooms[msg.sender] && !hasRole(CLAIM_OPERATOR_ROLE, msg.sender)) {
            revert UnauthorizedClaimRecorder();
        }
        if (msg.value != amount || amount == 0) revert InvalidFundedAmount();

        return _recordClaim(player, ClaimType.FallbackRoundPayout, roundId, amount);
    }

    function claim(bytes32[] calldata claimKeys) external nonReentrant whenNotPaused returns (uint256 totalPayout) {
        if (claimKeys.length == 0) revert EmptyClaimKeys();

        uint256 claimCount = claimKeys.length;

        for (uint256 i = 0; i < claimCount; i++) {
            bytes32 key = claimKeys[i];
            ClaimRecord storage record = claimRecords[key];

            if (record.player != msg.sender) revert ClaimNotOwned(key);
            if (record.claimed) revert ClaimAlreadyClaimed(key);
            if (record.amount == 0) revert InvalidClaimAmount(key);

            totalPayout += record.amount;
        }

        for (uint256 i = 0; i < claimCount; i++) {
            ClaimRecord storage record = claimRecords[claimKeys[i]];
            record.claimed = true;
            record.claimedAt = block.timestamp;
        }

        (bool sent,) = payable(msg.sender).call{value: totalPayout}("");
        if (!sent) revert ClaimTransferFailed();

        emit Claimed(msg.sender, totalPayout, claimCount);
    }

    function claimAll() external nonReentrant whenNotPaused returns (uint256 totalPayout, uint256 claimedCount) {
        bytes32[] storage keys = _playerClaimKeys[msg.sender];
        uint256 length = keys.length;

        for (uint256 i = 0; i < length; i++) {
            ClaimRecord storage record = claimRecords[keys[i]];
            if (record.claimed || record.amount == 0) continue;

            totalPayout += record.amount;
            claimedCount += 1;

            record.claimed = true;
            record.claimedAt = block.timestamp;
        }

        if (claimedCount == 0) revert NoClaimableRecords();

        (bool sent,) = payable(msg.sender).call{value: totalPayout}("");
        if (!sent) revert ClaimTransferFailed();

        emit ClaimAll(msg.sender, totalPayout, claimedCount);
    }

    function _recordClaim(address player, ClaimType claimType, uint256 sourceId, uint256 amount)
        internal
        returns (bytes32 claimKey)
    {
        if (player == address(0) || sourceId == 0 || amount == 0) revert InvalidClaimInput();

        claimKey = getClaimKey(player, claimType, sourceId);
        ClaimRecord storage record = claimRecords[claimKey];

        if (record.player == address(0)) {
            claimRecords[claimKey] = ClaimRecord({
                player: player,
                claimType: claimType,
                sourceId: sourceId,
                amount: amount,
                claimed: false,
                createdAt: block.timestamp,
                claimedAt: 0
            });

            if (!_claimKeyTracked[claimKey]) {
                _claimKeyTracked[claimKey] = true;
                _playerClaimKeys[player].push(claimKey);
            }

            emit ClaimRecorded(player, uint8(claimType), sourceId, amount);
            return claimKey;
        }

        if (record.claimed) revert ClaimAlreadyFinalized(claimKey);

        record.amount += amount;
        emit ClaimRecorded(player, uint8(claimType), sourceId, amount);
    }

    /// @dev TODO: extend claimAll to paged mode if per-user record count approaches block gas limits.
}
