# RumbleX

> On-chain GameFi arena on Monad testnet — battle-royale rounds, NFT pass gating, survivor payouts.

## Architecture

```
RumbleX/
├── src/                        # Frontend (Vite + React + TypeScript)
├── onchain/                    # Smart contracts (Foundry)
│   ├── src/                    # Solidity sources
│   │   ├── RumbleXPass.sol
│   │   ├── RoundFactory.sol
│   │   ├── RoundRoom.sol
│   │   ├── SeasonVault.sol
│   │   └── ClaimVault.sol
│   ├── script/                 # Forge deploy + smoke scripts
│   └── deployments/            # Generated manifest (monad-testnet.json)
└── services/
    └── indexer-api/            # Node.js event indexer + HTTP API
        ├── src/
        └── scripts/smoke.ts
```

### Data-mode switch (frontend)

| `VITE_DATA_MODE` | Behaviour |
|---|---|
| `mock` | All data from local fixtures — no RPC, no API needed |
| `hybrid` | Wallet summary / pass / claim use the indexer API; other views stay mock |
| `live` | Same as `hybrid` for the current MVP |

### Env-file ownership

| Layer | Reads |
|---|---|
| **Frontend** (`vite`) | `<repo-root>/.env.local` |
| **`validate-manifest.ts`** | `<repo-root>/.env.local` (hand-rolled parser) |
| **Indexer API** | 1. `process.env` (shell exports) <br> 2. `<CWD>/.env` (`dotenv` default) <br> 3. Fallback to `services/indexer-api/.env` if `MONAD_RPC_URL` is still missing |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Foundry (`forge`) | latest — [install](https://getfoundry.sh/) |

---

## Quick Start (mock mode — no chain required)

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Set VITE_DATA_MODE=mock (already the default in .env.example)
# 4. Start the frontend
npm run dev
# → http://localhost:3000
```

---

## Full Stack Startup (hybrid / live mode)

Start services **in this order**:

### Step 1 — Indexer API

The indexer loads its own `services/indexer-api/.env` (via `dotenv.config()`).  
Create it from the provided template before first run:

```bash
cd services/indexer-api
cp .env.example .env          # fill MONAD_RPC_URL + MONAD_CHAIN_ID
npm install
npm run dev                   # or: npm run start (no file-watch)
# → http://localhost:8787
```

Alternatively, you can run the service directly from the repository root. It will automatically fall back to the `.env` file you created in `services/indexer-api/` if no root environment is found:

```bash
# services/indexer-api/.env must exist with MONAD_RPC_URL set
npm run indexer:api
# → http://localhost:8787
```

### Step 2 — Frontend

```bash
# Back at repo root
# Ensure VITE_DATA_MODE=hybrid and VITE_API_BASE_URL=http://localhost:8787 in .env.local
npm run dev
# → http://localhost:3000
```

### Step 3 — Smoke test the API

```bash
cd services/indexer-api
SMOKE_ADDRESS=0xYourWallet npm run smoke
```

---

## Onchain Development

All commands run from the `onchain/` directory.

```bash
cd onchain

# Build contracts
forge build

# Run tests
forge test

# Deploy to Monad testnet (see onchain/deployments/README.md for full env vars)
forge script script/DeployCore.s.sol:DeployCoreScript \
  --rpc-url "$MONAD_RPC_URL" --broadcast

forge script script/CreateInitialRound.s.sol:CreateInitialRoundScript \
  --rpc-url "$MONAD_RPC_URL" --broadcast
```

After deployment, `onchain/deployments/monad-testnet.json` is written automatically.

---

## Validate Deployment Manifest

Before starting the indexer, confirm the manifest is coherent:

```bash
# validate-manifest.ts reads <repo-root>/.env.local automatically.
# The indexer does not — see "Env-file ownership" table above.
npx tsx scripts/validate-manifest.ts
```

Fails fast if any contract has no bytecode (`getCode == 0x`), if `chainId` mismatches, or if required `startBlock` values are missing.

---

## Available Root Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite frontend dev server |
| `npm run build` | Production build |
| `npm run lint` | TypeScript type-check (frontend) |
| `npm run indexer:api` | Run the indexer + API service |
| `npm run simulate` | Run the off-chain battle simulator |
| `npx tsx scripts/validate-manifest.ts` | Validate deployment manifest |

---

## Go-Live

See **[docs/go-live-checklist.md](docs/go-live-checklist.md)** for the full step-by-step deployment checklist.

---

## CI

GitHub Actions run automatically on push / PR:

| Workflow | Trigger |
|---|---|
| **Frontend** — lint + build | push / PR touching `src/`, `index.html`, `vite.config.ts`, `tsconfig.json` |
| **Indexer API** — lint + build + smoke | push / PR touching `services/indexer-api/` |
| **Onchain** — forge build | push / PR touching `onchain/` |
