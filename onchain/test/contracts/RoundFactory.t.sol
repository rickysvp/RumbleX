// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RumbleXPass} from "../../src/RumbleXPass.sol";
import {SeasonVault} from "../../src/SeasonVault.sol";
import {RoundFactory} from "../../src/RoundFactory.sol";

contract RoundFactoryTest is Test {
    RumbleXPass internal pass;
    SeasonVault internal seasonVault;
    RoundFactory internal factory;

    address internal roundOperator = address(0xA0);
    address internal settlementOperator = address(0xB0);

    function setUp() external {
        pass = new RumbleXPass(address(this), 1);
        seasonVault = new SeasonVault(address(this));
        factory = new RoundFactory(address(this), address(pass), address(seasonVault));

        factory.grantProtocolRole(factory.ROUND_OPERATOR_ROLE(), roundOperator);
    }

    function testCreateRoundAssignsUniqueRoundIdsAndRoomAddresses() external {
        vm.prank(roundOperator);
        (uint256 firstRoundId, address firstRoom) =
            factory.createRound(1, 1 ether, 333, settlementOperator);

        vm.prank(roundOperator);
        (uint256 secondRoundId, address secondRoom) =
            factory.createRound(1, 1 ether, 333, settlementOperator);

        assertEq(firstRoundId, 1);
        assertEq(secondRoundId, 2);
        assertTrue(firstRoom != address(0));
        assertTrue(secondRoom != address(0));
        assertTrue(firstRoom != secondRoom);

        assertEq(factory.getRoundAddress(1), firstRoom);
        assertEq(factory.getRoundAddress(2), secondRoom);
        assertEq(factory.getLatestRoundId(), 2);
    }
}
