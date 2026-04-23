#!/usr/bin/env tsx
/**
 * scripts/validate-manifest.ts
 *
 * Validates the deployment manifest (onchain/deployments/monad-testnet.json)
 * against the live chain before the indexer or frontend starts.
 *
 * Checks:
 *   1. Required env vars are present (MONAD_RPC_URL, MONAD_CHAIN_ID).
 *   2. chainId in manifest matches expected chain.
 *   3. Every primary contract entry has a non-empty startBlock.
 *   4. Every contract address has deployed bytecode (getCode != "0x").
 *
 * Usage:
 *   npx tsx scripts/validate-manifest.ts
 *
 * Env vars (honours root .env.local via dotenv):
 *   MONAD_RPC_URL      — required
 *   MONAD_CHAIN_ID     — required (numeric string, e.g. "10143")
 *   DEPLOYMENT_MANIFEST_PATH — optional override for manifest file path
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Load .env.local if present ────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fail(msg: string): never {
  console.error(`\n[validate-manifest] ✗ FAIL — ${msg}\n`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`[validate-manifest] ✓ ${msg}`);
}

// Minimal JSON-RPC fetch (no ethers dependency to keep the script self-contained)
async function rpcCall(url: string, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: { message: string } };
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

// ── Env checks ────────────────────────────────────────────────────────────────
const rpcUrl = process.env.MONAD_RPC_URL;
const chainIdEnv = process.env.MONAD_CHAIN_ID;

if (!rpcUrl) fail("MONAD_RPC_URL is not set. Export it or add it to .env.local");
if (!chainIdEnv) fail("MONAD_CHAIN_ID is not set. Export it or add it to .env.local");

const expectedChainId = Number(chainIdEnv);
if (!Number.isFinite(expectedChainId) || expectedChainId <= 0) {
  fail(`MONAD_CHAIN_ID must be a positive integer, got: "${chainIdEnv}"`);
}

// ── Load manifest ─────────────────────────────────────────────────────────────
const manifestPath =
  process.env.DEPLOYMENT_MANIFEST_PATH ??
  path.join(ROOT, "onchain", "deployments", "monad-testnet.json");

if (!fs.existsSync(manifestPath)) {
  fail(`Manifest not found at: ${manifestPath}\nDeploy contracts first (see onchain/deployments/README.md).`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
  chainId: number;
  contracts: Record<string, { address: string; startBlock?: number }>;
};

// ── Check 1: chainId ──────────────────────────────────────────────────────────
if (manifest.chainId !== expectedChainId) {
  fail(
    `chainId mismatch — manifest has ${manifest.chainId}, MONAD_CHAIN_ID=${expectedChainId}.\n` +
      `  Did you point DEPLOYMENT_MANIFEST_PATH at the right network?`
  );
}
ok(`chainId ${manifest.chainId} matches MONAD_CHAIN_ID`);

// ── Check 2: required startBlock values ───────────────────────────────────────
// ProtocolTreasury is an EOA/multisig — no startBlock required.
const START_BLOCK_EXEMPT = new Set(["ProtocolTreasury"]);

for (const [name, entry] of Object.entries(manifest.contracts)) {
  if (START_BLOCK_EXEMPT.has(name)) continue;
  if (entry.startBlock == null || entry.startBlock < 0) {
    fail(`contracts.${name} is missing a valid startBlock in the manifest.`);
  }
}
ok("All contracts have required startBlock values");

// ── Check 3: bytecode presence ────────────────────────────────────────────────
console.log(`[validate-manifest] Connecting to RPC: ${rpcUrl}`);
console.log(`[validate-manifest] Checking ${Object.keys(manifest.contracts).length} contract(s)…\n`);

for (const [name, entry] of Object.entries(manifest.contracts)) {
  let code: string;
  try {
    code = (await rpcCall(rpcUrl, "eth_getCode", [entry.address, "latest"])) as string;
  } catch (err) {
    fail(`RPC call failed for ${name} (${entry.address}): ${(err as Error).message}`);
  }

  if (!code || code === "0x") {
    fail(
      `${name} at ${entry.address} has no bytecode.\n` +
        `  The contract may not be deployed on chainId ${manifest.chainId}.`
    );
  }
  ok(`${name} (${entry.address}) — bytecode present (${Math.round((code.length - 2) / 2)} bytes)`);
}

// ── All checks passed ─────────────────────────────────────────────────────────
console.log(`\n[validate-manifest] ✅ All checks passed — manifest is valid.\n`);
