# RumbleX Contract Scope Spec

Version: 1.1
Last updated: 2026-04-22

## 1. Purpose

This spec defines the minimum smart contract scope for RumbleX MVP and the mandatory security requirements that every implementation must satisfy.

The MVP contract system is intentionally narrow. It exists to support qualification, round participation, round settlement, season fund routing, and claims.

***

## 2. MVP Contract Set

The MVP contract set is:

1. `RumbleXPass`
2. `RoundFactory`
3. `RoundRoom`
4. `SeasonVault`
5. `ClaimVault`

No advanced governance contracts, multi-chain routing contracts, or expanded treasury systems are required in MVP.

***

## 3. RumbleXPass

### Responsibility

- mint Pass NFTs
- expose pass ownership checks used for participation gating

### Mandatory requirements

- the contract MUST expose a stable ownership check such as `hasPass(address)`
- pass ownership MUST be usable by `RoundRoom` as an on-chain participation gate
- frontend pass checks are UX helpers only and MUST NOT be treated as security enforcement

***

## 4. RoundFactory

### Responsibility

- create round rooms
- register round ids and room addresses
- expose round discovery queries

### Mandatory requirements

- only authorized round creation authority may create new rounds
- each round id MUST be unique
- each created room MUST be permanently linked to its round id

***

## 5. RoundRoom

### Responsibility

- accept joins
- enforce participation rules
- track round participants
- manage round state
- finalize round settlement

### Mandatory requirements

#### 5.1 Pass enforcement

`join()` MUST enforce Pass ownership on-chain.

A user without a valid Pass MUST NOT be able to join by bypassing the frontend and calling the contract directly.

#### 5.2 Join state checks

`join()` MUST revert if any of the following are true:

- round is not in `SignupOpen`
- user already joined
- max player count reached
- payment is insufficient
- user does not hold a valid Pass

#### 5.3 Settlement authority

`settleRound()` MUST be restricted to the authorized settlement operator or settlement role.

Settlement is not permissionless in MVP.

#### 5.4 Single-settlement rule

A round may be settled only once.

#### 5.5 Settlement invariants

`settleRound()` MUST enforce:

- payout sum equals player pool
- entry split totals are correct
- failed payouts are moved into fallback claim flow

***

## 6. SeasonVault

### Responsibility

- receive season fee inflows
- maintain season pool balances
- expose season reward balances

### Mandatory requirements

- only authorized season operator may assign season rewards
- reward assignment MUST use a deterministic formula
- reward assignment MUST be reconstructable from state and events

### Canonical MVP reward formula

`playerReward = floor(playerQualifiedKills * seasonPool / totalQualifiedKills)`

Where:

- only qualified players are included
- `totalQualifiedKills` is the sum of kills across all qualified players for that season

### Dust / remainder rule

Integer division remainder MUST be explicitly handled.

MVP default rule:

- remainder stays in `SeasonVault`
- remainder is rolled into the next season pool unless a later spec version changes this

This rule must remain consistent across contract logic, indexer logic, and frontend display logic.

***

## 7. ClaimVault

### Responsibility

- store fallback round claims
- store season reward claims
- expose safe claiming flows

### Mandatory requirements

#### 7.1 No double claim

Each claim record MUST have an explicit claimed state.

A claimed entitlement MUST NOT be claimable again.

#### 7.2 Atomic claim semantics

The contract must ensure claim state transitions are atomic.

No concurrent or repeated claim attempt should allow one entitlement to be paid twice.

#### 7.3 Reentrancy protection

Claim functions MUST be protected against reentrancy.

#### 7.4 Claim-all safety

`claimAll()` MUST pay only currently unclaimed records that belong to `msg.sender`.

#### 7.5 Unique claim origin

Each claim record MUST be uniquely tied to:

- player
- claim type
- source id
- amount

The same entitlement source MUST NOT create duplicate payable claim records.

***

## 8. Roles

MVP role set:

- `OWNER`
- `ROUND_OPERATOR`
- `SETTLEMENT_OPERATOR`
- `SEASON_OPERATOR`
- `CLAIM_OPERATOR`

### Role rules

- `OWNER` manages privileged configuration
- `ROUND_OPERATOR` creates rounds
- `SETTLEMENT_OPERATOR` finalizes round results
- `SEASON_OPERATOR` assigns season rewards
- `CLAIM_OPERATOR` may record explicit claim records where the design requires it

In MVP, one address may hold multiple roles, but every privileged action must still be access-controlled.

***

## 9. Emergency Pause

Core contracts SHOULD include emergency pause capability.

### Pause behavior

When paused:

- new joins are disabled
- new settlement submissions are disabled

When safely possible:

- already recorded user claims SHOULD remain claimable

Pause authority must be limited to admin/owner control.

***

## 10. Treasury and Withdrawal Clarity

Protocol funds and season funds must not be trapped ambiguously.

### Mandatory clarity requirements

- the protocol-fee withdrawal path MUST be explicitly defined
- season-pool remainder handling MUST be explicitly defined
- all treasury withdrawals MUST emit events

Even if MVP keeps treasury operations simple, the extraction path must be auditable.

***

## 11. Summary

The RumbleX MVP contract scope is valid only if:

- join is Pass-gated on-chain
- settlement is operator-restricted
- payout invariants are enforced on-chain
- failed payouts become fallback claims
- claims cannot be duplicated or reentered
- season rewards use a deterministic documented formula

<br />

## X. Mandatory Emergency Pause

Emergency pause is mandatory in MVP.

### Required behavior

When protocol pause is active:

- new joins are disabled
- new round creation may be disabled
- new settlement submission may be disabled
- admin-only recovery actions remain available if explicitly defined

### Claim safety rule

Already recorded user claim entitlements SHOULD remain claimable whenever doing so is safe and technically feasible.

If claims are also paused for incident containment, that condition must be explicitly surfaced in product state and incident procedures.

***

## X. No Admin Sweep of User Claims

User claimable balances are not treasury balances.

### Mandatory rule

No owner, operator, or admin role may arbitrarily withdraw, sweep, or repurpose already-recorded user claim entitlements.

This applies to:

- fallback round claims
- assigned season reward claims

Protocol treasury withdrawal paths must remain strictly separate from user claim funds.

***

## X. Canonical Role Matrix

The contract system must maintain one canonical role matrix.

### Minimum authority mapping

- `OWNER`
  - pause / unpause protocol
  - rotate privileged operators
  - manage core configuration
- `ROUND_OPERATOR`
  - create rounds
  - manage allowed round lifecycle operations defined by protocol
- `SETTLEMENT_OPERATOR`
  - submit round settlement packages
  - submit settlement batches if batching is used
- `SEASON_OPERATOR`
  - finalize season reward assignment inputs
  - trigger season reward distribution flow
- `CLAIM_OPERATOR`
  - only if required by implementation, record explicit claim records from authorized sources

No role should have ambiguous implied power outside its documented scope.

<br />

