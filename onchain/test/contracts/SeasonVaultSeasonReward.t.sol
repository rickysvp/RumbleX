// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SeasonVault} from "../../src/SeasonVault.sol";
import {ClaimVault} from "../../src/ClaimVault.sol";

contract SeasonVaultSeasonRewardTest is Test {
    SeasonVault internal seasonVault;
    ClaimVault internal claimVault;

    address internal seasonOperator = address(0xA001);
    address internal unauthorizedCaller = address(0xA002);
    address internal roundRoom = address(0xA003);

    address internal alice = address(0xB001);
    address internal bob = address(0xB002);
    address internal carol = address(0xB003);
    address internal dave = address(0xB004);

    function setUp() external {
        seasonVault = new SeasonVault(address(this));
        claimVault = new ClaimVault(address(this));

        seasonVault.setAuthorizedRoundRoom(roundRoom, true);
        seasonVault.setClaimVault(address(claimVault));
        claimVault.setAuthorizedSeasonVault(address(seasonVault), true);

        seasonVault.grantProtocolRole(seasonVault.SEASON_OPERATOR_ROLE(), seasonOperator);
    }

    function testQualificationAndDistributionInvariants() external {
        uint256 seasonId = 1;
        _fundSeason(seasonId, 84 ether);

        vm.prank(seasonOperator);
        seasonVault.configureSeason(seasonId, 10);

        address[] memory players = new address[](4);
        players[0] = alice;
        players[1] = bob;
        players[2] = carol;
        players[3] = dave;

        uint256[] memory kills = new uint256[](4);
        kills[0] = 12;
        kills[1] = 9;
        kills[2] = 20;
        kills[3] = 10;

        vm.prank(seasonOperator);
        seasonVault.assignSeasonRewards(seasonId, players, kills);

        assertEq(seasonVault.assignedRewards(seasonId, alice), 24 ether);
        assertEq(seasonVault.assignedRewards(seasonId, bob), 0);
        assertEq(seasonVault.assignedRewards(seasonId, carol), 40 ether);
        assertEq(seasonVault.assignedRewards(seasonId, dave), 20 ether);

        uint256 sumAssigned = seasonVault.assignedRewards(seasonId, alice)
            + seasonVault.assignedRewards(seasonId, bob) + seasonVault.assignedRewards(seasonId, carol)
            + seasonVault.assignedRewards(seasonId, dave);

        assertEq(sumAssigned + seasonVault.getSeasonBalance(seasonId), 84 ether);

        (, uint256 threshold, bool rewardsAssigned,) = seasonVault.seasons(seasonId);
        assertEq(threshold, 10);
        assertTrue(rewardsAssigned);
    }

    function testNoQualifiedPlayersLeavesPoolUnchanged() external {
        uint256 seasonId = 2;
        _fundSeason(seasonId, 45 ether);

        vm.prank(seasonOperator);
        seasonVault.configureSeason(seasonId, 100);

        address[] memory players = new address[](3);
        players[0] = alice;
        players[1] = bob;
        players[2] = carol;

        uint256[] memory kills = new uint256[](3);
        kills[0] = 10;
        kills[1] = 20;
        kills[2] = 99;

        vm.prank(seasonOperator);
        seasonVault.assignSeasonRewards(seasonId, players, kills);

        assertEq(seasonVault.assignedRewards(seasonId, alice), 0);
        assertEq(seasonVault.assignedRewards(seasonId, bob), 0);
        assertEq(seasonVault.assignedRewards(seasonId, carol), 0);
        assertEq(seasonVault.getSeasonBalance(seasonId), 45 ether);
        assertEq(claimVault.totalClaimableFor(alice), 0);

        (, , bool rewardsAssigned,) = seasonVault.seasons(seasonId);
        assertTrue(rewardsAssigned);
    }

    function testDeterministicProportionalFormula() external {
        uint256 seasonId = 3;
        _fundSeason(seasonId, 100 ether);

        vm.prank(seasonOperator);
        seasonVault.configureSeason(seasonId, 1);

        address[] memory players = new address[](2);
        players[0] = alice;
        players[1] = bob;

        uint256[] memory kills = new uint256[](2);
        kills[0] = 1;
        kills[1] = 3;

        vm.prank(seasonOperator);
        seasonVault.assignSeasonRewards(seasonId, players, kills);

        assertEq(seasonVault.assignedRewards(seasonId, alice), 25 ether);
        assertEq(seasonVault.assignedRewards(seasonId, bob), 75 ether);
        assertEq(seasonVault.getSeasonBalance(seasonId), 0);
    }

    function testSeasonRewardAssignmentSingleShot() external {
        uint256 seasonId = 4;
        _fundSeason(seasonId, 10 ether);

        vm.prank(seasonOperator);
        seasonVault.configureSeason(seasonId, 1);

        address[] memory players = new address[](1);
        players[0] = alice;
        uint256[] memory kills = new uint256[](1);
        kills[0] = 1;

        vm.prank(seasonOperator);
        seasonVault.assignSeasonRewards(seasonId, players, kills);

        vm.prank(seasonOperator);
        vm.expectRevert(SeasonVault.SeasonRewardsAlreadyAssigned.selector);
        seasonVault.assignSeasonRewards(seasonId, players, kills);
    }

    function testSeasonRewardClaimsFlowIntegration() external {
        uint256 seasonId = 5;
        _fundSeason(seasonId, 10 ether);

        vm.prank(seasonOperator);
        seasonVault.configureSeason(seasonId, 1);

        address[] memory players = new address[](3);
        players[0] = alice;
        players[1] = bob;
        players[2] = carol;

        uint256[] memory kills = new uint256[](3);
        kills[0] = 1;
        kills[1] = 1;
        kills[2] = 2;

        vm.prank(seasonOperator);
        seasonVault.assignSeasonRewards(seasonId, players, kills);

        assertEq(seasonVault.assignedRewards(seasonId, alice), 2.5 ether);
        assertEq(seasonVault.assignedRewards(seasonId, bob), 2.5 ether);
        assertEq(seasonVault.assignedRewards(seasonId, carol), 5 ether);
        assertEq(seasonVault.getSeasonBalance(seasonId), 0);

        _assertSeasonClaimRecord(alice, seasonId, 2.5 ether);
        _assertSeasonClaimRecord(bob, seasonId, 2.5 ether);
        _assertSeasonClaimRecord(carol, seasonId, 5 ether);

        _claimAllAndAssert(alice, 2.5 ether);
        _claimAllAndAssert(bob, 2.5 ether);
        _claimAllAndAssert(carol, 5 ether);

        assertEq(claimVault.totalClaimableFor(alice), 0);
        assertEq(claimVault.totalClaimableFor(bob), 0);
        assertEq(claimVault.totalClaimableFor(carol), 0);
        assertEq(seasonVault.getSeasonBalance(seasonId), 0);
    }

    function testAssignSeasonRewardsUnauthorizedCallerReverts() external {
        uint256 seasonId = 6;
        _fundSeason(seasonId, 20 ether);

        vm.prank(seasonOperator);
        seasonVault.configureSeason(seasonId, 1);

        address[] memory players = new address[](1);
        players[0] = alice;
        uint256[] memory kills = new uint256[](1);
        kills[0] = 5;

        vm.prank(unauthorizedCaller);
        vm.expectRevert();
        seasonVault.assignSeasonRewards(seasonId, players, kills);
    }

    function _fundSeason(uint256 seasonId, uint256 amount) internal {
        vm.deal(roundRoom, roundRoom.balance + amount);
        vm.prank(roundRoom);
        seasonVault.receiveSeasonFee{value: amount}(seasonId);
    }

    function _assertSeasonClaimRecord(address player, uint256 seasonId, uint256 expectedAmount) internal view {
        bytes32 key = claimVault.getClaimKey(player, ClaimVault.ClaimType.SeasonReward, seasonId);
        (, , , uint256 amount, bool claimed,,) = claimVault.claimRecords(key);
        assertEq(amount, expectedAmount);
        assertFalse(claimed);
    }

    function _claimAllAndAssert(address player, uint256 expectedAmount) internal {
        uint256 beforeBalance = player.balance;

        vm.prank(player);
        (uint256 totalAmount, uint256 claimedCount) = claimVault.claimAll();

        assertEq(totalAmount, expectedAmount);
        assertEq(claimedCount, 1);
        assertEq(player.balance - beforeBalance, expectedAmount);
    }
}
