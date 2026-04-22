**RumbleX RoundRoom 状态机 Spec**。\
这份文档的目标是把“一个房间从创建到结算完成”的全过程写死，避免后面合约、前端、链下引擎三边状态不一致。

***

# RumbleX RoundRoom 状态机 Spec

## 1. 文档目的

本 Spec 定义单个 `RoundRoom` 的完整生命周期、状态流转、允许操作、禁止操作、异常处理和前端映射。\
它是：

- `RoundRoom` 合约设计依据
- 前端 Round Stage 状态依据
- 链下引擎提交结算的边界依据
- 测试用例依据。

***

## 2. RoundRoom 定义

一个 `RoundRoom` 表示一轮独立比赛实例，具有以下属性：

- 独立 `roundId`
- 独立报名列表
- 独立资金池
- 独立结算结果
- 独立上链状态。

每个 RoundRoom 只负责一轮，不复用，不重开，不循环使用。

***

## 3. 状态总览

建议最终状态机使用以下状态，而不是当前前端原型里的简单三态 `entry_open / live / concluded`。

## 核心状态

1. `Created`
2. `Open`
3. `Locked`
4. `Live`
5. `SettlementPending`
6. `Settled`
7. `FallbackClaimOpen`
8. `Closed`

这些状态必须是链上房间的正式状态，不允许前端自己“猜”。

***

## 4. 状态定义

## 4.1 `Created`

含义：

- 房间已由 `RoundFactory` 创建
- 但尚未对外开放报名。

典型用途：

- 初始化参数
- 写入 `rulesetHash`
- 设置开始时间 / 报名截止时间 / 最多人数 / entry fee。

允许操作：

- 配置房间参数
- 激活房间进入 `Open`。

禁止操作：

- 玩家报名
- 链下引擎启动
- 提交结算。

***

## 4.2 `Open`

含义：

- 房间已开放报名。

允许操作：

- 用户支付并报名
- 查询当前报名人数
- 查询剩余报名时间
- 查询自己是否已报名。

约束：

- 最多 100 人报名。
- 报名必须满足 Pass 条件。
- 报名时资金直接进入房间合约，不经过服务器。

退出条件：

- 到达报名截止时间；或
- 达到最大报名人数；或
- 满足开局条件后由系统锁定。

***

## 4.3 `Locked`

含义：

- 房间不再接受新报名
- 最终参赛名单已固定
- 即将开始 live 阶段。

允许操作：

- 查询最终参赛名单
- 查询开局倒计时
- 准备链下引擎启动。

禁止操作：

- 新报名
- 退赛退款（除非你另有明确规则）

退出条件：

- 开局时间到达，状态进入 `Live`。

***

## 4.4 `Live`

含义：

- 房间正式开始运行 10 分钟回合。

允许操作：

- 链下引擎运行事件模拟
- 前端展示 battle feed / system feed / live stats。

禁止操作：

- 新报名
- 提前结算
- 修改规则参数
- 修改参赛名单。

结束条件：

- 10 分钟到；或
- 满足“只剩下允许结算的存活人数”提前结束（如果你未来允许）

退出后进入 `SettlementPending`。

***

## 4.5 `SettlementPending`

含义：

- 回合已结束
- 链下引擎需要提交本轮最终结算结果
- 链上尚未完成正式分配。

允许操作：

- 提交结算数据
- 校验 `rulesetHash`
- 校验结果哈希 / 结果结构
- 计算 protocol fee / season fee / player payouts。

禁止操作：

- 重启房间
- 玩家继续参与
- 二次提交未授权结果。

这一步是**最关键安全状态**，因为它把“比赛过程结束”和“资金正式流转”隔开。

***

## 4.6 `Settled`

含义：

- 本轮结算已正式完成
- 协议费、赛季费、玩家发放结果都已进入链上最终状态。

允许操作：

- 查询结算结果
- 查询谁已直接收到 payout
- 查询哪些金额进入 fallback claim。

禁止操作：

- 重复结算
- 修改 payout
- 修改 survivors / kills / participants。

如果所有玩家款项都成功发放，则可直接进入 `Closed`。\
如果存在发放失败金额，则进入 `FallbackClaimOpen`。

***

## 4.7 `FallbackClaimOpen`

含义：

