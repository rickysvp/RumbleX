# RumbleX Minimal Indexer + HTTP API

This service provides a single-process MVP indexer and API over Monad testnet contracts.

## What It Does

- Loads contract addresses from `onchain/deployments/monad-testnet.json`.
- Reads events from:
  - `RumbleXPass`
  - `RoundFactory`
  - `RoundRoom` (discovered from `RoundCreated`)
  - `SeasonVault`
  - `ClaimVault`
- Materializes canonical collections:
  - `Season`
  - `Round`
  - `RoundParticipant`
  - `RoundSettlement`
  - `ClaimBalance`
  - `PlayerSeasonStats`
  - `ClaimSourceRecord`
  - `PassState`
- Exposes MVP routes and tx-intent routes.

## Run

### Env loading — how it works

The service calls `dotenv.config()` with no arguments, which reads **`.env` from the current working directory** at startup.  
It does **not** read the repo-root `.env.local` used by the frontend and `validate-manifest.ts`.

The canonical setup is a `services/indexer-api/.env` file.  
A template is provided — create yours before first run:

```bash
cd services/indexer-api
cp .env.example .env
# Open .env and set MONAD_RPC_URL and MONAD_CHAIN_ID
```

Alternatively, export the variables in your shell session before running any command.

### Option A: run from repository root

`npm run indexer:api` launches `tsx services/indexer-api/src/main.ts` from the repo root.  
`dotenv.config()` then looks for `<repo-root>/.env` — **not** `.env.local`.  
The simplest approach is to export the required vars in your shell:

```bash
# From repo root — shell exports take precedence over any .env file
export MONAD_RPC_URL="https://<your-monad-rpc>"
export MONAD_CHAIN_ID="10143"
npm run indexer:api
# → http://localhost:8787
```

Or create `<repo-root>/.env` with those values if you prefer a file for this layout.

### Option B: run directly from `services/indexer-api` (recommended)

Running from inside the service directory means `dotenv.config()` finds `services/indexer-api/.env` automatically:

```bash
cd services/indexer-api
# .env must exist (cp .env.example .env and fill values)
npm run dev    # file-watch mode
# or: npm run start   # single-run, no watch
# → http://localhost:8787
```

## Required Env

- `MONAD_RPC_URL`
- `MONAD_CHAIN_ID`

## Optional Env

- `DEPLOYMENT_MANIFEST_PATH` — default: `<repo-root>/onchain/deployments/monad-testnet.json`  
  (resolved relative to the repo root regardless of CWD; override only needed in Docker or CI with a non-standard layout)
- `INDEXER_DB_PATH` — default: `<repo-root>/services/indexer-api/data/indexer-db.json`
- `INDEXER_START_BLOCK` — override the first block to poll (default: taken from manifest `startBlock`)
- `INDEXER_POLL_INTERVAL_MS` — default: `12000`
- `INDEXER_CONFIRMATION_BLOCKS` — default: `3`
- `INDEXER_STALE_AFTER_MS` — default: `120000`
- `INDEXER_API_PORT` — default: `8787`
- `INDEXER_API_BASE_URL` — used by smoke script only, default: `http://localhost:8787`
- `SMOKE_ADDRESS` — used by smoke script only

## Quick Validation

With the API running, from `services/indexer-api`:

```bash
cd services/indexer-api
# INDEXER_API_BASE_URL and SMOKE_ADDRESS can be set in .env or as shell exports
SMOKE_ADDRESS="0xYourWalletAddress" npm run smoke
```

Or set them in `services/indexer-api/.env` and just run `npm run smoke`.

The smoke script verifies:
- `/mesummary` and `/meclaims` do not leak raw ethers decode errors
- responses are either `ok: true` or controlled degraded errors (`INDEXER_UNAVAILABLE` / `INDEXER_STALE` / `CHAIN_READ_FAILED`)

## Endpoints

Read:

- `GET /mesummary` and `GET /me/summary`
- `GET /meclaims` and `GET /me/claims`
- `GET /mehistory` and `GET /me/history`
- `GET /mestats` and `GET /me/stats`
- `GET /roundslive` and `GET /rounds/live`
- `GET /roundsrecent` and `GET /rounds/recent`
- `GET /rounds/:roundId`
- `GET /season/current`
- `GET /season/:seasonId/rank`
- `GET /season/:seasonId/me?address=0x...`

Tx intents:

- `POST /txpassmint-intent` and `POST /tx/pass/mint-intent`
- `POST /txroundjoin-intent` and `POST /tx/round/join-intent`
- `POST /txclaimall-intent` and `POST /tx/claim/all-intent`

## Envelope

Success:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "source": "indexer",
    "isPending": false,
    "isConfirmed": true,
    "isStale": false,
    "lastSyncedAt": "2026-04-22T00:00:00.000Z",
    "sourceBlockNumber": 123
  }
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```
