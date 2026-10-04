# 数据内容与引用约定

## 1. 单一数据源

`data/package_config.json`登记版本。文化关系只在cultural_tables，预算/操作节奏在balance，微型流量与雾在environment；人物出生盘只在characters，旧模板备份只在fixtures/legacy_presets用于迁移。

`schemaVersion`是容器形状版本，不意味着文化算法必须跟随改号。载入顺序：版本登记→生成表/文化表/平衡→人物/操作/协作→地图/首章→条件注册→事件/对白/交互。未知键/ID/枚举直接报路径，不默默忽略。

## 2. 条件AST白名单

`constant(value)`、`all(args)`、`any(args)`、`not(arg)`、`ref(id)`、`flag(key,equals)`、`item(id,atLeast)`、`clue(id)`、`status(id)`、`phase(in)`、`environment(metric,compare,value)`、`mechanism(key,equals)`、`shensha(id,domains,owner)`、`npcAvailable(id)`。

ref必须解析到存在ID且无循环；all空数组为true、any空数组为false，仅允许作者明确写入，不能把缺字段默认为空。compare仅lt/lte/eq/gte/gt。数值须有限；负物品数量拒绝。环境字段为投影、mechanism字段为原始机关，两者不能互相写。

正文中的`condition`中文只是作者说明，不执行字符串。禁止eval、new Function、任意脚本URL或运行时LLM生成规则。范围、同意、资源、版本、NPC占用是命令层额外硬检查，不能靠一条true条件绕过。

## 3. 效果白名单

`setFlag`、`setMechanism`、`grantClue`、`grantItem`、`spendItem`、`addStatus`、`learnSkill`、`setSocial`。实际主线交信走专门原子命令，复杂技能走skills.runtime.handler。事件effect只负责确定已实际完成动作后的剧情结算，不直接替玩家开地图。

关键件grant/spend限批准的剧情事务；inventory/max、防重复回执、素材库存与空间安全都先整笔验证。setFlag不能写未注册键；setMechanism不能写原始四柱或派生缓存。面板preview只读。

## 4. 对象组件

Living、Flexible、Anchors、Moisture、GrowthReserve、OpticalReceiver、Thermal、AirflowVolume、Soil、LoadBearing、HydraulicBoundary、Reservoir、Containment、Separable、Integrity、JoinableMetal、MaterialReserve、Resonant、Connectivity、WaterAccessible、HydraulicNetwork、ReflectiveSurface、AuthoredEcho。

完整对象至少带id、roomId、layer、位置、组件、可安全操作的几何边界。蓝图位置不是直接碰撞地图：生产内容构建器必须生成/校验可站立格、目标距离、视线与门户落点。

## 5. 内容完成度

data是完整首章的种子与确定边界，不包含最终碰撞图块、全NPC动画或最终对白润色。每个ID都要在生产内容中接通并在状态表记SPECIFIED/IMPLEMENTED/VERIFIED；只读取JSON不算有玩法。

## 投影字段与展示副本

`data/objects.json`的mechanismBindings是动作到权威environment的写入映射；对象外观mode可以由environment派生，不能把两份副本独立持久化后各自决定是否通路。fixture中的初始外观值只用于新建原型；读档必须依据权威environment重投影。规则间不得互相双向写回造成循环。

显示名可用Unicode，但actorId/worldSeed/npcId/eligibleWindowId等进入相遇协议的键使用非空可打印ASCII；actorId另禁止斜杠与竖线，以保证来源节点和occurrence键不碰撞。
