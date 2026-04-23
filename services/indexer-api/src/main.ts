import dotenv from "dotenv";
import { loadConfig } from "./config";
import { ChainContext } from "./contracts/chain";
import { loadDeploymentsManifest } from "./contracts/manifest";
import { IndexerService } from "./indexer/indexer";
import { JsonStore } from "./models/store";
import { createApiServer } from "./api/server";

dotenv.config();

async function main() {
  const config = loadConfig();
  const manifest = loadDeploymentsManifest(config.deploymentManifestPath);

  if (config.chainId && manifest.chainId && config.chainId !== manifest.chainId) {
    throw new Error(
      `MONAD_CHAIN_ID (${config.chainId}) does not match deployment manifest chainId (${manifest.chainId})`
    );
  }

  const chain = new ChainContext(config.rpcUrl, config.chainId || manifest.chainId, manifest);
  const deploymentValidation = await chain.validateManifestContracts();

  const startBlockFromManifest =
    manifest.contracts.RoundFactory.startBlock ??
    manifest.contracts.RumbleXPass.startBlock ??
    manifest.contracts.SeasonVault.startBlock ??
    manifest.contracts.ClaimVault.startBlock ??
    0;

  const startBlock =
    config.indexerStartBlockOverride !== null
      ? config.indexerStartBlockOverride
      : Math.max(0, startBlockFromManifest);

  const store = new JsonStore(config.dbPath, config.chainId || manifest.chainId, startBlock);

  const indexer = new IndexerService(store, chain, {
    startBlock,
    confirmationBlocks: config.confirmationBlocks,
    pollIntervalMs: config.indexerPollIntervalMs,
  });

  await indexer.start();

  const app = createApiServer(store, chain, { staleAfterMs: config.staleAfterMs });
  app.listen(config.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log(`[indexer-api] listening on :${config.apiPort}`);
    // eslint-disable-next-line no-console
    console.log(`[indexer-api] using manifest: ${config.deploymentManifestPath}`);
    // eslint-disable-next-line no-console
    console.log(`[indexer-api] using db: ${config.dbPath}`);
    // eslint-disable-next-line no-console
    console.log(`[indexer-api] rpc chainId: ${deploymentValidation.chainId}`);
    for (const item of deploymentValidation.contracts) {
      // eslint-disable-next-line no-console
      console.log(
        `[indexer-api] contract ${item.name} @ ${item.address} code=${item.hasCode ? "present" : "missing"}`
      );
    }
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[indexer-api] fatal error", error);
  process.exit(1);
});
