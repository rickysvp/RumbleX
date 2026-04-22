# RumbleX Round Settlement Spec

Version: 1.1
Last updated: 2026-04-22

## 1. Purpose

This spec defines how a single RumbleX round is settled, how funds are split, how payout failure is handled, and what runtime validations must be enforced on-chain.

The core principle is: every round is independently finalized on-chain, and the on-chain settlement result is the single source of truth.

***

## 2. Settlement Authority

MVP phase uses a single authorized settlement operator.

Only the authorized settlement operator may call the round settlement entrypoint.

No public or permissionless settlement submission is allowed in MVP.

Future keeper / delegated settlement support is out of scope for MVP unless explicitly added with a new version of this spec.

### Mandatory rule

- `settleRound()` MUST revert if `msg.sender` is not the authorized settlement operator.

***

## 3. Settlement Preconditions

A round may be settled only if all of the following are true:

1. The round exists.
2. The round state is `SettlementPending`.
3. The round has not already been settled.
4. The settlement payload contains all final participant results required by the protocol.
5. The settlement totals satisfy all runtime invariants in this spec.

If any condition fails, settlement MUST revert.

***

## 4. Round Fund Model

For each round:

- Entry fee contributes to three destinations:
  - 10% protocol fee
  - 10% season fee
  - 80% player settlement pool

Skill fees and item fees belong to protocol revenue unless explicitly changed by a later spec version.

### Canonical formulas

- `protocolFeeFromEntry = totalEntryCollected * 10%`
- `seasonFeeAmount = totalEntryCollected * 10%`
- `playerPoolAmount = totalEntryCollected * 80%`

### Runtime invariant

The contract MUST enforce:

- `protocolFeeFromEntry + seasonFeeAmount + playerPoolAmount == totalEntryCollected`

If not true, settlement MUST revert.

***

## 5. Settlement Payload

Each settlement submission MUST include, at minimum, for every relevant participant:

- player address
- survivor flag
- final kills
- final holding
- payout amount

The payload MAY also include a result hash or off-chain proof hash for auditability.

### Required constraints per participant

- `payoutAmount >= 0`
- eliminated players MUST have `payoutAmount == 0`
- only survivors may have `payoutAmount > 0`

If any participant entry violates these rules, settlement MUST revert.

***

## 6. Player Pool Validation

The smart contract MUST validate the payout vector during settlement.

### Mandatory runtime invariant

- `sum(all participant payoutAmount) == playerPoolAmount`

If not true, settlement MUST revert.

This is not only a testing requirement. It is a hard on-chain settlement requirement.

***

## 7. Settlement Execution Order

Settlement MUST execute in this order:

1. Validate caller authority.
2. Validate round state and not-yet-settled status.
3. Validate fee totals and payout totals.
4. Mark the round as settled in storage.
5. Record final participant outcomes in storage.
6. Route protocol fee.
7. Route season fee.
8. Attempt player payouts.
9. If a payout fails, record fallback claim instead of reverting the whole round.
10. Emit final settlement events.

The whole round MUST NOT fail solely because one individual payout fails.

***

## 8. Payout Failure Handling

Direct payout is best effort, not all-or-nothing.

The contract MUST attempt each eligible payout using a low-level call pattern that does not force the whole round to revert on one receiver failure.

### Required behavior

If a payout to a player fails:

- do NOT revert the entire settlement
- record the amount as fallback claimable
- emit a fallback event
- continue processing remaining payouts

### Forbidden behavior

- using payout logic that causes one broken receiver to lock the full round
- silently dropping failed payout amounts
- marking a failed payout as paid

***

## 9. Fallback Claim Model

If direct payout fails, the unpaid amount is moved into the fallback claim path.

Fallback claimable amounts are part of the same round result and MUST remain traceable to:

- round id
- player address
- amount
- creation time
- claim status

### Required invariant

- `totalPaidOut + totalFallbackClaimable == playerPoolAmount`

If not true, settlement MUST revert.

***

## 10. Settlement Finality

Once a round is successfully settled:

- it MUST NOT be settled again
- its player pool MUST NOT be recomputed
- its participant results MUST NOT be mutated except through an explicitly defined emergency/admin flow, which is out of scope for MVP

### Mandatory rule

- a settled round is immutable for MVP

***

## 11. Events

The contract MUST emit enough events to reconstruct the settlement off-chain.

At minimum:

- `RoundSettled`
- `PayoutSent`
- `FallbackRecorded`

Recommended event fields:

### RoundSettled

- roundId
- resultHash
- protocolFeeAmount
- seasonFeeAmount
- playerPoolAmount
- totalPaidOut
- totalFallbackClaimable

### PayoutSent

- roundId
- player
- amount

### FallbackRecorded

- roundId
- player
- amount

***

## 12. Revert Conditions

Settlement MUST revert if any of the following happen:

- unauthorized caller
- invalid round state
- already settled
- malformed participant payload
- eliminated player has non-zero payout
- payout sum != playerPoolAmount
- protocol + season + playerPool != totalEntryCollected
- totalPaidOut + totalFallbackClaimable != playerPoolAmount

***

## 13. MVP Security Rules

The following are non-negotiable in MVP:

- single authorized settlement operator
- on-chain payout sum validation
- on-chain fee split validation
- one failed payout must not block the round
- fallback claim path must be recorded on-chain
- settled rounds are single-settlement only

***

## 14. Summary

A RumbleX round settlement is valid only if:

- the authorized operator submits it
- all fee and payout invariants hold
- failed payouts become fallback claims
- the final result is recorded on-chain exactly once

<br />

## X. Settlement Provenance

A settlement submission must be traceable to a unique round result package.

Each settlement package MUST include, directly or by hash reference:

