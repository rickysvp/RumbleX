// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2, stdJson} from "forge-std/Script.sol";
import {RumbleXPass} from "../src/RumbleXPass.sol";
import {RoundFactory} from "../src/RoundFactory.sol";
import {RoundRoom} from "../src/RoundRoom.sol";
import {SeasonVault} from "../src/SeasonVault.sol";
import {ClaimVault} from "../src/ClaimVault.sol";

contract RejectingPayoutPlayer {
    function joinRound(address room) external payable {
        RoundRoom(room).join{value: msg.value}();
    }

    receive() external payable {
        revert("NO_DIRECT_PAYOUT");
    }
}

/// @notice Runs a live smoke flow against deployed contracts:
/// pass -> create round -> join -> settle -> fallback claim check -> season reward -> claimAll.
contract SmokeCorePathScript is Script {
    using stdJson for string;

    struct SmokeConfig {
        uint256 ownerKey;
        uint256 playerKey;
        uint256 seasonId;
        uint256 entryFee;
        uint256 maxPlayers;
        address owner;
        address player;
    }

    struct CoreAddresses {
        address pass;
        address seasonVault;
        address claimVault;
        address roundFactory;
        address protocolTreasury;
        uint256 chainId;
    }

    struct SettlementNumbers {
        uint256 totalEntry;
        uint256 seasonFee;
        uint256 fallbackPayout;
        uint256 playerPayout;
    }

    error ChainIdMismatch(uint256 expected, uint256 actual);
    error InvariantFailed(string reason);

    function run() external {
        string memory manifestPath = vm.envOr(
            "DEPLOYMENT_MANIFEST_PATH", string.concat(vm.projectRoot(), "/deployments/monad-testnet.json")
        );
        CoreAddresses memory core = _loadCore(manifestPath);
        if (block.chainid != core.chainId) revert ChainIdMismatch(core.chainId, block.chainid);

        SmokeConfig memory cfg = _loadSmokeConfig();
        if (cfg.owner == address(0) || cfg.player == address(0)) revert InvariantFailed("INVALID_SMOKE_SIGNER");

        RumbleXPass pass = RumbleXPass(core.pass);
        SeasonVault seasonVault = SeasonVault(core.seasonVault);
        ClaimVault claimVault = ClaimVault(core.claimVault);
        RoundFactory factory = RoundFactory(core.roundFactory);

        (uint256 roundId, RoundRoom room, RejectingPayoutPlayer fallbackPlayer) =
            _setupAndJoin(core, cfg, pass, seasonVault, claimVault, factory);
        (uint256 fallbackPayout, uint256 seasonRewardPool) =
            _settleAndAssign(core, cfg, roundId, room, fallbackPlayer, seasonVault, claimVault);
        (uint256 claimedAmount, uint256 claimedCount) = _claimForPlayer(cfg, claimVault);

        if (claimedAmount < seasonRewardPool) revert InvariantFailed("CLAIM_ALL_AMOUNT_MISMATCH");
        if (claimedCount == 0) revert InvariantFailed("CLAIM_ALL_ZERO_COUNT");

        console2.log("Smoke roundId:", roundId);
        console2.log("Smoke room:", address(room));
        console2.log("Fallback claim amount:", fallbackPayout);
        console2.log("Season reward claimed:", claimedAmount);
    }

    function _loadCore(string memory manifestPath) internal view returns (CoreAddresses memory core) {
        string memory json = vm.readFile(manifestPath);
        core.chainId = json.readUint(".chainId");
        core.pass = json.readAddress(".contracts.RumbleXPass.address");
        core.seasonVault = json.readAddress(".contracts.SeasonVault.address");
        core.claimVault = json.readAddress(".contracts.ClaimVault.address");
        core.roundFactory = json.readAddress(".contracts.RoundFactory.address");
        core.protocolTreasury = json.readAddress(".contracts.ProtocolTreasury.address");
    }

    function _loadSmokeConfig() internal view returns (SmokeConfig memory cfg) {
        cfg.ownerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        cfg.playerKey = vm.envUint("SMOKE_PLAYER_PRIVATE_KEY");
        cfg.seasonId = vm.envOr("SMOKE_SEASON_ID", uint256(1));
        cfg.entryFee = vm.envOr("SMOKE_ENTRY_FEE", uint256(0.01 ether));
        cfg.maxPlayers = vm.envOr("SMOKE_MAX_PLAYERS", uint256(10));
        cfg.owner = vm.addr(cfg.ownerKey);
        cfg.player = vm.addr(cfg.playerKey);
    }

    function _setupAndJoin(
        CoreAddresses memory core,
        SmokeConfig memory cfg,
        RumbleXPass pass,
        SeasonVault seasonVault,
        ClaimVault claimVault,
        RoundFactory factory
    ) internal returns (uint256 roundId, RoundRoom room, RejectingPayoutPlayer fallbackPlayer) {
        vm.startBroadcast(cfg.ownerKey);

        pass.setActiveSeason(cfg.seasonId);
        pass.mintPass(cfg.player, cfg.seasonId);

        fallbackPlayer = new RejectingPayoutPlayer();
        pass.mintPass(address(fallbackPlayer), cfg.seasonId);

        address roomAddress;
        (roundId, roomAddress) = factory.createRound(cfg.seasonId, cfg.entryFee, cfg.maxPlayers, cfg.owner);
        room = RoundRoom(roomAddress);

        seasonVault.setAuthorizedRoundRoom(roomAddress, true);
        claimVault.setAuthorizedRoundRoom(roomAddress, true);
        room.configureSettlementTargets(core.claimVault, core.protocolTreasury);

        (bool fundPlayerOk,) = payable(cfg.player).call{value: cfg.entryFee * 2}("");
        if (!fundPlayerOk) revert InvariantFailed("PLAYER_FUNDING_FAILED");

        (bool fundFallbackOk,) = payable(address(fallbackPlayer)).call{value: cfg.entryFee * 2}("");
        if (!fundFallbackOk) revert InvariantFailed("FALLBACK_FUNDING_FAILED");

        vm.stopBroadcast();

        vm.startBroadcast(cfg.playerKey);
        room.join{value: cfg.entryFee}();
        vm.stopBroadcast();
    }

    function _settleAndAssign(
        CoreAddresses memory,
        SmokeConfig memory cfg,
        uint256 roundId,
        RoundRoom room,
        RejectingPayoutPlayer fallbackPlayer,
        SeasonVault seasonVault,
        ClaimVault claimVault
    ) internal returns (uint256 fallbackPayout, uint256 seasonRewardPool) {
        vm.startBroadcast(cfg.ownerKey);

        fallbackPlayer.joinRound{value: cfg.entryFee}(address(room));

        uint256 seasonBefore = seasonVault.getSeasonBalance(cfg.seasonId);

        room.setRoundState(RoundRoom.RoundState.SettlementPending);
        SettlementNumbers memory numbers = _computeSettlementNumbers(cfg.entryFee);
        fallbackPayout = numbers.fallbackPayout;

        RoundRoom.ParticipantSettlement[] memory batch = new RoundRoom.ParticipantSettlement[](2);
        batch[0] = RoundRoom.ParticipantSettlement({
            player: cfg.player,
            isSurvivor: true,
            kills: 2,
            finalHolding: numbers.playerPayout,
            payoutAmount: numbers.playerPayout
        });
        batch[1] = RoundRoom.ParticipantSettlement({
            player: address(fallbackPlayer),
            isSurvivor: true,
            kills: 1,
            finalHolding: fallbackPayout,
            payoutAmount: fallbackPayout
        });

        room.settleRoundBatch(keccak256(abi.encodePacked("SMOKE", roundId, block.number)), batch);

        if (room.totalEntryCollected() != numbers.totalEntry) revert InvariantFailed("ENTRY_TOTAL_MISMATCH");
        if (room.protocolFeeAmount() + room.seasonFeeAmount() + room.playerPoolAmount() != numbers.totalEntry) {
            revert InvariantFailed("FEE_SPLIT_MISMATCH");
        }
        if (room.totalPaidOut() + room.totalFallbackClaimable() != room.playerPoolAmount()) {
            revert InvariantFailed("PAYOUT_CONSERVATION_MISMATCH");
        }
        if (claimVault.totalClaimableFor(address(fallbackPlayer)) != fallbackPayout) {
            revert InvariantFailed("FALLBACK_CLAIM_MISSING");
        }
        if (seasonVault.getSeasonBalance(cfg.seasonId) != seasonBefore + numbers.seasonFee) {
            revert InvariantFailed("SEASON_FEE_NOT_ROUTED");
        }

        seasonRewardPool = _assignSeasonReward(cfg, seasonVault, claimVault);

        vm.stopBroadcast();
    }

    function _assignSeasonReward(SmokeConfig memory cfg, SeasonVault seasonVault, ClaimVault claimVault)
        internal
        returns (uint256 seasonRewardPool)
    {
        seasonRewardPool = seasonVault.getSeasonBalance(cfg.seasonId);
        seasonVault.configureSeason(cfg.seasonId, 1);

        address[] memory seasonPlayers = new address[](1);
        seasonPlayers[0] = cfg.player;

        uint256[] memory seasonKills = new uint256[](1);
        seasonKills[0] = 1;

        seasonVault.assignSeasonRewards(cfg.seasonId, seasonPlayers, seasonKills);

        if (claimVault.totalClaimableFor(cfg.player) < seasonRewardPool) {
            revert InvariantFailed("SEASON_REWARD_NOT_RECORDED");
        }
    }

    function _claimForPlayer(SmokeConfig memory cfg, ClaimVault claimVault)
        internal
        returns (uint256 claimedAmount, uint256 claimedCount)
    {
        vm.startBroadcast(cfg.playerKey);
        uint256 claimableBefore = claimVault.totalClaimableFor(cfg.player);
        (claimedAmount, claimedCount) = claimVault.claimAll();
        vm.stopBroadcast();

        if (claimedAmount != claimableBefore) revert InvariantFailed("CLAIMABLE_DELTA_MISMATCH");
    }

    function _computeSettlementNumbers(uint256 entryFee) internal pure returns (SettlementNumbers memory numbers) {
        numbers.totalEntry = entryFee * 2;
        uint256 protocolFee = (numbers.totalEntry * 1000) / 10000;
        numbers.seasonFee = (numbers.totalEntry * 1000) / 10000;
        uint256 playerPool = numbers.totalEntry - protocolFee - numbers.seasonFee;
        numbers.fallbackPayout = playerPool / 4;
        numbers.playerPayout = playerPool - numbers.fallbackPayout;
    }
}
