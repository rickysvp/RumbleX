// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRumbleXPass {
    function hasPass(address player) external view returns (bool);
}