- 本轮主结算已完成
- 但存在个别 payout 发放失败
- 失败部分已转入 `ClaimVault`，等待用户自行领取。

允许操作：

- 查询 claimable 金额
- 用户 Claim All
- 查看 claim 来源 round。

禁止操作：

- 修改原始结算结果
- 重新分配本轮金额。

当所有 fallback 金额都处理完毕后，可进入 `Closed`。

***

## 4.8 `Closed`

含义：

- 本轮生命周期彻底结束。

特征：

- 状态只读
- 可查询历史
- 不允许任何资金与规则修改。

这个状态是历史页、统计页、排行页使用的最终可信来源。

***

## 5. 状态流转图

唯一合法流转应为：

Created→Open→Locked→Live→SettlementPending→Settled→(FallbackClaimOpen?)→ClosedCreated \rightarrow Open \rightarrow Locked \rightarrow Live \rightarrow SettlementPending \rightarrow Settled \rightarrow (FallbackClaimOpen?) \rightarrow ClosedCreated→Open→Locked→Live→SettlementPending→Settled→(FallbackClaimOpen?)→Closed

更具体写法：

- `Created -> Open`
- `Open -> Locked`
- `Locked -> Live`
- `Live -> SettlementPending`
- `SettlementPending -> Settled`
- `Settled -> Closed`
- `Settled -> FallbackClaimOpen -> Closed`。

不允许反向流转。\
不允许跨级跳转。\
不允许从 `Closed` 回到任何活跃状态。

***

## 6. 每个状态的触发者

## 系统 / 合约触发

- `Created -> Open`
- `Open -> Locked`
- `Locked -> Live`
- `Settled -> Closed`
- `FallbackClaimOpen -> Closed`。

## 玩家触发

- 仅在 `Open` 可报名。
- 仅在 `FallbackClaimOpen` 可 claim fallback 金额。

## 结算提交者触发

- `Live -> SettlementPending`
- `SettlementPending -> Settled`。

结算提交者可以是：

- 你自己的 operator
- 未来的 keeper
- 未来带有授权资格的结算者。

但 MVP 阶段建议只保留一个明确角色，减少攻击面。

***

## 7. 前端状态映射

你现在前端的 `entry_open / live / concluded` 只是原型态。\
正式上线建议这样映射：

链上状态

前端显示

`Created`

准备中

`Open`

报名中

`Locked`

已锁定 / 即将开始

`Live`

进行中

`SettlementPending`

结算中

`Settled`

已结算

`FallbackClaimOpen`

已结算 / 可领取

`Closed`

已关闭 / 历史轮次

这样前端不必展示所有技术词，但状态必须来自同一套状态机。

***

## 8. 用户视角状态

从玩家角度，还要叠加一层用户状态：

- `NotJoined`
- `Joined`
- `Alive`
- `Eliminated`
- `Paid`
- `Claimable`
- `NoPayout`。

例如：

- 房间状态 = `Live`，用户状态 = `Alive`
- 房间状态 = `FallbackClaimOpen`，用户状态 = `Claimable`
- 房间状态 = `Closed`，用户状态 = `Paid`。

这套映射要用于：

- Arena 页面
- History 页面
- Claim 区域
- 用户 stats。

***

## 9. 状态机约束

必须写死以下 invariant：

1. `Open` 状态下报名人数不得超过 100。
2. `Locked` 后参赛名单不可再变。
3. `Live` 期间规则参数不可变。
4. `SettlementPending` 只能有一次成功结算。
5. `Settled` 后资金分配不可再更改。
6. `FallbackClaimOpen` 只允许领取，不允许重算。
7. `Closed` 永久只读。

***

## 10. 房间资金行为与状态关系

## Open

- 接受报名资金。

## Locked

- 不再接受新资金进入报名池。

## Live

- 不执行结算类资金发放。

## SettlementPending

- 准备按结果分配资金。

## Settled

- protocol fee 已划走
- season fee 已划走
- 成功 payout 已发放。

## FallbackClaimOpen

- 失败 payout 已记入 `ClaimVault`。

## Closed

- 本轮无进一步资金动作。

***

## 11. 超时与异常规则

必须明确至少这些异常：

## A. 报名不足

如果人数不足最低开局条件（如果你未来设最低门槛），则：

- 房间取消并退款；或
- 延长报名；或
- 直接允许低人数开局。

