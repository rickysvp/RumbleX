<br />

**RumbleX Claim / Payout UX Spec**。\
这份文档专门解决你前面最在意的问题：**用户怎么理解“已到账”和“可领取”，以及怎样避免用户去历史轮次里逐个找钱。**

***

# RumbleX Claim / Payout UX Spec

## 1. 文档目的

本 Spec 定义 RumbleX 中与玩家资金结果相关的前端体验，包括：

- 回合结束后的到账反馈
- fallback claim 的交互方式
- 统一 Claim 入口
- 历史页如何展示 payout 状态
- 钱包区域如何展示资金状态
- 什么是“已支付”、什么是“可领取”、什么是“无收益”。

目标只有一个：\
**用户永远不需要去猜钱去哪了。**

***

## 2. 设计原则

RumbleX 的 payout UX 必须遵守以下原则：

1. **直接发放是主路径。**
2. **Claim 只是 fallback 和赛季奖励入口，不是主要领取方式。**
3. **用户不按轮逐个找钱。**
4. **所有未到账但已归属用户的钱，都统一汇总到一个 Claim 入口。**
5. **History 页负责解释，不负责主要领取动作。**
6. **钱包区必须始终展示用户当前资金状态。**

***

## 3. 资金状态定义

前端必须明确区分以下概念：

## 3.1 Wallet Balance

用户当前钱包中的真实 MON 余额。

## 3.2 Locked In Round

用户已报名但仍锁定在当前或未来房间中的金额。

## 3.3 Just Paid

刚刚在本轮结算中已直接发放到钱包的金额。

## 3.4 Claimable MON

本应归属用户，但未在主结算中直接发放成功、或属于赛季奖励待领取的金额。

## 3.5 No Payout

该轮被淘汰或该轮没有归属收益。

这些词必须固定，不能页面一套、弹窗一套、历史页一套。

***

## 4. 用户唯一心智模型

用户不需要理解复杂合约模式，只要理解下面这句：

- **赢了，通常会直接到账。**
- **少数异常或赛季奖励，会出现在 Claimable MON。**

这句心智模型必须贯穿：

- Arena
- 左侧钱包区
- History
- Stats
- Guide。

***

## 5. 全局 Claim 入口

必须存在一个**全局唯一 Claim 入口**。\
推荐放在左侧用户钱包区域，或顶部钱包状态区域。

入口必须始终展示：

- `Claimable MON`
- 一个总额数字
- `Claim All` 按钮
- 若金额为 0，则按钮置灰。

例如：

- `Claimable MON: 2.4`
- `[Claim All]`

这就是用户对“未到账但属于我”的唯一入口认知。

***

## 6. Claim 入口交互规则

## 状态 A：无可领取金额

展示：

- `Claimable MON: 0.0`
- 按钮 disabled
- 辅助文案：`No pending payouts.`

## 状态 B：有可领取金额

展示：

- `Claimable MON: X.X`
- 按钮可点击
- 有轻微高亮 / 红点提醒。

## 状态 C：Claim 交易 pending

展示：

- `Claiming...`
- 按钮 loading
- 暂时锁定重复点击。

## 状态 D：Claim 成功

展示：

- `Claim Complete`
- 钱包余额刷新
- Claimable MON 归零或减少。

## 状态 E：Claim 失败

展示：

- `Claim Failed`
- 保留 claimable 数字
- 显示错误原因和重试入口。

***

## 7. Claim All 交互定义

MVP 阶段只做一个主动作：

- `Claim All`

不要一开始做：

- 按 round 逐个 claim
- 按来源分批 claim
- 自定义 claim 选择器。

`Claim All` 背后的逻辑是：

- 聚合所有 fallback round payouts
- 聚合所有 season reward 可领取金额
- 发起一次领取交易。

用户不需要知道具体来源，除非展开详情查看。

***

## 8. Claim 来源详情

在 Claim 区块下方，可选展开一个详情列表，显示 claim 来源：

- Round #842 fallback payout — 1.3 MON
- Round #847 fallback payout — 0.9 MON
- Season 1 reward — 4.8 MON。

但这个详情层有两个原则：

1. 默认折叠。
2. 只是解释，不影响主操作。

***

## 9. 回合结束后的主反馈

当用户刚结束一轮时，Arena 和 feed 区必须给出清晰结果：

## 9.1 已直接到账

显示：

- `SETTLED & PAID`
- `+X.X MON sent to wallet`
- 可附 tx hash。

## 9.2 进入 Claim

