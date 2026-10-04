# v0.4交接资料验收记录

**状态：设计交接包参考检查通过；游戏本体尚未在本次任务中实现。**

本记录不沿用旧包PASS；下列工具在当前v0.4实际执行，原始输出位于evidence。UTC执行时间见`evidence/reference_validation.json`。输入ZIP哈希见`evidence/input_provenance.json`；原文件未覆盖。

## 实际执行

| 命令/检查 | 结果 | 证据范围 |
|---|---|---|
| `python3 tools/validate_handoff.py --exhaustive --report evidence/reference_validation.json` | PASS | 27份JSON、版本/引用/注册表；518,400种选择的预算枚举、2,000张固定种子抽样盘 |
| `node tools/check_creation_vectors.mjs` | PASS | 64个32位输出、14个冻结创建案例，跨Python/JavaScript一致 |
| `node tools/check_encounter_vectors.mjs` | PASS | 17个SHA-256/BigInt向量，包括无资格窗口和第4次保底 |
| `tsc --noEmit --strict --target ES2022 contracts/index.ts` | PASS | TypeScript统一类型契约；不是游戏构建 |
| `python3 tools/check_schemas.py` | PASS | 3份局部schema、7张盘、1个selection、1份人工最小档、3个拒绝案例 |

执行环境：Python3.13.5、Node22.16.0、TypeScript5.8.3；可选JSON Schema检查使用jsonschema4.26.0。未安装Phaser/Vite游戏依赖，未伪造package-lock或浏览器截图。

## 参考检查具体覆盖

100对有向十神、12支藏干列表、60日柱旬空、120地势组合；七张作者盘的根透/位置关系图例；三明干＋全部藏干的自身十神预算70单位与跨人80单位区分。生枝土0.8/隐藏节点11、双天乙载位和多证据去重均有回归。

环境枚举576组机关×时辰，检查数值范围与局部输入/输出守恒。蓝图16节点19边，12节点在雾门未开时可达；必要轴芯与识路证据在该前置范围。这只是图节点可达，不证明实际tilemap碰撞或门户能够走通。

15操作、10协作、12神煞、6事件家族、6附属分支、6相互作用、19条件、27对象种子、37交互、4完整作息、9探索点位组、66项验收定义的ID/引用/覆盖检查。**注册条目存在不等于其handler已实现或趣味性成立。**

518,400枚举使用年/月与日/时两段合法派生的缓存做笛卡尔组合，验证完整预算与费用边界；不是对同数量真实历日、世界状态或通关流程的测试。2,000盘抽样执行完整神煞参考定位；并非518,400盘的每种神煞都已逐盘穷举。

## 本次发现并处理

创建预览残留的旧木18示例修正为按新公式实算：生枝当前五项均取整20。该现象说明费用差异可能不明显，不能把规则校验当玩法平衡验证。其他统一项见`MERGE_AUDIT.md`。

skill提交顺序改为草稿内反应/最终校验后整笔提交；环境herbShield唯一持久化；首章识路碑前置；节点/类型/存档字段使用一套owner与版本约定；行脚客缺失的固定虚构盘和作息/相遇向量补齐。

## 未执行 / 不在证据范围

实际游戏代码、构建、渲染、美术、动画、键鼠/UI通关、碰撞、存档浏览器读写、真实旧档迁移、运行时transit/partner检测、多人连接/并发/断线、性能与人工试玩均**NOT RUN**。这里只提供本命参考定位器；没有把它冒称完整时运引擎。

本次没有重新逐条校勘文化文献；来源沿袭与归一化选择见`SOURCES.md`。开发者不得用当前PASS给古籍版本、现实预测能力或尚未运行的游戏背书。

## 发行完整性

`MANIFEST.sha256`列出所有交付文件（除自身）；`python3 tools/check_manifest.py`用于本地核对。压缩包还需对ZIP CRC及重新解压后的manifest验证；封包执行记录单独作为交付附件保存，不回写已封包内容。
