# RumbleX Master Spec

## 1. 文档定位

`RumbleX Master Spec` 不是新增业务规则，而是把前面已经定义的核心内容汇总成**唯一总索引**。\
它服务 4 类目标：

- 产品统一口径
- 合约边界统一口径
- 前端/索引器/API 统一口径
- 上线与测试统一口径。

***

## 2. 产品一句话

RumbleX 是一个运行在 Monad 上的 `Play to Win` 回合制 Rumble Royale 风格链游：每轮固定时长、独立房间、最多约 333 名玩家参与，玩家通过彼此击杀获得 MON，最终结果按单轮独立上链结算。\
系统同时包含 Pass 资格、协议费、赛季池、fallback claim 和按 kills 计算的赛季资格与奖励逻辑。

***

## 3. 核心规则索引

主游戏规则必须以以下几条为准：

- 用户先持有 `RumbleX Pass` 才能参与真实 round。
- 每轮独立进行，单轮最终结果必须上链。
- 每轮 entry fee 中，10% 进入协议费，10% 进入 season pool，80% 进入玩家结算池。
- 游戏没有传统冠军/亚军/季军奖金结构，而是围绕幸存者结果与结算向量展开。
- 赛季奖励按累计 kills 达到阈值后的资格与比例分配处理。

***

## 4. 系统结构索引

RumbleX 的最小系统结构分成 5 层：

1. Pass 资格层。
2. Round 创建与单轮结算层。
3. Claim 与延迟领取层。
4. Season 资金与排名层。
5. 前端展示与索引查询层。

这意味着整套系统的总原则是：\
**资格、单轮、claim、season、查询展示彼此分层，不能混写。**

***

## 5. 合约边界索引

V1 建议合约集合固定为：

- `RumbleXPass`
- `RoundFactory`
- `RoundRoom`
- `SeasonVault`
- `ClaimVault`。

它们的职责分别对应：

- 资格
- 开房登记
- 单轮报名与结算
- 赛季资金池
- fallback / reward claim。

***

## 6. 资金流索引

RumbleX 的标准资金流可以浓缩为：

1. 用户 mint Pass。
2. 用户 join round 并支付 entry 及相关费用。
3. round 结束后执行链上 settlement。
4. entry 的 10% 进入协议费，10% 进入 season pool，80% 进入 player pool。
5. 主发放失败或延迟奖励进入 `Claimable MON` 并由 Claim All 统一领取。

这条路径是整套产品最不可被破坏的主线。

***

## 7. 数据与索引索引

整套系统的数据主轴必须围绕这些实体：

- `PlayerProfile`
- `PassState`
- `Season`
- `Round`
- `RoundParticipant`
- `RoundSettlement`
- `ClaimBalance`
- `PlayerSeasonStats`。

链上事件负责可信事实，indexer 负责把这些事实重建成 History、Stats、Rank、Claim 和 Summary 可读视图。

***

## 8. 前端索引

前端最终应按 4 层状态组织：

- Wallet Session State
- Round Runtime State
- Indexed Query State
- UI View State。

页面层建议固定为：

- Arena
- History
- Stats
- Rank
- Guide
- Settings
- Support。

其中 Arena 是主入口，History/Stats/Rank 是解释层，Guide/Support 是认知教育层。

***

## 9. 关键交易索引

前端关键交易流必须统一状态机，并优先覆盖：

- `mint_pass`
- `join_round`
- `claim_all`
- `set_loadout`（若单独存在）。

统一交易步骤应始终是：

- precheck
- awaiting signature
- submitting
- pending confirmation
- confirmed / rejected / failed。

***

## 10. 错误与测试索引

错误处理总原则是：

- 先告诉用户状态
- 再告诉用户资金是否安全
- 最后告诉用户下一步能做什么。

测试与 invariant 总原则是：

- 先验证资金守恒
- 再验证资格、状态机、claim、season 聚合
- 最后验证前端展示和页面一致性。

***

## 11. 上线范围索引

V1 的定义必须被收紧为一个**最小可信闭环**，而不是功能最大化版本。\
V1 核心范围固定为：

- Connect wallet
- Mint / check pass
- Join round
- On-chain settlement
- Claimable / Claim All
- History
- Stats
- Rank。

更复杂的社交、房间系统、赛制扩张、运营玩法和资产层扩张都属于 V1 之后再考虑的范围。

***

## 12. Master Spec 目录建议

建议你把整套文档最终整理成下面这个目录：

编号

文档

编号

文档

1

Game Rules Spec

2

RoundRoom State Machine Spec

3

Round Settlement Spec

4

Claim / Payout UX Spec

5

Contract Scope Spec

6

Data Model Spec

7

Event & Indexer Spec

8

API Surface Spec

9

Frontend State Spec

10

Frontend Integration Plan

11

Transaction Flow Spec

12

Error Handling Spec

13

Testing & Invariants Spec

14

Launch Readiness Spec

15

V1 Scope / Post-MVP Roadmap Spec

这 15 份已经足够构成一个完整的 RumbleX 主线规格包。

***

## 13. 一句话定义

`RumbleX Master Spec` 的本质就是：

**把规则、结算、claim、合约、数据、事件、API、前端状态、交易、错误、测试和上线范围，收束成一个统一总纲。**

<br />

