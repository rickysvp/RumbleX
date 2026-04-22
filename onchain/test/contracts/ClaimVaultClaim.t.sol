// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ClaimVault} from "../../src/ClaimVault.sol";

contract ReentrantClaimAttacker {
    ClaimVault public immutable claimVault;
    bool public attemptedReentry;
    bool public reentrySucceeded;

    constructor(ClaimVault claimVault_) {
        claimVault = claimVault_;
    }

    function attackClaimAll() external {
        claimVault.claimAll();
    }

    receive() external payable {
        if (!attemptedReentry) {
            attemptedReentry = true;
            (bool ok,) = address(claimVault).call(abi.encodeCall(ClaimVault.claimAll, ()));
            reentrySucceeded = ok;
        }
    }
}

contract ClaimVaultClaimFlowTest is Test {
    ClaimVault internal claimVault;

    address internal roundRoom = address(0xAAA0);
    address internal claimOperator = address(0xAAA1);
    address internal player = address(0xAAA2);
    address internal otherPlayer = address(0xAAA3);

    function setUp() external {
        claimVault = new ClaimVault(address(this));

        claimVault.setAuthorizedRoundRoom(roundRoom, true);
        claimVault.grantProtocolRole(claimVault.CLAIM_OPERATOR_ROLE(), claimOperator);

        vm.deal(roundRoom, 100 ether);
    }

    function testSingleClaimSuccessAndClaimableDecrease() external {
        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 1.25 ether}(player, 101, 1.25 ether);

        bytes32 key = claimVault.getClaimKey(player, ClaimVault.ClaimType.FallbackRoundPayout, 101);

        assertEq(claimVault.totalClaimableFor(player), 1.25 ether);

        bytes32[] memory keys = new bytes32[](1);
        keys[0] = key;

        uint256 beforeBalance = player.balance;

        vm.prank(player);
        uint256 totalClaimed = claimVault.claim(keys);

        assertEq(totalClaimed, 1.25 ether);
        assertEq(player.balance - beforeBalance, 1.25 ether);

        (, , , , bool claimed, , uint256 claimedAt) = claimVault.claimRecords(key);
        assertTrue(claimed);
        assertGt(claimedAt, 0);
        assertEq(claimVault.totalClaimableFor(player), 0);
    }

    function testClaimAllMultipleRecords() external {
        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 0.5 ether}(player, 201, 0.5 ether);

        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 1.0 ether}(player, 202, 1.0 ether);

        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 0.25 ether}(player, 203, 0.25 ether);

        assertEq(claimVault.totalClaimableFor(player), 1.75 ether);

        uint256 beforeBalance = player.balance;

        vm.prank(player);
        (uint256 totalAmount, uint256 claimedCount) = claimVault.claimAll();

        assertEq(totalAmount, 1.75 ether);
        assertEq(claimedCount, 3);
        assertEq(player.balance - beforeBalance, 1.75 ether);
        assertEq(claimVault.totalClaimableFor(player), 0);
    }

    function testNoDoubleClaimStrictRevert() external {
        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 0.8 ether}(player, 301, 0.8 ether);

        bytes32 key = claimVault.getClaimKey(player, ClaimVault.ClaimType.FallbackRoundPayout, 301);
        bytes32[] memory keys = new bytes32[](1);
        keys[0] = key;

        vm.prank(player);
        claimVault.claim(keys);

        vm.prank(player);
        vm.expectRevert(abi.encodeWithSelector(ClaimVault.ClaimAlreadyClaimed.selector, key));
        claimVault.claim(keys);

        vm.prank(player);
        vm.expectRevert(ClaimVault.NoClaimableRecords.selector);
        claimVault.claimAll();
    }

    function testReentrancyProtectionClaimAll() external {
        ReentrantClaimAttacker attacker = new ReentrantClaimAttacker(claimVault);

        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 1 ether}(address(attacker), 401, 1 ether);

        uint256 before = address(attacker).balance;
        attacker.attackClaimAll();

        assertEq(address(attacker).balance - before, 1 ether);
        assertTrue(attacker.attemptedReentry());
        assertFalse(attacker.reentrySucceeded());
        assertEq(claimVault.totalClaimableFor(address(attacker)), 0);
    }

    function testClaimOwnershipAndAdminCannotClaimForUser() external {
        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 0.6 ether}(player, 501, 0.6 ether);

        bytes32 key = claimVault.getClaimKey(player, ClaimVault.ClaimType.FallbackRoundPayout, 501);
        bytes32[] memory keys = new bytes32[](1);
        keys[0] = key;

        vm.prank(otherPlayer);
        vm.expectRevert(abi.encodeWithSelector(ClaimVault.ClaimNotOwned.selector, key));
        claimVault.claim(keys);

        vm.expectRevert(abi.encodeWithSelector(ClaimVault.ClaimNotOwned.selector, key));
        claimVault.claim(keys);
    }

    function testAggregationMatchesUnclaimedRecords() external {
        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 0.4 ether}(player, 601, 0.4 ether);

        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 0.9 ether}(player, 602, 0.9 ether);

        vm.prank(roundRoom);
        claimVault.recordFallbackRoundPayout{value: 1.1 ether}(otherPlayer, 603, 1.1 ether);

        assertEq(claimVault.totalClaimableFor(player), 1.3 ether);
        assertEq(claimVault.totalClaimableFor(otherPlayer), 1.1 ether);

        bytes32 key = claimVault.getClaimKey(player, ClaimVault.ClaimType.FallbackRoundPayout, 601);
        bytes32[] memory keys = new bytes32[](1);
        keys[0] = key;

        vm.prank(player);
        claimVault.claim(keys);

        assertEq(claimVault.totalClaimableFor(player), 0.9 ether);

        vm.prank(player);
        claimVault.claimAll();

        assertEq(claimVault.totalClaimableFor(player), 0);
        assertEq(claimVault.totalClaimableFor(otherPlayer), 1.1 ether);
    }
}
