**RumbleX API Surface Spec**。\
这份文档的目标是把前端真正需要的**查询接口**和**写操作入口**收敛成一套稳定 API，让 Arena、History、Stats、Rank、Claim 和钱包区都能共用同一口径的数据与动作。

## 1. 文档目标

RumbleX 的产品闭环已经很清楚：用户先校验或铸造 Pass，再报名单轮房间，回合结束后查看结算、领取 claimable 金额，并在赛季维度查看击杀与资格状态。\
因此 API Surface 必须优先覆盖 6 类能力：`wallet/pass`、`round lobby`、`round result`、`history`、`claim`、`season rank/stats`。\
设计原则也应固定为一句话：**写操作尽量走链上签名，读操作尽量走索引器聚合接口。**

## 2. 读接口

前端建议只依赖一组聚合读接口，而不是每个页面自己扫事件，因为你已经明确要求最终结果上链，同时 UI 又需要钱包区、历史页、统计页和赛季页共用一致数据口径。

路由

用途

关键返回字段

`GET /me/summary?address=0x...`

钱包区和首页总览。

`address`, `hasPass`, `walletBalance`, `lockedInRounds`, `claimableMon`, `seasonEstimateMon`, `activeRoundId`。

`GET /me/claims?address=0x...`

Claim 面板与 Claim 来源详情。

`claimableTotal`, `fallbackClaims[]`, `seasonRewards[]`, `lastUpdatedAt`。

`GET /rounds/live`

Arena 房间大厅与官方房间展示。

`roundId`, `seasonId`, `state`, `entryFee`, `joinedCount`, `maxPlayers`, `startTime`, `roomAddress`。

`GET /rounds/recent`

全站最近回合列表与 History 首页。

`roundId`, `participants`, `survivors`, `volume`, `settledAt`, `resultHash`。

`GET /rounds/:roundId`

单轮详情页。

`round`, `settlement`, `participants[]`, `survivors[]`, `payouts[]`。

`GET /me/history?address=0x...`

我的历史战绩与结算结果。

`roundId`, `joinedAt`, `kills`, `survivalStatus`, `payoutAmount`, `payoutStatus`, `settledAt`。

`GET /me/stats?address=0x...`

Stats 页累计数据。

`totalRoundsPlayed`, `totalSurvivedRounds`, `totalKills`, `totalPaidOut`, `totalClaimed`, `currentClaimable`, `netMonDelta`。

`GET /season/current`

当前赛季头部信息与规则说明。

`seasonId`, `status`, `endsAt`, `prizePool`, `qualificationKillThreshold`。

`GET /season/:seasonId/rank`

Rank 页排行榜。

`playerAddress`, `displayName`, `totalKills`, `qualified`, `estimatedReward`。

`GET /season/:seasonId/me?address=0x...`

个人赛季卡片。

`totalKills`, `qualified`, `killsToThreshold`, `estimatedReward`, `claimedReward`。

这些读接口已经足够覆盖你当前 UI 中的左侧用户区、Arena、混合 feed 上方状态区、History、Stats 和 Rank 页面。

## 3. 写接口

写操作建议分成两层：**预检/构建层**和**链上提交层**，因为报名、Pass mint、Claim 都属于用户资金动作，最终可信状态必须依赖链上结果而不是普通 Web2 POST 成功提示。

动作

前端入口

建议 API

链上目标

连接后资格预检

钱包区、Arena 入口。

`POST /preflight/pass-check` 返回 `hasPass`、`canJoin`、`recommendedAction`。

无直接交易。

Mint Pass

无 Pass 用户的主 CTA。

`POST /tx/pass/mint-intent` 返回 `to`, `data`, `value`。

`RumbleXPass.mint()`。

报名单轮

Arena 的 PLAY / Queue 按钮。

`POST /tx/round/join-intent` 返回 `roundId`, `to`, `data`, `value`。

`RoundRoom.join()`。

提交 loadout

报名阶段选择技能和道具。

`POST /tx/round/loadout-intent` 返回签名数据或 calldata。

`RoundRoom.setLoadout()` 或等价入口。

Claim All

钱包区 Claim 模块的唯一主动作。

`POST /tx/claim/all-intent` 返回聚合领取交易参数。

`ClaimVault.claimAll()`。

刷新结算状态

回合结束后的结果刷新。

`POST /sync/round-status` 或纯前端重拉查询。

无直接交易。

MVP 阶段不要把“逐轮 claim”“按来源 claim”“管理员批量补发”暴露成前端主入口，因为你前面已经确定 Claim 应该是一键聚合，而不是让用户逐轮找钱。

## 4. 响应与错误

所有读接口建议统一返回：

```
json
```

`{ "ok": true, "data": { ... }, "meta": { "source": "indexer", "confirmed": true } }`

这种结构适合 RumbleX，因为用户最关心的是资金与结果是否已经**确认**，尤其是 `Claimable MON`、`RoundSettled` 和赛季奖励状态。\
所有写接口建议统一返回：

```
json
```

`{ "ok": true, "data": { "intentId": "...", "to": "0x...", "data": "0x...", "value": "..." } }`

这样前端就可以用同一套 wallet adapter 发起签名和提交。\
错误也建议只保留少量标准码，不要每个接口自己发明一套，例如：`PASS_REQUIRED`、`ROUND_NOT_JOINABLE`、`ALREADY_JOINED`、`NOTHING_TO_CLAIM`、`SETTLEMENT_PENDING`、`TX_BUILD_FAILED`。\
其中 `SETTLEMENT_PENDING` 很关键，因为回合结束后前端需要能明确告诉用户“这轮正在结算，状态稍后更新”，而不是让用户误以为钱丢了。

