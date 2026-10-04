# 存档4与旧版本迁移

## 1. 当前完整结构

schemaVersion=4，contentVersion=0.4.0；culture/balance/creation/environment版本分别登记。完整四柱与creation origin不可缺；只存模板ID、种子、五行饼图均不足。权威结构见`contracts/index.ts`，最小参考档见`fixtures/save_v4_minimal.json`。

同一world保存tick、revision、seed、NPC约定/精力、原始机关、相遇窗口回执、事件阶段、任务证据与奖励回执。派生缓存加载重算，不接受旧缓存覆盖新表。

## 2. current/previous的安全协议

使用两个有效代际槽＋一个head元数据，逻辑角色为current/previous。优先采用IndexedDB的单事务更新；纯localStorage实现应先写非current槽、校验完整内容与校验和，再单键切head。失败不能覆盖最后一份有效current；恢复界面显示代际和版本，让用户选择。

单个序列化包带generation、payload与校验和；校验和只发现损坏，不是防作弊安全签名。写失败停止“已保存”提示，允许手动导出。已有档创建新游戏要确认替换范围并保留旧有效代际。

## 3. 来源校验

random来源的算法/seed/locks须与完整四柱一致；只复算核对，不能读档重抽。未知必需算法/profile返回UNSUPPORTED_VERSION。custom/template/code必须分别与来源性质吻合；分享码只还原盘、不覆盖世界。

本包没有用户真实旧存档，迁移说明是待实现契约，不声称已经迁移过真实游戏。旧v0.3类型未保存创建来源这一缺口不得伪造补种子：已存在且有效则保留；缺失时用`migrated_unknown`并标fromSchema=3，保留原盘，不能称“可种子重放”。

## 4. 映射表

| 来源 | 保留 | 重新派生/转换 | 拒绝情况 |
|---|---|---|---|
| schema1 | 原任务/物品事实、profileId | 从本包冻结旧三模板填完整四柱；origin=legacy_preset | 未知模板、缺必需任务结构、非法数值 |
| schema2 | 完整player/chart/origin、种子/locks/code、已完成事实 | 新藏干预算、节点、十神、神煞，环境/技能按映射迁移 | 来源与盘冲突、未知创建算法 |
| schema3 | natalCharts、player身份资料(如有)、约定、事件、库存与来源(如有) | 统一actor ID/节点格式/世界4；缺来源显式unknown | 多份盘归属歧义、必需身份或世界字段缺失 |
| schema4 | 全部合法原始字段 | 按指定profile重建查询 | 未知版本/缺字段/非有限值/非法物品 |

不从旧affinity/“土0”反推八字。文化profile不变也重算缓存，避免重复实例残留。结构列表顺序固定年/月/日/时，不能排序变盘。

## 5. 旧任务与技能

五个旧技能映射：生枝→wood_growth；引灯→fire_light；筑垒→earth_base；断络→metal_cut；润脉→water_moisten。补齐本版开局五核心，不抹除学习历史。该映射只为迁移，正式UI不保留两套同功能按钮。

旧channelCleared=true→rootMode=trimmed；false→blocked。gateRepaired、ventState、herbShield保留实际原始值；重新计算F/H。若玩家正在新版本封闭/失效边上，迁移前提示并安置到进入侧安全点；reachedDock=true永保安全回程。

旧水木火灯阵已完成保留traceLearned和历史完成记录；新开局必须用观察/标路流程。旧letterDelivered/chapterComplete和首次结尾历史保留，不用新公式重写历史快照；旧快照注明legacy版本。

## 6. 人物与事件

recruited/trust只证明已相识/曾合作，不自动造出完整新约定。若存档明确人物正在同行，迁移后在安全点保留一段“待确认续约”租约，给予接受/告别选项，不能直接踢走。缺证据则迁为相识，不编造曾发生的委托。

旧以时辰计算的“本命天乙/驿马”标签不当成natal证据导入；已发生的相遇与奖励历史保留为legacy_event_receipt，新本命记录重新计算。不存在完整来源的历史事件只记发生事实，不伪造承载位。

## 7. 必须单独验证

坏档、截断档、未知版本、原始盘不合法、完整盘与seed冲突、只缺创建来源、人物正在桥上、旧灯阵完成、旧通关快照、访客离房。测试需对真实实现运行；本包结构schema与参考最小档不证明浏览器保存或迁移成功。
