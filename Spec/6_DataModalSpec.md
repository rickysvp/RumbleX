**RumbleX Data Model Spec**。\
这份文档的作用是把前端、索引器和合约使用的字段统一下来，避免同一个“回合结果”在不同模块里出现三套命名和三套口径。

## 文档目标

RumbleX 是按**单轮独立结算**运行的链游，因此数据模型必须先围绕 `Season`、`Round`、`PlayerRoundResult`、`Claim` 四类核心对象建立，再向 UI 扩展。\
同时，模型必须能覆盖 Pass 持有校验、每轮最终上链结算、赛季击杀累计和 fallback claim 这几条主链路。

## 核心实体

建议先固定 8 个实体：`PlayerProfile`、`PassState`、`Season`、`Round`、`RoundParticipant`、`RoundSettlement`、`ClaimBalance`、`PlayerSeasonStats`。\
其中 `Round` 负责描述房间本身，`RoundParticipant` 负责“谁参加了这轮”，`RoundSettlement` 负责“这轮怎么分钱”，而 `ClaimBalance` 只负责“哪些钱还没直达钱包”。

建议字段如下：

实体

关键字段

`PlayerProfile`

`address`, `displayName`, `hasPass`, `walletBalance`, `claimableMon`, `seasonEstimateMon`

`PassState`

`address`, `hasPass`, `passTokenId`, `checkedAt`

`Season`

`seasonId`, `status`, `startTime`, `endTime`, `seasonVaultBalance`, `qualificationKillThreshold`

`Round`

`roundId`, `seasonId`, `roomAddress`, `state`, `entryFee`, `maxPlayers`, `participantCount`, `startTime`, `endTime`, `rulesetHash`

`RoundParticipant`

`roundId`, `playerAddress`, `joinTime`, `loadoutSkillId`, `loadoutItemId`, `isEliminated`, `isSurvivor`, `kills`, `finalHolding`, `payoutAmount`, `payoutStatus`

`RoundSettlement`

`roundId`, `resultHash`, `totalEntryCollected`, `protocolFeeAmount`, `seasonFeeAmount`, `playerPoolAmount`, `totalPaidOut`, `totalFallbackClaimable`, `settledAt`

`ClaimBalance`

`playerAddress`, `claimableTotal`, `fallbackRoundAmount`, `seasonRewardAmount`, `updatedAt`

`PlayerSeasonStats`

`seasonId`, `playerAddress`, `totalKills`, `qualified`, `estimatedReward`, `claimedSeasonReward`

## 状态与枚举

`Round.state` 建议固定为：`SignupOpen`、`SignupLocked`、`Live`、`SettlementPending`、`Settled`、`FallbackClaimOpen`、`Closed`，这样才能和你前面定义的房间状态机与结算状态保持一致。\
`RoundParticipant.payoutStatus` 建议固定为：`none`、`paid`、`claimable`，因为用户在前端只需要理解“没收益 / 已到账 / 可领取”这三种结果。\
`Season.status` 建议固定为：`Upcoming`、`Active`、`Ended`、`RewardsReady`、`Closed`，这样 Rank、Stats 和 Claim UI 都能共用一套口径。

## 字段约束

有几条约束必须写死：`RoundSettlement.playerPoolAmount = totalEntryCollected * 0.8`，`protocolFeeAmount = totalEntryCollected * 0.1`，`seasonFeeAmount = totalEntryCollected * 0.1`。\
`RoundParticipant.payoutAmount` 只有幸存者才能大于 0，被淘汰者必须为 0，而且全体 `payoutAmount` 之和必须等于 `playerPoolAmount`。\
`ClaimBalance.claimableTotal` 必须等于 `fallbackRoundAmount + seasonRewardAmount`，因为 Claim All 的唯一目标就是聚合 fallback payout 与赛季奖励两类待领取金额。

## 前端映射

左侧钱包区直接读取 `PlayerProfile`，至少展示 `walletBalance`、`claimableMon`、`seasonEstimateMon` 和 `hasPass`，因为这几项就是用户最关心的资金与资格状态。\
History 页按 `Round + RoundParticipant + RoundSettlement` 渲染，每一行至少要能显示 round id、settled time、你的 kills、你的 payout amount、你的 payout status。\
Stats 页主要读 `PlayerSeasonStats` 和聚合后的 `RoundParticipant` 数据，Rank 页主要读 `PlayerSeasonStats.totalKills` 与资格状态，Claim 区则只读 `ClaimBalance`。

<br />

## X. Provenance and Confirmation Fields

Every money-related and settlement-related entity must carry enough provenance metadata for auditability.

### Required provenance fields by entity

#### RoundSettlement

- `settlementTxHash`
- `settlementBlockNumber`
- `settlementLogIndex`
- `resultHash`
- `confirmationStatus`
- `confirmedAt`

#### ClaimRecord / ClaimBalance source records

- `sourceTxHash`
- `sourceBlockNumber`
- `sourceLogIndex`
- `claimType`
- `sourceId`
- `confirmationStatus`

#### PlayerHistoryEntry

- `roundId`
- `settlementTxHash`
- `finalizationStatus`
- `dataFreshness`

#### SeasonRewardAssignment

- `assignmentTxHash`
- `assignmentBlockNumber`
- `assignmentLogIndex`
- `seasonId`
- `qualificationSnapshotVersion`
- `confirmationStatus`

### Freshness fields

API-facing read models should also support:

- `isPending`
- `isConfirmed`
- `isStale`
- `lastSyncedAt`

These fields are required to help frontend distinguish final truth from syncing state.

<br />

## X. Canonical Modeling Rules

All protocol-facing data models MUST preserve canonical meaning across contracts, indexers, APIs, and frontend read models.

A field name MUST NOT represent different semantics in different layers.

