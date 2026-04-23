// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RumbleXPass} from "../src/RumbleXPass.sol";
import {SeasonVault} from "../src/SeasonVault.sol";
import {ClaimVault} from "../src/ClaimVault.sol";
import {RoundFactory} from "../src/RoundFactory.sol";

/// @notice Deploys core MVP contracts and writes deployments/<network>.json.
contract DeployCoreScript is Script {
    struct DeployConfig {
        uint256 deployerPrivateKey;
        uint256 expectedChainId;
        uint256 initialSeasonId;
        string network;
        address owner;
        address protocolTreasury;
        address roundOperator;
        address seasonOperator;
        address claimOperator;
        address passMinter;
    }

    struct DeploymentResult {
        address rumbleXPass;
        address seasonVault;
        address claimVault;
        address roundFactory;
        uint256 rumbleXPassStartBlock;
        uint256 seasonVaultStartBlock;
        uint256 claimVaultStartBlock;
        uint256 roundFactoryStartBlock;
    }

    error ChainIdMismatch(uint256 expected, uint256 actual);
    error DeployerMustBeOwner(address deployer, address owner);
    error ZeroAddress(string field);

    function run() external returns (DeploymentResult memory result) {
        DeployConfig memory cfg = _loadConfig();

        if (cfg.protocolTreasury == address(0)) revert ZeroAddress("PROTOCOL_TREASURY");
        if (cfg.owner == address(0)) revert ZeroAddress("OWNER");

        address deployer = vm.addr(cfg.deployerPrivateKey);
        if (deployer != cfg.owner) revert DeployerMustBeOwner(deployer, cfg.owner);
        if (block.chainid != cfg.expectedChainId) revert ChainIdMismatch(cfg.expectedChainId, block.chainid);

        vm.startBroadcast(cfg.deployerPrivateKey);

        RumbleXPass pass = new RumbleXPass(cfg.owner, cfg.initialSeasonId);
        result.rumbleXPass = address(pass);
        result.rumbleXPassStartBlock = block.number;

        SeasonVault seasonVault = new SeasonVault(cfg.owner);
        result.seasonVault = address(seasonVault);
        result.seasonVaultStartBlock = block.number;

        ClaimVault claimVault = new ClaimVault(cfg.owner);
        result.claimVault = address(claimVault);
        result.claimVaultStartBlock = block.number;

        RoundFactory roundFactory = new RoundFactory(cfg.owner, address(pass), address(seasonVault));
        result.roundFactory = address(roundFactory);
        result.roundFactoryStartBlock = block.number;

        // Canonical wiring for season reward -> claim path.
        seasonVault.setClaimVault(address(claimVault));
        claimVault.setAuthorizedSeasonVault(address(seasonVault), true);

        // Minimal MVP operator setup.
        roundFactory.grantProtocolRole(roundFactory.ROUND_OPERATOR_ROLE(), cfg.owner);
        if (cfg.roundOperator != cfg.owner) {
            roundFactory.grantProtocolRole(roundFactory.ROUND_OPERATOR_ROLE(), cfg.roundOperator);
        }

        seasonVault.grantProtocolRole(seasonVault.SEASON_OPERATOR_ROLE(), cfg.owner);
        if (cfg.seasonOperator != cfg.owner) {
            seasonVault.grantProtocolRole(seasonVault.SEASON_OPERATOR_ROLE(), cfg.seasonOperator);
        }

        claimVault.grantProtocolRole(claimVault.CLAIM_OPERATOR_ROLE(), cfg.owner);
        if (cfg.claimOperator != cfg.owner) {
            claimVault.grantProtocolRole(claimVault.CLAIM_OPERATOR_ROLE(), cfg.claimOperator);
        }

        pass.setPassMinter(cfg.passMinter);

        vm.stopBroadcast();

        _writeManifest(cfg, result, deployer);

        console2.log("Deployed RumbleXPass:", result.rumbleXPass);
        console2.log("Deployed SeasonVault:", result.seasonVault);
        console2.log("Deployed ClaimVault:", result.claimVault);
        console2.log("Deployed RoundFactory:", result.roundFactory);
    }

    function _loadConfig() internal view returns (DeployConfig memory cfg) {
        cfg.deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        cfg.expectedChainId = vm.envUint("MONAD_CHAIN_ID");
        cfg.owner = vm.envAddress("OWNER");
        cfg.protocolTreasury = vm.envAddress("PROTOCOL_TREASURY");

        cfg.initialSeasonId = vm.envOr("INITIAL_SEASON_ID", uint256(1));
        cfg.network = vm.envOr("NETWORK_NAME", string("monad-testnet"));
        cfg.roundOperator = vm.envOr("ROUND_OPERATOR", cfg.owner);
        cfg.seasonOperator = vm.envOr("SEASON_OPERATOR", cfg.owner);
        cfg.claimOperator = vm.envOr("CLAIM_OPERATOR", cfg.owner);
        cfg.passMinter = vm.envOr("PASS_MINTER", cfg.owner);
    }

    function _writeManifest(DeployConfig memory cfg, DeploymentResult memory result, address deployer) internal {
        string memory deploymentDir = string.concat(vm.projectRoot(), "/deployments");
        vm.createDir(deploymentDir, true);
        string memory path = string.concat(deploymentDir, "/", cfg.network, ".json");
        string memory contractsJson = string.concat(
            _contractWithBlock("RumbleXPass", result.rumbleXPass, result.rumbleXPassStartBlock, true),
            _contractWithBlock("SeasonVault", result.seasonVault, result.seasonVaultStartBlock, true),
            _contractWithBlock("ClaimVault", result.claimVault, result.claimVaultStartBlock, true),
            _contractWithBlock("RoundFactory", result.roundFactory, result.roundFactoryStartBlock, true),
            _contractNoBlock("ProtocolTreasury", cfg.protocolTreasury, false)
        );

        string memory rolesJson = string.concat(
            _roleField("owner", cfg.owner, true),
            _roleField("roundOperator", cfg.roundOperator, true),
            _roleField("seasonOperator", cfg.seasonOperator, true),
            _roleField("claimOperator", cfg.claimOperator, true),
            _roleField("passMinter", cfg.passMinter, false)
        );

        string memory manifest = string.concat(
            "{\n",
            '  "network": "',
            cfg.network,
            '",\n',
            '  "chainId": ',
            vm.toString(block.chainid),
            ",\n",
            '  "deployer": "',
            vm.toString(deployer),
            '",\n',
            '  "owner": "',
            vm.toString(cfg.owner),
            '",\n',
            '  "generatedAtBlock": ',
            vm.toString(block.number),
            ",\n",
            '  "contracts": {\n',
            contractsJson,
            "  },\n",
            '  "roles": {\n',
            rolesJson,
            "  }\n",
            "}\n"
        );

        vm.writeFile(path, manifest);

        console2.log("Wrote deployment manifest:", path);
    }

    function _contractWithBlock(string memory name, address value, uint256 startBlock, bool trailingComma)
        internal
        view
        returns (string memory)
    {
        return string.concat(
            '    "',
            name,
            '": {\n',
            '      "address": "',
            vm.toString(value),
            '",\n',
            '      "startBlock": ',
            vm.toString(startBlock),
            "\n",
            trailingComma ? "    },\n" : "    }\n"
        );
    }

    function _contractNoBlock(string memory name, address value, bool trailingComma)
        internal
        view
        returns (string memory)
    {
        return string.concat(
            '    "',
            name,
            '": {\n',
            '      "address": "',
            vm.toString(value),
            '"\n',
            trailingComma ? "    },\n" : "    }\n"
        );
    }

    function _roleField(string memory name, address value, bool trailingComma) internal view returns (string memory) {
        return string.concat(
            '    "',
            name,
            '": "',
            vm.toString(value),
            trailingComma ? "\",\n" : "\"\n"
        );
    }
}