显示：

- `SETTLED / CLAIMABLE`
- `+X.X MON moved to Claimable balance`
- 引导查看 Claimable MON。

## 9.3 无收益

显示：

- `ELIMINATED`
- `No payout from this round`。

这三种文案必须成为产品级标准，不要每页自己造词。

***

## 10. Arena 页面展示

Arena 页在一轮结束时必须展示结算卡片，包含：

- round id
- round result
- 用户状态：survived / eliminated
- payout 状态：paid / claimable / none
- 本轮净变化
- 一个按钮：
  - 若 `paid`：`View History`
  - 若 `claimable`：`Claim Now`
  - 若 `none`：`Queue Next Round`。

这里的 `Claim Now` 可以直接跳到全局 Claim 区，而不是开新的领取逻辑。

***

## 11. 钱包区展示要求

左侧用户区未来必须升级为 5 块资金信息，而不只是单纯余额。

建议顺序：

1. Wallet Balance
2. Locked In Rounds
3. Claimable MON
4. Season Estimate
5. Pass Status。

其中：

- `Claimable MON` 是高优先级块，应该比 `Season Estimate` 更显眼。
- 有可领取金额时，要有视觉提醒。

***

## 12. History 页展示规则

History 页只负责说明“这轮发生了什么”，不是主要资金操作区。

每轮历史必须显示：

- round id
- settled time
- participants
- survivors
- round volume
- 你的结果状态：
  - `Paid`
  - `Claimable`
  - `No Payout`

若是 `Paid`：

- 显示 `+X.X MON sent`

若是 `Claimable`：

- 显示 `+X.X MON claimable`
- 可附一个小按钮 `Go to Claim`。

但不要在 History 页做“逐轮 Claim”主按钮矩阵，那会让用户形成错误心智。

***

## 13. Stats 页展示规则

Stats 页要展示累计结果，而不是具体操作入口。

必须增加或预留：

- Total Paid Out
- Total Claimed
- Current Claimable
- Net MON
- Total Rounds
- Total Wins / Survival Count
- Total Kills。

也就是说，Stats 是总结页，不是交易页。

***

## 14. Feed 区提示规则

混合 feed 是你产品的重要氛围来源，所以 payout 结果也应该进入 feed。

建议标准系统事件：

- `★ ROUND #842 SETTLED. +2.4 MON sent to PILOT_01 wallet.`
- `★ ROUND #843 SETTLED. +1.6 MON moved to Claimable balance.`
- `★ SEASON REWARD AVAILABLE. 4.8 MON ready to claim.`

这些消息的作用是让用户第一时间知道资金结果，不必自己猜。

***

## 15. Claim 的视觉优先级

Claim 状态必须高于这些模块：

- 一般历史信息
- 次要统计信息
- 社区提示。

因为对用户来说，“我能不能拿到钱”永远优先于“我这一局杀了几个人”。

所以当 `Claimable MON > 0` 时：

- 钱包区高亮
- Arena 页可显示提醒
- History 页对应轮次标记
- 移动端导航上可有提醒点。

***

## 16. 移动端规则

你当前有移动端导航，所以 Claim 入口不能只出现在桌面左侧栏。

移动端必须至少满足其中一种：

- 在顶部钱包栏中显示 `Claimable MON`
- 或在 PROFILE 页中置顶显示 Claim 卡片
- 或在底部导航上用 badge 提示可领取金额存在。

但不建议单独加一个 Claim tab，除非后面领取场景变得非常重。

***

## 17. Guide 页说明要求

Guide 页要明确告诉用户：

- 正常情况下，回合收益会直接发到钱包。
- 若主发放失败，收益会进入 Claimable MON。
- 赛季奖励通过 Claim 统一领取。
- Claim 入口在钱包区，而不是去历史页逐轮找。

这一步能显著减少用户困惑和客服负担。

***

## 18. 异常文案规范

必须统一这些错误文案：

## Claim 失败

- `Claim failed. Your funds remain safe in Claimable MON.`

## 钱包拒绝签名

- `Claim cancelled. No funds moved.`

## 无可领取金额

- `No pending payouts to claim.`

## 结算中

- `Round settling. Payout status will update shortly.`

文案必须强调：\
**钱没有消失，只是状态不同。**

***

## 19. 你最该避免的 UX 错误

不要做这些：

- 按轮次逐个 Claim 主入口。
- History 页出现十几个 Claim 按钮。
- 钱包区只显示钱包余额，不显示 Claimable。
- 用户已 claimable 但 Arena 无反馈。
- 赛季奖励和 fallback payout 混在一起却没有来源说明。

