// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RumbleXPass} from "../../src/RumbleXPass.sol";
import {SeasonVault} from "../../src/SeasonVault.sol";
import {ClaimVault} from "../../src/ClaimVault.sol";
import {RoundRoom} from "../../src/RoundRoom.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract RevertingReceiver is IERC721Receiver {
    receive() external payable {
        revert("NO_DIRECT_PAYOUT");
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract RoundRoomSettlementTest is Test {
    uint256 internal constant ENTRY_FEE = 1 ether;

    RumbleXPass internal pass;
    SeasonVault internal seasonVault;
    ClaimVault internal claimVault;
    RoundRoom internal room;

    address internal settlementOperator = address(0xBADA55);
    address internal nonSettlementOperator = address(0xD00D);
    address internal protocolTreasury = address(0xFEE1);

    function setUp() external {
        pass = new RumbleXPass(address(this), 1);
        seasonVault = new SeasonVault(address(this));
        claimVault = new ClaimVault(address(this));

        room = new RoundRoom({
            owner_: address(this),
            roundId_: 1,
            seasonId_: 1,
            entryFee_: ENTRY_FEE,
            maxPlayers_: 333,
            rumbleXPass_: address(pass),
            seasonVault_: address(seasonVault),
            roundOperator_: address(this),
            settlementOperator_: settlementOperator
        });

        room.configureSettlementTargets(address(claimVault), protocolTreasury);
        seasonVault.setAuthorizedRoundRoom(address(room), true);
        claimVault.setAuthorizedRoundRoom(address(room), true);
    }

    function testSettleRoundBatchRevertsForNonSettlementOperator() external {
        address p1 = _joinPlayer(address(0x101));
        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](1);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: p1,
            isSurvivor: true,
            kills: 1,
            finalHolding: 0.8 ether,
            payoutAmount: 0.8 ether
        });

        vm.prank(nonSettlementOperator);
        vm.expectRevert();
        room.settleRoundBatch(keccak256("result-A"), batch);
    }

    function testSettleRoundBatchRevertsIfStateNotSettlementPending() external {
        address p1 = _joinPlayer(address(0x102));

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](1);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: p1,
            isSurvivor: true,
            kills: 1,
            finalHolding: 0.8 ether,
            payoutAmount: 0.8 ether
        });

        vm.prank(settlementOperator);
        vm.expectRevert(RoundRoom.SettlementNotPending.selector);
        room.settleRoundBatch(keccak256("result-B"), batch);
    }

    function testSettleRoundBatchRevertsIfAlreadySettled() external {
        address p1 = _joinPlayer(address(0x103));
        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](1);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: p1,
            isSurvivor: true,
            kills: 2,
            finalHolding: 0.8 ether,
            payoutAmount: 0.8 ether
        });

        vm.prank(settlementOperator);
        room.settleRoundBatch(keccak256("result-C"), batch);

        vm.prank(settlementOperator);
        vm.expectRevert(RoundRoom.SettlementNotPending.selector);
        room.settleRoundBatch(keccak256("result-C2"), batch);
    }

    function testSettleRoundBatchRevertsOnMismatchedResultHashAcrossBatches() external {
        address p1 = _joinPlayer(address(0x1501));
        address p2 = _joinPlayer(address(0x1502));
        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        RoundRoom.ParticipantSettlement[] memory firstBatch = new RoundRoom.ParticipantSettlement[](1);
        firstBatch[0] = RoundRoom.ParticipantSettlement({
            player: p1,
            isSurvivor: true,
            kills: 1,
            finalHolding: 1.6 ether,
            payoutAmount: 1.6 ether
        });

        vm.prank(settlementOperator);
        room.settleRoundBatch(keccak256("result-hash-A"), firstBatch);

        RoundRoom.ParticipantSettlement[] memory secondBatch = new RoundRoom.ParticipantSettlement[](1);
        secondBatch[0] = RoundRoom.ParticipantSettlement({
            player: p2,
            isSurvivor: false,
            kills: 0,
            finalHolding: 0,
            payoutAmount: 0
        });

        vm.prank(settlementOperator);
        vm.expectRevert(RoundRoom.ResultHashMismatch.selector);
        room.settleRoundBatch(keccak256("result-hash-B"), secondBatch);
    }

    function testSettlementFeeSplitAndPayoutInvariant() external {
        address p1 = _joinPlayer(address(0x201));
        address p2 = _joinPlayer(address(0x202));
        address p3 = _joinPlayer(address(0x203));

        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        uint256 expectedEntry = 3 ether;
        uint256 expectedProtocolFee = 0.3 ether;
        uint256 expectedSeasonFee = 0.3 ether;
        uint256 expectedPlayerPool = 2.4 ether;

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](3);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: p1,
            isSurvivor: true,
            kills: 3,
            finalHolding: 1.2 ether,
            payoutAmount: 1.2 ether
        });
        batch[1] = RoundRoom.ParticipantSettlement({
            player: p2,
            isSurvivor: true,
            kills: 2,
            finalHolding: 1.2 ether,
            payoutAmount: 1.2 ether
        });
        batch[2] = RoundRoom.ParticipantSettlement({
            player: p3,
            isSurvivor: false,
            kills: 0,
            finalHolding: 0,
            payoutAmount: 0
        });

        vm.prank(settlementOperator);
        room.settleRoundBatch(keccak256("result-D"), batch);

        assertEq(room.totalEntryCollected(), expectedEntry);
        assertEq(room.protocolFeeAmount(), expectedProtocolFee);
        assertEq(room.seasonFeeAmount(), expectedSeasonFee);
        assertEq(room.playerPoolAmount(), expectedPlayerPool);
        assertEq(room.protocolFeeAmount() + room.seasonFeeAmount() + room.playerPoolAmount(), room.totalEntryCollected());
        assertEq(room.totalPayoutAssigned(), expectedPlayerPool);
        assertEq(room.totalPaidOut() + room.totalFallbackClaimable(), expectedPlayerPool);

        assertEq(seasonVault.getSeasonBalance(1), expectedSeasonFee);
        assertEq(protocolTreasury.balance, expectedProtocolFee);
    }

    function testSettlementRevertsWhenPayoutSumMismatch() external {
        address p1 = _joinPlayer(address(0x301));
        address p2 = _joinPlayer(address(0x302));
        address p3 = _joinPlayer(address(0x303));

        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](3);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: p1,
            isSurvivor: true,
            kills: 3,
            finalHolding: 1 ether,
            payoutAmount: 1 ether
        });
        batch[1] = RoundRoom.ParticipantSettlement({
            player: p2,
            isSurvivor: true,
            kills: 2,
            finalHolding: 1 ether,
            payoutAmount: 1 ether
        });
        batch[2] = RoundRoom.ParticipantSettlement({
            player: p3,
            isSurvivor: false,
            kills: 0,
            finalHolding: 0,
            payoutAmount: 0
        });

        vm.prank(settlementOperator);
        vm.expectRevert(RoundRoom.PayoutSumMismatch.selector);
        room.settleRoundBatch(keccak256("result-E"), batch);
    }

    function testSettlementRevertsForEliminatedNonZeroPayout() external {
        address p1 = _joinPlayer(address(0x401));

        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](1);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: p1,
            isSurvivor: false,
            kills: 0,
            finalHolding: 0,
            payoutAmount: 0.8 ether
        });

        vm.prank(settlementOperator);
        vm.expectRevert(RoundRoom.EliminatedNonzeroPayout.selector);
        room.settleRoundBatch(keccak256("result-F"), batch);
    }

    function testSettlementRevertsForNonParticipantInPayload() external {
        _joinPlayer(address(0x501));

        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](1);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: address(0x9999),
            isSurvivor: true,
            kills: 1,
            finalHolding: 0.8 ether,
            payoutAmount: 0.8 ether
        });

        vm.prank(settlementOperator);
        vm.expectRevert(RoundRoom.NonParticipantInSettlement.selector);
        room.settleRoundBatch(keccak256("result-G"), batch);
    }

    function testFallbackConservationAndClaimRecordedOnTransferFailure() external {
        RevertingReceiver badReceiver = new RevertingReceiver();
        address badPlayer = address(badReceiver);
        address eliminated = _joinPlayer(address(0x602));

        pass.mintPass(badPlayer, 1);
        vm.deal(badPlayer, 10 ether);
        vm.prank(badPlayer);
        room.join{value: ENTRY_FEE}();

        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](2);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: badPlayer,
            isSurvivor: true,
            kills: 4,
            finalHolding: 1.6 ether,
            payoutAmount: 1.6 ether
        });
        batch[1] = RoundRoom.ParticipantSettlement({
            player: eliminated,
            isSurvivor: false,
            kills: 0,
            finalHolding: 0,
            payoutAmount: 0
        });

        vm.prank(settlementOperator);
        room.settleRoundBatch(keccak256("result-H"), batch);

        assertEq(room.totalPaidOut(), 0);
        assertEq(room.totalFallbackClaimable(), 1.6 ether);
        assertEq(room.totalPaidOut() + room.totalFallbackClaimable(), room.playerPoolAmount());

        bytes32 claimKey = claimVault.getClaimKey(badPlayer, ClaimVault.ClaimType.FallbackRoundPayout, 1);
        (
            address player,
            ClaimVault.ClaimType claimType,
            uint256 sourceId,
            uint256 amount,
            bool claimed,
            uint256 createdAt,
            uint256 claimedAt
        ) = claimVault.claimRecords(claimKey);

        assertEq(player, badPlayer);
        assertEq(uint8(claimType), uint8(ClaimVault.ClaimType.FallbackRoundPayout));
        assertEq(sourceId, 1);
        assertEq(amount, 1.6 ether);
        assertFalse(claimed);
        assertGt(createdAt, 0);
        assertEq(claimedAt, 0);
        assertEq(uint8(room.state()), uint8(RoundRoom.RoundState.FallbackClaimOpen));
    }

    function testBatchSafetyAcrossMultipleSettlementBatches() external {
        uint256 count = 100;
        address[] memory players = _joinPlayers(count, 0x1000);

        room.setRoundState(RoundRoom.RoundState.SettlementPending);

        bytes32 resultHash = keccak256("result-I");

        _submitBatch(players, 0, 25, resultHash);
        assertEq(room.totalParticipantsProcessed(), 25);
        assertFalse(room.settlementFinalized());

        _submitBatch(players, 25, 50, resultHash);
        assertEq(room.totalParticipantsProcessed(), 50);
        assertFalse(room.settlementFinalized());

        _submitBatch(players, 50, 75, resultHash);
        assertEq(room.totalParticipantsProcessed(), 75);
        assertFalse(room.settlementFinalized());

        _submitBatch(players, 75, 100, resultHash);

        assertEq(room.totalParticipantsExpected(), 100);
        assertEq(room.totalParticipantsProcessed(), 100);
        assertTrue(room.settlementFinalized());

        assertEq(room.totalEntryCollected(), 100 ether);
        assertEq(room.protocolFeeAmount(), 10 ether);
        assertEq(room.seasonFeeAmount(), 10 ether);
        assertEq(room.playerPoolAmount(), 80 ether);
        assertEq(room.totalPayoutAssigned(), 80 ether);
        assertEq(room.totalPaidOut() + room.totalFallbackClaimable(), 80 ether);

        assertEq(seasonVault.getSeasonBalance(1), 10 ether);
        assertEq(protocolTreasury.balance, 10 ether);
    }

    function _submitBatch(address[] memory players, uint256 start, uint256 end, bytes32 resultHash) internal {
        uint256 size = end - start;
        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](size);

        for (uint256 i = 0; i < size; i++) {
            address player = players[start + i];
            bool survivor = (start + i) < 80;

            batch[i] = RoundRoom.ParticipantSettlement({
                player: player,
                isSurvivor: survivor,
                kills: survivor ? 1 : 0,
                finalHolding: survivor ? 1 ether : 0,
                payoutAmount: survivor ? 1 ether : 0
            });
        }

        vm.prank(settlementOperator);
        room.settleRoundBatch(resultHash, batch);
    }

    function _joinPlayer(address player) internal returns (address) {
        pass.mintPass(player, 1);
        vm.deal(player, 10 ether);

        vm.prank(player);
        room.join{value: ENTRY_FEE}();

        return player;
    }

    function _joinPlayers(uint256 count, uint256 base) internal returns (address[] memory players) {
        players = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            address player = address(uint160(base + i));
            players[i] = _joinPlayer(player);
        }
    }
}
