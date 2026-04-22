# RumbleX Event & Indexer Spec

Version: 1.1
Last updated: 2026-04-22

## 1. Purpose

This spec defines the event model and indexer behavior for RumbleX MVP.

The goal is to ensure that off-chain data is reconstructable, idempotent, reorg-safe, and consistent with confirmed on-chain truth.

***

## 2. Source of Truth

Confirmed on-chain events and confirmed contract state are the only authoritative source for:

- round settlement results
- claimable balances
- payout outcomes
- season reward assignments
- participation history
- season kill accumulation

The indexer is a reconstruction layer, not an authority layer.

***

## 3. Event Coverage

The protocol MUST emit enough events to reconstruct at least the following:

- pass mint
- round creation
- player join
- round state change
- round settlement
- payout sent
- fallback recorded
- season funded
- season reward assigned
- claim completed

***

## 4. Event Identity

Each indexed event MUST be stored using a stable unique identity derived from chain log metadata.

Recommended identity:

- `chainId`
- `contractAddress`
- `transactionHash`
- `logIndex`

This identity must be used for idempotent event processing.

***

## 5. Pending vs Confirmed

The indexer MUST distinguish between:

- `pending`
- `confirmed`

Critical monetary data MUST NOT be treated as final until the system confirmation policy is satisfied.

### Confirmation policy

MVP must define a chain-specific confirmation threshold as infrastructure configuration.

The threshold is an implementation parameter and may vary by deployment environment.

Examples of values that must respect confirmation policy:

- claimable balances
- fallback claim records
- final round settlement results
- season reward assignments

The UI may display pending values, but they must be clearly labeled as syncing or pending.

***

## 6. Reorg Handling

The indexer MUST support chain reorganization handling.

### Required behavior

- keep block-linked ingestion records
- detect canonical chain changes
- rollback orphaned block effects
- replay from the last safe confirmed checkpoint

### Mandatory rule

No user-facing final monetary value may remain permanently derived from orphaned blocks.

***

## 7. Idempotent Processing

Event processing MUST be idempotent.

Before applying any event:

1. compute event identity
2. check whether it was already processed
3. skip if already processed
4. otherwise apply and persist atomically

This rule is especially important for:

- `PayoutSent`
- `FallbackRecorded`
- `SeasonRewardAssigned`
- `Claimed`

***

## 8. Derived Read Models

The indexer is expected to derive at least these read models:

- account summary
- player history
- round detail
- claimable summary
- player stats
- season ranking

Every derived model must be reproducible from canonical events plus confirmed chain state.

***

## 9. Claimable Aggregation Rules

Claimable balances MUST be computed from canonical claim records and their claimed status.

### Required rules

- unclaimed fallback records increase claimable
- unclaimed season reward records increase claimable
- claimed records no longer contribute to claimable
- no entitlement may be counted twice

***

## 10. Round History Rules

Player history must be derived from:

- join participation
- settlement outcome
- payout or fallback result

A round must not be displayed as final before its settlement meets confirmation policy.

***

## 11. Season Aggregation Rules

Season statistics and season rank must be derived from canonical round outcomes and canonical reward assignment events.

### Required rules

- kills are accumulated deterministically
- qualification threshold is applied consistently
- assigned rewards and estimated rewards are stored distinctly
- estimated rewards must never be presented as assigned rewards

***

## 12. Recovery and Rebuild

The indexer MUST support:

- replay from a configured start block
- replay from checkpoint
- rollback of unconfirmed data
- full reprocessing without duplication

If a rebuild changes monetary outputs, that discrepancy must be treated as a critical incident.

***

## 13. API / UI Contract

The indexer and API layer must expose enough status for frontend to distinguish:

- unavailable
- syncing
- pending confirmation
- confirmed

The frontend must never present unconfirmed monetary values as irreversible final truth.

***

## 14. Summary

The RumbleX indexer is correct only if:

- it is idempotent
- it is reorg-safe
- it distinguishes pending from confirmed
- it reconstructs balances and history from canonical events
- it never treats unconfirmed monetary data as final truth

<br />

## X. Canonical Event Authority

Canonical protocol events are the authoritative source for off-chain reconstruction.

For monetary state, historical state, and reward state, the indexer MUST treat confirmed on-chain events and confirmed contract state as the highest authority.

