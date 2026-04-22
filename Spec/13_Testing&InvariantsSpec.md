# RumbleX Testing & Invariants Spec

Version: 1.1
Last updated: 2026-04-22

## 1. Purpose

This spec defines the mandatory invariants and tests required for RumbleX MVP.

The top priority is not UI correctness. The top priority is protecting funds, preventing duplicate claims, preserving state integrity, and keeping indexed data aligned with on-chain truth.

***

## 2. Mandatory Runtime and Security Invariants

The following rules must exist both as tests and, where applicable, as runtime implementation constraints.

### 2.1 Settlement authority

- unauthorized callers cannot settle
- only designated settlement operator may settle

### 2.2 Pass-gated participation

- users without Pass cannot join
- direct contract calls cannot bypass Pass gating

### 2.3 Entry split correctness

- protocol fee + season fee + player pool == totalEntryCollected

### 2.4 Payout sum correctness

- sum of all participant payouts == playerPoolAmount

### 2.5 Survivor payout rule

- only survivors may have positive payout
- eliminated players must have zero payout

### 2.6 Fallback conservation

- totalPaidOut + totalFallbackClaimable == playerPoolAmount

### 2.7 Single settlement

- a settled round cannot be settled again

### 2.8 No double claim

- claimed records cannot be claimed again
- concurrent claim attempts cannot double-spend the same entitlement

***

## 3. Claim Safety Tests

At minimum, test:

1. single fallback claim succeeds
2. `claimAll()` handles multiple records correctly
3. second claim attempt on the same records fails or pays zero
4. reentrancy attempt fails
5. failed direct payout becomes fallback claim
6. claimable balance decreases only after successful claim completion

***

## 4. Settlement Failure Tests

At minimum, test:

1. unauthorized settlement caller reverts
2. payout sum mismatch reverts
3. fee split mismatch reverts
4. eliminated player with non-zero payout reverts
5. one payout receiver failure does not block full settlement
6. failed receiver amount becomes fallback claim record

***

## 5. Participation Tests

At minimum, test:

1. user without Pass cannot join
2. pass holder can join
3. duplicate join fails
4. join after lock fails
5. join when full fails

***

## 6. Season Reward Tests

At minimum, test:

1. only qualified players are included
2. reward formula uses deterministic proportional distribution
3. integer remainder follows documented dust rule
4. assigned rewards match emitted events and readable state

***

## 7. Indexer Consistency Tests

At minimum, test:

1. replay is idempotent
2. duplicate event processing does not inflate balances
3. orphaned block rollback restores correct derived state
4. pending and confirmed views are not conflated
5. summary, claims, history, stats, and rank remain consistent

***

## 8. Frontend Transaction Consistency Tests

At minimum, test:

1. failed join does not leave false joined UI state
2. failed claim does not zero local claimable balance
3. successful claim triggers authoritative refresh
4. successful mint triggers pass-status refresh
5. pending state is visually distinct from confirmed state

***

## 9. Launch Blocking Conditions

Release must be blocked if any of the following are true:

- unauthorized settlement is possible
- no-pass join is possible
- payout sum check is missing or failing
- duplicate claim is possible
- one failed payout can lock the full round
- indexer can permanently overcount balances
- pending monetary data is shown as final truth

***

## 10. Summary

RumbleX MVP is test-ready only if:

- money conservation is enforced
- privileged actions are protected
- claim duplication is impossible
- fallback payout path is safe
- indexed views remain consistent with confirmed chain truth

<br />

## X. Batch and Gas Safety Tests

Because round capacity is `333`, testing must include gas-safety and batch-safety coverage.

### At minimum, test:

1. settlement commit with large participant count
2. participant result batch submission
3. payout batch execution
4. finalization blocked until all required batches are present
5. duplicate batch submission fails
6. batch ordering errors do not corrupt totals

Any settlement design that works only at small participant counts but fails operationally at configured capacity is non-compliant.

***

## X. Emergency Pause and Incident Tests

At minimum, test:

1. pause disables join
2. pause disables new settlement submissions
3. authorized admin can unpause
4. operator rotation after incident preserves control boundaries
5. user claim entitlements are not silently lost during pause scenarios

***

## X. Provenance and Finality Tests

At minimum, test:

1. every settlement record has tx/source provenance
2. claim source records remain auditable
3. pending data is not exposed as confirmed
4. reorg rollback updates freshness/finality correctly
5. stale data is surfaced as stale in API-facing read models

## X. Batch and Gas Safety Tests

