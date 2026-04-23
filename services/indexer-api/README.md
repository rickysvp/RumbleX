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

### Option A: run from repository root

```bash
# From the repo root (picks up .env.local automatically)
export MONAD_RPC_URL="https://<your-monad-rpc>"
export MONAD_CHAIN_ID="10143"
# optional: export DEPLOYMENT_MANIFEST_PATH="/abs/path/to/onchain/deployments/monad-testnet.json"
# optional: export INDEXER_DB_PATH="/abs/path/to/indexer-db.json"
# optional: export INDEXER_API_PORT="8787"
npm run indexer:api
```

### Option B: run directly from `services/indexer-api`

```bash
cd services/indexer-api
export MONAD_RPC_URL="https://<your-monad-rpc>"
export MONAD_CHAIN_ID="10143"
# optional: export DEPLOYMENT_MANIFEST_PATH="/abs/path/to/onchain/deployments/monad-testnet.json"
# optional: export INDEXER_DB_PATH="/abs/path/to/services/indexer-api/data/indexer-db.json"
# optional: export INDEXER_API_PORT="8787"
npm run start   # no-watch
# or: npm run dev
```

## Required Env

- `MONAD_RPC_URL`
- `MONAD_CHAIN_ID`

## Optional Env

- `DEPLOYMENT_MANIFEST_PATH` (default `onchain/deployments/monad-testnet.json`)
- `INDEXER_DB_PATH` (default `services/indexer-api/data/indexer-db.json`)
- `INDEXER_START_BLOCK` (override manifest startBlock)
- `INDEXER_POLL_INTERVAL_MS` (default `12000`)
- `INDEXER_CONFIRMATION_BLOCKS` (default `3`)
- `INDEXER_STALE_AFTER_MS` (default `120000`)
- `INDEXER_API_PORT` (default `8787`)
- `INDEXER_API_BASE_URL` (used by smoke script, default `http://localhost:8787`)
- `SMOKE_ADDRESS` (used by smoke script)

## Quick Validation

With the API running:

```bash
cd services/indexer-api
export INDEXER_API_BASE_URL="http://localhost:8787"
export SMOKE_ADDRESS="0xYourWalletAddress"
npm run smoke
```

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
