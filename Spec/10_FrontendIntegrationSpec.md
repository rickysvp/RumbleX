**RumbleX Frontend Integration Plan**。\
这份文档专门回答一个非常现实的问题：**你现在这套 mock 前端，应该按什么顺序、分几步，平滑接到真实钱包、真实合约和真实 indexer，而不是一口气全部推翻重做。**

# RumbleX Frontend Integration Plan

## 1. 文档目的

RumbleX 当前前端已经具备可用的产品骨架：有 `walletStore`、`gameStore`、`mockWallet`、`mockTransaction`，也有 Arena、MixedFeed、History、Stats、Rank、Sidebar、TopBar 等主要页面与组件。\
因此这份计划的目标不是“重写前端”，而是**从 mock 驱动过渡到 live data 驱动**，同时尽量保留现有 UI 结构、像素风格和页面布局。

***

## 2. 集成总原则

整个接入过程必须遵守 5 条原则：

1. **先替换读，再替换写。**
2. **先接账户与总览，再接回合，再接 claim 和 season。**
3. **实时局内表现可以暂时保留 mock/simulated 层。**
4. **资金与结算真相只能来自链上与 indexer。**
5. **任何阶段都要保持前端可运行。**

也就是说，你的策略应该是“**分层替换**”，而不是“整站推倒重来”。

***

## 3. 当前前端现状

你现在的代码结构已经说明了三件事：

- 钱包连接与余额依赖 `mockWallet`。
- 交易流程依赖 `mockTransaction`。
- 局内状态、排行榜、历史、统计大量依赖 `gameStore` 本地模拟。

这意味着当前前端已经非常适合做“体验原型”，但还没有区分：

- 链上真实数据
- 索引器聚合数据
- 本地运行态
- UI 临时态。

所以接入计划的核心，就是把这四层拆开并逐步替换。

***

## 4. 最终目标架构

目标架构建议变成：

- `wallet adapter`：真实钱包连接与签名。
- `walletStore`：当前会话与账户总览状态。
- `roundStore`：当前房间运行态与局内临时表现。
- `query layer`：读取 indexer/API 聚合数据。
- `tx layer`：构建交易、发起签名、跟踪确认。
- `mock/sim engine`：只保留给开发模式或局内演出层。

一句话：\
**mock 从“业务主驱动”降级为“开发辅助与局内演出辅助”。**

***

## 5. 阶段 1：先接真实钱包

## 目标

先把 `mockWallet` 换成真实钱包 adapter，但页面结构先不动。

## 需要完成的事

- 替换 `mockWallet.connect/disconnect/refreshBalance`。
- 连接成功后写入：
  - `address`
  - `addressFull`
  - `walletBalance`
  - `connection status`。
- 连接后立即触发 Pass 检查。

## 本阶段保留 mock 的部分

- 仍可保留 `gameStore`
- 仍可保留 mock round flow
- 仍可保留 mock history / mock stats。

## 为什么先做这个

因为钱包连接是所有真实用户路径的起点；没有它，后面的 mint、join、claim 都没法进真实链路。

***

## 6. 阶段 2：接入账户总览 API

## 目标

让左侧用户区和 TopBar 先展示**真实账户总览**，即使 Arena 还在跑 mock。

## 要接的内容

接入 `/me/summary` 类接口，填充：

- `walletBalance`
- `hasPass`
- `claimableMon`
- `lockedInRounds`
- `seasonEstimateMon`
- `activeRoundId`。

## 页面影响

- TopBar 的 BALANCE 改成真实值。
- Sidebar 的 Pass 状态改成真实值。
- Sidebar 增加 `Claimable MON` 展示位。

## 本阶段结果

即使其他页面还是 mock，用户也已经能看到**自己的真实账户入口**。

***

## 7. 阶段 3：打通 Pass 流程

## 目标

把“无 Pass -> Mint Pass -> 拥有资格”这条链路先打通。

## 要做的事

- 在钱包连接后自动检查是否持有 Pass。
- 若没有：
  - 在 Sidebar、Arena 入口、TopBar 下拉中统一出现 Mint CTA。
- Mint 成功后：
  - 更新 `hasPass`
  - 更新 `passStatus`
  - 刷新 summary。

## 为什么优先

因为 Pass 是所有真实参与流程的资格闸门。\
不先打通它，后面的 Join Round 都只能是假链路。

***

## 8. 阶段 4：替换 Join Round 交易

## 目标

先把“报名这一轮”从 mock submit 换成真实交易。

## 你现在的情况

当前 `mockTransaction.submit` 做了三件事：

- 模拟等待签名
- 模拟 pending
- 扣本地余额并把用户排进 `gameStore`。

## 替换方案

改成：

1. 前端构建 join intent。
2. 钱包签名并提交交易。
3. 等待链上确认。
4. 成功后刷新：
   - summary
   - live round join status
   - 当前 round 参与状态。

## 本阶段保留

- MixedFeed 的局内演出仍可先走 mock/sim
- 倒计时和播报也可暂留前端运行态。

这样你能先把“**真钱报名**”接通，而不需要同步把整套实时战斗系统一次性做完。

***

## 9. 阶段 5：接入 Live Round 读取

## 目标

