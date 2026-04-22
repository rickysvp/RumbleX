**RumbleX Frontend State Spec**。\
这份文档的目标是把前端 store 的边界彻底定清楚：**哪些状态应该存在前端，哪些只能来自后端/索引器，哪些只能以“派生状态”存在，不能让 Zustand 越存越乱。**

# RumbleX Frontend State Spec

## 1. 文档目的

RumbleX 当前前端已经有 `walletStore` 与 `gameStore` 两个核心状态入口，同时 UI 由左侧栏、Arena、MixedFeed、Intel、History、Stats、Rank 等多个区域共同消费状态。\
因此这份 Spec 的目标是把前端状态拆成**账户状态、实时回合状态、索引查询状态、纯 UI 状态**四层，避免把链上真相、链下模拟、页面临时状态和展示缓存混在一起。

***

## 2. 总体原则

前端状态必须遵守 4 条原则：

1. **资金真相不由前端 store 决定。**
2. **实时表现状态可以短暂存前端。**
3. **可通过查询重建的数据，不要重复长期存本地。**
4. **UI 控制状态和业务事实状态必须分离。**

一句话说：\
**store 是消费真相的地方，不是发明真相的地方。**

***

## 3. 状态分层

建议前端最终分为 4 层状态：

## A. Wallet Session State

用户连接钱包后的会话状态。

## B. Round Runtime State

当前 Arena 正在展示的实时回合状态。

## C. Indexed Query State

来自 API / indexer 的已确认业务数据。

## D. UI View State

标签切换、抽屉、弹窗、筛选器、loading 等纯前端状态。

这 4 层必须分仓或至少分 slice，不能继续全部塞进一个大 `gameStore`。

***

## 4. Wallet Session State

你现在的 `walletStore` 已经有不错的基础字段：

- `status`
- `address`
- `addressFull`
- `monBalance`
- `hasRumbleXPass`
- `passStatus`
- `isMintingPass`
- `error`
- `isRefreshing`。

后续建议扩展为：

- `claimableMon`
- `lockedInRounds`
- `seasonEstimateMon`
- `activeRoundId`
- `lastWalletSyncAt`。

## 它负责什么

- 钱包连接状态
- 当前地址
- 当前账户总览
- Pass 状态
- 用户能否进入主流程。

## 它不负责什么

- 历史战绩列表
- 回合详情
- 排行榜
- 聊天 feed
- 合约最终结算计算。

***

## 5. Round Runtime State

你当前 `gameStore` 里已经存了大量运行态数据，例如：

- `phase`
- `roundNumber`
- `timeRemaining`
- `players`
- `feedEvents`
- `lastRoundResult`
- `userLoadout`
- `lastElimination`。

这些字段本质上都属于 **Round Runtime State**，适合驱动：

- Arena 主舞台
- MixedFeed
- Intel 的局内态势
- 倒计时与播报。

## 必须保留的运行态

- 当前 round phase
- 当前倒计时
- 当前房间参与者概况
- 局内 feed / combat stream
- 用户本轮 loadout 草稿
- 当前局结算前的临时结果展示。

## 不应该放这里的

- 赛季累计排名真值
- Claimable 最终金额
- 历史累计收益
- 已确认 payout 结果。

因为这些都不属于“正在进行的这一局”的瞬时状态。

***

## 6. Indexed Query State

这是你现在最缺的一层。\
它应该专门存 API / indexer 返回的“已确认业务事实”，例如：

- `playerSummary`
- `playerClaims`
- `playerHistory`
- `playerStats`
- `currentSeason`
- `seasonRank`
- `roundDetailById`。

## 它负责什么

- History 页数据
- Stats 页数据
- Rank 页数据
- Claim 面板数据
- 赛季与结算确认状态。

## 它不负责什么

- 钱包连接过程
- MixedFeed 的临时聊天流
- 当前拖动、展开、hover、tab。

你可以把这层拆成单独的 query store，或者直接交给 React Query / SWR 这类数据层管理。\
总之，它不应该继续塞进 `gameStore`。

***

## 7. UI View State

当前 app shell 已经有不少 UI 视图状态：

- `activeTab`
- `isMenuOpen`
- `viewMode`
- `currentView`。

这类状态只影响“怎么看”，不影响“事实是什么”。\
因此它们必须留在 UI 层或 `uiStore`，而不是和钱包/回合/索引数据混放。

建议统一收敛这些字段：

- `currentView`
- `mobileTab`
- `isHamburgerOpen`
- `feedFilter`
- `claimPanelOpen`
- `selectedRoundId`
- `historyFilter`
- `rankSortMode`
- `isSettingsOpen`。

***

## 8. 你现有 `gameStore` 的问题

当前 `gameStore` 同时混了这些内容：

- 当前回合运行态
- 赛季榜单
- 用户历史
- 用户统计
- treasury 累计
- UX trigger 字段。

这会造成 3 个问题：

1. 局内刷新会误伤历史/统计数据。
2. API 接入后，本地模拟状态会和真实结算状态打架。
3. 页面边界越来越模糊，后期很难维护。

