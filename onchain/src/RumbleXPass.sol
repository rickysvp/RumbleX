// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {RumbleAccessControl} from "./access/RumbleAccessControl.sol";

contract RumbleXPass is ERC721, RumbleAccessControl {
    uint256 public nextTokenId = 1;
    uint256 public activeSeasonId;
    address public passMinter;

    mapping(uint256 seasonId => mapping(address player => uint256 tokenId)) public seasonTokenByOwner;
    mapping(uint256 tokenId => uint256 seasonId) public tokenSeason;

    error NotMinter();
    error PassAlreadyMinted(address player, uint256 seasonId);
    error InvalidPlayer();

    event PassMinted(address indexed player, uint256 indexed tokenId, uint256 indexed seasonId);
    event ActiveSeasonUpdated(uint256 indexed seasonId);
    event PassMinterUpdated(address indexed passMinter);

    constructor(address owner_, uint256 initialSeasonId)
        ERC721("RumbleX Pass", "RXPASS")
        RumbleAccessControl(owner_)
    {
        activeSeasonId = initialSeasonId;
    }

    function setActiveSeason(uint256 seasonId) external onlyRole(OWNER_ROLE) {
        activeSeasonId = seasonId;
        emit ActiveSeasonUpdated(seasonId);
    }

    function setPassMinter(address minter) external onlyRole(OWNER_ROLE) {
        passMinter = minter;
        emit PassMinterUpdated(minter);
    }

    function mintPass(address player, uint256 seasonId) external returns (uint256 tokenId) {
        if (!hasRole(OWNER_ROLE, msg.sender) && msg.sender != passMinter) {
            revert NotMinter();
        }
        if (player == address(0)) revert InvalidPlayer();
        if (seasonTokenByOwner[seasonId][player] != 0) {
            revert PassAlreadyMinted(player, seasonId);
        }

        tokenId = nextTokenId++;
        seasonTokenByOwner[seasonId][player] = tokenId;
        tokenSeason[tokenId] = seasonId;

        _safeMint(player, tokenId);

        emit PassMinted(player, tokenId, seasonId);
    }

    /// @dev Canonical on-chain participation gate used by RoundRoom.join().
    function hasPass(address player) public view returns (bool) {
        return seasonTokenByOwner[activeSeasonId][player] != 0;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
