// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RumbleAccessControl} from "./access/RumbleAccessControl.sol";

contract SeasonVault is RumbleAccessControl {
    mapping(uint256 seasonId => uint256 seasonPoolBalance) public seasonPoolBalance;
    mapping(address room => bool authorized) public authorizedRoundRooms;

    error UnauthorizedSeasonFeeSender();
    error InvalidAmount();

    event SeasonFunded(uint256 indexed seasonId, uint256 amount, address indexed sender);
    event RoundRoomAuthorizationUpdated(address indexed roundRoom, bool authorized);

    constructor(address owner_) RumbleAccessControl(owner_) {}

    function setAuthorizedRoundRoom(address roundRoom, bool authorized) external onlyRole(OWNER_ROLE) {
        authorizedRoundRooms[roundRoom] = authorized;
        emit RoundRoomAuthorizationUpdated(roundRoom, authorized);
    }

    function receiveSeasonFee(uint256 seasonId) external payable whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        if (!authorizedRoundRooms[msg.sender] && !hasRole(ROUND_OPERATOR_ROLE, msg.sender)) {
            revert UnauthorizedSeasonFeeSender();
        }

        seasonPoolBalance[seasonId] += msg.value;
        emit SeasonFunded(seasonId, msg.value, msg.sender);
    }

    function getSeasonBalance(uint256 seasonId) external view returns (uint256) {
        return seasonPoolBalance[seasonId];
    }

    /// @dev TODO: implement deterministic season reward assignment per 5_ContractScopeSpec.md §6.
    function assignSeasonRewards(uint256 /* seasonId */ ) external pure {
        revert("SEASON_REWARD_NOT_IMPLEMENTED");
    }
}