This includes at minimum:

- round creation
- player join
- round state transition
- round settlement
- payout success
- fallback claim recording
- season funding
- season reward assignment
- claim completion

No off-chain simulation feed, API cache, or UI-local state may override canonical settled event truth.

***

## X. Unified Event Requirements

The protocol MUST emit a coherent event surface sufficient for deterministic reconstruction.

At minimum, the event model MUST support the following canonical event intents:

### Pass / access

- pass minted

### Round lifecycle

- round created
- player joined
- round state changed
- round settled

### Payout and claims

- payout sent
- fallback recorded
- claim recorded, if claim records are explicitly emitted
- claimed

### Season accounting

- season funded
- season reward assigned

### Event consistency rule

All protocol documents, contract interfaces, and indexer logic MUST refer to the same canonical event names and parameter meanings.

If an event definition changes, the indexer spec, contract scope spec, and implementation interfaces MUST be updated together.

***

## X. Event Identity and Idempotency

Each indexed event MUST be processed using a stable unique identity.

Recommended canonical identity:

- `chainId`
- `contractAddress`
- `transactionHash`
- `logIndex`

### Required rule

Event application MUST be idempotent.

Before applying any event, the indexer MUST:

1. compute canonical event identity
2. check whether it was already processed
3. skip already-processed events
4. otherwise apply the event atomically

No replay, restart, or duplicate ingestion pass may inflate balances, duplicate history entries, or duplicate claimable totals.

***

## X. Finality and Confirmation Model

The indexer MUST distinguish between:

- pending
- confirmed
- stale or degraded views when applicable

### Required rule

No monetary value derived from chain events may be presented as silently final before the configured confirmation policy is satisfied.

This applies in particular to:

- claimable balances
- fallback claim records
- season reward assignment
- round settlement outputs
- season rank or stats that affect user entitlements

The confirmation threshold MAY be deployment-specific, but it MUST be explicitly configured and consistently applied.

***

## X. Reorg Handling

The indexer MUST be reorg-safe.

### Required behavior

The system MUST:

- retain block-linked ingestion checkpoints
- detect canonical chain changes
- rollback orphaned event effects
- replay from the last safe checkpoint
- recompute derived views affected by reverted events

### Monetary safety rule

No user-facing final monetary state may remain permanently derived from orphaned blocks.

***

## X. Feed vs Settlement Truth

Live combat feed and official settlement are not the same trust layer.

### Trust hierarchy

- live feed is narrative and provisional
- confirmed indexer state is derived truth
- canonical settled on-chain outcomes are final truth for money, history, and season accounting

### Required rule

If live feed, provisional simulation output, or API cache conflicts with canonical settled round outcome, the canonical settled round outcome MUST win.

### Product implication

The indexer and API layer MUST provide enough status metadata for frontend to distinguish:

- live / provisional
- pending confirmation
- confirmed official result

***

## X. Derived Read Model Rules

All derived read models MUST be reproducible from canonical events plus confirmed contract state.

This includes at minimum:

- account summary
- player history
- round detail
- claimable summary
- player stats
- season ranking

### Required rule

If a derived view cannot be deterministically reconstructed from canonical sources, that view is not compliant as an authoritative read model.

***

## X. Claim Aggregation Rules

Claimable views MUST be derived from canonical claim entitlements and their claim status.

### Required rules

- unclaimed fallback records contribute to claimable balance
- unclaimed season reward records contribute to claimable balance
- claimed records no longer contribute to claimable balance
- no claim source may be counted twice
- each claimable source MUST remain auditable by source type and source id

***

## X. Provenance Fields for Indexed Data

Every money-related indexed entity SHOULD retain provenance metadata sufficient for auditability.

At minimum, indexed records SHOULD preserve:

- source transaction hash
- source block number
- source log index
- canonical source event type
- confirmation status
- last updated time

These fields are necessary for debugging, incident review, and user-facing trust explanations.

***

## X. Recovery and Rebuild

The indexer MUST support:

- replay from a configured start block
- replay from checkpoint
- rollback of unconfirmed data
- full rebuild without balance inflation or duplicate history

### Critical incident rule

If rebuild output changes previously exposed monetary values, the discrepancy MUST be treated as a critical incident and investigated before being normalized in production.
