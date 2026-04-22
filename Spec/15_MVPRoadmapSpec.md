**RumbleX V1 Scope / Post-MVP Roadmap Spec**。\
这份文档的目标很明确：**把什么是 V1 必做、什么是可以晚一点做、什么坚决不要在现在扩张写死。** 这样你后面开发时才不会一边补核心闭环，一边被“顺手再加一个功能”拖死。

# RumbleX V1 Scope / Post-MVP Roadmap Spec

## 1. 文档目的

RumbleX 已经有了比较完整的产品蓝图：Pass、单轮房间、链上结算、Claim、赛季击杀累计、History、Stats、Rank、混合 feed、像素风 UI。\
但真正要上线一个能跑、能解释、能结算的 V1，必须把范围压缩到**最小可信闭环**，否则项目会持续扩张、核心路径迟迟不能稳定。

***

## 2. V1 的核心定义

RumbleX V1 不应被定义为“功能最多的版本”，而应被定义为：

**用户可以完成 Pass -> Join -> Round End -> On-chain Settlement -> Claim / View Result 这一整条链路，并且赛季层有基本可读性。**

换句话说，V1 的关键不是“功能丰富”，而是：

- 闭环完整
- 资金可信
- 用户能理解
- 团队能维护。

***

## 3. V1 必做范围

V1 必做内容建议固定为以下 8 类：

1. Wallet connect。
2. Pass check + Mint Pass。
3. 官方 round lobby / join flow。
4. 单轮结算正式上链。
5. Claimable MON + Claim All。
6. History 页展示真实 round 结果。
7. Stats 页展示个人累计结果。
8. Rank / Season 页展示 kills 与资格状态。

这 8 项加起来，已经足够构成一个可以对外解释清楚的产品版本。

***

## 4. V1 必须稳定的体验

V1 不要求所有页面都极度丰富，但必须稳定这些体验：

- 无 Pass 用户知道为什么不能玩，以及去哪 mint。
- 已报名用户知道自己是否成功进入 round。
- round 结束后用户知道自己是 paid、claimable 还是 no payout。
- 用户知道 claim 钱从哪领，不用逐轮找。
- 用户知道 season 是按 kills 资格来算，而不是传统名次奖金。

如果这些解释不清楚，就算链路 technically 能跑，产品也还没准备好。

***

## 5. V1 不必强求的内容

以下内容可以做，但**不应阻塞 V1 上线**：

- 更复杂的社交关系系统
- 更丰富的个人资料页
- 更复杂的房间创建系统
- 高级筛选与多维历史分析
- 过度复杂的动画和演出
- 赛季奖励预测的高级图表。

这些内容都可能提升体验，但不会决定“用户能不能完成核心资金闭环”。

***

## 6. V1 明确不做

为了防止 scope creep，建议明确写入 V1 不做：

- 自定义用户房间的完整权限系统。
- 多种赛制并存。
- 多代币经济。
- 深度公会/战队系统
- 可交易复杂资产市场
- 多链支持
- 大型社交 feed 重构
- 复杂成就系统。

这些不是“永远不做”，而是**现在不做**。\
它们对当前 alpha/V1 成功不是决定性因素。

***

## 7. 为什么 V1 要收缩到这个程度

RumbleX 当前最核心的风险不在于“内容不够多”，而在于：

- 资格路径是否清楚。
- 结算路径是否可信。
- claim 路径是否清楚。
- season 规则是否能被用户读懂。
- 前端从 mock 过渡到 live data 是否稳定。

所以 V1 的策略必须是：\
**先把真实信任闭环做对，再考虑玩法和社交扩张。**

***

## 8. V1 页面范围

V1 页面建议固定为：

- Arena
- History
- Stats
- Rank
- Guide
- Settings
- Support。

其中：

- Arena 是主入口。
- History/Stats/Rank 是可信解释层。
- Guide/Support 是认知教育层。

不要在 V1 再扩出太多平行页面，否则信息结构会迅速变重。

***

## 9. V1 数据范围

V1 只需要稳定 6 类核心数据：

- account summary
- live round state
- round settlement result
- claimable total
- player stats
- season rank / qualification。

## 不必在 V1 强做的数据

- 高级漏斗分析
- 多维行为画像
- 深度 battle replay
- 全站内容推荐。

这些都属于后续优化层，不是 V1 可信闭环的必要数据。

***

## 10. V1 合约范围

V1 合约建议严格限制为：

- `RumbleXPass`
- `RoundFactory`
- `RoundRoom`
- `SeasonVault`
- `ClaimVault`。

不要在 V1 阶段额外引入：

- 复杂治理合约
- 多层 treasury 路由
- 复杂运营后台权限系统
- 一堆为了“以后可扩展”而加的中间层。

V1 优先的是：

- 易理解
- 易测
- 易维护。

***

## 11. V1 允许保留 mock 的地方

V1 并不代表所有内容都必须完全真实驱动。\
以下部分在 V1 阶段仍可保留一定 mock / 演出层：

- 局内 feed 的部分叙事增强
- 一些视觉动效
- 非关键社交提示
- 某些开发模式下的模拟数据切换。

但要注意：

- 资金
- 历史
- claim
- season kills / qualification

这些绝不能继续靠 mock 冒充真相。

***

## 12. Post-MVP：V1.1

V1.1 最适合补的是“让产品更顺滑”，而不是推翻结构。\
建议优先考虑：

- 更好的移动端 claim / summary 体验。
- History 详情页增强。
- Stats 更细的时间维度和收益拆分。
- 更丰富的 season 奖励解释层。
- feed 与系统提示更智能地联动真实结算状态。

这些功能能增强理解，但不改变底层闭环。

***

## 13. Post-MVP：V2

V2 才适合考虑更大扩张：

- 用户房间 / 自建房体系深化。
- 更复杂的赛事模式
- 更成熟的社交与社区机制
- 更丰富的资产层与成长线
- 更强的运营后台与配置系统
- 更高级的 season 内容系统。

这些扩展都建立在一个前提上：\
V1 的资金、资格、结算、claim、rank 已经稳定可信。

***

## 14. 功能优先级框架

建议你后续开发时，所有新需求都用下面这套优先级判断：

## P0

不做就无法形成可信闭环。

## P1

不做不影响上线，但明显影响主路径体验。

## P2

提升理解和留存，但不影响闭环。

## P3

锦上添花，适合后续节奏慢慢补。

例如：

- Pass / Join / Settle / Claim = P0。
- History / Stats / Rank = P1。
- 更丰富 feed 演出 = P2。
- 个性化社交系统 = P3。

***

## 15. 你最该防止的 scope creep

你最需要防止的扩张包括：

- 在 claim 还没彻底清楚前，去做复杂社交系统。
- 在 settlement 还没完全稳定前，去做更多赛制。
- 在 Pass / Join / History 还没打通前，去做运营花活和炫技 UI。
- 在 API / state 边界还没稳定前，去做大规模页面新增。

这些很容易让项目看起来“功能越来越多”，但其实核心越来越不稳。

***

## 16. 一句话定义

RumbleX 的 V1 范围应该被定义为：

**一个能让用户清楚参与、清楚结算、清楚领取、清楚理解赛季资格的最小可信链游闭环。**

***

到这里，主线文档包其实已经完整了。\
如果继续往后扩，我建议下一组就不是继续写“第 16 份、第 17 份”这种泛文档，而是进入更实用的交付物，例如：

- **RumbleX Master Spec 目录版**
- **Solidity 合约接口草案**
- **Frontend store / API types 草案**
- **上线前 checklist 表格版**。

