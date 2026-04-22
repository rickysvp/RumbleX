// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RumbleXPass} from "../../src/RumbleXPass.sol";
import {SeasonVault} from "../../src/SeasonVault.sol";
import {RoundRoom} from "../../src/RoundRoom.sol";

contract RoundRoomJoinTest is Test {
    RumbleXPass internal pass;
    SeasonVault internal seasonVault;
    RoundRoom internal room;

    address internal playerWithPass = address(0xAAA1);
    address internal playerWithoutPass = address(0xAAA2);

    uint256 internal constant ENTRY_FEE = 1 ether;

    function setUp() external {
        pass = new RumbleXPass(address(this), 1);
        seasonVault = new SeasonVault(address(this));

        room = new RoundRoom({
            owner_: address(this),
            roundId_: 1,
            seasonId_: 1,
            entryFee_: ENTRY_FEE,
            maxPlayers_: 333,
            rumbleXPass_: address(pass),
            seasonVault_: address(seasonVault),
            roundOperator_: address(this),
            settlementOperator_: address(this)
        });

        pass.mintPass(playerWithPass, 1);

        vm.deal(playerWithPass, 10 ether);
        vm.deal(playerWithoutPass, 10 ether);
    }

    function testJoinRevertsWithoutPass() external {
        vm.prank(playerWithoutPass);
        vm.expectRevert(RoundRoom.MissingPass.selector);
        room.join{value: ENTRY_FEE}();
    }

    function testJoinRevertsIfAlreadyJoined() external {
        vm.prank(playerWithPass);
        room.join{value: ENTRY_FEE}();

        vm.prank(playerWithPass);
        vm.expectRevert(RoundRoom.AlreadyJoined.selector);
        room.join{value: ENTRY_FEE}();
    }

    function testJoinRevertsWhenStateIsNotSignupOpen() external {
        room.setRoundState(RoundRoom.RoundState.Live);

        vm.prank(playerWithPass);
        vm.expectRevert(RoundRoom.RoundNotOpen.selector);
        room.join{value: ENTRY_FEE}();
    }
}
