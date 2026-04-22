// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISeasonVault {
    function receiveSeasonFee(uint256 seasonId) external payable;
}