Because the canonical round capacity is `333`, testing MUST include gas-safety and batch-safety coverage.

### At minimum, test:

1. settlement commit with high participant count
2. participant result batch submission across multiple batches
3. payout batch execution across multiple batches
4. finalization remains blocked until all required batches are committed
5. duplicate batch submission fails or is safely ignored according to canonical idempotency rules
6. out-of-order or malformed batch submission cannot corrupt totals
7. total participant accounting remains correct at configured capacity

### Non-compliance rule

Any settlement design that only works safely at small participant counts but fails operationally at configured round capacity is non-compliant.

***

## X. Settlement Invariant Tests

At minimum, test the following settlement invariants:

1. unauthorized settlement caller reverts
2. round cannot be settled twice
3. payout sum mismatch reverts
4. fee split mismatch reverts
5. eliminated player with non-zero payout reverts
6. non-participant recipient in payout vector reverts
7. total paid plus total fallback equals player pool
8. settlement timeout does not silently convert player funds into protocol treasury
9. recovery path preserves canonical accounting semantics

***

## X. Claim Safety Tests

At minimum, test:

1. single claim succeeds correctly
2. `claimAll()` handles multiple claim sources correctly
3. a claimed record cannot be claimed again
4. concurrent or repeated claim attempts cannot double-spend the same entitlement
5. reentrancy attempt fails
6. failed transfer does not create ambiguous payable state
7. claimable balance decreases only after successful claim completion according to canonical logic
8. fallback round claims and season reward claims remain distinguishable by type and source id

***

## X. Participation and Access Tests

At minimum, test:

1. a user without required Pass cannot join
2. a valid Pass holder can join
3. duplicate join attempt fails
4. join after lock fails
5. join beyond max player count fails
6. canonical max player capacity is enforced consistently
7. frontend precheck disagreement does not bypass contract enforcement

***

## X. State Machine Tests

At minimum, test:

1. valid canonical state transitions succeed
2. invalid transitions revert or remain unavailable
3. state names remain consistent across contract, API, and indexer layers
4. cancelled rounds follow only documented cancellation paths
5. joined players cannot use an undefined voluntary withdrawal path
6. timeout transitions enter governed recovery logic rather than undefined behavior

***

## X. Season Reward Tests

At minimum, test:

1. qualification uses canonical finalized kill totals only
2. only qualified players participate in season reward distribution
3. reward formula matches the documented proportional rule
4. integer rounding follows the documented remainder rule
5. no-qualified-player path follows the documented rollover rule
6. assigned season rewards match emitted events and readable state
7. estimated reward and assigned reward are not conflated in read models

***

## X. Indexer and Finality Tests

At minimum, test:

1. duplicate event ingestion does not duplicate balances or history
2. replay from checkpoint is idempotent
3. reorg rollback removes orphaned monetary effects
4. pending and confirmed views are not conflated
5. stale data is surfaced as stale rather than silently treated as final
6. history, claims, stats, and rank remain reconstructable from canonical event sources
7. feed and settled truth divergence resolves in favor of settled truth

***

## X. Transaction Consistency Tests

At minimum, test:

1. failed mint does not leave false pass-holder state
2. failed join does not leave false joined state
3. failed claim does not zero local claimable state
4. page refresh during pending transaction rehydrates authoritative state
5. missing transaction hash after interrupted signature flow resolves to cancelled or unknown, not false success
6. timeout in UI does not overwrite authoritative chain truth
7. terminal transaction UI state triggers authoritative refresh

***

## X. Provenance and Auditability Tests

At minimum, test:

1. every settlement record preserves source provenance fields
2. claim records preserve source type and source id
3. season reward assignment remains traceable to season and kill totals
4. source transaction and confirmation metadata remain available in indexed or API-facing read models
5. timestamp fields reflect source event time rather than render time where canonical event time exists

***

## X. Pause and Incident Tests

At minimum, test:

1. pause disables new joins
2. pause disables new round creation when configured to do so
3. privileged control can unpause
4. pause does not silently destroy recorded user entitlements
5. pause does not rewrite player funds into protocol treasury
6. incident recovery paths remain access-controlled and auditable

***

## X. Launch Blocking Conditions

Release MUST be blocked if any of the following are true:

- unauthorized settlement is possible
- no-pass participation is possible
- payout conservation can fail
- claims can be duplicated
- a single failed payout can corrupt round accounting
- pending monetary data is presented as final truth
- stale or orphaned indexer data can remain permanently user-facing
- configured round capacity causes settlement or accounting failure

