# RumbleX 最终规则与结算 Spec

## 1. 产品定义

RumbleX 是一个基于 Monad 的回合制链游。\
每轮是一个**独立房间**，每轮**独立报名、独立运行、独立结算、独立上链**。

每轮核心特征：

- 固定时长：10 分钟。
- 最大报名人数：333 人。
- 每位玩家只有一条命。
- 玩家可携带：
  - 1 个 skill
  - 1 个 item
  - 1 个 strategy。
- 无冠军/亚军/季军概念。
- 回合结束时幸存者保留其最终持有 MON。

***

## 2. 参与资格

玩家参与前必须满足：

1. 钱包已连接。
2. 当前钱包持有当前赛季的 RumbleX Pass NFT （例如 RumbleX S1 Pass NFT，作为赛季空投领取条件之一）。
3. 钱包有足够余额支付：
   - entry fee
   - 可选 skill fee
   - 可选 item fee
   - gas。

若未持有 Pass，则前端必须引导 mint，该NFT为赛季制，每个赛季需要单独铸造该赛季独有的 RumbleX Pass NFT。\
Pass 是参与资格，不是结算资产。

***

## 3. 每轮基础参数

这些是系统级固定参数，必须集中配置，不能在多个地方手写：

- `ROUND_DURATION = 600s`（10 分钟）
- `MAX_PLAYERS_PER_ROUND = 333`
- `TARGET_MAX_SURVIVORS < 7`
- `PROTOCOL_FEE_BPS = 1000`（10%）
- `SEASON_FEE_BPS = 1000`（10%）
- `PLAYER_POOL_BPS = 8000`（80%）
- `SEASON_KILL_THRESHOLD = 100`
- `SEASON_DURATION_DAYS = 30`

说明：\
`PROTOCOL_FEE_BPS + SEASON_FEE_BPS + PLAYER_POOL_BPS = 10000` 必须永远成立。

***

## 4. 玩家支付结构

单个玩家每轮支付总额定义为：

PlayerCost=EntryFee+SkillFee+ItemFee\text{PlayerCost} = \text{EntryFee} + \text{SkillFee} + \text{ItemFee}PlayerCost=EntryFee+SkillFee+ItemFee

其中：

- `EntryFee`：进入本轮资金池的基础费用。
- `SkillFee`：若选择 skill，则支付 skill 价格，否则为 0。
- `ItemFee`：若选择 item，则支付 item 价格，否则为 0。

如用户启用 Auto Deploy 多轮报名，则总支付额为：

TotalQueuedCost=PlayerCost×QueuedRounds\text{TotalQueuedCost} = \text{PlayerCost} \times \text{QueuedRounds}TotalQueuedCost=PlayerCost×QueuedRounds

***

## 5. 房间资金构成

单轮房间的资金必须拆成 3 类：

## 5.1 Entry Pool

由本轮所有玩家的 `EntryFee` 构成。\
这是本轮正式结算的基础池。

## 5.2 Protocol Revenue

协议费来源于 Entry Pool 的 10%。\
这是协议收入的一部分。

## 5.3 Season Pool Contribution

赛季池来源于 Entry Pool 的 10%。\
这部分必须流入本赛季 SeasonVault，不参与本轮玩家分配。

## 5.4 Player Settlement Pool

剩余 80% 的 Entry Pool 进入本轮玩家结算池。

***

## 6. Skill / Item 收入口径

必须明确 skill 和 item 的收入归属。\
建议写死为：

- `SkillFee`：直接归协议收入。
- `ItemFee`：直接归协议收入。

也就是说：

- EntryFee 参与 10% / 10% / 80% 拆分。
- SkillFee / ItemFee 不进入玩家池，不进入赛季池，直接归协议。

这样可以保持结算简洁，并降低房间资金分配复杂度。

***

## 7. 回合运行规则

每轮流程如下：

1. 房间创建。
2. 开放报名。
3. 玩家最多可报名至 100 人。
4. 到达开局条件后，房间锁定。
5. 回合进入 live 状态并持续 10 分钟。
6. 链下引擎运行战斗逻辑、技能逻辑、道具逻辑、策略逻辑。
7. 回合结束时生成最终结算结果。
8. 该轮结算结果上链。

