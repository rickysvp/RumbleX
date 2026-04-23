# Monad Testnet Deployment

## Prerequisites

Set environment variables:

```bash
export MONAD_RPC_URL="https://<your-monad-rpc>"
export MONAD_CHAIN_ID="<monad-chain-id>"
export DEPLOYER_PRIVATE_KEY="0x<owner-private-key>"
export OWNER="0x<owner-address>"
export PROTOCOL_TREASURY="0x<protocol-treasury-address>"

# Optional (default to OWNER where noted)
export NETWORK_NAME="monad-testnet"
export INITIAL_SEASON_ID="1"
export ROUND_OPERATOR="0x<round-operator-address>"      # default OWNER
export SEASON_OPERATOR="0x<season-operator-address>"    # default OWNER
export CLAIM_OPERATOR="0x<claim-operator-address>"      # default OWNER
export PASS_MINTER="0x<pass-minter-address>"            # default OWNER
```

`OWNER` must match `DEPLOYER_PRIVATE_KEY` for one-shot deploy + role wiring.

## 1) Deploy Core Contracts

```bash
cd onchain
forge script script/DeployCore.s.sol:DeployCoreScript \
  --rpc-url "$MONAD_RPC_URL" \
  --broadcast
```

This deploys:

- `RumbleXPass`
- `SeasonVault`
- `ClaimVault`
- `RoundFactory`

and writes:

- `onchain/deployments/monad-testnet.json` (or `NETWORK_NAME`.json)

## 2) Create Initial Round + Wire Authorizations

```bash
export ROUND_SEASON_ID="1"
export ROUND_ENTRY_FEE="10000000000000000" # 0.01 native token
export ROUND_MAX_PLAYERS="333"
export ROUND_SETTLEMENT_OPERATOR="$OWNER"

forge script script/CreateInitialRound.s.sol:CreateInitialRoundScript \
  --rpc-url "$MONAD_RPC_URL" \
  --broadcast
```

This script:

- calls `RoundFactory.createRound(...)`
- calls `SeasonVault.setAuthorizedRoundRoom(room, true)`
- calls `ClaimVault.setAuthorizedRoundRoom(room, true)`
- calls `RoundRoom.configureSettlementTargets(claimVault, protocolTreasury)`

and writes a round output file:

- `onchain/deployments/monad-testnet.round-<roundId>.json`

## 3) Smoke Test On Deployed Contracts

```bash
export SMOKE_PLAYER_PRIVATE_KEY="0x<funded-player-private-key>"
export SMOKE_SEASON_ID="1"
export SMOKE_ENTRY_FEE="10000000000000000"
export SMOKE_MAX_PLAYERS="10"

forge script script/SmokeCorePath.s.sol:SmokeCorePathScript \
  --rpc-url "$MONAD_RPC_URL" \
  --broadcast
```

Smoke script verifies:

- Pass -> CreateRound -> Join -> Settlement path
- `protocolFee + seasonFee + playerPool == totalEntryCollected`
- fallback payout claim is recorded in `ClaimVault` when payout receiver reverts
- `SeasonVault` receives season fee
- season reward assignment emits claimable `season_reward`
- `claimAll()` pays out for test player