## 5. MVP 顺序

最小可上线 API 顺序建议只有 5 组：`/me/summary`、`/rounds/live`、`/tx/pass/mint-intent`、`/tx/round/join-intent`、`/tx/claim/all-intent`。\
第二阶段再补：`/me/history`、`/me/stats`、`/season/current`、`/season/:id/rank`，因为这些更偏展示层，不是用户完成核心资金闭环的前置条件。\
一句话讲，这份 API Surface Spec 的本质是：**用很少的稳定接口，覆盖 Pass、报名、结算、Claim 和赛季查询这五条主路径。**

<br />

## X. Finality and Freshness Contract

All money-related API responses must explicitly expose freshness and finality state.

### Required response metadata

For every summary, claim, history, stats, or rank response involving chain-derived values, the API should expose:

- `isPending`
- `isConfirmed`
- `isStale`
- `lastSyncedAt`
- `sourceBlockNumber` when available

### Mandatory rule

No endpoint may return chain-derived monetary values as silently final if the value is still pending confirmation or stale.

***

## X. Read-Only Degradation Mode

If indexer or aggregation services are degraded, the product must retain a minimal read-only fallback mode.

### Minimum fallback reads

The system should still be able to read directly from chain for:

- pass ownership
- current round identity
- round state
- user joined status
- claimable contract balance if directly queryable
- basic settlement status

### Product rule

Indexer-dependent views may degrade, but the product must avoid a full trust blackout for core user funds and participation state.

<br />

## X. API Design Convention

The API layer MUST follow one canonical naming and response convention.

### Route naming rules

Read endpoints SHOULD use:

- `GET /resource`
- `GET /resource/:id`
- `GET /me/...` for user-scoped read views

Transaction intent endpoints SHOULD use:

- `POST /tx/...-intent`

Sync or maintenance-trigger endpoints SHOULD use:

- `POST /sync/...`

### Canonical intent

The API intent layer prepares transaction metadata, but does NOT replace contract enforcement.

Frontend prechecks and API intent generation are convenience layers only.

***

## X. Recommended Endpoint Surface

The API SHOULD support, at minimum, the following read surfaces:

- `GET /me/summary`
- `GET /me/claims`
- `GET /me/history`
- `GET /me/stats`
- `GET /rounds/live`
- `GET /rounds/recent`
- `GET /rounds/:roundId`
- `GET /season/current`
- `GET /season/:seasonId/rank`
- `GET /season/:seasonId/me`

The API SHOULD support, at minimum, the following transaction intent surfaces:

- `POST /tx/pass/mint-intent`
- `POST /tx/round/join-intent`
- `POST /tx/claim/all-intent`

If loadout selection requires explicit transaction preparation in the architecture, a dedicated loadout intent route MAY be added.

***

## X. Canonical Response Envelope

All API responses SHOULD follow one canonical envelope.

### Success response

```json
{
  "ok": true,
  "data": {},
  "meta": {}
}
```

### Error response

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Rule

No endpoint should silently change envelope format by route family unless explicitly documented.

***

## X. Finality and Freshness Metadata

All money-related and settlement-related API responses MUST expose freshness and finality state.

### Required metadata fields

When applicable, API responses SHOULD expose:

- `isPending`
- `isConfirmed`
- `isStale`
- `lastSyncedAt`
- `sourceBlockNumber`
- `source` (for example: `chain`, `indexer`, `aggregated`)

### Mandatory rule

No API endpoint may present chain-derived monetary values as silently final when the data is still pending confirmation or stale.

This applies in particular to:

- claimable balances
- round settlement outputs
- season reward values
- reward qualification status
- player history rows that imply final money movement

***

## X. Feed vs Settlement Truth

Live feed and official settlement are not the same trust layer.

### Canonical trust rule

- live feed is narrative and provisional
- API-confirmed settled outcomes are derived from canonical chain truth
- final payout, claim, history, and season accounting MUST follow canonical settled on-chain outcome

### Conflict rule

If live feed data conflicts with settled round data, the settled round data MUST override the live feed for all money-related and record-related views.

### Product rule

The API MUST expose enough state for frontend to visually distinguish:

- live / provisional
- pending confirmation
- confirmed official result

***

## X. Degraded Read Mode

If indexer or aggregation systems are degraded, the API layer SHOULD retain a minimal read-only fallback mode for critical user state.

### Minimum fallback reads

When feasible, the system SHOULD still support direct-chain or reduced-trust reads for:

- pass ownership
- current round identity
- round state
- joined status
- claimable state if directly derivable
- basic settlement status

### Required product behavior

Degraded API mode MUST NOT silently present unavailable data as zero or final.

Unavailable or stale data MUST be surfaced explicitly.

***

## X. User-Scoped Money Semantics

For user-scoped endpoints, the API MUST distinguish between:

- wallet balance
- claimable balance
- estimated season reward
- assigned season reward
- claimed reward

These values MUST NOT be merged into a single ambiguous “balance” field.

***

## X. Query Consistency Rule

Endpoints that represent the same canonical concept MUST use the same field meanings.

For example:

- `claimableMon` must mean the same thing in summary and claims views
- round state names must match canonical state enum
- season reward status labels must match canonical season lifecycle terminology

No endpoint may redefine protocol meanings locally for convenience.

***

## X. Pagination and Ordering Rules

History, claim lists, round lists, and rank views SHOULD define stable ordering and pagination behavior.

### Minimum requirements

- paginated endpoints MUST document ordering keys
- default ordering MUST be deterministic
- cursor or page-based pagination MUST NOT duplicate or skip rows under normal operation
- pending and confirmed records SHOULD remain distinguishable in list views

