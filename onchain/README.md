# RumbleX Onchain Contracts

This package contains the core smart contracts for the RumbleX arena, built and tested with [Foundry](https://getfoundry.sh/).

## Core Contracts

- **`RumbleXPass`**: NFT pass required for players to enter the arena.
- **`RoundFactory`**: Factory contract responsible for deploying new, isolated `RoundRoom` instances.
- **`RoundRoom`**: The deterministic battleground contract handling participant registration, loadouts, and the final round simulation logic.
- **`SeasonVault`**: The protocol vault holding fees and liquidity accumulated over the course of a season.
- **`ClaimVault`**: The payout vault where survivors and winners claim their earned $MON rewards.

## Where to deploy / operate

For the complete step-by-step guide on how to deploy these contracts to the Monad testnet, generate the manifest, and run smoke tests, see:

👉 **[deployments/README.md](deployments/README.md)**

---

### Standard Development Commands

```bash
# Build contracts
forge build

# Run tests
forge test

# Format code
forge fmt
```