***

## 8. 生存与淘汰规则

- 每位玩家只有 1 条命。
- 被淘汰后立即失去继续参与该轮资格。
- 击杀成功的一方获得目标当时携带的全部 MON。
- 回合结束时，所有仍存活玩家保留其最终持有 MON。
- 游戏没有 1/2/3 名奖励分层。

***

## 9. 幸存者控制机制

系统必须通过游戏算法机制，使每轮在 10 分钟结束时的幸存者数量**通常低于 7 人**。\
这属于玩法平衡目标，不是链上合约直接判断逻辑。

Spec 中应写明：

- 这是引擎的目标结果约束。
- 如果实际幸存者数量高于目标区间，仍按实际结果结算。
- 不能因为“人数太多”而修改已发生的链下回合结果。

***

## 10. 每轮最终结算公式

设：

- NNN = 本轮参与人数
- EEE = EntryFee
- StotalS\_{\text{total}}Stotal​ = 本轮所有 SkillFee 总和
- ItotalI\_{\text{total}}Itotal​ = 本轮所有 ItemFee 总和

则：

EntryPool=N×E\text{EntryPool} = N \times EEntryPool=N×E

ProtocolFeeFromEntry=EntryPool×10%\text{ProtocolFeeFromEntry} = \text{EntryPool} \times 10\\%ProtocolFeeFromEntry=EntryPool×10%

SeasonFee=EntryPool×10%\text{SeasonFee} = \text{EntryPool} \times 10\\%SeasonFee=EntryPool×10%

PlayerSettlementPool=EntryPool×80%\text{PlayerSettlementPool} = \text{EntryPool} \times 80\\%PlayerSettlementPool=EntryPool×80%

ProtocolRevenueTotal=ProtocolFeeFromEntry+Stotal+Itotal\text{ProtocolRevenueTotal} = \text{ProtocolFeeFromEntry} + S\_{\text{total}} + I\_{\text{total}}ProtocolRevenueTotal=ProtocolFeeFromEntry+Stotal​+Itotal​

***

## 11. 金额守恒约束

系统必须满足：

EntryPool=ProtocolFeeFromEntry+SeasonFee+PlayerSettlementPool\text{EntryPool} = \text{ProtocolFeeFromEntry} + \text{SeasonFee} + \text{PlayerSettlementPool}EntryPool=ProtocolFeeFromEntry+SeasonFee+PlayerSettlementPool

以及：

GrossRoundInflow=ProtocolRevenueTotal+SeasonFee+PlayerSettlementPool\text{GrossRoundInflow} = \text{ProtocolRevenueTotal} + \text{SeasonFee} + \text{PlayerSettlementPool}GrossRoundInflow=ProtocolRevenueTotal+SeasonFee+PlayerSettlementPool

其中：

GrossRoundInflow=EntryPool+Stotal+Itotal\text{GrossRoundInflow} = \text{EntryPool} + S\_{\text{total}} + I\_{\text{total}}GrossRoundInflow=EntryPool+Stotal​+Itotal​

这两条必须作为测试级 invariant。

***

## 12. 每轮结算输出

每轮结算至少输出：

- `roundId`
- `rulesetHash`
- `startTime`
- `endTime`
- `participants`
- `eliminatedCount`
- `survivors[]`
- `killsByPlayer[]`
- `playerPayouts[]`
- `protocolFee`
- `seasonFee`
- `playerSettlementPool`
- `resultHash`
- `settlementStatus`。

***

## 13. 上链结算要求

每轮最终结果必须上链。\
上链至少应保证：

- 本轮已正式结束。
- 本轮最终分配结果已确定。
- 协议费、赛季费、玩家结算金额都已进入链上最终状态。
- 不允许同一轮重复结算。

***

## 14. 结算发放方式

主路径：

- 回合结束后，链上直接对本轮结算对象发放。

异常路径：

- 若某个地址发放失败，则该金额转入 `ClaimVault`。
- 用户后续通过统一 Claim 入口领取。

产品要求：

- claim 不是主领取路径。
- claim 只是 fallback 与赛季奖励领取入口。

