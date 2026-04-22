// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ClaimVault} from "../../src/ClaimVault.sol";

contract ClaimVaultTest is Test {
    ClaimVault internal claimVault;

    address internal claimOperator = address(0xC0FFEE);
    address internal player = address(0xF00D);

    function setUp() external {
        claimVault = new ClaimVault(address(this));
        claimVault.grantProtocolRole(claimVault.CLAIM_OPERATOR_ROLE(), claimOperator);
    }

    function testRecordClaimCreatesAndUpdatesSingleClaimKey() external {
        vm.startPrank(claimOperator);
        claimVault.recordClaim(player, ClaimVault.ClaimType.FallbackRoundPayout, 42, 1 ether);
        claimVault.recordClaim(player, ClaimVault.ClaimType.FallbackRoundPayout, 42, 0.5 ether);
        vm.stopPrank();

        bytes32 key = claimVault.getClaimKey(player, ClaimVault.ClaimType.FallbackRoundPayout, 42);

        (
            address storedPlayer,
            ClaimVault.ClaimType claimType,
            uint256 sourceId,
            uint256 amount,
            bool claimed,
            uint256 createdAt,
            uint256 claimedAt
        ) = claimVault.claimRecords(key);

        assertEq(storedPlayer, player);
        assertEq(uint8(claimType), uint8(ClaimVault.ClaimType.FallbackRoundPayout));
        assertEq(sourceId, 42);
        assertEq(amount, 1.5 ether);
        assertFalse(claimed);
        assertGt(createdAt, 0);
        assertEq(claimedAt, 0);
    }

    function testDifferentClaimTypesProduceDistinctClaimKeys() external view {
        bytes32 fallbackKey = claimVault.getClaimKey(player, ClaimVault.ClaimType.FallbackRoundPayout, 7);
        bytes32 seasonKey = claimVault.getClaimKey(player, ClaimVault.ClaimType.SeasonReward, 7);

        assertTrue(fallbackKey != seasonKey);
    }
}
