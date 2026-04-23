import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../..");

export interface ServiceConfig {
  rpcUrl: string;
  chainId: number;
  deploymentManifestPath: string;
  dbPath: string;
  indexerStartBlockOverride: number | null;
  indexerPollIntervalMs: number;
  confirmationBlocks: number;
  staleAfterMs: number;
  apiPort: number;
}

function envNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`Invalid numeric env ${name}: ${value}`);
  return num;
}

function envOptionalNumber(name: string): number | null {
  const value = process.env[name];
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`Invalid numeric env ${name}: ${value}`);
  return num;
}

export function loadConfig(): ServiceConfig {
  const rpcUrl = process.env.MONAD_RPC_URL;
  if (!rpcUrl) {
    throw new Error("MONAD_RPC_URL is required");
  }

  return {
    rpcUrl,
    chainId: envNumber("MONAD_CHAIN_ID", 0),
    deploymentManifestPath:
      process.env.DEPLOYMENT_MANIFEST_PATH ??
      path.join(ROOT_DIR, "onchain", "deployments", "monad-testnet.json"),
    dbPath:
      process.env.INDEXER_DB_PATH ??
      path.join(ROOT_DIR, "services", "indexer-api", "data", "indexer-db.json"),
    indexerStartBlockOverride: envOptionalNumber("INDEXER_START_BLOCK"),
    indexerPollIntervalMs: envNumber("INDEXER_POLL_INTERVAL_MS", 12000),
    confirmationBlocks: envNumber("INDEXER_CONFIRMATION_BLOCKS", 3),
    staleAfterMs: envNumber("INDEXER_STALE_AFTER_MS", 120000),
    apiPort: envNumber("INDEXER_API_PORT", 8787),
  };
}

export function rootDir(): string {
  return ROOT_DIR;
}
