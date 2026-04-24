import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const rpcUrl = "http://127.0.0.1:8545";
const apiUrl = "http://127.0.0.1:8787";

const ownerKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const playerKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

async function main() {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const owner = new ethers.Wallet(ownerKey, provider);
    const player = new ethers.Wallet(playerKey, provider);

    let ownerNonce = await provider.getTransactionCount(owner.address);
    let playerNonce = await provider.getTransactionCount(player.address);

    console.log("Player address:", player.address);

    const manifestPath = path.join(process.cwd(), "onchain/deployments/monad-testnet.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    
    const passAddr = manifest.contracts.RumbleXPass.address;
    const factoryAddr = manifest.contracts.RoundFactory.address;
    const seasonVaultAddr = manifest.contracts.SeasonVault.address;
    const claimVaultAddr = manifest.contracts.ClaimVault.address;
    const protocolTreasuryAddr = manifest.contracts.ProtocolTreasury.address;

    const passAbi = [
        "function mintPass(address to, uint256 seasonId)",
        "function balanceOf(address owner) view returns (uint256)"
    ];
    const factoryAbi = ["function createRound(uint256 seasonId, uint256 entryFee, uint256 maxPlayers, address operator) returns (uint256 roundId, address room)"];
    const roomAbi = [
        "function join() payable", 
        "function configureSettlementTargets(address, address)",
        "function setRoundState(uint8)",
        "function settleRoundBatch(bytes32, tuple(address player, bool isSurvivor, uint256 kills, uint256 finalHolding, uint256 payoutAmount)[])",
        "function participationByPlayer(address) view returns (tuple(bool joined, uint256 joinTime))"
    ];
    const seasonVaultAbi = ["function setAuthorizedRoundRoom(address, bool)", "function configureSeason(uint256, uint256)", "function assignSeasonRewards(uint256, address[], uint256[])"];
    const claimVaultAbi = ["function claimAll() returns (uint256, uint256)", "function totalClaimableFor(address) returns (uint256)"];

    const waitForIndexer = async (checkFn: () => Promise<boolean>, label: string) => {
        console.log(`Waiting for indexer: ${label}...`);
        for (let i = 0; i < 15; i++) {
            try {
                if (await checkFn()) {
                    console.log(`[PASS] ${label}`);
                    return true;
                }
            } catch (e) {}
            await new Promise(r => setTimeout(r, 2000));
        }
        console.log(`[FAIL] ${label} (Timeout)`);
        return false;
    };

    console.log("\n--- STEP 1: Mint Pass ---");
    const passContract = new ethers.Contract(passAddr, passAbi, owner);
    const balance = await passContract.balanceOf(player.address);
    if (balance > 0n) {
        console.log("Player already has a pass.");
    } else {
        await (await passContract.mintPass(player.address, 1, { nonce: ownerNonce++ })).wait();
        console.log("Minted pass on-chain.");
    }
    
    await waitForIndexer(async () => {
        const res = await fetch(`${apiUrl}/me/summary?address=${player.address}`);
        const summary = (await res.json()).data;
        return summary?.hasPass === true;
    }, "Summary shows Pass");

    console.log("\n--- STEP 2: Create & Join Round ---");
    const factory = new ethers.Contract(factoryAddr, factoryAbi, owner);
    const entryFee = ethers.parseEther("0.01");
    
    const tx = await factory.createRound(1, entryFee, 10, owner.address, { nonce: ownerNonce++ });
    await tx.wait();
    
    await waitForIndexer(async () => {
        const res = await fetch(`${apiUrl}/rounds/live`);
        const rounds = (await res.json()).data;
        return rounds && rounds.length > 0;
    }, "API shows live round");

    let res = await fetch(`${apiUrl}/rounds/live`);
    const liveRounds = (await res.json()).data;
    const roundId = liveRounds[liveRounds.length - 1].roundId;
    const roomAddress = liveRounds[liveRounds.length - 1].roomAddress;

    const roomOwner = new ethers.Contract(roomAddress, roomAbi, owner);
    const svOwner = new ethers.Contract(seasonVaultAddr, seasonVaultAbi, owner);
    await (await svOwner.setAuthorizedRoundRoom(roomAddress, true, { nonce: ownerNonce++ })).wait();
    await (await roomOwner.configureSettlementTargets(claimVaultAddr, protocolTreasuryAddr, { nonce: ownerNonce++ })).wait();

    const roomPlayer = new ethers.Contract(roomAddress, roomAbi, player);
    const participation = await roomPlayer.participationByPlayer(player.address);
    if (participation.joined) {
        console.log("Player already joined this round.");
    } else {
        await (await roomPlayer.join({ value: entryFee, nonce: playerNonce++ })).wait();
        console.log("Joined round on-chain.");
    }

    await waitForIndexer(async () => {
        const res = await fetch(`${apiUrl}/rounds/${roundId}`);
        const data = (await res.json()).data;
        return data?.participants.some((p: any) => p.playerAddress.toLowerCase() === player.address.toLowerCase());
    }, "Round details show participant");

    console.log("\n--- STEP 3: Settle Round & Season Rewards ---");
    await (await roomOwner.setRoundState(3, { nonce: ownerNonce++ })).wait(); // SettlementPending

    const batch = [{
        player: player.address,
        isSurvivor: true,
        kills: 1,
        finalHolding: ethers.parseEther("0.008"),
        payoutAmount: ethers.parseEther("0.008")
    }];

    const digest = ethers.keccak256(ethers.toUtf8Bytes("SMOKE" + roundId + Date.now()));
    await (await roomOwner.settleRoundBatch(digest, batch, { nonce: ownerNonce++ })).wait();
    await (await svOwner.configureSeason(1, 1, { nonce: ownerNonce++ })).wait();
    await (await svOwner.assignSeasonRewards(1, [player.address], [1], { nonce: ownerNonce++ })).wait();
    console.log("Settled round and assigned season rewards on-chain.");

    await waitForIndexer(async () => {
        const res = await fetch(`${apiUrl}/me/claims?address=${player.address}`);
        const claims = (await res.json()).data;
        return parseFloat(claims?.claimableTotal) > 0;
    }, "Claims available in API");

    await waitForIndexer(async () => {
        const res = await fetch(`${apiUrl}/me/history?address=${player.address}`);
        const history = (await res.json()).data;
        return history?.length > 0;
    }, "History record created");

    await waitForIndexer(async () => {
        const res = await fetch(`${apiUrl}/me/stats?address=${player.address}`);
        const stats = (await res.json()).data;
        return parseInt(stats?.totalRoundsPlayed) > 0;
    }, "Stats updated");

    await waitForIndexer(async () => {
        const res = await fetch(`${apiUrl}/season/1/rankings`);
        const rankings = (await res.json()).data;
        return rankings && rankings.length > 0;
    }, "Season rankings available");

    console.log("\n--- STEP 4: Claim Rewards ---");
    const cvPlayer = new ethers.Contract(claimVaultAddr, claimVaultAbi, player);
    const claimable = await cvPlayer.totalClaimableFor(player.address);
    if (claimable > 0n) {
        await (await cvPlayer.claimAll({ nonce: playerNonce++ })).wait();
        console.log("Claimed all on-chain.");
    } else {
        console.log("Nothing to claim.");
    }

    await waitForIndexer(async () => {
        const res = await fetch(`${apiUrl}/me/claims?address=${player.address}`);
        const claims = (await res.json()).data;
        return claims?.claimableTotal === "0";
    }, "Claims cleared in API");
}

main().catch(console.error);
