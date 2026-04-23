// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2, stdJson} from "forge-std/Script.sol";
import {RoundFactory} from "../src/RoundFactory.sol";
import {RoundRoom} from "../src/RoundRoom.sol";
import {SeasonVault} from "../src/SeasonVault.sol";
import {ClaimVault} from "../src/ClaimVault.sol";

/// @notice Creates one round from deployed core contracts and wires room auth/config.
contract CreateInitialRoundScript is Script {
    using stdJson for string;

    struct CoreAddresses {
        address roundFactory;
        address seasonVault;
        address claimVault;
        address protocolTreasury;
        uint256 chainId;
        string network;
    }

    error ChainIdMismatch(uint256 expected, uint256 actual);
    error InvalidManifestPath();
    error ZeroAddress(string field);

    function run() external returns (uint256 roundId, address roomAddress) {
        string memory manifestPath = vm.envOr(
            "DEPLOYMENT_MANIFEST_PATH", string.concat(vm.projectRoot(), "/deployments/monad-testnet.json")
        );
        if (bytes(manifestPath).length == 0) revert InvalidManifestPath();

        CoreAddresses memory core = _loadCoreAddresses(manifestPath);

        if (block.chainid != core.chainId) revert ChainIdMismatch(core.chainId, block.chainid);
        if (core.roundFactory == address(0)) revert ZeroAddress("RoundFactory");
        if (core.seasonVault == address(0)) revert ZeroAddress("SeasonVault");
        if (core.claimVault == address(0)) revert ZeroAddress("ClaimVault");
        if (core.protocolTreasury == address(0)) revert ZeroAddress("ProtocolTreasury");

        uint256 ownerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 seasonId = vm.envUint("ROUND_SEASON_ID");
        uint256 entryFee = vm.envUint("ROUND_ENTRY_FEE");
        uint256 maxPlayers = vm.envOr("ROUND_MAX_PLAYERS", uint256(333));
        address settlementOperator = vm.envOr("ROUND_SETTLEMENT_OPERATOR", vm.addr(ownerKey));

        vm.startBroadcast(ownerKey);

        (roundId, roomAddress) =
            RoundFactory(core.roundFactory).createRound(seasonId, entryFee, maxPlayers, settlementOperator);

        SeasonVault(core.seasonVault).setAuthorizedRoundRoom(roomAddress, true);
        ClaimVault(core.claimVault).setAuthorizedRoundRoom(roomAddress, true);
        RoundRoom(roomAddress).configureSettlementTargets(core.claimVault, core.protocolTreasury);

        vm.stopBroadcast();

        _writeRoundOutput(core.network, core.chainId, roundId, roomAddress, seasonId, entryFee, maxPlayers);

        console2.log("Created roundId:", roundId);
        console2.log("RoundRoom:", roomAddress);
    }

    function _loadCoreAddresses(string memory manifestPath) internal view returns (CoreAddresses memory core) {
        string memory json = vm.readFile(manifestPath);

        core.network = json.readString(".network");
        core.chainId = json.readUint(".chainId");
        core.roundFactory = json.readAddress(".contracts.RoundFactory.address");
        core.seasonVault = json.readAddress(".contracts.SeasonVault.address");
        core.claimVault = json.readAddress(".contracts.ClaimVault.address");
        core.protocolTreasury = json.readAddress(".contracts.ProtocolTreasury.address");
    }

    function _writeRoundOutput(
        string memory network,
        uint256 chainId,
        uint256 roundId,
        address roomAddress,
        uint256 seasonId,
        uint256 entryFee,
        uint256 maxPlayers
    ) internal {
        string memory deploymentDir = string.concat(vm.projectRoot(), "/deployments");
        vm.createDir(deploymentDir, true);

        string memory root = "initialRound";
        root.serialize("network", network);
        root.serialize("chainId", chainId);
        root.serialize("roundId", roundId);
        root.serialize("roomAddress", roomAddress);
        root.serialize("seasonId", seasonId);
        root.serialize("entryFee", entryFee);
        string memory finalJson = root.serialize("maxPlayers", maxPlayers);

        string memory path =
            string.concat(deploymentDir, "/", network, ".round-", vm.toString(roundId), ".json");
        finalJson.write(path);
        console2.log("Wrote round output:", path);
    }
}
