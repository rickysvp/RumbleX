**RumbleX Launch Readiness Spec**。\
这份文档的目标不是讲“怎么开发”，而是讲**什么情况下你才算真的能上线 alpha / beta，而不是只是自己本地觉得差不多了。**

# RumbleX Launch Readiness Spec

## 1. 文档目的

RumbleX 是一个涉及真实资格、真实报名、真实结算和真实 claim 的链游，因此“能运行”不等于“能上线”。\
这份 Spec 用来定义一套正式上线前的检查门槛，覆盖：

- 合约 readiness
- indexer/API readiness
- 前端 readiness
- 运营与版本 readiness
- 灰度发布 readiness。

***

## 2. 上线原则

上线判断必须遵守 5 条原则：

1. **资金路径先于内容路径。**
2. **结算可信先于局内演出完整。**
3. **最小闭环先于全功能。**
4. **能回滚、能观测、能解释，才算可上线。**
5. **alpha 允许简化，但不允许账不对。**

也就是说，\
你可以先不上复杂玩法，但不能带着“金额可能不一致”去上线。

***

## 3. 上线最低闭环

RumbleX 在 alpha 阶段至少必须打通这 5 条链路：

1. Connect wallet。
2. Check / Mint Pass。
3. Join round。
4. On-chain settle result。
5. Claim fallback / season rewards。

只要这 5 条链路没打通，就还不是“可上线产品”，最多只是可演示原型。

***

## 4. 合约 readiness

合约侧上线前必须确认：

- Pass 合约已部署并可 mint / query。
- RoundFactory 可创建和索引房间。
- RoundRoom 可完成报名、状态推进、结算。
- SeasonVault 可接收每轮 10% season fee。
- ClaimVault 可登记并发放 fallback / reward claim。

## 必须通过的条件

- 核心 invariant 已测试通过。
- 重复结算被拒绝。
- claim 不可重复领取。
- protocol fee / season fee / player pool 计算正确。

合约如果还处于“逻辑基本能跑，但边界没测完”，就不应上线。

***

## 5. 事件与索引器 readiness

因为前端大量依赖 History、Stats、Rank、Claim 这些聚合结果，indexer readiness 是正式上线门槛，而不是附属功能。

上线前必须确认：

- 所有关键事件已定义并稳定发出。
- indexer 能从事件回放重建：
  - round history
  - claimable
  - player stats
  - season kills / qualification。
- 有重扫与去重能力。
- 关键数据有 confirmed / syncing 状态区分。

如果 indexer 还经常让 summary、history、claims 互相打架，这一版不能上线。

***

## 6. API readiness

前端正式使用的最小 API 面必须已经稳定，至少包括：

- `/me/summary`
- `/me/claims`
- `/rounds/live`
- `/me/history`
- `/me/stats`
- `/season/current`
- `/season/:id/rank`。

## API 上线标准

- 返回结构稳定。
- 错误码统一。
- claimable、history、stats、rank 口径一致。
- 失败时有明确 retry 语义。

正式上线前，不允许页面还依赖“临时 mock JSON”去冒充正式数据源。

***

## 7. 前端 readiness

前端上线前必须做到：

- 真实钱包可连接。
- Pass gate 可工作。
- Arena 主 CTA 能真实 join。
- History 能展示真实 settled 结果。
- Claim 模块可真实领取。
- Stats / Rank 读真实数据。

## 体验层最低要求

- desktop 和 mobile 都能完成核心闭环。
- loading / error / retry 状态完整。
- Claimable MON 在钱包区清晰可见。
- 用户不会需要去 history 逐轮找钱。

你可以接受像素动效还没做到极致，但不能接受用户不知道“我是不是拿到钱了”。

***

## 8. 内容与说明 readiness

Guide、FAQ、Tooltip、页面文案必须至少解释清楚这些内容：

- Pass 是参与资格。
- 每轮独立结算。
- entry fee 的 10% 进协议，10% 进 season pool。
- 幸存者保留本轮结果，异常转入 claimable。
- season qualification 基于 kills 阈值。

这一步不是“营销文案优化”，而是减少误解和客服成本的基础设施。

***

## 9. 版本与发布 readiness

你当前 repo 已有版本号与 release 脚本，并且 `version.json` 里已经记录了 alpha 渠道和 changelog，这说明版本化发布流程已经有基础。\
上线前必须确认：

- 当前 release channel 明确，例如 `alpha`。
- changelog 可读，且说明本次变化影响哪些用户路径。
- 发布版本唯一可追踪。
- 回滚到上一个稳定版本的流程明确。

换句话说：\
不能只说“发最新版”，而要知道“发的是哪一版，坏了怎么退”。

***

## 10. 监控与观测 readiness

正式上线前，必须至少具备以下观测能力：

- join 成功率
- mint pass 成功率
- claim 成功率
- summary 查询成功率
- history / stats / rank 查询成功率
- settlement 同步延迟。

## 最低要求

- 能看到最近一段时间失败率。
- 能区分用户取消与系统错误。
- 能知道错误发生在哪一层：钱包、RPC、合约、indexer、API、前端。

如果没有观测，你上线后其实无法判断产品是在“偶尔出错”还是“已经系统性损坏”。

***

## 11. 灰度发布策略

RumbleX 更适合分阶段上线，而不是一次性全开放。

建议分 3 步：

## Phase A：Internal Alpha

- 仅团队和少量测试地址使用。

## Phase B：Closed Alpha

- 小范围真实用户，可控人数，可重点收集 join / claim / settlement 问题。

## Phase C：Public Alpha

- 对外公开，但仍保留 alpha 标识和风险提示。

这种方式最适合你现在这种从 mock 向真实链路切换中的产品状态。

***

## 12. 上线阻断条件

出现以下任一情况，应直接阻止上线：

- 资金守恒测试未通过。
- settlement 结果不能稳定上链。
- claim 存在重复领取风险。
- summary / claims / stats 数据口径不一致。
- 无 Pass 用户可能误入真实报名流程。
- 关键页面 still 依赖 mock 数据冒充正式结果。

这些不是“待优化项”，而是“上线阻断项”。

***

## 13. 上线前清单

正式上线前建议逐项打勾：

- 合约部署地址已确认。
- Pass / Join / Settle / Claim 核心路径已跑通。
- Indexer 已同步且可重扫。
- API 结构冻结。
- 钱包区已展示 claimable。
- History / Stats / Rank 已接真实数据。
- 错误文案统一。
- Guide / FAQ 已更新。
- 发布版本已编号。
- 回滚方案已准备。

***

## 14. Alpha 成功标准

alpha 不是要求一切完美，而是要求最核心闭环稳定。\
建议 alpha 成功标准是：

- 用户可以完成 Pass -> Join -> Settle -> Claim 全链路。
- 关键资金与统计数据不打架。
- 错误出现时用户知道当前状态和下一步。
- 团队能观测问题并快速修复。

只要做到这几点，alpha 就是成功的。

***

## 15. 一句话定义

RumbleX 的 Launch Readiness，本质上就是：

**当资格、报名、结算、claim 和查询闭环都稳定、可观测、可解释、可回滚时，产品才算准备上线。**

***