所以后面接入真实数据时，`gameStore` 必须瘦身。

***

## 9. 推荐 store 划分

建议最终拆成下面 4 个 store / data layer：

## `walletStore`

只管账户和钱包会话。

## `roundStore`

只管当前房间运行态与局内临时表现。

## `queryState` 或 `useQuery`

只管 indexer/API 读数据。

## `uiStore`

只管页面控制与交互状态。

如果继续沿用 Zustand，也可以是：

- `useWalletStore`
- `useRoundStore`
- `useUiStore`

然后把服务器查询交给 React Query。\
这是最稳的组合。

***

## 10. `walletStore` 建议字段

建议最终字段如下：

- `status`
- `address`
- `addressFull`
- `walletBalance`
- `hasPass`
- `passStatus`
- `claimableMon`
- `lockedInRounds`
- `seasonEstimateMon`
- `activeRoundId`
- `isConnecting`
- `isRefreshing`
- `isMintingPass`
- `error`
- `lastSyncedAt`。

## 派生字段

这些不必单独存：

- `canJoinGame = status === connected && hasPass`
- `showMintPassCTA = connected && !hasPass`
- `hasClaimable = claimableMon > 0`。

***

## 11. `roundStore` 建议字段

建议 `roundStore` 只保留当前或最近一轮的运行数据：

- `activeRoundId`
- `phase`
- `timeRemaining`
- `entryFee`
- `joinedCount`
- `maxPlayers`
- `userJoinStatus`
- `queuedLoadout`
- `lockedLoadout`
- `feedEvents`
- `roundSnapshot`
- `lastRoundOutcomePreview`
- `isSubmittingJoin`
- `isSubmittingLoadout`。

## 不该放进去的

- `seasonPool`
- `leaderboard`
- `userHistory`
- `userStats`
- `claimableMon`。

这些都不是“当前房间运行态”。

***

## 12. Query 数据建议结构

建议把后端聚合结果按资源类型缓存：

- `summary[address]`
- `claims[address]`
- `history[address]`
- `stats[address]`
- `season[seasonId]`
- `seasonRank[seasonId]`
- `round[roundId]`。

这样可以支持：

- 用户切换页面不重复清空
- 指定 round 详情按需加载
- 进入 History / Rank / Stats 时快速复用缓存。

这里要记住：\
**query cache 是远端真相的镜像，不是本地业务主数据库。**

***

## 13. 哪些字段必须是派生状态

以下字段尽量不要直接存，而是临时计算：

- `aliveCount`，由 `players` 推导。
- `topFrag`
- `biggestStack`
- `canClaim`
- `seasonProgressPercent`
- `killsToThreshold`
- `isRoundEndingSoon`。

你现在 `gameStore` 里已经有一部分是“结果展示字段”，比如 `lastRoundResult`。\
这类字段可以短暂保留，但只适合作为局部 UX 缓冲，不应替代真实查询结果。

***

## 14. 哪些状态绝不能由前端写死

这些状态必须只来自链上或索引器：

- 最终 payout amount
- claimable total
- season qualification
- round settled status
- protocol fee / season fee
- 历史净收益累计。

前端可以“暂时显示 pending”，但不能自己最终决定这些值。\
否则一接真实结算，状态一定冲突。

***

## 15. 页面到状态层的映射

## Left Sidebar / Profile

读 `walletStore + summary query`。

## Arena / RoundStage

读 `roundStore` 为主，辅以 `walletStore` 的资格和余额信息。

## MixedFeed

读 `roundStore.feedEvents`，不直接依赖历史查询数据。

## History

读 `history query`。

## Stats

读 `stats query`。

## Rank

读 `season + seasonRank query`。

这样页面边界会非常清楚。

***

## 16. 状态同步策略

建议同步顺序如下：

1. 钱包连接成功 -> 拉 `summary`。
2. 进入 Arena -> 拉当前 live round / join status。
3. round 结束 -> 轮询或订阅 `round detail` 与 `summary` 更新。
4. 打开 History / Stats / Rank -> 按需拉对应 query。
5. Claim 成功 -> 强制刷新 `summary + claims + stats`。

这个顺序能最大限度减少无意义全局刷新。

***

## 17. 本地模拟与真实数据切换

你现在前端大量依赖 mock simulation、mock wallet、mock transaction。\
因此必须预留一个明确开关，例如：

- `dataMode = mock | live`

并保证：

- mock 模式下允许本地写入 runtime 数据
- live 模式下资金与历史类数据只读远端结果。

否则接入真实链上后，mock 逻辑很容易把 UI 覆盖坏。

***

## 18. 一句话定义

RumbleX 的前端状态体系应该遵守一句话：

**钱包状态归钱包，局内运行态归房间，历史与资金真相归查询层，页面开关归 UI 层。**

你只要坚持这条，后面从 mock 过渡到真实链上数据时就不会炸。

***

下一步最适合继续写的，就是第 10 份文档：\
**RumbleX Frontend Integration Plan（从你当前 mock 前端，分几步接到真实链上与 indexer）**。
