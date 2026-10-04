# 工程架构、环境与提交协议

## 1. 技术边界

TypeScript＋Phaser＋Vite；Phaser负责显示、输入、镜头，core负责规则、状态与可重放事务。沿用已有有效锁文件，不为整合文档无端升级引擎。全新项目可采用已选Phaser4.2.1基线；本次确认官方页面存在并记录版本，未在此包安装或构建游戏。[T1]

Vite、Vitest、TypeScript、Playwright在R0选择兼容的明确版本并生成lockfile，记录真实Node版本和依赖要求。官方资料[T2-T4]是环境入口，不保证任意版本组合成立。不要在设计包放一个未经安装的package-lock伪称已锁定；不提供会自动收费或公网部署的脚本。

首版单人不需后端、账户、运行时模型或联网遥测。真人COOP-1单独本地/测试环境实现；付费云服务/公网发布须另行授权。

## 2. 生产目录建议

```text
src/
  main.ts
  core/
    creation/{selection,locks,generator,code,identity}.ts
    rules/{chartNodes,tenGods,relations,shensha,stages}.ts
    world/{movement,navigation,fields,clock,skills,leases}.ts
    narrative/{conditions,events,dialogue,quests}.ts
    party/{schedule,encounter,invitation,contract,coordination}.ts
    state/{types,initialState,validate,plan,commit,selectors}.ts
  content/
    generated/                 # 由本包data导入并验证，禁止另抄一套表
  scenes/{Boot,Title,Create,World,Interior,RulesLab}.ts
  ui/{HUD,Chart,Journal,Party,Dialogue,Map,Settings}.ts
  persistence/{schema,codec,storage,migrations}.ts
  network/{protocol,authority,client,session}.ts  # COOP-1阶段
  dev/{inspector,testBridge}.ts
public/assets/
  ASSET_LICENSES.md
tests/{unit,integration,e2e,network}/
docs/{IMPLEMENTATION_STATUS,DECISIONS,PLAYTEST,DELIVERY_REPORT}.md
```

core禁止import Phaser、DOM、localStorage和网络，输入输出是明确数据。规则无权限读取用户电脑时间或真实生日。一个actor只由一套移动/碰撞模块控制，不由Phaser物理与core位置同时竞争写入。

## 3. 权威原始状态

`SaveGame`保留完整identity、原始四柱、创建来源、worldSeed、逻辑tick、revision、actor位置/资源/学习、机关、任务事实、库存、证据、NPC关系和旅行约定、相遇回执、剧情事件、奖励回执、首次快照。

藏干节点、十神分布、根透图、神煞本命匹配、环境F/H与通行图是带版本的派生查询，不作为另一份权威事实。`herbShield`只在environment里，邀请条件从那里读，不另存同名flag；游戏位置不只保存画布像素而丢掉room/layer。

储存的是有限状态而不是每帧粒子。所有金额均不存在现实金融含义；库存单位/灵力/tick/格各自有单位，不能把normalizedSignal当真实水量。

## 4. 命令与事务

命令包含commandId、worldId、actorId、expectedRevision、kind、匹配kind的payload。客户端传意图，不传“我的奖励改成100”。命令层检查会话、角色控制权、大小、类型、有限数值、距离、层级、视线、来源、资源、同意、租约与版本。

`validate → plan draft → reserve draft resources → simulate reactions draft → check final safety → commit one revision → publish result/events`。

失败不更改原状态、不扣部分资源、不产生成功回执。重复commandId且payload相同返回原回执；同ID不同payload拒绝ID_CONFLICT。道具奖励另以world/player/event/reward去重，不能因为重连换commandId再领。

动作串引发反应最多4层/32条，深度/数量超限回滚整笔草稿。演出、音效、粒子和UI动画不得反向提交额外游戏事实。所有唯一奖励与剧情完成必须在同一事务，不靠动画结束回调。

资源成本展示与真正提交调用同一个planner。expectedRevision过期先重算预览/请求玩家确认，不能客户端猜测已经成功。读档拒绝未知profile，不能另建默认人物糊过去。

## 5. 时钟、移动与持续效果

固定60tick/模拟秒；每渲染帧最多补5步，单人失焦暂停，恢复不追几小时。角色速度192px/s、48px/格、对角归一化。可行走图做长路径，AABB/网格碰撞保证实际位置；不同layer不串碰撞，门户使用明确落点。

持续效果每秒扣费是新的小事务，费用不足产生安全结束事件。路径租约只保护正在穿越者，不替新来的角色无限开放。NPC离队/客户端掉线同样受安全租约约束。

模拟顺序固定：tick推进→到期/持续扣费→输入命令顺序→环境投影→导航边更新→作息/已登记相遇窗口→事件资格→演出事件。禁止事件资格每帧抽随机；随机与渲染分离。

## 6. 存档API与运行时校验

`contracts/index.ts`是设计契约，不替代运行时验证。提供的schema也只是结构约束，不替代干支、神煞、图循环、资源预算和任务可达性校验。不得只`as SaveGame`后信任JSON。

对象键/枚举/范围严格检查，禁止prototype污染字段；显示名纯文本。导入1MiB上限，导入先预览不直接覆盖。写盘错误提示“尚未保存”，不能给假成功。详细迁移见`SAVE_MIGRATION.md`。

## 7. COOP-1最小真实实现

先本地权威进程＋2/3个实际浏览器客户端，可用WebSocket类传输但具体库须另做依赖锁定。只做同步位置不算完成，必须共享机关、时间、事件、库存和幂等奖励。

总行动角色3；真人占席位，NPC必须安全退场并保留约定。个人命盘/图鉴/关系属于个人，环境属于world。虚构命盘详细分享需同意，摘要仍可合作；不要以隐藏UI冒充网络层保密。

个人菜单不暂停大家；等待/跳时由房主提案且全员ready，忙于不可打断事务或桥上租约者阻止跳时。断线玩家先安全放置，重连读取authority snapshot＋revision，不从旧客户端状态覆盖世界。

门/水门并发仅按权威序串行；结果确认包含新的revision，显示过期拒绝。主持世界退出后，不把其环境全量写进访客个人存档；访客仅带回被允许的个人知识/奖励回执。无公网上线与压力测试就不声称可大规模MMO。

## 8. 工程交付证据

生产项目至少有dev/build/typecheck/test/test:integration/test:e2e/validate:content等真实有效脚本。每个脚本需实际运行记录，失败不改成echo PASS。保存浏览器截图/操作路径/日志/性能环境；不能拿设计图或参考脚本输出充当成品演示。


### 移动与离散事务的revision区别

移动意图按actor的单调inputSequence排队，在权威tick应用，observedRevision用于校准，不以全局revision稍落后便拒绝正常行走。机关、施法、邀请、领奖等离散事务必须expectedRevision并做冲突校验；禁止每帧位置更新使两名玩家的正常操作互相饿死。重复输入序号忽略，持续位移不允许客户端直接报终点。
