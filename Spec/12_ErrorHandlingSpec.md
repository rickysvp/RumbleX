# RumbleX Error Handling Spec

Version: 1.1
Last updated: 2026-04-22

## 1. Purpose

This spec defines product-level error handling for wallet, pass, join, settlement sync, claim, and query failures.

The main goal is to preserve user trust by clearly communicating state, funds safety, and next action.

***

## 2. Core Principles

All error handling must follow these rules:

1. Explain current state first.
2. Explain whether funds moved or did not move.
3. Explain the next safe action.
4. User cancellation is not a system error.
5. Unconfirmed state must not be presented as final truth.

***

## 3. Error Domains

Primary error domains are:

- wallet
- pass
- precheck
- transaction
- settlement sync
- query / indexer

***

## 4. Funds Safety Copy Rules

The product must use explicit money-safety language.

### Cancelled before execution

Use:

- “Transaction cancelled. No funds moved.”

### Failed without completed transfer

Use:

- “Transaction failed. No funds moved.”

### Claim failed before completion

Use:

- “Claim failed. Funds remain in Claimable MON.”

### Settlement sync delayed

Use:

- “Settlement confirmed on-chain. Syncing latest result.”

These meanings should stay consistent across Arena, Claim, History, and wallet-related UI surfaces.

***

## 5. Join Errors

Required join-related error handling includes:

- no pass
- already joined
- round locked
- round full
- insufficient payment
- state changed before confirmation

Recommended copy:

- “RumbleX Pass required to join.”
- “You already joined this round.”
- “This round is no longer open for entry.”
- “Round is full.”
- “State changed before confirmation. Refresh and try again.”

***

## 6. Claim Errors

Required claim-related handling includes:

- nothing to claim
- claim failed before execution
- claim reverted
- claim syncing delayed

Recommended copy:

- “No pending payouts to claim.”
- “Claim failed. Funds remain in Claimable MON.”
- “Claim submitted. Waiting for confirmation.”
- “Claim status updating...”

***

## 7. Sync and Query Errors

For indexer or API delay and failure states, the UI should prefer:

- inline loading / syncing states
- panel-level retry
- clear pending/final distinction

The UI should avoid:

- presenting zero as final when data is unavailable
- silently showing stale monetary data without stale markers

***

## 8. Summary

Error handling in RumbleX is correct only if:

- the user knows the current state
- the user knows whether funds moved
- the user knows the next safe action
- sync delay is not mislabeled as fund loss

