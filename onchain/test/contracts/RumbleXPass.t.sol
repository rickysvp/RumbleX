// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RumbleXPass} from "../../src/RumbleXPass.sol";

contract RumbleXPassTest is Test {
    RumbleXPass internal pass;

    address internal owner = address(this);
    address internal player = address(0xA11CE);
    address internal minter = address(0xBEEF);

    function setUp() external {
        pass = new RumbleXPass(owner, 1);
    }

    function testMintPassAndHasPass() external {
        assertFalse(pass.hasPass(player));

        uint256 tokenId = pass.mintPass(player, 1);

        assertEq(tokenId, 1);
        assertTrue(pass.hasPass(player));
        assertEq(pass.ownerOf(tokenId), player);
    }

    function testConfiguredMinterCanMint() external {
        pass.setPassMinter(minter);

        vm.prank(minter);
        uint256 tokenId = pass.mintPass(player, 1);

        assertEq(tokenId, 1);
        assertTrue(pass.hasPass(player));
    }
}