***

## 15. Claim 规则

Claim 入口必须是全局统一入口，而不是按轮逐个领取。\
用户可以看到：

- 当前可领取总额
- claim 来源（fallback payout / season reward）
- Claim All 操作。

历史页只展示该轮是否已支付或进入 claim，不承担主领取职责。

***

## 16. 协议收入定义

协议收入由以下部分组成：

1. 每轮 Entry Pool 的 10% 协议费。
2. 所有 SkillFee。
3. 所有 ItemFee。
4. 每个赛季的 Pass mint 收入。

协议收入不包括：

- 赛季奖池资金。
- 玩家结算池资金。

***

## 17. 赛季规则

赛季奖池来源于每轮 Entry Pool 的 10%。\
赛季结束时：

- 按累计 kills 排名。
- kills 达到阈值（当前 100）才有资格分配。
- 奖池按合格玩家 kills 占比进行分配。

***

## 18. 禁止事项

以下设计在正式实现中应明确禁止：

- 重复结算同一 round。
- 重复领取同一笔 claim。consensysdiligence.github+1
- 协议收入、赛季收入、玩家池混账。
- 服务器托管用户房间资金。
- 用前端文案替代资金真实状态。

***

## 19. 前端展示要求

前端必须始终清晰展示：

- Pass 状态。
- 当前 round 状态。
- 当前钱包余额。
- Claimable MON。
- Season Estimate。
- 历史 round 的结算状态：
  - `Paid`
  - `Claimable`
  - `Eliminated / No Payout`。

***

## 20. 测试必须覆盖

这份 Spec 对应的最低测试范围：

- EntryPool 拆分是否严格满足 10% / 10% / 80%。
- SkillFee / ItemFee 是否全部进入协议收入。
- 同一轮是否无法重复结算。
- claim 是否无法重复领取。fravoll.github+1
- 某个幸存者发放失败时，是否正确转入 ClaimVault。
- 赛季 kills 与 season reward 是否按规则累计。

***

# 使用方式

这份文档不是给用户看的 marketing copy，\
它是你接下来所有工作的**唯一真相来源**：

- 合约接口按它写
- 前端状态按它写
- 测试 invariant 按它写
- Guide 页按它同步
- 历史页 / stats / rank 按它解释。

***

<br />

## X. Canonical Round Capacity

The canonical maximum player capacity per round in the current MVP version is `333`.

### Required rule

This value is protocol configuration, not UI decoration.

All gameplay logic, room admission rules, state transitions, settlement assumptions, API responses, and frontend displays MUST use the same canonical round capacity for the current version.

Any earlier reference to another default round size is superseded by this value.

***

## X. Entry Fee Configuration

Entry fee MUST be configurable on a per-round basis.

### Required rule

When a round is created, the authorized creator or operator MUST set that round's entry fee.

Different rounds MAY use different entry fees.

### Locking rule

Once a round is created, its entry fee becomes part of that round's canonical configuration and MUST NOT change after players are allowed to rely on that configuration.

In MVP, the safest rule is:

- entry fee may be configured only before the round enters `Open`
- after the round enters `Open`, the entry fee is immutable for that round

### Optional protocol bounds

The protocol MAY enforce configurable minimum and maximum entry fee bounds.

If such bounds exist, they MUST be documented consistently across contract validation, API responses, indexer views, and frontend display.

***

## X. Pass-Gated Participation

A player MUST satisfy the protocol's access requirement before joining a round.

### MVP rule

In MVP, round participation is gated by required Pass ownership.

A player who does not hold the required Pass MUST NOT be allowed to complete round join.

### Product rule

The product SHOULD detect Pass ownership after login and, if Pass is missing, direct the user to the canonical mint flow before allowing signup.

***

## X. Loadout Structure

Each player may enter a round with:

- one paid skill
- one paid item
- one strategy selection

### Canonical rule

Skill and item are paid gameplay modifiers for that round.

Strategy selection is part of gameplay configuration and MAY be free or separately configured according to the active ruleset.

### Scope rule

Loadout choices apply only to the current round by default in MVP and do not create permanent player inventory unless a later spec revision explicitly introduces that behavior.

