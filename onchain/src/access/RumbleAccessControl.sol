// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

abstract contract RumbleAccessControl is AccessControl, Pausable {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant ROUND_OPERATOR_ROLE = keccak256("ROUND_OPERATOR_ROLE");
    bytes32 public constant SETTLEMENT_OPERATOR_ROLE = keccak256("SETTLEMENT_OPERATOR_ROLE");
    bytes32 public constant SEASON_OPERATOR_ROLE = keccak256("SEASON_OPERATOR_ROLE");
    bytes32 public constant CLAIM_OPERATOR_ROLE = keccak256("CLAIM_OPERATOR_ROLE");

    error ZeroAddress();

    event ProtocolRoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event ProtocolRoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    constructor(address owner_) {
        if (owner_ == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, owner_);
        _grantRole(OWNER_ROLE, owner_);
    }

    function grantProtocolRole(bytes32 role, address account) external onlyRole(OWNER_ROLE) {
        _grantRole(role, account);
        emit ProtocolRoleGranted(role, account, msg.sender);
    }

    function revokeProtocolRole(bytes32 role, address account) external onlyRole(OWNER_ROLE) {
        _revokeRole(role, account);
        emit ProtocolRoleRevoked(role, account, msg.sender);
    }

    function pauseProtocol() external onlyRole(OWNER_ROLE) {
        _pause();
    }

    function unpauseProtocol() external onlyRole(OWNER_ROLE) {
        _unpause();
    }
}