For example:

- `claimableMon` must always refer to currently claimable user entitlement, not wallet balance
- `payoutAmount` must always refer to final on-chain payout amount, not simulated in-game holding
- `estimatedReward` must never mean assigned season reward

***

## X. Round-Level Entities

Round-related modeling MUST distinguish between:

- round configuration
- participation
- settlement result
- payout execution outcome

### Required round configuration fields

The canonical round model SHOULD include, at minimum:

- `roundId`
- `seasonId`
- `roomAddress`
- `state`
- `entryFee`
- `maxPlayers`
- `participantCount`
- `signupEnd`
- `liveEnd`
- `settlementDeadline`
- `rulesetHash`

### Required rule

`maxPlayers` MUST reflect the canonical configured capacity of the round and MUST remain consistent with protocol configuration.

***

## X. Participant Result Fields

Round participant modeling MUST be sufficient to reconstruct both game outcome and payout outcome.

Each participant result record SHOULD support, at minimum:

- `roundId`
- `playerAddress`
- `joinedAt`
- `loadoutSkillId`
- `loadoutItemId`
- `strategyId` if strategy selection is modeled explicitly
- `kills`
- `isEliminated`
- `isSurvivor`
- `finalHolding`
- `payoutAmount`
- `payoutStatus`

### Canonical meaning

- `finalHolding` = in-game final simulated holding before payout scaling
- `payoutAmount` = final on-chain payout amount after canonical scaling
- `payoutStatus` = one of:
  - `none`
  - `paid`
  - `claimable`

### Consistency rules

- if `isEliminated = true`, then `payoutAmount` MUST be zero
- if `payoutAmount > 0`, then the participant MUST be a survivor
- `finalHolding` and `payoutAmount` MUST NOT be treated as interchangeable values

***

## X. Settlement Record Fields

Settlement records MUST retain sufficient accounting detail for audit and indexer rebuild.

Each round settlement record SHOULD support, at minimum:

- `roundId`
- `seasonId`
- `resultHash`
- `settlementVersion`
- `totalEntryCollected`
- `protocolFeeAmount`
- `seasonFeeAmount`
- `playerPoolAmount`
- `totalPaidOut`
- `totalFallbackClaimable`
- `settledAt`

### Consistency rules

- `protocolFeeAmount + seasonFeeAmount + playerPoolAmount` MUST equal `totalEntryCollected`
- `totalPaidOut + totalFallbackClaimable` MUST equal `playerPoolAmount`

***

## X. Claim Source Modeling

Claimable balances MUST be derivable from explicit claim sources.

The system SHOULD distinguish claim sources at record level, not only at aggregated balance level.

### Required source-level fields

Each claim source record SHOULD support, at minimum:

- `playerAddress`
- `claimType`
- `sourceId`
- `sourceRoundId` when applicable
- `sourceSeasonId` when applicable
- `amount`
- `status`
- `createdAt`
- `claimedAt` when applicable

### Canonical claim types

At minimum:

- `fallback_round_payout`
- `season_reward`

### Required status semantics

- `unclaimed`
- `claimed`

No claim source may exist in ambiguous partially-claimed state unless a later spec explicitly introduces partial-claim behavior.

***

## X. Aggregated Balance Fields

User-facing aggregated money views MUST distinguish between different balance concepts.

The account summary model SHOULD support, at minimum:

- `walletBalance`
- `claimableMon`
- `seasonEstimatedMon`
- `seasonAssignedMon`
- `seasonClaimedMon`

### Required rule

These fields MUST NOT be collapsed into one generic “balance” value.

***

## X. Season Modeling Fields

Season-related models MUST distinguish between qualification, estimated reward, assigned reward, and claimed reward.

The season player model SHOULD support, at minimum:

- `seasonId`
- `playerAddress`
- `totalKills`
- `qualified`
- `qualificationThreshold`
- `estimatedReward`
- `assignedReward`
- `claimedSeasonReward`

### Required semantics

- `estimatedReward` is derived preview data and is not final
- `assignedReward` exists only after season finalization
- `claimedSeasonReward` reflects actually claimed assigned entitlement

***

## X. Provenance and Confirmation Fields

Every money-related and settlement-related entity MUST carry enough provenance metadata for auditability and freshness handling.

### Recommended provenance fields

For settlement-related and claim-related records, models SHOULD preserve:

- `sourceTxHash`
- `sourceBlockNumber`
- `sourceLogIndex`
- `sourceEventType`
- `confirmationStatus`
- `confirmedAt`
- `lastSyncedAt`

### Recommended confirmation values

At minimum:

- `pending`
- `confirmed`

If degraded read modes exist, additional freshness flags MAY be layered above these values.

***

## X. Freshness Flags for Read Models

API-facing read models SHOULD support freshness flags where applicable.

Recommended fields:

- `isPending`
- `isConfirmed`
- `isStale`

### Rule

Freshness flags MUST describe data finality, not business success.

For example:

- a payout may be successful but still pending confirmation
- a claim source may exist but still be displayed as pending until confirmation policy is satisfied

***

## X. Ruleset and Loadout Configuration Modeling

Where loadout configuration is ruleset-based, the canonical round model MUST reference the ruleset deterministically.

### Required rule

The round record MUST preserve `rulesetHash` as the canonical binding to loadout pricing and effect configuration for that round.

### Separation rule

- on-chain models MAY store only `rulesetHash`
- off-chain systems MAY store expanded ruleset configuration
- expanded off-chain ruleset content MUST remain consistent with the canonical `rulesetHash`

***

## X. Timestamp Semantics

Timestamp fields MUST represent real event time, not UI render time or current device time.

For user-facing history, settlement, claim, and season records, displayed timestamps SHOULD map to canonical source event time whenever possible.