这个规则必须单独写清，不能上线后靠人工判断。

## B. 结算超时

如果 `Live` 已结束但长时间无人提交结算：

- 必须定义 operator 超时责任
- 是否允许备用结算者提交
- 是否进入 emergency fallback。

## C. 部分收款失败

若结算中个别玩家收款失败：

- 其他成功发放不回滚
- 失败金额进入 `ClaimVault`
- 房间进入 `FallbackClaimOpen`。

***

## 12. 与其他模块的关系

## 与 Pass 模块

- `Open` 报名前必须验证 Pass。

## 与 Season 模块

- `Settled` 时将本轮 10% season fee 转入 `SeasonVault`。

## 与 Claim 模块

- `FallbackClaimOpen` 期间仅处理 fallback 金额。

## 与 History / Stats / Rank

- 这些页面只能读 `Settled / Closed` 的结果，不得读中间态作为最终结论。

***

## 13. 测试必须覆盖

这份状态机至少要有以下测试：

- 非法状态跳转被拒绝。
- `Closed` 后无法再结算。
- `Locked` 后无法再报名。
- `Live` 中无法直接 claim 或 payout。
- `SettlementPending` 无法重复提交有效结果。
- 有 fallback 时能正确进入 `FallbackClaimOpen`。
- fallback 清空后能进入 `Closed`。

***

## 14. 这份 Spec 的意义

以后你做任何东西，只要涉及房间生命周期，都要先问一句：

**它属于 RoundRoom 的哪个状态，是否与这份状态机一致？**

如果不一致：

- 前端不能先做
- 合约不能先写
- 文案不能乱加
- 测试不能跳过。

***

## X. State Transition Authority

Round state transitions are not permissionless.

In MVP, every privileged state transition must be triggered by an authorized operator role or by deterministic contract conditions explicitly defined in this spec.

### Rules

- `SignupOpen -> SignupLocked`
  - may occur when signup end time is reached, or when max player count is reached
  - may be triggered only by authorized round operator logic or an explicit contract transition path
- `SignupLocked -> Live`
  - may occur only after the round is locked
  - may be triggered only by authorized round operator logic
- `Live -> SettlementPending`
  - may occur when live end time is reached, or when a valid early-end condition defined by game rules is satisfied
  - may be triggered only by authorized round operator logic
- `SettlementPending -> Settled`
  - may occur only through authorized settlement flow
  - may be triggered only by authorized settlement operator
- `Settled -> FallbackClaimOpen`
  - may occur automatically as part of settlement result finalization if fallback claims exist, or by deterministic post-settlement logic
- `FallbackClaimOpen -> Closed`
  - may occur only after all round-final accounting is complete

No public caller may arbitrarily advance round state.

***

## X. Timeout and Liveness Rules

A round must not remain indefinitely stuck in a non-final state.

### MVP liveness policy

- each round MUST define:
  - `signupEnd`
  - `liveEnd`
  - `settlementDeadline`
- `settlementDeadline` is the maximum allowed time after `liveEnd` for settlement finalization

### Required behavior

- before `settlementDeadline`, only the authorized settlement operator may settle
- if settlement is not completed by `settlementDeadline`, the protocol enters incident mode for that round
- incident mode allows owner/admin to:
  - pause creation of new dependent flows if needed
  - rotate settlement operator
  - continue settlement through authorized recovery flow

Funds must not become permanently ambiguous due to missing operator action.

***

## X. Max Player Capacity

The canonical MVP round capacity is `333` players.

This value must be treated as protocol configuration, not as frontend-only display text.

### Mandatory rules

- the contract MUST enforce the round max player count
- frontend display, data model, API responses, and validation logic must all use the same canonical max player value
- any earlier reference to `100` players is superseded by this value in the latest version

## X. Canonical Round State Enum

All protocol-level documents, contracts, indexers, APIs, and frontend mappings MUST use one canonical round state set.

The canonical round state set is:

- `Created`
- `Open`
- `Locked`
- `Live`
- `SettlementPending`
- `Settled`
- `FallbackClaimOpen`
- `Cancelled`
- `Closed`

No protocol-level document may introduce alternate synonyms for these states.

For example:

- `SignupOpen` MUST be normalized to `Open`
- `SignupLocked` MUST be normalized to `Locked`