Arena 顶部状态区、RoundStage 抬头信息、报名人数等，改为读取真实 round 数据。

## 要接的接口

- 当前 live/open round
- 当前 round 状态
- joinedCount
- maxPlayers
- round countdown / start time
- 当前用户 join status。

## 页面改造

- `RoundStage` 上层信息从本地假数据改成 query 数据。
- PLAY / Queue 按钮依据真实资格与 join status 控制。
- `gameStore.phase` 不再充当全站事实来源，而只保留演出层作用。

***

## 10. 阶段 6：把 History 先接真

## 目标

在所有页面里，**History 是最适合最先 fully-live 化的页面**。

## 为什么

因为它是静态结果页，依赖的是已确认 settlement，不依赖复杂实时交互。

## 要替换的内容

把 `HistoryPage` 从 mock round list 替换为：

- `/rounds/recent`
- `/me/history?address=...`
- `/rounds/:roundId` 详情数据。

## 效果

这一步做完后，用户至少能看到：

- 哪轮参加了
- 是 paid、claimable 还是 no payout
- 具体 settled 时间和结果摘要。

这是你从“demo”走向“真实产品”的关键一步。

***

## 11. 阶段 7：接入 Claim 模块

## 目标

把钱包区变成一个真正可信的资金入口，而不是只显示 Balance。

## 要做的事

- 在 Sidebar / TopBar / 移动端 PROFILE 区增加 `Claimable MON` 模块。
- 接入 `/me/claims` 查询。
- 接入 `Claim All` 交易。
- Claim 成功后刷新：
  - `summary`
  - `claims`
  - `stats`
  - 必要时 `history`。

## 结果

用户第一次真正看到完整资金闭环：

- 钱包余额
- 已锁定金额
- claimable 金额
- 领取动作。

***

## 12. 阶段 8：接入 Stats 与 Rank

## 目标

把“累计信息”从本地模拟迁移到真实 query 数据。

## 要替换的内容

- `StatsPage` 使用 `/me/stats`。
- `RankPage` 使用 `/season/current` 与 `/season/:id/rank`。
- 当前用户 season 卡片使用 `/season/:id/me`。

## 同时要移除的本地假事实

- 本地 `leaderboard`
- 本地 `seasonPool`
- 本地 `userStats`
- 本地 `userHistory` 作为最终真相来源。

本地仍可保留一些 UI 动效值，但不能再充当正式结果数据源。

***

## 13. 阶段 9：收缩 `gameStore`

当 History、Claim、Stats、Rank 都接到真实 query 后，`gameStore` 就必须瘦身。

## 只保留

- 当前 round 运行态
- 当前 feed 事件
- 当前 loadout 草稿
- 局内临时动画与演出触发器。

## 删除或迁出

- season leaderboard
- user history
- user stats
- treasury 累计
- claimable / payout 真值。

这一步不是“优化”，而是防止 mock 与 live 状态互相污染的必要手术。

***

## 14. 阶段 10：区分开发模式与生产模式

必须引入一个明确的 data mode：

- `mock`
- `hybrid`
- `live`。

## 定义

- `mock`：钱包、交易、round、history 全部模拟。
- `hybrid`：钱包与 summary、history、claim 等是真实；局内 feed/演出部分允许模拟。
- `live`：资金、历史、season、claim 全走真实链路与 indexer；局内演出只做展示增强，不篡改真相。

这个模式开关会极大降低你后面调试成本。

***

## 15. 推荐实施顺序

最推荐的实际顺序是：

1. 真实钱包接入。
2. summary 接口接入。
3. Pass mint 接入。
4. Join round 交易接入。
5. Live round 读取接入。
6. History live 化。
7. Claim live 化。
8. Stats / Rank live 化。
9. `gameStore` 瘦身。
10. data mode 整理。

这条顺序的好处是：\
每一步都能独立验收，而且任何时候前端都还是能跑的。

***

## 16. 每阶段验收标准

## 阶段 1-3 验收

- 能连接真实钱包
- 能判断 Pass 状态
- 能完成 Mint Pass。

## 阶段 4-5 验收

- 能真实 join round
- Arena 能显示真实房间状态
- 钱包与锁仓金额会刷新。

## 阶段 6-8 验收

- History 显示真实 settlement
- Claim 能真实领取
- Stats / Rank 与 indexer 数据一致。

## 阶段 9-10 验收

- mock 与 live 不冲突
- 页面刷新后数据可重建
- 前端 store 边界清晰。

***

## 17. 最容易踩的坑

你最需要避免 5 个坑：

- 一边接真实 balance，一边还让 mock tx 随意扣本地余额。
- History 已接真实数据，但 Stats 还在吃本地累计，导致数字打架。
- Claimable 已来自 indexer，但前端还自己计算 claimable。
- `gameStore` 继续持有 season 真值。
- 没有 data mode，导致开发和生产逻辑互相污染。

这些问题一旦出现，用户会直接觉得“产品账对不上”。

***

## 18. 一句话定义

RumbleX 的前端集成路线，本质上就是：

**先把钱包和账户总览接真，再把报名和结算结果接真，最后把统计与赛季接真，同时把 mock 从主数据源降级为演出与开发辅助层。**

***