这些都会让用户觉得产品“不知道钱在哪里”。

***

## 20. 一句话定义

RumbleX 的 payout UX 应该让用户形成唯一认知：

**大多数轮次会直接到账；少数未直达的钱，统一在 Claimable MON 里，一键 Claim All。**

***

下一步最自然继续写的，就是第 5 份文档：\
**RumbleX Contract Scope Spec（每个合约各自负责什么，不负责什么）**。

<br />

## X. Canonical Season Lifecycle

Each season MUST follow one canonical lifecycle:

`Upcoming -> Active -> GracePeriod -> RewardsReady -> Closed`

### State meanings

#### Upcoming

The season exists but is not yet open for new round attachment.

#### Active

New rounds may be created and attached to the season.
Kills earned from finalized rounds count toward the season.

#### GracePeriod

The configured active duration has ended.
No new rounds may attach to the season, but already-created rounds may still finish and settle.

#### RewardsReady

All season-relevant rounds are finalized in a reward-safe terminal state, and reward allocation data is fully determined.

#### Closed

Season reward assignment is complete and the season is archived for historical read access.

***

## X. Season Finalization Preconditions

A season may be finalized only if all of the following are true:

- the current time is after the season end time plus the configured grace period
- no new round may still legally attach to the season
- all rounds attached to the season are finalized in a state that is safe for reward accounting
- player qualification data can be derived deterministically from canonical round outcomes

If any of the above conditions are not satisfied, season finalization MUST revert or remain unavailable.

***

## X. Qualification Rule

Season qualification is based on canonical accumulated kill count.

A player qualifies for season reward participation only if:

`totalSeasonKills(player) >= seasonQualificationThreshold`

### Notes

- the qualification threshold MUST be configurable at the protocol level
- qualification MUST be derived from canonical finalized round outcomes only
- live feed, provisional stats, or unconfirmed indexer estimates MUST NOT determine final qualification

***

## X. Canonical Reward Formula

Season reward distribution is proportional among qualified players only.

### Definitions

- `TV` = total distributable reward balance in `SeasonVault`
- `Q` = the set of qualified players
- `K_i` = total finalized season kills for player `i`
- `TQK` = total kills across all qualified players

### Canonical formula

For every qualified player `i`:

`reward_i = floor(TV * K_i / TQK)`

### Required rules

- non-qualified players receive zero season reward
- reward computation MUST use integer smallest-unit accounting
- reward computation MUST be deterministic and reproducible
- the sum of all assigned rewards plus any explicitly assigned remainder MUST equal `TV`

***

## X. Rounding and Remainder Rule

If integer division creates remainder during season reward allocation, that remainder MUST be handled by one deterministic documented rule.

MVP default rule:

- compute all `reward_i` values using floor division
- keep the final undistributed remainder in `SeasonVault`
- carry that remainder forward according to the canonical treasury and season rollover rule

There MUST be no unassigned dust.

***

## X. No-Qualified-Player Rule

If no player satisfies the season qualification threshold:

- no season reward distribution is assigned for that season
- the undistributed season reward balance MUST remain in `SeasonVault`
- the balance MUST roll forward according to the canonical treasury rollover rule

The protocol MUST NOT silently redirect undistributed season reward balance into unrelated treasury revenue unless a later spec revision explicitly changes this rule.

***

## X. Reward Assignment Output

Season finalization MUST produce enough canonical output for audit, claims, and indexer reconstruction.

At minimum, reward assignment output MUST support:

- season id
- qualification threshold used
- qualified player set
- finalized kill count per qualified player
- assigned reward amount per qualified player
- total distributed amount
- total carried remainder, if any

These outputs MUST be sufficient to reconstruct both season ranking and season reward entitlements.

***

## X. Claim Path for Season Rewards

Assigned season rewards MUST enter the canonical claim system.

### Required rule

Once season rewards are finalized:

- each assigned reward entitlement MUST be recorded or derivable as a claimable season-reward record
- users MUST be able to claim these rewards through the canonical claim flow
- season rewards and fallback round claims may share the same claim surface, but MUST remain distinguishable by claim type and source id

***

## X. Separation from Estimates

Estimated season rewards shown in UI, API, or indexer views are not final reward assignments.

### Required rule

The system MUST distinguish between:

- estimated reward
- assigned reward
- claimed reward

No estimated reward value may be presented as final unless season finalization has completed.