***

## X. State Meanings

### Created

The round exists but is not yet open for player entry.

### Open

Eligible players may join the round.

### Locked

The player list is frozen.
No further joins are allowed.

### Live

The round is actively running according to the game engine.

### SettlementPending

The live phase has ended and the round is awaiting canonical settlement submission.

### Settled

Canonical settlement has completed successfully.

### FallbackClaimOpen

Canonical settlement completed, and at least one payout was converted into fallback claimable entitlement.

### Cancelled

The round will not proceed to normal live completion.
This state is reserved for explicitly defined cancellation conditions.

### Closed

The round lifecycle is fully complete for protocol purposes.

***

## X. Canonical Transition Rules

The canonical transition graph is:

`Created -> Open -> Locked -> Live -> SettlementPending -> Settled -> Closed`

Optional terminal or side transitions may include:

- `Settled -> FallbackClaimOpen -> Closed`
- `Open -> Cancelled`
- `Locked -> Cancelled` only if an explicitly documented cancellation condition exists before live execution

### Invalid transition rule

No implementation may skip, reorder, or invent protocol state transitions unless such behavior is explicitly added in a later spec revision.

***

## X. State Transition Authority

Round state transitions are not permissionless.

Every privileged transition MUST be triggered by:

- authorized operator logic, or
- deterministic contract conditions explicitly defined in protocol rules

### Required authority boundaries

- `Created -> Open`
  - triggered only by authorized round preparation or activation logic
- `Open -> Locked`
  - triggered only by authorized round logic or deterministic close conditions such as signup timeout or max capacity reached
- `Locked -> Live`
  - triggered only by authorized round start logic
- `Live -> SettlementPending`
  - triggered only by deterministic live-end conditions or authorized round completion logic
- `SettlementPending -> Settled`
  - triggered only by authorized settlement submission
- `Settled -> FallbackClaimOpen`
  - triggered only if fallback claimable payouts exist
- `FallbackClaimOpen -> Closed`
  - triggered only after round-final claim accounting conditions are satisfied, or under explicitly documented archival rules
- `Cancelled -> Closed`
  - triggered only after all cancellation-side accounting is complete

No arbitrary public caller may advance round state outside documented protocol behavior.

***

## X. Cancellation Rules

Cancellation is exceptional behavior and MUST be explicitly bounded.

### Allowed cancellation conditions in MVP

A round MAY enter `Cancelled` only if:

- minimum valid participation conditions are not met before round start, or
- an explicitly documented pre-live protocol incident makes normal execution impossible

### Forbidden cancellation behavior

A round MUST NOT be cancelled after canonical live execution has produced a valid settlement path, except under a later explicitly documented emergency policy revision.

Cancellation MUST NOT be used as a shortcut to bypass normal settlement obligations.

***

## X. Withdrawal and Exit Rules

Joining a round is a locking action for that round.

### Canonical rule

Once a player has successfully joined a round, the player may not voluntarily withdraw from that round through a normal exit path.

### Refund exception

A joined player may receive refund only if:

- the round is cancelled under explicitly documented cancellation rules, or
- a future spec revision introduces a documented refund-safe path

### Consistency rule

No event, API shape, or frontend flow may imply ordinary voluntary player withdrawal unless the protocol explicitly adds such a feature in a later spec version.

***

## X. Timeout and Liveness Rules

A round MUST NOT remain indefinitely in a non-final state.

Each round MUST define:

- `signupEnd`
- `liveEnd`
- `settlementDeadline`

### Required behavior

- after `signupEnd`, the round may no longer remain indefinitely `Open`
- after `liveEnd`, the round may no longer remain indefinitely `Live`
- after `settlementDeadline`, unresolved `SettlementPending` rounds MUST enter an explicitly governed recovery path

### Recovery rule

Timeout recovery MUST preserve user-fund destination semantics.

Operator failure or settlement timeout MUST NOT silently convert player funds into protocol treasury revenue.

***

## X. Max Player Capacity

The canonical round capacity for the current MVP version is `333` players.

### Required rule

This capacity MUST be treated as protocol configuration and MUST be enforced consistently across:

- contract validation
- state transition logic
- API responses
- data model fields
- frontend display and precheck logic

Any earlier reference to a different default round capacity is superseded by this value in the latest spec version.

