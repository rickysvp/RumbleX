# RumbleX Transaction Flow Spec

Version: 1.1
Last updated: 2026-04-22

## 1. Purpose

This spec defines the lifecycle of all user-facing blockchain transactions in RumbleX MVP.

The goal is to ensure frontend state, user messaging, and blockchain truth remain aligned, especially when a transaction fails, is cancelled, or remains pending.

***

## 2. Covered Transaction Types

MVP user-facing transaction types are:

- connect wallet
- mint pass
- join round
- claim all

***

## 3. Canonical Transaction Lifecycle

All user-facing transactions should follow the same logical lifecycle:

1. Precheck
2. Awaiting Signature
3. Submitted
4. Pending Confirmation
5. Confirmed
6. Failed
7. Cancelled

Frontend may simplify display labels, but this logical model remains canonical.

***

## 4. Precheck Rules

Prechecks improve UX but do not enforce protocol security.

### Mint Pass prechecks

- wallet connected
- user does not appear to already own a pass
- mint price loaded

### Join Round prechecks

- wallet connected
- pass appears owned
- round appears open
- user appears not already joined
- expected payment value available

### Claim All prechecks

- wallet connected
- visible claimable balance is greater than zero

Important:
All of the above are frontend optimizations only.
Contract-layer checks remain mandatory.

***

## 5. No Final Trust in Optimistic State

Frontend MUST NOT permanently trust optimistic local state for participation or money-related results.

After any seemingly successful transaction:

- refresh authoritative on-chain and/or confirmed indexed state
- overwrite optimistic local values with authoritative values

This rule is especially important for:

- pass ownership
- joined status
- claimable balance
- claim status

***

## 6. Failure Rollback Rules

If a transaction fails or is cancelled, the frontend must revert to authoritative state.

### Mint Pass failure

- do not mark the user as pass owner
- refresh pass ownership if needed

### Join Round failure

- do not keep local joined state
- refresh round state
- refresh user participation state

### Claim All failure

- do not zero local claimable balance
- refresh claimable balance
- refresh claim records

***

## 7. Post-Confirmation Refresh Rules

After transaction confirmation:

### Mint Pass

Refresh:

- pass ownership
- wallet summary

### Join Round

Refresh:

- round state
- participant status
- wallet summary if relevant

### Claim All

Refresh:

- claimable balance
- claim records
- wallet summary
- recent history if claim state is reflected there

***

## 8. Pending State Semantics

While a transaction is pending:

- UI may show progress
- UI must not show irreversible final success yet

Recommended copy:

- “Waiting for confirmation...”
- “Syncing latest status...”

***

## 9. Funds Safety Messaging

The transaction layer must clearly distinguish:

- user cancelled
- rejected before execution
- reverted on-chain
- pending
- confirmed

Whenever a transaction fails without a completed state change, the product must clearly say that funds were not moved.

***

## 10. Summary

Transaction flow in RumbleX is correct only if:

- frontend prechecks improve UX without replacing contract checks
- failed transactions do not leave false success state locally
- confirmed transactions always trigger authoritative refresh
- monetary state is never trusted purely optimistically

## X. Transaction State Persistence

User-facing transaction state MUST survive ordinary in-app navigation and MUST recover safely after refresh or interruption.

### In-app navigation rule

While the user remains in the active app session, transaction state SHOULD be preserved across page or panel changes.

This applies in particular to:

- pass mint
- round join
- claim all

### Required behavior

If the user navigates between pages during an in-flight transaction, the frontend MUST NOT silently discard the visible transaction state.

***

## X. Refresh and Rehydration Rules

If the browser is refreshed, re-opened, or the user returns after interruption, transaction state MUST be rehydrated from authoritative sources whenever possible.

### Required rehydration order

1. if a transaction hash is known, query chain receipt or equivalent authoritative transaction status
2. refresh canonical user summary and relevant contract/indexer-derived state
3. replace any stale optimistic local state with authoritative state

### Cancellation assumption

If no transaction hash was ever produced and the app was interrupted during signature stage, the transaction MAY be treated as cancelled by the user unless later evidence shows otherwise.

***

## X. Unknown State Handling

Some transactions may remain in uncertain status after interruption, RPC delay, or confirmation delay.

The transaction model SHOULD support an `unknown` or equivalent uncertainty state.

### Required rule

The frontend MUST NOT convert uncertain state into success or failure without authoritative confirmation.

### User message rule

When status is uncertain, the product SHOULD direct the user to authoritative wallet or on-chain history checks while also refreshing protocol summary views.

***

## X. Transaction Timeout Semantics

Transaction UI timeouts are presentation-level timers, not authoritative chain outcomes.

### Recommended handling

- `awaiting_signature` may time out back to idle after a defined UX timeout
- `pending_confirmation` may move to `unknown` after a defined UX timeout if confirmation is still unavailable

### Required rule

A frontend timeout MUST NOT be treated as proof that on-chain state did or did not change.

Authoritative state refresh remains mandatory.

***

## X. Global Visibility of In-Flight State

If the app supports global state management, in-flight transaction progress SHOULD remain visible across the product.

### Recommended behavior

Users SHOULD be able to see:

- awaiting signature
- submitted
- pending confirmation
- confirmed
- failed
- cancelled
- unknown

This reduces false assumptions caused by page changes or modal dismissal.

***

## X. Authoritative Refresh After Every Final Outcome

After any transaction reaches a user-visible terminal outcome, the app MUST refresh authoritative state relevant to that action.

### Mint Pass

Refresh at minimum:

- pass ownership state
- wallet-related user summary

### Join Round

Refresh at minimum:

- joined status
- round participant count when relevant
- round state
- relevant wallet or claim summary if impacted

### Claim All

Refresh at minimum:

- claimable balance
- claim source records or claim history
- wallet-related user summary

### Rule

No terminal UI state may be treated as final until the corresponding authoritative refresh completes or clearly degrades into explicit stale/unknown state.

***

## X. No False Success Persistence

The frontend MUST NOT persist false success state across navigation, refresh, or reconnect.

### Required examples

- failed pass mint MUST NOT leave the user marked as pass holder
- failed join MUST NOT leave the user marked as joined
- failed claim MUST NOT leave claimable balance cleared
- unknown confirmation status MUST NOT be rendered as confirmed success

***

## X. Multi-Tab Safety

If the product does not implement strong multi-tab synchronization, the transaction spec MUST explicitly treat multi-tab state as best-effort only.

### Required product rule

The app MUST prefer authoritative refresh over trusting locally cached transaction state when multiple tabs or sessions may exist.

***

## X. Separation of UX State and Protocol State

Transaction UI state and protocol truth are related but not identical.

### Canonical rule

- UI state explains what the app currently believes is happening
- protocol state explains what chain-confirmed reality currently is

If the two diverge, protocol state MUST win.