- round id
- season id
- settlement version
- engine or ruleset version
- participant result payload hash
- totals payload hash
- optional off-chain evidence or transcript hash

### Required rule

The same round must not accept multiple distinct canonical result packages.

If a round already stores a canonical settlement result hash, any second settlement attempt with a different result hash MUST revert.

***

## X. Precision and Rounding Rules

All on-chain accounting uses integer smallest-unit accounting.

No floating-point or UI-formatted decimal logic may be used in canonical fund calculations.

### Mandatory rules

- fee calculations MUST use deterministic integer division
- payout calculations MUST use deterministic integer values
- season reward calculations MUST use floor rounding unless explicitly overridden in a later spec version
- every division remainder must be assigned to a defined destination

### Default dust rules in MVP

- entry split remainder stays with protocol fee unless explicitly assigned elsewhere by contract implementation
- season reward remainder stays in `SeasonVault` and rolls forward to the next season

There must be no unassigned remainder.

***

## X. Settlement Batching Requirement for 333 Players

Because the canonical round cap is `333`, settlement must be designed for gas safety.

A single monolithic settlement transaction that stores all participant results and performs all payouts may exceed acceptable gas limits.

### MVP rule

Settlement MUST support batch-safe execution.

Recommended minimum architecture:

1. commit settlement totals and canonical result hash
2. submit participant result batches
3. execute payout batches or record fallback batches
4. finalize round settlement after all required batches are committed

### Required guarantees

- batch execution must preserve the same global invariants as one-shot settlement
- no batch may allow double counting
- finalization must be blocked until all required batches are committed
- failed payout batches must not corrupt already committed totals

***

## X. No Implicit Full-List Iteration Assumption

The protocol must not assume that all 333 participant records can always be safely processed in one unbounded loop.

Any implementation that depends on full unbounded on-chain iteration over all participants is non-compliant for MVP at 333-player capacity.

<br />

## X. Settlement Liveness and Recovery

A round MUST NOT remain indefinitely in `SettlementPending`.

### Required timestamps

Each round MUST define:

- `liveEnd`
- `settlementDeadline`

`settlementDeadline` is the maximum allowed time after `liveEnd` for canonical settlement submission.

### Normal settlement rule

Before `settlementDeadline`, only the authorized settlement operator may submit settlement.

### Recovery rule

If settlement is not completed by `settlementDeadline`, the round enters recovery eligibility.

In recovery mode:

- the protocol MUST preserve user-fund destination semantics
- the protocol MUST NOT silently convert unsettled player funds into protocol treasury revenue
- owner/admin MAY rotate the settlement operator
- owner/admin MAY activate an explicitly authorized recovery settlement path
- every recovery action MUST be fully auditable by event and state trace

### Forbidden behavior

The protocol MUST NOT treat operator failure, timeout, or delayed settlement as sufficient reason to confiscate player funds into protocol revenue.

***

## X. Settlement Verification Assumptions

MVP settlement verification uses a trust-plus-validation model.

### Trust assumption

In MVP, the settlement operator is a trusted protocol-controlled role.

### Required on-chain validation

The contract MUST validate at settlement time:

- the round is in a valid settlement state
- the settlement caller is authorized
- every payout recipient is a valid participant of the round
- eliminated participants MUST have zero payout
- the payout sum MUST equal the player settlement pool
- the fee split MUST satisfy canonical accounting rules
- the submitted `resultHash` MUST match the submitted settlement payload or its canonical hash representation

### Non-goal in MVP

`resultHash` alone does NOT prove that the off-chain simulation was truthful.

MVP does NOT include an on-chain dispute game, optimistic challenge window, or public fraud-proof mechanism.

If future versions introduce third-party settlement operators, a stronger verification or dispute model MUST be added in a later spec version.

***

## X. Payout Mapping Formula

RumbleX distinguishes between:

- in-game simulated holdings
- on-chain final payout amounts

### Definitions

- `EntryPool` = total entry fees collected from all joined players
- `PlayerSettlementPool` = `EntryPool * 80 / 100`
- `holding_i` = survivor `i`'s final in-game holding before fee scaling
- `payout_i` = survivor `i`'s actual on-chain payout

### Canonical rule

For every survivor:

`payout_i = floor(holding_i * PlayerSettlementPool / EntryPool)`

### Required invariants

- the sum of all survivor `holding_i` MUST equal `EntryPool`
- the sum of all survivor `payout_i`, plus any explicitly assigned rounding remainder, MUST equal `PlayerSettlementPool`
- eliminated players MUST have `payout_i = 0`

### Rounding rule

If integer division creates remainder during payout scaling, the remainder MUST be assigned by one deterministic documented rule and MUST NOT be left implicit.

MVP default rule:

- compute all survivor payouts using floor division
- assign the final remainder to the survivor with the largest `holding_i`
- if multiple survivors tie on `holding_i`, break ties by ascending address order

***

## X. Settlement Output Requirements

The off-chain settlement engine MUST output, directly or by canonical derivation:

- the survivor set
- final holdings for each survivor
- per-player kill counts
- the final payout vector
- the settlement payload hash or canonical result hash

These outputs MUST be sufficient for audit, indexer reconstruction, and post-settlement dispute review if governance later introduces a challenge framework.

***

## X. Failure-Tolerant Payout Handling

Settlement payout execution MUST be failure-tolerant.

If a direct payout to a player fails:

- the round settlement MUST continue
- the failed amount MUST NOT be dropped
- the failed amount MUST be recorded as a fallback claim entitlement
- the failure MUST be reflected in settlement events and accounting

### Required accounting invariant

`totalPaidOut + totalFallbackClaimable == PlayerSettlementPool`

If this invariant does not hold, settlement MUST revert.