***

## X. Ruleset-Bound Configuration

Round gameplay parameters MUST be bound to a canonical ruleset.

### Required rule

Each round MUST reference one `rulesetHash` that defines or commits to the active gameplay and economic configuration for that round.

The ruleset SHOULD cover, where applicable:

- entry fee assumptions
- skill definitions
- item definitions
- strategy definitions
- pricing configuration
- gameplay effect configuration
- other round-level balancing parameters

### Separation rule

- on-chain systems MAY store only the canonical `rulesetHash`
- off-chain systems MAY store expanded ruleset content
- expanded off-chain content MUST remain consistent with the canonical hash binding

This rule prevents rule drift between simulation, settlement, API display, and UI explanation.

***

## X. Economic Components of a Round

A round may involve the following player-visible economic components:

- entry fee
- skill cost, if the selected skill is paid
- item cost, if the selected item is paid

### Required rule

The product MUST clearly explain to the player, before join confirmation, what the player is paying for that round.

### Consistency rule

Game rules, UI explanation, API responses, and settlement assumptions MUST use consistent meanings for these economic components.

***

## X. In-Game Holding vs. On-Chain Settlement

Gameplay simulation and on-chain settlement are related but not identical.

### Canonical distinction

- in-game holding reflects simulated possession during battle
- on-chain payout reflects final settlement after canonical fee scaling and payout mapping

### Required rule

Game rules, UI explanation, and settlement logic MUST consistently explain that final on-chain payout may differ from final in-game holding.

This difference MUST NOT be presented as an error or exception if it follows the documented settlement model.

***

## X. Survivor Outcome Rule

RumbleX does not use champion, runner-up, or podium ranking as its primary settlement model.

Survivors are defined by end-of-round state, and settlement is based on canonical survivor outcomes and holdings rather than first-place ranking alone.

### Required rule

The game engine and settlement layer MUST remain compatible with multi-survivor outcomes.

No gameplay rule may assume that exactly one winner must exist unless a later mode-specific ruleset explicitly introduces that requirement.

***

## X. Zero-Survivor Fallback Rule

The protocol MUST NOT leave zero-survivor outcome behavior undefined.

### MVP rule

The game system MUST guarantee one deterministic terminal rule if a natural zero-survivor interpretation would otherwise occur.

This may be achieved by either:

- preventing unresolved simultaneous elimination from producing undefined settlement state, or
- defining a deterministic fallback resolution rule in the engine

### Required rule

Settlement MUST always receive a valid terminal outcome from the game layer.

There MUST be no round outcome that leaves payout semantics undefined.

***

## X. Minimum Valid Start Conditions

The protocol MAY define minimum valid participation conditions for a round to proceed to live play.

If such conditions are configured:

- they MUST be documented explicitly
- they MUST be checked before live start
- failure to satisfy them MUST lead to a documented cancellation path

No hidden, unwritten, or operator-only threshold may control whether a round proceeds.

***

## X. Join Commitment Rule

Joining a round is a commitment to that round under its published configuration.

### Required rule

After a player successfully joins a round, the player is bound by that round's canonical configuration, including:

- entry fee
- ruleset binding
- applicable loadout structure
- settlement model

### Consistency rule

Once a round is open for joining, the protocol MUST NOT mutate economically meaningful round parameters in a way that changes the basis on which already-joined players entered.

***

## X. Auto Deploy Scope

Auto Deploy is NOT part of the canonical V1 gameplay scope.

### V1 rule

Each round requires explicit user participation and explicit round-level join behavior.

No V1 rule may assume:

- cross-round pre-funded enrollment
- multi-round automatic entry
- hidden pending balance reservation
- silent re-entry into future rounds

Unless such features are introduced by a later spec revision, they are out of scope for V1.

***

## X. Economic Explanation Rule

The product MUST explain the round economy consistently across game rules, settlement views, and user-facing UI.

At minimum, the explanation MUST remain consistent about:

- entry fee
- skill and item cost if applicable
- which portions of round funds go to protocol, season, and player settlement
- why final payout may differ from simulated in-game holding

No layer of the product may present a simplified explanation that contradicts canonical settlement behavior.
