// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SeasonVault} from "../../src/SeasonVault.sol";

contract SeasonVaultTest is Test {
    SeasonVault internal seasonVault;

    address internal roundRoom = address(0xABCD);

    function setUp() external {
        seasonVault = new SeasonVault(address(this));
        seasonVault.setAuthorizedRoundRoom(roundRoom, true);
    }

    function testReceiveSeasonFeeUpdatesBalance() external {
        vm.deal(roundRoom, 5 ether);

        vm.prank(roundRoom);
        seasonVault.receiveSeasonFee{value: 1.25 ether}(1);

        assertEq(seasonVault.getSeasonBalance(1), 1.25 ether);
    }
}
