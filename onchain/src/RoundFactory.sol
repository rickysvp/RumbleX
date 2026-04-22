// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RumbleAccessControl} from "./access/RumbleAccessControl.sol";
import {RoundRoom} from "./RoundRoom.sol";

contract RoundFactory is RumbleAccessControl {
    struct RoundInfo {
        uint256 roundId;
        address roomAddress;
        uint256 seasonId;
        uint256 entryFee;
        uint256 maxPlayers;
        uint256 createdAt;
    }

    address public roomOwner;
    address public immutable rumbleXPass;
    address public immutable seasonVault;

    uint256 private _latestRoundId;
    mapping(uint256 roundId => RoundInfo info) public roundInfoById;
    uint256[] private _roundIds;

    error InvalidConfig();

    event RoundCreated(
        uint256 indexed roundId,
        address indexed roomAddress,
        uint256 indexed seasonId,
        uint256 entryFee,
        uint256 maxPlayers
    );
    event RoomOwnerUpdated(address indexed roomOwner);

    constructor(address owner_, address rumbleXPass_, address seasonVault_) RumbleAccessControl(owner_) {
        if (rumbleXPass_ == address(0) || seasonVault_ == address(0)) revert InvalidConfig();

        roomOwner = owner_;
        rumbleXPass = rumbleXPass_;
        seasonVault = seasonVault_;
    }

    function setRoomOwner(address roomOwner_) external onlyRole(OWNER_ROLE) {
        if (roomOwner_ == address(0)) revert InvalidConfig();
        roomOwner = roomOwner_;
        emit RoomOwnerUpdated(roomOwner_);
    }

    function createRound(uint256 seasonId, uint256 entryFee, uint256 maxPlayers, address settlementOperator)
        external
        onlyRole(ROUND_OPERATOR_ROLE)
        whenNotPaused
        returns (uint256 roundId, address roomAddress)
    {
        roundId = ++_latestRoundId;

        RoundRoom room = new RoundRoom({
            owner_: roomOwner,
            roundId_: roundId,
            seasonId_: seasonId,
            entryFee_: entryFee,
            maxPlayers_: maxPlayers,
            rumbleXPass_: rumbleXPass,
            seasonVault_: seasonVault,
            roundOperator_: msg.sender,
            settlementOperator_: settlementOperator
        });

        roomAddress = address(room);

        roundInfoById[roundId] = RoundInfo({
            roundId: roundId,
            roomAddress: roomAddress,
            seasonId: seasonId,
            entryFee: entryFee,
            maxPlayers: maxPlayers,
            createdAt: block.timestamp
        });
        _roundIds.push(roundId);

        emit RoundCreated(roundId, roomAddress, seasonId, entryFee, maxPlayers);
    }

    function getRoundAddress(uint256 roundId) external view returns (address) {
        return roundInfoById[roundId].roomAddress;
    }

    function getLatestRoundId() external view returns (uint256) {
        return _latestRoundId;
    }

    function getRecentRoundIds(uint256 count) external view returns (uint256[] memory ids) {
        uint256 total = _roundIds.length;
        if (count > total) {
            count = total;
        }

        ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = _roundIds[total - 1 - i];
        }
    }
}
