# RumbleX Go-Live Checklist

> Use this doc for every testnet or mainnet deployment cycle.  
> Work through the steps in order — each step assumes the previous passed.

---

## Environment Setup

- [ ] Copy `.env.example` → `.env.local` at repo root
- [ ] Copy `services/indexer-api/.env.example` → `services/indexer-api/.env`
- [ ] Fill in `MONAD_RPC_URL` in **both** files (private or Alchemy/Infura endpoint — do **not** use public RPC for production)
- [ ] Set `MONAD_CHAIN_ID=10143` (Monad testnet) or the target chain ID in **both** files
- [ ] Set `DEPLOYER_PRIVATE_KEY` for the deploy wallet (export only for the session — never store in a file)
- [ ] Confirm the deploy wallet has enough native token for gas

---

## Step 1 — Deploy Contracts

```bash
cd onchain

# Deploy RumbleXPass, SeasonVault, ClaimVault, RoundFactory
forge script script/DeployCore.s.sol:DeployCoreScript \
  --rpc-url "$MONAD_RPC_URL" \
  --broadcast
```

- [ ] No errors in forge output
- [ ] `onchain/deployments/monad-testnet.json` written with correct `chainId` and all four contract addresses

---

## Step 2 — Create Initial Round

```bash
export ROUND_SEASON_ID="1"
export ROUND_ENTRY_FEE="10000000000000000"   # 0.01 native token
export ROUND_MAX_PLAYERS="333"
export ROUND_SETTLEMENT_OPERATOR="$OWNER"

forge script script/CreateInitialRound.s.sol:CreateInitialRoundScript \
  --rpc-url "$MONAD_RPC_URL" \
  --broadcast
```

- [ ] `onchain/deployments/monad-testnet.round-1.json` written
- [ ] `SeasonVault` and `ClaimVault` authorisations granted for the new `RoundRoom`

---

## Step 3 — Update Deployment Manifest

- [ ] Verify `onchain/deployments/monad-testnet.json` has the correct addresses and `startBlock` values
- [ ] If re-deploying over an existing deployment, update `startBlock` to the new block height (avoids re-indexing stale history)
- [ ] Commit `monad-testnet.json` to version control (this is the source of truth for all downstream services)

---

## Step 4 — Validate Manifest

```bash
# From repo root
npx tsx scripts/validate-manifest.ts
```

Expected output: `✅ All checks passed — manifest is valid.`

- [ ] All contract addresses show bytecode present
- [ ] `chainId` in manifest matches `MONAD_CHAIN_ID`
- [ ] All contracts have valid `startBlock` values

> **Do not proceed to Step 5 until this passes.**

---

## Step 5 — Run Indexer API

```bash
# Ensure services/indexer-api/.env exists (copy from .env.example on first run)
cd services/indexer-api && cp .env.example .env   # fill MONAD_RPC_URL + MONAD_CHAIN_ID
cd ../..   # back to repo root

# Run from repo root
npm run indexer:api
```

- [ ] Service starts on port `8787` (or `INDEXER_API_PORT`)
- [ ] No `MONAD_RPC_URL is required` or manifest errors in startup logs
- [ ] `GET http://localhost:8787/health` returns `200`

---

## Step 6 — Run Indexer Smoke Test

```bash
cd services/indexer-api
SMOKE_ADDRESS=0xYourWalletAddress npm run smoke
```

- [ ] `[smoke] /mesummary ok`
- [ ] `[smoke] /meclaims ok`
- [ ] `[smoke] PASS` printed — no raw decode leaks

---

## Step 7 — Run Frontend in Hybrid Mode

```bash
# In .env.local:
#   VITE_DATA_MODE=hybrid
#   VITE_API_BASE_URL=http://localhost:8787

npm run dev
# → http://localhost:3000
```

- [ ] App loads without console errors
- [ ] Wallet connect works and wallet address appears
- [ ] Pass ownership check resolves (shows "Mint Pass" or "Has Pass" correctly)

---

## Step 8 — Verify Core User Flow

### Pass Flow
- [ ] Connect wallet that does **not** have a pass → "Mint RumbleX Pass" CTA visible
- [ ] Mint pass → transaction confirmed on chain
- [ ] Reload app → pass ownership reflected correctly (source: `hybrid` API, not mock)

### Join Flow
- [ ] Navigate to an open round
- [ ] Select loadout and confirm join → transaction broadcast
- [ ] Round participant count increments in the UI

### Claim Flow
- [ ] After round settlement, navigate to Intel / Claims
- [ ] Claimable balance shown correctly (source: indexer API)
- [ ] Claim all → `ClaimVault.claimAll()` transaction confirmed
- [ ] Claimed amount deducted from claimable balance

---

## Step 9 — Post-Launch Checks

- [ ] Indexer is polling without errors (check logs every 5 minutes for first 30 minutes)
- [ ] No `INDEXER_STALE` errors returned by API within first polling cycle (`INDEXER_POLL_INTERVAL_MS` × `INDEXER_CONFIRMATION_BLOCKS`)
- [ ] CI badges on GitHub show green for all three workflows
- [ ] Git tag pushed for the release: `npm run release:patch` (or `:minor` / `:major`)

---

## Rollback

If any step above fails:

1. **Contracts** — if `DeployCore` failed mid-way, identify which contracts succeeded from the broadcast logs and manually record addresses.  Re-run with `--resume` to continue from the last successful tx.
2. **Manifest mismatch** — re-run `npx tsx scripts/validate-manifest.ts` after editing `monad-testnet.json` to pinpoint the offending entry.
3. **Indexer stale** — check `MONAD_RPC_URL` is reachable; reduce `INDEXER_CONFIRMATION_BLOCKS` if the network is slow.
4. **Frontend showing mock data** — ensure `VITE_DATA_MODE=hybrid` and `VITE_API_BASE_URL` points to the running API; restart the Vite dev server after changing env.

---

*Last updated: 2026-04-23 — matches RumbleX v0.1.44 architecture.*
