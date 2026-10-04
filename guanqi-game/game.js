(function (root) {
  "use strict";

  const phases = "卯辰巳午未申酉戌亥子丑寅".split("");
  const stems = "甲乙丙丁戊己庚辛壬癸".split("");
  const branches = "子丑寅卯辰巳午未申酉戌亥".split("");
  const pillars = ["年", "月", "日", "时"];
  const pillarKeys = ["year", "month", "day", "hour"];
  const cycle = Array.from({ length: 60 }, (_, i) => stems[i % 10] + branches[i % 12]);
  const selectionKeys = ["yearCycle", "monthBranch", "dayCycle", "hourBranch"];
  const elementOf = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
  const elementIds = { 木: "wood", 火: "fire", 土: "earth", 金: "metal", 水: "water" };
  const elementNames = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
  const hidden = {
    子: [["癸", 1]], 丑: [["己", .6], ["癸", .3], ["辛", .1]], 寅: [["甲", .6], ["丙", .3], ["戊", .1]],
    卯: [["乙", 1]], 辰: [["戊", .6], ["乙", .3], ["癸", .1]], 巳: [["丙", .6], ["戊", .3], ["庚", .1]],
    午: [["丁", .7], ["己", .3]], 未: [["己", .6], ["丁", .3], ["乙", .1]], 申: [["庚", .6], ["壬", .3], ["戊", .1]],
    酉: [["辛", 1]], 戌: [["戊", .6], ["辛", .3], ["丁", .1]], 亥: [["壬", .7], ["甲", .3]]
  };
  const phaseFogBonus = [20, 20, 10, 0, 0, 0, 0, 0, 10, 20, 20, 20];
  const skillList = [
    ["wood_growth", "wood", "催荣", "加速已有活组织生长"], ["wood_shape", "wood", "曲直", "调整柔性组织方向"], ["wood_bind", "wood", "结络", "在安全锚点间形成拉索"],
    ["fire_light", "fire", "照幽", "照出预置痕迹与透光材料"], ["fire_heat", "fire", "温炼", "改变有热窗口的材料状态"], ["fire_rise", "fire", "炎升", "形成短时局部上升气流"],
    ["earth_base", "earth", "培基", "夯实土体与承载面"], ["earth_channel", "earth", "辟畦", "在边界内重排土体水路"], ["earth_store", "earth", "镇藏", "限制容器的交换速率"],
    ["metal_cut", "metal", "裁形", "沿安全切线分离连接"], ["metal_join", "metal", "合铸", "在材料与热窗口内接合"], ["metal_resonate", "metal", "鸣金", "沿连通结构探查回响"],
    ["water_moisten", "water", "润泽", "转移有限水量与湿润"], ["water_flow", "water", "通流", "沿既有网络重分配流动"], ["water_reflect", "water", "澄映", "平静水面读取预置回响"]
  ].map(([id, element, name, description], i) => ({ id, element, name, description, core: i % 3 === 1 }));
  const templates = [
    ["生枝", ["壬申", "乙巳", "甲寅", "庚午"]],
    ["明烛", ["戊寅", "壬戌", "丙子", "乙未"]],
    ["听锋", ["乙酉", "丁亥", "辛卯", "壬辰"]]
  ];
  const charts = {
    a_lan: ["庚辰", "壬午", "癸亥", "乙卯"],
    shi_heng: ["己卯", "丁卯", "庚申", "己卯"],
    sang_yu: ["癸未", "乙卯", "乙酉", "丁亥"],
    road_guest: ["癸酉", "乙丑", "丙寅", "己丑"]
  };
  const coopEntries = {
    比肩: ["同调", "维持临时结构"], 劫财: ["分担", "主施放者少耗6点灵力"], 食神: ["延展", "临时效果持续更久"],
    伤官: ["外放", "有效距离增加"], 偏财: ["周转", "可替代一份普通材料"], 正财: ["精用", "主施放者少耗4点灵力"],
    七杀: ["镇压", "短时压住可抑制风险"], 正官: ["定式", "吸收一次操作中断"], 偏印: ["洞察", "显出一条作者线索"],
    正印: ["护持", "延长标路并挡住一次雾推"]
  };
  const clueNames = {
    clue_water_trace: "渠痕：缺水来自通路不连通", clue_wind_bell: "风铃：回声指向安全侧路",
    clue_stone_inscription: "碑文：路标方向与观察位置", clue_old_river_name_a: "旧河名上半段",
    clue_old_river_name_b: "旧河名下半段", clue_echo_name: "缺名碑的可核对名字", clue_hidden_return: "渡口安全回程"
  };
  const itemNames = { letter: "渡口信", axis_core: "旧轴芯", ancient_bell: "古铃", tool_bag: "巡渠工具袋", echo_token: "集市回响签", reed_rope: "芦绳", solder: "补缝料" };

  const spots = [
    ["camp", "出生营地", 92, 205, 28, "village", true, "活枝压着近路，旁边仍有普通绕行。"],
    ["village", "雾村", 105, 105, 32, "village", true, "村民谈起停转的水车和两边都响过的铃。"],
    ["workshop", "工坊", 520, 355, 29, "village", true, "案上有木、金两册手记与修理工具。"],
    ["canal", "旧渠", 345, 245, 31, "terraces", false, "水尺、叶片和水车声都指向堵塞的根。"],
    ["herb", "药圃", 245, 350, 31, "terraces", true, "护屏有裂缝，叶片会随水与风即时变化。"],
    ["wall", "双风板", 548, 210, 34, "terraces", false, "墙外铃响，墙内无声；风板可以反复调整。"],
    ["ridge", "山脊", 535, 96, 29, "terraces", false, "高处能辨清回铃方向，火册夹在守风人的记录里。"],
    ["bell", "铃室", 560, 54, 25, "terraces", true, "两侧铃声可以互相核对，不必拆掉整面墙。"],
    ["gorge", "峡谷三径", 300, 455, 31, "terraces", true, "活藤、浅水踏石和塌坡分别指向三种近路。"],
    ["stone", "反射碑", 650, 352, 29, "ferry", true, "碑、静水和路标在同一视线上，镜里少了一行字。"],
    ["gate", "雾门", 740, 195, 34, "ferry", false, "公开路取决于真实水风状态，识路则需要三份证据。"],
    ["ferry", "旧渡口", 805, 410, 35, "ferry", true, "摆渡人在码头等信，旁边还有一只被拦的货箱。"],
    ["shrine", "旧祠碑廊", 885, 272, 29, "ferry", false, "废驿碑与缺名碑能核对回程和旧名。"],
    ["market", "空亡市", 870, 168, 28, "ferry", true, "缺名物件只吞回响，不会拿走主线物品。"]
  ].map(([id, name, x, y, r, region, safe, text]) => ({ id, name, x, y, r, region, safe, text }));
  const links = [
    ["camp", "village"], ["village", "workshop"], ["village", "canal"], ["village", "herb"], ["canal", "wall"],
    ["herb", "wall"], ["wall", "ridge"], ["ridge", "bell"], ["canal", "gorge"], ["gorge", "wall"],
    ["canal", "gate"], ["wall", "gate"], ["stone", "gate"], ["gate", "ferry"], ["ferry", "shrine"], ["shrine", "market"]
  ];
  const npcDefs = {
    a_lan: { name: "阿澜", job: "水工", assist: "借出水路图，也认得巡渠工具袋。", invite: "归还工具或找到渠痕后，且她当时有空。" },
    shi_heng: { name: "石衡", job: "支护匠", assist: "解释风板受力，不需要先入队。", invite: "说明方案并实际保护药圃。" },
    sang_yu: { name: "桑榆", job: "药圃管理者", assist: "辨认可导的根和需要留下的苗。", invite: "安排好当日照料后可短途同行。" },
    road_guest: { name: "行脚客", job: "辨路人", assist: "补充一条非必需的旧驿路传闻。", invite: "相遇后谈妥同行范围。" }
  };
  const shenshaCatalog = [
    ["tianyi", "天乙", "归铃引路"], ["tiande", "天德", "护苗调停"], ["yuede", "月德", "救援准备"], ["taiji", "太极", "碑影对照"],
    ["lu", "禄神", "补给交换"], ["yima", "驿马", "重立驿碑"], ["huagai", "华盖", "碑影相照"], ["jiangxing", "将星", "分工防护"],
    ["xianchi", "咸池", "灯市口述"], ["yangren", "阳刃", "受控破障"], ["jiesha", "劫煞", "被拦货箱"], ["xunkong", "旬空", "集市缺名"]
  ];
  const shenshaTables = {
    tianyi: { 甲:"丑未",乙:"子申",丙:"酉亥",丁:"酉亥",戊:"丑未",己:"子申",庚:"丑未",辛:"寅午",壬:"卯巳",癸:"卯巳" },
    taiji: { 甲:"子午",乙:"子午",丙:"卯酉",丁:"卯酉",戊:"辰戌丑未",己:"辰戌丑未",庚:"寅亥",辛:"寅亥",壬:"申巳",癸:"申巳" },
    lu: { 甲:"寅",乙:"卯",丙:"巳",丁:"午",戊:"巳",己:"午",庚:"申",辛:"酉",壬:"亥",癸:"子" },
    yima: { 申:"寅",子:"寅",辰:"寅",寅:"申",午:"申",戌:"申",亥:"巳",卯:"巳",未:"巳",巳:"亥",酉:"亥",丑:"亥" },
    huagai: { 申:"辰",子:"辰",辰:"辰",寅:"戌",午:"戌",戌:"戌",亥:"未",卯:"未",未:"未",巳:"丑",酉:"丑",丑:"丑" },
    jiangxing: { 申:"子",子:"子",辰:"子",寅:"午",午:"午",戌:"午",亥:"卯",卯:"卯",未:"卯",巳:"酉",酉:"酉",丑:"酉" },
    xianchi: { 申:"酉",子:"酉",辰:"酉",寅:"卯",午:"卯",戌:"卯",亥:"子",卯:"子",未:"子",巳:"午",酉:"午",丑:"午" },
    jiesha: { 申:"巳",子:"巳",辰:"巳",寅:"亥",午:"亥",戌:"亥",亥:"申",卯:"申",未:"申",巳:"寅",酉:"寅",丑:"寅" },
    yangren: { 甲:"卯",乙:"",丙:"午",丁:"",戊:"午",己:"",庚:"酉",辛:"",壬:"子",癸:"" },
    yuede: { 寅:"丙",午:"丙",戌:"丙",亥:"甲",卯:"甲",未:"甲",申:"壬",子:"壬",辰:"壬",巳:"庚",酉:"庚",丑:"庚" }
  };
  const tiande = {
    寅:["stem","丁"], 卯:["branch","申"], 辰:["stem","壬"], 巳:["stem","辛"], 午:["branch","亥"], 未:["stem","甲"],
    申:["stem","癸"], 酉:["branch","寅"], 戌:["stem","丙"], 亥:["stem","乙"], 子:["branch","巳"], 丑:["stem","庚"]
  };
  const stageStarts = { 甲:"亥",乙:"午",丙:"寅",丁:"酉",戊:"寅",己:"酉",庚:"巳",辛:"子",壬:"申",癸:"卯" };
  const stageNames = ["长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养"];
  const naYinPairs = ["海中金","炉中火","大林木","路旁土","剑锋金","山头火","涧下水","城头土","白蜡金","杨柳木","泉中水","屋上土","霹雳火","松柏木","长流水","沙中金","山下火","平地木","壁上土","金箔金","覆灯火","天河水","大驿土","钗钏金","桑柘木","大溪水","沙中土","天上火","石榴木","大海水"];
  const relations = {
    "天干五合": [["甲","己"],["乙","庚"],["丙","辛"],["丁","壬"],["戊","癸"]],
    "地支六合": [["子","丑"],["寅","亥"],["卯","戌"],["辰","酉"],["巳","申"],["午","未"]],
    "地支冲": [["子","午"],["丑","未"],["寅","申"],["卯","酉"],["辰","戌"],["巳","亥"]],
    "地支害": [["子","未"],["丑","午"],["寅","巳"],["卯","辰"],["申","亥"],["酉","戌"]],
    "地支破": [["子","酉"],["丑","辰"],["寅","亥"],["卯","午"],["巳","申"],["未","戌"]]
  };
  const eventFlags = {
    tianyi: "tianyiResolved", yima: "fastTravelUnlocked", huagai: "inscriptionCompared",
    xianchi: "publicStoryHeard", jiesha: "cargoDisputeResolved", xunkong: "missingNameReturned"
  };
  const guideSteps = [
    { id: "lamp_observe", section: "学徒教学", title: "先看灯为什么会熄", target: "camp", focus: "护路灯", point: [112, 178], action: "inspect_lamp", text: "查看灯焰和门边布条。它们如果朝同一边倒，就能看出风从哪里来。", hints: ["先别管命盘和术语，只比较两样东西的方向。", "灯焰和布条都被院门吹向桥边。", "点击下方的“查看灯焰与布条”。"], done: s => !!s.flags.trainingWindSeen },
    { id: "screen", section: "学徒教学", title: "把风引开，同时保留灯光", target: "camp", focus: "可移动屏风", point: [72, 185], action: "screen_good", direct: false, text: "试摆屏风。蓝线是风，黄线是灯必须照到的桥面；有效摆法要同时满足“风不吹灯、光不断”。", hints: ["只挡风还不够，灯前也要留出空间。", "横着封死会一起挡住光；斜放能把风引到灯旁。", "选择“斜放在迎风侧”；也可以先试另一种，看清失败原因。"], done: s => s.environment.trainingScreen === "angled" },
    { id: "lamp", section: "学徒教学", title: "点灯验证刚才的摆法", target: "camp", focus: "护路灯", point: [112, 178], action: "light_lamp", text: "屏风已经把风引到灯旁，黄线仍然通向桥面。现在点灯，用结果验证判断。", hints: ["好的摆法应该让灯焰直立。", "若灯仍被吹灭，就回到屏风重试。", "点击“点灯验证”。"], done: s => !!s.environment.trainingLampLit },
    { id: "jing", section: "学徒教学", title: "让稳定的灯照出桥痕", target: "camp", focus: "灯下光路", point: [105, 158], action: "jing_reveal", text: "灯稳以后，本关才介绍第一个阵局词：景门。这里把它改编为“让光影痕迹变清楚”，不会自动给出答案。", hints: ["景门只显露原本存在的桥痕。", "灯稳定是前置条件。", "点击“照向雾中桥面”。"], done: s => !!s.environment.trainingBridgeRevealed },
    { id: "kai", section: "学徒教学", title: "启动已经看清的旧桥", target: "camp", focus: "旧桥台", point: [103, 148], action: "kai_open", text: "桥痕已经清晰。本关再介绍开门：它只启动条件已经满足的通路，不能凭空造桥。", hints: ["条件只有三项：灯稳定、桥痕清晰、开门当值。", "现在三项都已满足。", "点击“启动旧桥台”。"], done: s => !!s.environment.trainingBridgeOpen },
    { id: "village", section: "学徒教学", title: "亲自走过恢复的旧桥", target: "village", action: "observe", text: "用方向键、WASD 或屏幕方向键沿亮起的石阶去雾村，到达后点击“观察”。", hints: ["金色目标在桥的另一端。", "刚才的屏风、灯和桥会保留，不会在成功后消失。", "向前走到雾村，再点击“观察”。"], done: s => !!s.flags.reachedVillage },
    { id: "canal", section: "送信任务", title: "调查旧渠", target: "canal", action: "observe", text: "教学完成。现在前往旧渠，先观察水为什么没有流向雾门。", hints: ["仍然沿用刚才的顺序：先看异常，再改一处。", "水尺和堵根都在旧渠。", "前往旧渠并点击“观察”。"], done: s => !!s.flags.canalItemsTaken },
    { id: "repair", section: "送信任务", title: "先修好水门", target: "canal", action: "repair", text: "观察得到旧轴芯。先点击“手工装回轴芯”，让水门恢复工作。", hints: ["断轴是第一个可见条件。", "背包里的旧轴芯正好用于水门。", "点击“手工装回轴芯”。"], done: s => !!s.environment.gateRepaired },
    { id: "roots", section: "送信任务", title: "再让水路畅通", target: "canal", action: "roots", text: "水门已修，但堵根仍截断水路。点击“手工牵根”，让水改道而不毁掉活根。", hints: ["水门能动不等于水已经能走。", "真正截断流向的是堵渠根。", "点击“手工牵根”。"], done: s => s.environment.rootMode !== "blocked" },
    { id: "wait", section: "送信任务", title: "等晨雾降下来", target: "herb", action: "rest", text: "水已经流向雾门。前往安全的药圃调息；若雾势仍高于 45，再调息一次。", hints: ["右侧会直接显示当前雾势。", "安全地点调息会推进时辰，让晨雾变化。", "在药圃点击“调息”。"], done: s => routeOpen(s) },
    { id: "ferry", section: "送信任务", title: "穿过雾门", target: "ferry", action: null, text: "通路条件已经满足。沿金色目标前往旧渡口。", hints: ["现在不需要再操作命盘。", "雾门右侧的道路已经开放。", "继续向右前往旧渡口。"], done: s => !!s.flags.reachedDock },
    { id: "deliver", section: "送信任务", title: "交付渡口信", target: "ferry", action: "deliver", text: "在旧渡口点击“交付渡口信”，完成第一关。", hints: ["摆渡人在码头边。", "渡口信一直保留在背包中。", "点击“交付渡口信”。"], done: s => !!s.flags.letterDelivered }
  ];
  const storyScenes = {
    opening: [
      { speaker: "旁白", portrait: "narrator", text: "你是驿路署新入门的巡路学徒，奉命把一封信送往旧渡口。" },
      { speaker: "旁白", portrait: "narrator", text: "村口护路灯熄了，通往雾村的旧桥也被雾遮住。守灯人正在小院里等你。" },
      { speaker: "守灯人", portrait: "ferryman", text: "别急着记术语。先看灯焰，再看门边布条：它们会告诉你风从哪里来。" }
    ],
    village: [
      { speaker: "阿澜", portrait: "a_lan", text: "渡口没消失，是旧渠断了，雾才压住了路。" },
      { speaker: "阿澜", portrait: "a_lan", text: "水门的轴芯落在旧渠外侧。找到它、装回去，再把堵根牵开。" },
      { speaker: "行旅人", portrait: "traveler", text: "先让水重新走，路自然会出现。明白了。" }
    ],
    canal: [
      { speaker: "旁白", portrait: "narrator", text: "水尺停在最低刻度。断轴旁的工具袋还很新，像有人刚刚放下。" },
      { speaker: "行旅人", portrait: "traveler", text: "轴芯找到了。先装回水门，再慢慢牵开堵住水路的根。" }
    ],
    herb: [
      { speaker: "旁白", portrait: "narrator", text: "药圃背风，苦香暂时压住了湿冷。这里适合等晨雾散开。" },
      { speaker: "行旅人", portrait: "traveler", text: "等雾势降到四十五，我就继续去渡口。" }
    ],
    ferry: [
      { speaker: "摆渡人", portrait: "ferryman", text: "你走的不是最短的路，却是一条不会吞人的路。" },
      { speaker: "行旅人", portrait: "traveler", text: "我来送信。" },
      { speaker: "摆渡人", portrait: "ferryman", text: "走到码头边来。雾听见水声，就不会再拦你。" }
    ],
    ending: [
      { speaker: "摆渡人", portrait: "ferryman", text: "信我收到了。水声回来了，雾隐渡也该重新开门。" },
      { speaker: "旁白", portrait: "narrator", text: "旧渠重新响起，远处村里的风铃第一次与渡口同声。" },
      { speaker: "行旅人", portrait: "traveler", text: "这趟路结束了。但碑廊里，似乎还有一个名字没有回来。" }
    ],
    lesson: [
      { speaker: "行旅人", portrait: "traveler", text: "我明白了：先认形势，再找局眼与病处；只改关键一处，最后验证风、光和通路是否真的改变。" },
      { speaker: "旁白", portrait: "narrator", text: "形势布置创造条件，教学阵局提示此刻的机会；景门显露痕迹，开门启动已经满足条件的通路。" }
    ]
  };

  let draft;
  let state;
  let dirty = true;
  let lastUi = 0;
  let lastFrame = 0;
  let lastNearest = "";
  let lastTraceState = false;
  let toastTimer;
  let worldArt;
  let dialogueQueue = [];
  let dialogueIndex = 0;

  const byId = id => spots.find(s => s.id === id);
  const skill = id => skillList.find(s => s.id === id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const branch = pillar => pillar.slice(1);
  const nearestSpot = () => spots.filter(s => dist(state.player, s) < s.r + 25).sort((a, b) => dist(state.player, a) - dist(state.player, b))[0];
  const currentSpotSafe = () => !!(nearestSpot() && nearestSpot().safe);
  state = makeState(heroFromTemplate(templates[0], 0));
  if (typeof Image !== "undefined") {
    worldArt = new Image();
    worldArt.onload = markDirty;
    worldArt.src = "./assets/mist-ferry-world.png";
  }

  function deriveChart(s) {
    validateSelection(s);
    const y = s.yearCycle, m = s.monthBranch, d = s.dayCycle, h = s.hourBranch;
    return [
      cycle[y],
      stems[(2 * (y % 5) + 2 + ((m + 10) % 12)) % 10] + branches[m],
      cycle[d],
      stems[(2 * (d % 5) + h) % 10] + branches[h]
    ];
  }

  function validateSelection(s) {
    const bounds = { yearCycle: 60, monthBranch: 12, dayCycle: 60, hourBranch: 12 };
    selectionKeys.forEach(k => {
      if (typeof s[k] === "boolean" || !Number.isInteger(s[k]) || s[k] < 0 || s[k] >= bounds[k]) throw new Error("OUT_OF_BOUNDS");
    });
  }

  function encodeSelection(s) {
    validateSelection(s);
    return "GQ1-" + selectionKeys.map(k => String(s[k]).padStart(2, "0")).join("-");
  }

  function decodeSelection(code) {
    const match = /^GQ1-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/.exec(String(code).trim());
    if (!match) throw new Error("INVALID_CODE");
    const out = Object.fromEntries(selectionKeys.map((k, i) => [k, Number(match[i + 1])]));
    validateSelection(out);
    return out;
  }

  function selectionFromChart(chart) {
    const out = {
      yearCycle: cycle.indexOf(chart[0]), monthBranch: branches.indexOf(chart[1].slice(1)),
      dayCycle: cycle.indexOf(chart[2]), hourBranch: branches.indexOf(chart[3].slice(1))
    };
    validateSelection(out);
    if (deriveChart(out).join(" ") !== chart.join(" ")) throw new Error("INVALID_CHART");
    return out;
  }

  function rng(seedHex) {
    let n = Number.parseInt(seedHex, 16) >>> 0;
    return () => {
      n = (n + 0x6D2B79F5) >>> 0;
      let t = n;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (t ^ (t >>> 14)) >>> 0;
    };
  }

  function sample(next, pool) {
    const limit = 2 ** 32 - (2 ** 32 % pool.length);
    let u;
    do { u = next(); } while (u >= limit);
    return pool[u % pool.length];
  }

  function generate(seedHex, locks = {}) {
    if (!/^[0-9a-f]{8}$/.test(seedHex)) throw new Error("INVALID_SEED");
    const allowed = new Set([...selectionKeys, "dayStem"]);
    Object.keys(locks).forEach(k => { if (!allowed.has(k)) throw new Error("UNKNOWN_LOCK"); });
    if (locks.dayStem !== undefined && !stems.includes(locks.dayStem)) throw new Error("INVALID_DAY_STEM");
    const domains = { yearCycle: 60, monthBranch: 12, dayCycle: 60, hourBranch: 12 };
    const next = rng(seedHex), out = {};
    for (const key of selectionKeys) {
      if (key in locks && (typeof locks[key] === "boolean" || !Number.isInteger(locks[key]) || locks[key] < 0 || locks[key] >= domains[key])) throw new Error("INVALID_LOCK");
      let pool = key in locks ? [locks[key]] : Array.from({ length: domains[key] }, (_, i) => i);
      if (key === "dayCycle" && locks.dayStem) pool = pool.filter(i => stems[i % 10] === locks.dayStem);
      if (!pool.length) throw new Error("CONFLICTING_LOCKS");
      out[key] = sample(next, pool);
    }
    return out;
  }

  function newSeedHex() {
    const a = new Uint32Array(1);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(a);
    else a[0] = Math.floor(Math.random() * 2 ** 32);
    return a[0].toString(16).padStart(8, "0");
  }

  function heroFromSelection(name, selection, source) {
    const chart = deriveChart(selection);
    return [name, chart, { selection: clone(selection), chartCode: encodeSelection(selection), source: clone(source) }];
  }

  function heroFromTemplate(template, index) {
    const selection = selectionFromChart(template[1]);
    return [template[0], clone(template[1]), { selection, chartCode: encodeSelection(selection), source: { type: "template", templateId: index } }];
  }

  function randomHero(name = "行旅人", locks = {}) {
    const seedHex = newSeedHex();
    return heroFromSelection(name, generate(seedHex, locks), { type: "random", seedHex, algorithm: "gq-structural-mulberry32-v1", locks: clone(locks) });
  }

  function importHero(code, name = "来客") {
    const selection = decodeSelection(code);
    return heroFromSelection(name, selection, { type: "code", code: encodeSelection(selection) });
  }

  function chartBudget(chart) {
    const budget = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    chart.forEach(p => budget[elementOf[p[0]]] += 1);
    chart.map(branch).forEach(b => hidden[b].forEach(([s, n]) => budget[elementOf[s]] += n));
    return budget;
  }

  function chartNodes(chart) {
    const nodes = [];
    chart.forEach((p, i) => {
      nodes.push({ id: pillarKeys[i] + ".stem", pillar: pillars[i], kind: "stem", value: p[0], visible: true });
      nodes.push({ id: pillarKeys[i] + ".branch", pillar: pillars[i], kind: "branch", value: p[1], visible: true });
      hidden[p[1]].forEach(([stem, weight], j) => nodes.push({
        id: pillarKeys[i] + ".hidden." + j, pillar: pillars[i], kind: "stem", value: stem, visible: false, weight
      }));
    });
    return nodes;
  }

  function tenGod(observer, target) {
    const oi = stems.indexOf(observer), ti = stems.indexOf(target);
    const oe = Math.floor(oi / 2), te = Math.floor(ti / 2), samePolarity = oi % 2 === ti % 2;
    if (oe === te) return samePolarity ? "比肩" : "劫财";
    if ((oe + 1) % 5 === te) return samePolarity ? "食神" : "伤官";
    if ((oe + 2) % 5 === te) return samePolarity ? "偏财" : "正财";
    if ((te + 2) % 5 === oe) return samePolarity ? "七杀" : "正官";
    return samePolarity ? "偏印" : "正印";
  }

  function tenGodDistribution(observer, chart, excludeDayStem) {
    const out = {};
    chartNodes(chart).filter(n => n.kind === "stem" && !(excludeDayStem && n.id === "day.stem")).forEach(n => {
      const key = tenGod(observer, n.value);
      out[key] = (out[key] || 0) + (n.visible ? 1 : n.weight);
    });
    return out;
  }

  function stageFor(stem, branchValue) {
    const start = branches.indexOf(stageStarts[stem]);
    const direction = stems.indexOf(stem) % 2 ? -1 : 1;
    const delta = (branches.indexOf(branchValue) - start + 12) % 12;
    return stageNames[(direction === 1 ? delta : (12 - delta) % 12)];
  }

  function relationRows(chart) {
    const stemNodes = chart.map((p, i) => ({ value: p[0], pillar: pillars[i] }));
    const branchNodes = chart.map((p, i) => ({ value: p[1], pillar: pillars[i] }));
    const rows = [];
    Object.entries(relations).forEach(([name, pairs]) => {
      const nodes = name.startsWith("天干") ? stemNodes : branchNodes;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        if (pairs.some(pair => pair.includes(nodes[i].value) && pair.includes(nodes[j].value))) rows.push(`${name}：${nodes[i].pillar}${nodes[i].value}—${nodes[j].pillar}${nodes[j].value}`);
      }
    });
    const roots = stemNodes.flatMap(n => branchNodes.filter((b, i) => hidden[b.value].some(([s]) => s === n.value)).map(b => `通根：${n.pillar}${n.value}→${b.pillar}${b.value}`));
    return [...roots, ...rows];
  }

  function visibleNodes(chart) {
    return chart.flatMap((p, i) => [
      { id: pillarKeys[i] + ".stem", pillar: pillars[i], kind: "stem", value: p[0] },
      { id: pillarKeys[i] + ".branch", pillar: pillars[i], kind: "branch", value: p[1] }
    ]);
  }

  function shenshaOccurrences(chart) {
    const nodes = visibleNodes(chart), found = Object.fromEntries(shenshaCatalog.map(([id]) => [id, []]));
    const add = (id, carrier, proof) => {
      let item = found[id].find(x => x.carrierId === carrier.id);
      if (!item) found[id].push(item = { carrierId: carrier.id, carrier: carrier.pillar + carrier.value, proofs: [] });
      if (!item.proofs.includes(proof)) item.proofs.push(proof);
    };
    const anchors = {
      stemYearDay: nodes.filter(n => n.id === "year.stem" || n.id === "day.stem"),
      branchYearDay: nodes.filter(n => n.id === "year.branch" || n.id === "day.branch")
    };
    anchors.stemYearDay.forEach(a => nodes.filter(n => n.kind === "branch" && shenshaTables.tianyi[a.value].includes(n.value)).forEach(n => add("tianyi", n, a.pillar + "干" + a.value)));
    const monthBranch = chart[1][1];
    const td = tiande[monthBranch];
    nodes.filter(n => n.kind === td[0] && n.value === td[1]).forEach(n => add("tiande", n, "月支" + monthBranch));
    nodes.filter(n => n.kind === "stem" && shenshaTables.yuede[monthBranch].includes(n.value)).forEach(n => add("yuede", n, "月支" + monthBranch));
    nodes.filter(n => n.kind === "branch" && shenshaTables.taiji[chart[0][0]].includes(n.value)).forEach(n => add("taiji", n, "年干" + chart[0][0]));
    nodes.filter(n => n.kind === "branch" && shenshaTables.lu[chart[2][0]].includes(n.value)).forEach(n => add("lu", n, "日干" + chart[2][0]));
    ["yima", "huagai", "jiangxing", "xianchi", "jiesha"].forEach(id => anchors.branchYearDay.forEach(a => {
      nodes.filter(n => n.kind === "branch" && n.id !== a.id && shenshaTables[id][a.value].includes(n.value)).forEach(n => add(id, n, a.pillar + "支" + a.value));
    }));
    const blade = shenshaTables.yangren[chart[2][0]];
    nodes.filter(n => n.kind === "branch" && blade.includes(n.value)).forEach(n => add("yangren", n, "日干" + chart[2][0]));
    const dayCycle = cycle.indexOf(chart[2]), decadeStart = (Math.floor(dayCycle / 10) * 10) % 12;
    const empty = [branches[(decadeStart + 10) % 12], branches[(decadeStart + 11) % 12]];
    nodes.filter(n => n.kind === "branch" && empty.includes(n.value)).forEach(n => add("xunkong", n, "日柱" + chart[2] + "旬"));
    return found;
  }

  function projectEnvironment(s = state) {
    const water = s.environment.gateRepaired && ["trimmed", "shaped", "bypassed"].includes(s.environment.rootMode);
    const wind = { closed: 0, notch: .5, open: 1 }[s.environment.ventState] || 0;
    return {
      water, wind,
      ferryOutput: water ? 2 : 0,
      herbOutput: water ? 6 : 0,
      spillOutput: water ? 0 : 8,
      fog: clamp(80 - 45 * (water ? 1 : 0) - 40 * wind + phaseFogBonus[s.phase], 0, 100),
      herb: clamp(90 + 10 * (water ? 1 : 0) - 50 * wind + 25 * (s.environment.herbShield ? 1 : 0), 0, 100)
    };
  }

  function traceActive(s = state) { return (s.statuses.traceWindow || 0) > s.tick; }
  function marketAvailable(s = state) { return !!(s.flags.insideEmptyMarket || (s.flags.chapterComplete && [9,10,11].includes(s.phase) && s.flags.lanternLit)); }
  function routeOpen(input = state) {
    if (input.waterRoute || input.windRoute || input.traceRoute) return true;
    if (!input.environment) return false;
    const env = projectEnvironment(input);
    return !!(input.flags.reachedDock || env.fog <= 45 || traceActive(input));
  }
  function canEnterFerry(input) { return routeOpen(input); }

  function makeState(hero) {
    return {
      schemaVersion: 4, contentVersion: "0.4.0", cultureProfileId: "GQ-CULTURE-0.3", balanceProfileId: "GQ-BALANCE-0.4",
      started: false, hero: clone(hero), worldSeed: newSeedHex(), revision: 0, tick: 0, dayIndex: 0, phase: 0, phaseCount: 0,
      spirit: 100, player: { x: 92, y: 205 }, facing: { x: 0, y: -1 }, keys: {}, selectedElement: "wood", selectedSkill: "wood_shape", lens: false, viewMode: "close",
      learned: Object.fromEntries(skillList.filter(s => s.core).map(s => [s.id, true])),
      flags: { letterReceived: true },
      environment: {
        gateRepaired: false, rootMode: "blocked", ventState: "closed", herbShield: false,
        trainingScreen: "home", trainingLampLit: false, trainingBridgeRevealed: false, trainingBridgeOpen: false, trainingAwning: "home"
      },
      inventory: { letter: 1, reed_rope: 2, solder: 2 }, clues: {}, statuses: {}, visited: { camp: true },
      party: [], supportId: null,
      guide: { enabled: true, hintLevel: 0, hintStep: "" },
      npcs: Object.fromEntries(Object.keys(npcDefs).map(id => [id, { social: "unknown", travel: "independent", focus: 60, contractUntil: null }])),
      encounters: { road_guest: { attempts: 0, receipts: {}, met: false } }, events: {}, receipts: {}, endingSnapshot: null,
      log: ["你在雾边醒来，渡口信压在行囊最上层。"]
    };
  }

  function guideStep(input) {
    const index = guideSteps.findIndex(step => !step.done(input));
    if (index < 0) return { id: "complete", section: "第一关", title: "第一关完成", text: "渡口信已经送达。接下来可以自由探索人物、神煞事件与另外两条路线。", target: null, action: null, index: guideSteps.length, total: guideSteps.length, sectionIndex: 0, sectionTotal: 0, complete: true };
    const step = guideSteps[index], sectionSteps = guideSteps.filter(item => item.section === step.section);
    return { ...step, index, total: guideSteps.length, sectionIndex: sectionSteps.findIndex(item => item.id === step.id), sectionTotal: sectionSteps.length, complete: false };
  }

  function activeGuide(input = state) {
    return input.guide && input.guide.enabled ? guideStep(input) : null;
  }

  function guidePoint(guide) {
    if (!guide || !guide.target) return null;
    const spot = byId(guide.target);
    return guide.point ? { ...spot, name: guide.focus || spot.name, x: guide.point[0], y: guide.point[1] } : spot;
  }

  function pillarVoid(pillar) {
    const index = cycle.indexOf(pillar), start = (Math.floor(index / 10) * 10) % 12;
    return branches[(start + 10) % 12] + branches[(start + 11) % 12];
  }

  function naYinFor(pillar) { return naYinPairs[Math.floor(cycle.indexOf(pillar) / 2)]; }

  function stemClass(stem) { return { 木:"stemWood", 火:"stemFire", 土:"stemEarth", 金:"stemMetal", 水:"stemWater" }[elementOf[stem]]; }

  function baziTable(chart) {
    const dayStem = chart[2][0], occurrences = shenshaOccurrences(chart);
    const stars = pillarKeys.map(key => Object.entries(occurrences).flatMap(([id, items]) => items.some(item => item.carrierId.startsWith(key + ".")) ? [shenshaCatalog.find(row => row[0] === id)[1]] : []));
    const row = (label, cells, className = "") => `<div class="baziCell baziLabel">${label}</div>${cells.map(cell => `<div class="baziCell ${className}">${cell}</div>`).join("")}`;
    return [
      row("四柱", pillars.map(x => x + "柱"), "baziHead"),
      row("十神", chart.map((p, i) => i === 2 ? "日元" : tenGod(dayStem, p[0]))),
      row("干支", chart.map(p => `<span class="${stemClass(p[0])}">${p[0]}</span><span class="${stemClass(hidden[p[1]][0][0])}">${p[1]}</span>`), "baziPillar"),
      row("藏干", chart.map(p => `<div class="baziHidden">${hidden[p[1]].map(([s]) => `<span class="${stemClass(s)}">${s}<small>${tenGod(dayStem, s)}</small></span>`).join("")}</div>`)),
      row("纳音", chart.map(naYinFor)),
      row("地势", chart.map(p => stageFor(dayStem, p[1]))),
      row("空亡", chart.map(pillarVoid)),
      row("神煞", stars.map(items => items.length ? items.join("<br>") : "—"))
    ].join("");
  }

  function chartClassics(chart) {
    const dayStem = chart[2][0], monthBranch = branch(chart[1]), monthHidden = hidden[monthBranch];
    const visible = chart.map((p, i) => i === 2 ? `${pillars[i]}干 ${p[0]}（日主）` : `${pillars[i]}干 ${p[0]}（${tenGod(dayStem, p[0])}）`).join("；");
    const monthReading = monthHidden.map(([stem], i) => `${i ? "兼藏" : "本气"}${stem}（${tenGod(dayStem, stem)}）`).join("、");
    const roots = chart.map((p, i) => `${pillars[i]}支${p[1]}藏${hidden[p[1]].map(([stem]) => stem + "·" + tenGod(dayStem, stem)).join("/")}`).join("；");
    return [
      `<p><strong>一、先立日主</strong><br>本盘以日干 <b>${dayStem}</b>（${elementOf[dayStem]}）为参照，再定其余干支的十神关系：${visible}。</p>`,
      `<p><strong>二、再察月令</strong><br>月支为 <b>${monthBranch}</b>，${monthReading}。古法把月令视为提纲，但本作未按真实公历与节气起月，因此不据此强判格局、旺衰或用神。</p>`,
      `<p><strong>三、后看根透与组合</strong><br>${roots}。藏干比例只用于本作资源预算，不是古籍规定的统一百分比；神煞也不能代替四柱整体关系。</p>`,
      `<p><strong>四、不把单项直接判成吉凶</strong><br>《子平真诠》前七篇反复提醒：得时未必便旺，失时未必便弱；合、冲、刑、会也会因远近、阻隔与组合而改变。本盘只列关系线索，不用一项标签替玩家下结论。</p>`,
      `<p class="sourceNote">读法线索：本地影印本《子平真诠》前七篇逐页校读；<a href="https://zh.wikisource.org/wiki/三命通會_(四庫全書本)/卷07" target="_blank" rel="noopener">《三命通会·卷七》</a>以日为主；<a href="https://zh.wikisource.org/wiki/滴天髓/17" target="_blank" rel="noopener">《滴天髓·月令论》</a>重月令提纲；<a href="https://zh.wikisource.org/zh-hans/淵海子平" target="_blank" rel="noopener">《渊海子平》</a>并看月令与日主。这里只呈现历史术数的结构读法，不作现实命运判断。</p>`
    ].join("");
  }

  function dialogueOpen() { return dialogueQueue.length > 0; }

  function renderDialogue() {
    if (typeof document === "undefined" || !dialogueOpen()) return;
    const line = dialogueQueue[dialogueIndex];
    document.getElementById("dialogueSpeaker").textContent = line.speaker;
    document.getElementById("dialogueText").textContent = line.text;
    document.getElementById("dialoguePortrait").className = `dialoguePortrait ${line.portrait}`;
    document.getElementById("dialogueNext").textContent = dialogueIndex === dialogueQueue.length - 1 ? "继续旅程" : "继续";
    const dialogue = document.getElementById("dialogue");
    dialogue.classList.toggle("narratorLine", line.portrait === "narrator");
    dialogue.classList.remove("hide");
    document.body.classList.add("dialogueOpen");
  }

  function playScene(id) {
    if (!storyScenes[id] || state.flags["story_" + id]) return;
    setFlag("story_" + id);
    state.revision += 1;
    if (typeof document === "undefined") return;
    state.keys = {};
    dialogueQueue = storyScenes[id];
    dialogueIndex = 0;
    renderDialogue();
  }

  function closeDialogue() {
    dialogueQueue = [];
    dialogueIndex = 0;
    state.keys = {};
    if (typeof document !== "undefined") {
      document.getElementById("dialogue").classList.add("hide");
      document.body.classList.remove("dialogueOpen");
    }
  }

  function advanceDialogue() {
    if (!dialogueOpen()) return;
    dialogueIndex += 1;
    if (dialogueIndex >= dialogueQueue.length) closeDialogue();
    else renderDialogue();
  }

  function castCost(hero, element, supportId = state.supportId) {
    const share = chartBudget(hero[1])[elementNames[element]];
    let cost = Math.ceil(20 * (1 - Math.min(.15, share / 8 * .15)));
    if (supportId && state.party.includes(supportId) && state.npcs[supportId].focus >= 12) {
      const tg = tenGod(hero[1][2][0], charts[supportId][2][0]);
      if (tg === "劫财") cost -= 6;
      if (tg === "正财") cost -= 4;
    }
    return Math.max(8, cost);
  }

  function markDirty() { dirty = true; }
  function notify(message) {
    state.log.unshift(message);
    state.log = state.log.slice(0, 18);
    if (typeof document !== "undefined") {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
    }
    markDirty();
  }

  function useSupport() {
    const id = state.supportId;
    if (!id || !state.party.includes(id) || state.npcs[id].focus < 12) return "";
    state.npcs[id].focus -= 12;
    const tg = tenGod(state.hero[1][2][0], charts[id][2][0]);
    return `；${npcDefs[id].name}以${tg}·${coopEntries[tg][0]}协作`;
  }

  function trainingAction(kind) {
    const env = state.environment;
    if (kind === "inspect_lamp") {
      setFlag("trainingWindSeen");
      state.lens = true;
      notify("看清了：灯焰和布条同向偏斜，风正从院门直吹灯台。");
    } else if (kind === "screen_wrong") {
      env.trainingScreen = "cross";
      setFlag("trainingTriedWrong");
      notify("风挡住了，但屏风也截断了灯光。这个摆法可以撤回重试。");
    } else if (kind === "screen_reset") {
      env.trainingScreen = "home";
      notify("屏风已撤回原位；这次重置只影响眼前装置。");
    } else if (kind === "screen_good") {
      env.trainingScreen = "angled";
      notify("风绕开灯台，灯光仍能照向桥面。你刚做到的是本关所说的“藏风而不闭塞”。");
    } else if (kind === "light_lamp") {
      if (env.trainingScreen !== "angled") return notify("灯焰仍会被风吹灭；先调整屏风的位置与朝向。");
      env.trainingLampLit = true;
      notify("灯焰直立并稳定下来。你刚才改变的是风、屏风与光路之间的关系。");
    } else if (kind === "jing_reveal") {
      if (!env.trainingLampLit) return notify("景门不能凭空显路；先让护路灯稳定燃烧。");
      env.trainingBridgeRevealed = true;
      notify("灯光照出了雾中原本存在的桥痕；这是本关对“景门显露”的游戏改编。");
    } else if (kind === "kai_open") {
      if (!env.trainingBridgeRevealed) return notify("开门只启动条件齐备的通路；先用景门看清桥面落点。");
      env.trainingBridgeOpen = true;
      notify("桥台启动，石阶从雾里升起；这是本关对“开门启路”的游戏改编。");
    } else if (kind === "awning_wrong") {
      env.trainingAwning = "flat";
      setFlag("trainingTransferTriedWrong");
      notify("帆布安静了，却压住风铃和回铃出口。原因可见，随时可以换一种摆法。");
    } else if (kind === "awning_reset") {
      env.trainingAwning = "home";
      notify("风帆恢复原位。");
    } else if (kind === "awning_good") {
      env.trainingAwning = "raised";
      setFlag("trainingTransferSolved");
      notify("风从帆布下方通过，风铃重新发声。你把同一判断方法用在了不同物件上。");
      playScene("lesson");
    } else return;
    state.revision += 1;
    markDirty();
  }

  function transact(id, cost, guard, apply, success, repeat = false) {
    const error = guard ? guard() : "";
    if (error) { notify(error); return false; }
    if (!repeat && state.receipts[id]) { notify("这件事已经完成，不会重复扣取资源。"); return false; }
    if (state.spirit < cost) { notify("灵力不足；在营地、村庄、工坊、药圃或渡口调息。"); return false; }
    state.spirit -= cost;
    apply();
    state.revision += 1;
    if (!repeat) state.receipts[id] = { revision: state.revision, tick: Math.floor(state.tick) };
    notify(success + (cost ? `（灵力 -${cost}）` : ""));
    return true;
  }

  function grantClue(id) {
    if (!state.clues[id]) state.clues[id] = { at: Math.floor(state.tick) };
  }
  function grantItem(id, count = 1) { state.inventory[id] = (state.inventory[id] || 0) + count; }
  function setFlag(id) { state.flags[id] = true; }

  function observeSpot(s) {
    if (s.id === "market" && !marketAvailable()) return notify("空亡市入口尚未显现：主线后携灯在子、丑、寅时回访；出口一旦进入便始终开放。");
    state.visited[s.id] = true;
    const messages = {
      camp: "观气只显示对象的联系，不会替你决定唯一答案。活枝可调向，旁路也能走。",
      village: "告示板留下旧河名的下半段；水车停转，风铃却偶尔越墙传来。",
      workshop: "手记按对象性质记录十五种法式，旧轴修理仍需真实材料。",
      canal: "水门外侧能取得旧轴芯和工具袋；修门后还要处理堵渠根。",
      herb: "当前叶片状态会同时读取供水、通风和护屏，不保存三份互相矛盾的结果。",
      wall: "风板可开窄口或全开。全开能散雾，但未加固的药圃会受损。",
      ridge: "上下两处铃声对照后，安全侧路的方向清楚了。",
      bell: "墙内外回铃相差半拍，风确实从旧渡口一侧回来。",
      gorge: "活藤、踏石和塌坡都是可用对象；三条近路同达墙边。",
      stone: "静水映出碑文和实际路标，旧河名上半段也留在石脚。",
      gate: "雾门不认五行密码：雾势足够低，或标出真实隐路，才允许通过。",
      ferry: "摆渡人会收信。货箱支架断裂，修、调停或受控裁切都能处理。",
      shrine: "缺名碑需要从市外带回证据；废驿碑只开放已经走过的回程。",
      market: "入口受夜灯时机限制，出口始终可见。缺名不会删除任何主线物品。"
    };
    if (s.id === "village") { setFlag("reachedVillage"); grantClue("clue_old_river_name_b"); }
    if (s.id === "canal") {
      grantClue("clue_water_trace");
      if (!state.flags.canalItemsTaken) {
        grantItem("axis_core"); grantItem("tool_bag"); setFlag("canalItemsTaken");
        messages.canal += " 你收起旧轴芯和巡渠工具袋。";
      }
    }
    if (s.id === "ridge" || s.id === "bell") grantClue("clue_wind_bell");
    if (s.id === "stone") {
      grantClue("clue_stone_inscription"); grantClue("clue_old_river_name_a"); setFlag("markerPositionObserved");
      if (!state.flags.bellTaken) { grantItem("ancient_bell"); setFlag("bellTaken"); messages.stone += " 石缝里还有一枚古铃。"; }
    }
    if (s.id === "wall") setFlag("planExplained");
    if (s.id === "ferry") setFlag("cargoDisputeKnown");
    if (s.id === "market") { setFlag("insideEmptyMarket"); setFlag("missingNameObserved"); }
    if (state.clues.clue_water_trace && state.clues.clue_wind_bell && state.clues.clue_stone_inscription) setFlag("traceLearned");
    if (state.clues.clue_old_river_name_a && state.clues.clue_old_river_name_b) setFlag("riverNamesLearned");
    state.revision += 1;
    notify(messages[s.id]);
    if (s.id === "village") playScene("village");
    if (s.id === "canal") playScene("canal");
  }

  function learnAt(s) {
    const ids = {
      workshop: ["wood_growth","wood_bind","metal_join","metal_resonate"],
      ridge: ["fire_light","fire_rise"],
      herb: ["earth_channel","earth_store"],
      canal: ["water_moisten","water_reflect"]
    }[s.id] || [];
    return transact("manual:" + s.id, 0, null, () => ids.forEach(id => state.learned[id] = true), `读完手记，学会${ids.map(id => skill(id).name).join("、")}。`);
  }

  function castSpec(s, k) {
    const specs = {
      camp: {
        wood_shape: ["camp:shape", () => setFlag("shortcut"), "活枝被调向，营地近路打开。"],
        earth_base: ["camp:base", () => setFlag("shortcut"), "松动踏石被夯稳，营地近路打开。"]
      },
      workshop: {
        fire_heat: ["workshop:heat", () => setFlag("jointHeated"), "封胶进入安全热窗口。"],
        metal_join: ["workshop:join", () => setFlag("spareJoint"), "备用金属接缝被接合，可用于货箱支架。"],
        metal_resonate: ["workshop:resonate", () => grantClue("clue_echo_name"), "回声沿旧管传来，留下缺名碑的核对音。"]
      },
      canal: {
        fire_heat: ["canal:heat", () => setFlag("axisLoosened"), "封胶软化，轴座可安全拆装。"],
        metal_cut: ["canal:trim", () => state.environment.rootMode = "trimmed", "沿安全切线裁去堵渠根，根路可过。"],
        wood_shape: ["canal:shape", () => state.environment.rootMode = "shaped", "堵渠根被调向，不再截断水路。"],
        earth_channel: ["canal:bypass", () => state.environment.rootMode = "bypassed", "旁渠被重新界定，水可绕过根系。"],
        water_flow: ["canal:flow", () => setFlag("waterSurveyed"), "通流沿既有网络核对了上下游；它没有替你剪根或修门。"],
        water_moisten: ["canal:moisten", () => setFlag("toolsCleaned"), "工具袋被有限水量清理，没有凭空生成水。"]
      },
      herb: {
        earth_base: ["herb:base", () => { state.environment.herbShield = true; setFlag("protectionActionCompleted"); }, "护屏基础被夯稳。"],
        earth_store: ["herb:store", () => { state.environment.herbShield = true; setFlag("protectionActionCompleted"); }, "储土框的交换被限制，护屏稳定下来。"],
        wood_growth: ["herb:growth", () => { setFlag("herbGrowth"); setFlag("careArranged"); }, "在适宜湿度内催荣，药苗填补了护屏缝隙。"],
        water_moisten: ["herb:moisten", () => setFlag("herbWatered"), "一份水被转移到干燥苗床。"]
      },
      wall: {
        fire_rise: ["wall:rise", () => state.environment.ventState = "notch", "短时上升气流显出窄口方向，风板留在半开位。"],
        fire_heat: ["wall:heat", () => state.environment.ventState = "open", "旧闩进入热窗口，风板全开。"],
        metal_cut: ["wall:cut", () => state.environment.ventState = "open", "卡住风板的废销被安全裁开，风板全开。"],
        earth_base: ["wall:base", () => { state.environment.herbShield = true; setFlag("protectionActionCompleted"); }, "墙脚与药圃侧护屏一起被稳住。"]
      },
      ridge: {
        fire_light: ["ridge:light", () => grantClue("clue_wind_bell"), "照幽显出两侧铃绳的摆向。"],
        fire_rise: ["ridge:rise", () => grantClue("clue_wind_bell"), "局部上升气流让回铃方向清楚可辨。"]
      },
      bell: {
        metal_resonate: ["bell:resonate", () => grantClue("clue_wind_bell"), "鸣金把两侧铃的连接回声串起来。"],
        fire_light: ["bell:light", () => grantClue("clue_wind_bell"), "透光刻痕标出了旧风路。"]
      },
      gorge: {
        wood_bind: ["gorge:vine", () => { setFlag("gorgeVineReady"); state.inventory.reed_rope -= 1; }, "活藤与芦绳结成限时承载索桥。", () => state.inventory.reed_rope > 0 ? "" : "缺少一份芦绳。"],
        water_flow: ["gorge:stone", () => setFlag("gorgeStonesExposed"), "浅水被导回旧槽，踏石露出。"],
        earth_base: ["gorge:slope", () => setFlag("gorgeSlopeStable"), "塌坡被夯稳，上层旧路可走。"]
      },
      stone: {
        water_reflect: ["stone:reflect", () => { grantClue("clue_stone_inscription"); grantClue("clue_old_river_name_a"); setFlag("markerPositionObserved"); }, "水面澄定，碑文与路标方向同时显出。"],
        fire_light: ["stone:light", () => { grantClue("clue_stone_inscription"); setFlag("markerPositionObserved"); }, "侧光照出碑文凹槽和路签位置。"],
        water_moisten: ["stone:moisten", () => grantClue("clue_stone_inscription"), "有限水量洗去浮尘，碑文可读。"]
      },
      gate: {
        fire_light: ["gate:light", () => setFlag("lanternLit"), "路灯被点亮，真实路签在雾里保持可见。"],
        water_reflect: ["gate:reflect", () => setFlag("markerPositionObserved"), "静水回照确认了路标的观察位置。"]
      },
      ferry: {
        earth_base: ["cargo:base", () => setFlag("cargoSupportRepaired"), "货箱支脚被夯稳，可以结算纠纷。"],
        metal_join: ["cargo:join", () => { setFlag("cargoSupportRepaired"); state.inventory.solder -= 1; }, "断裂支架被接合，可以结算纠纷。", () => state.inventory.solder > 0 ? "" : "缺少一份补缝料。"],
        metal_cut: ["cargo:cut", () => { setFlag("cargoSafeCutDone"); setFlag("safeCutPathObserved"); }, "受力线确认后完成受控裁切，可以结算纠纷。"]
      },
      shrine: {
        water_reflect: ["shrine:reflect", () => { grantClue("clue_echo_name"); setFlag("inscriptionCompared"); }, "碑影相照，缺名有了可带回的证据。"],
        metal_resonate: ["shrine:resonate", () => { grantClue("clue_echo_name"); setFlag("inscriptionCompared"); }, "碑廊回声补出缺失名字。"],
        fire_light: ["shrine:light", () => { grantClue("clue_echo_name"); setFlag("inscriptionCompared"); }, "普通灯光照出拓痕，缺名可以核对。"],
        earth_base: ["shrine:base", () => setFlag("milestoneRestored"), "废驿碑被扶正，只记录已经走过的道路。"]
      },
      market: {
        fire_light: ["market:light", () => setFlag("publicStoryHeard"), "灯影让口述者认出旧河名，公开故事被记录。"],
        water_reflect: ["market:reflect", () => setFlag("missingNameReturned"), "带回的名字映入水面，缺名支线完成。", () => state.clues.clue_echo_name ? "" : "先从碑廊带回可核对的名字。"]
      },
      village: {
        fire_light: ["village:lantern", () => setFlag("lanternLit"), "行灯被点亮，可在深夜辨认空亡市入口。"],
        water_reflect: ["village:story", () => { grantClue("clue_old_river_name_b"); setFlag("publicStoryHeard"); }, "水盆倒影与公开告示相对，旧河名下半段得到核对。"]
      }
    };
    return specs[s.id] && specs[s.id][k];
  }

  function castAt(s) {
    const spec = castSpec(s, state.selectedSkill);
    if (!state.learned[state.selectedSkill]) return notify("这册手记还没有找到。");
    if (!spec) return notify(`${skill(state.selectedSkill).name}对这里没有合适对象；没有扣灵力。`);
    const cost = castCost(state.hero, skill(state.selectedSkill).element);
    return transact(spec[0], cost, spec[3] || null, () => { spec[1](); const note = useSupport(); if (note) state.flags.lastCoop = note; }, spec[2] + (state.supportId ? useSupportPreview() : ""));
  }

  function useSupportPreview() {
    const id = state.supportId;
    if (!id || !state.party.includes(id) || state.npcs[id].focus < 12) return "";
    const tg = tenGod(state.hero[1][2][0], charts[id][2][0]);
    return ` ${npcDefs[id].name}以${tg}·${coopEntries[tg][0]}协作。`;
  }

  function manualAction(kind, s) {
    if (kind === "repairGate") return transact("manual:repairGate", 0,
      () => state.inventory.axis_core ? "" : "先在水门外侧取得旧轴芯。",
      () => { state.inventory.axis_core -= 1; state.environment.gateRepaired = true; }, "用场景工具装回轴芯，水门修复。");
    if (kind === "roots") return transact("manual:roots", 0,
      () => state.environment.gateRepaired ? "" : "先修好水门，才能核对水流后果。",
      () => state.environment.rootMode = "shaped", "你慢慢牵开堵渠根，保留活组织并让出水路。");
    if (kind === "vent") return transact("manual:vent:" + state.environment.ventState, 0,
      () => state.flags.planExplained ? "" : "先观察两侧风铃和风板受力。",
      () => state.environment.ventState = state.environment.ventState === "closed" ? "notch" : state.environment.ventState === "notch" ? "open" : "closed",
      "你用手柄调整风板；环境变化会立刻反映在雾势与药圃。");
    if (kind === "shield") return transact("manual:shield", 0, null,
      () => { state.environment.herbShield = true; setFlag("protectionActionCompleted"); }, "用场景材料加固护屏，药圃获得保护。");
    if (kind === "trace") return transact("trace:" + state.phaseCount, 0,
      () => state.flags.traceLearned && state.flags.markerPositionObserved ? "" : "还需要渠痕、风铃、碑文三份证据，并确认路标位置。",
      () => { state.statuses.traceWindow = state.tick + 1800; setFlag("tracePrepared"); }, "隐路被标出，三十秒内可穿过雾门。", true);
    if (kind === "deliver") {
      const completed = transact("deliver:letter", 0,
        () => !state.flags.reachedDock ? "还没有抵达渡口。" : !state.inventory.letter ? "渡口信不在行囊里。" : "",
        () => {
          state.inventory.letter = 0; setFlag("letterDelivered"); setFlag("chapterComplete");
          if (!state.endingSnapshot) state.endingSnapshot = {
            route: state.flags.firstEntryMode, fog: projectEnvironment().fog, herb: projectEnvironment().herb,
            party: clone(state.party), tick: Math.floor(state.tick)
          };
        }, "摆渡人收下信。雾隐渡重新与村中相连，首章主线完成。");
      if (completed) playScene("ending");
      return completed;
    }
    if (kind === "returnBell") return transact("event:returnBell", 0,
      () => state.inventory.ancient_bell ? "" : "先在反射碑附近找到古铃。",
      () => { state.inventory.ancient_bell -= 1; setFlag("bellReturned"); }, "古铃归位，归铃引路线进入可处理状态。");
    if (kind === "tianyi") return transact("event:tianyi", 0,
      () => state.flags.bellReturned && (state.flags.riverNamesLearned || shenshaOccurrences(state.hero[1]).tianyi.length) ? "" : "需要归还古铃，并补齐河名或本命承载证据。",
      () => { setFlag("tianyiResolved"); grantClue("clue_hidden_return"); setFlag("mediatorAvailable"); }, "摆渡人说明安全回程，也愿为货箱纠纷作保。");
    if (kind === "cargo") return transact("event:cargo", 0,
      () => state.flags.cargoSupportRepaired || state.flags.cargoSafeCutDone || state.flags.mediatorAvailable ? "" : "先修支架、完成受控裁切，或请到调停者。",
      () => setFlag("cargoDisputeResolved"), "被拦货箱得到处理，没有关键物品被随机夺走。");
    if (kind === "milestone") return transact("event:milestone", 0,
      () => state.flags.reachedDock ? "" : "先实际走到渡口。",
      () => { setFlag("milestoneRestored"); setFlag("routeSurveyed"); }, "你实地核对营地与渡口，废驿碑重新记录已访问路线。");
    if (kind === "yima") return transact("event:yima", 0,
      () => state.flags.milestoneRestored && state.flags.routeSurveyed ? "" : "先扶正驿碑并实地核对已走过的路。",
      () => setFlag("fastTravelUnlocked"), "重立驿碑完成，营地与渡口之间可以安全回返。");
    if (kind === "huagai") return transact("event:huagai", 0,
      () => state.clues.clue_echo_name ? "" : "先用静水、回响或灯光取得缺名证据。",
      () => setFlag("inscriptionCompared"), "碑影对照完成；太极条件只补充视角，不替代证据。");
    if (kind === "xianchi") return transact("event:xianchi", 0, null,
      () => { grantClue("clue_old_river_name_b"); setFlag("publicStoryHeard"); }, "公开告示补齐旧河名；无需强制社交或恋爱。");
    if (kind === "xunkong") return transact("event:xunkong", 0,
      () => state.clues.clue_echo_name ? "" : "先离开市内，在碑廊取得外界证据。",
      () => { setFlag("missingNameReturned"); grantItem("echo_token"); }, "缺名被归还，主线物品与出口都没有消失。");
    if (kind === "lantern") return transact("event:lantern", 0, null,
      () => setFlag("lanternLit"), "你点亮村中借来的普通行灯，深夜入口有了参照。");
    if (kind === "rest") return rest();
    if (kind === "learn") return learnAt(s);
  }

  function npcSpot(id) {
    if (state.party.includes(id)) return null;
    if (id === "road_guest") return state.encounters.road_guest.met ? "ferry" : null;
    const p = state.phase;
    if (id === "a_lan") return p >= 3 && p <= 6 ? "canal" : p >= 7 && p <= 9 ? "workshop" : "village";
    if (id === "shi_heng") return p >= 3 && p <= 8 ? "wall" : p === 9 ? "herb" : "village";
    if (id === "sang_yu") return p >= 3 && p <= 4 ? "ridge" : p >= 5 && p <= 9 ? "herb" : "village";
  }

  function npcsHere(s) { return Object.keys(npcDefs).filter(id => npcSpot(id) === s.id); }

  function talkNpc(id) {
    const npc = state.npcs[id], def = npcDefs[id];
    npc.social = npc.social === "unknown" ? "acquainted" : npc.social;
    npc.travel = "local_assist";
    setFlag("met_" + id);
    if (id === "a_lan") {
      grantClue("clue_water_trace");
      if (state.inventory.tool_bag) { state.inventory.tool_bag -= 1; setFlag("toolsReturned"); npc.social = "trusted"; }
    }
    if (id === "shi_heng") setFlag("planExplained");
    if (id === "sang_yu") { setFlag("careArranged"); if (projectEnvironment().herb >= 60) npc.social = "trusted"; }
    if (id === "road_guest") setFlag("journeyAgreed");
    state.revision += 1;
    notify(`${def.name}（${def.job}）：${def.assist}`);
  }

  function npcAvailable(id) {
    return npcSpot(id) !== null && nearestSpot() && npcSpot(id) === nearestSpot().id;
  }

  function inviteError(id) {
    if (!state.flags["met_" + id]) return "先与对方交谈。";
    if (state.party.length >= 2) return "队伍至多同行两位人物。";
    if (!npcAvailable(id)) return "对方此刻不在附近或正忙于自己的作息。";
    if (id === "a_lan" && !(state.flags.toolsReturned || state.clues.clue_water_trace)) return "阿澜还需要工具或可信渠痕。";
    if (id === "shi_heng" && !(state.flags.planExplained && state.environment.herbShield)) return "石衡要先听到方案并看到药圃得到保护。";
    if (id === "sang_yu" && !state.flags.careArranged) return "桑榆要先安排好当日照料。";
    if (id === "road_guest" && !state.flags.journeyAgreed) return "先谈妥同行范围。";
    return "";
  }

  function toggleParty(id) {
    const npc = state.npcs[id], def = npcDefs[id];
    if (state.party.includes(id)) {
      if (!currentSpotSafe()) return notify("只能在安全地标分别，不能在机关或桥上突然撤手。");
      state.party = state.party.filter(x => x !== id);
      npc.travel = "independent"; npc.contractUntil = null;
      if (state.supportId === id) state.supportId = state.party[0] || null;
      state.revision += 1;
      return notify(`${def.name}依约在安全处暂别，关系与线索保留。`);
    }
    const error = inviteError(id);
    if (error) return notify(error);
    state.party.push(id); npc.travel = "following_temporary"; npc.contractUntil = state.phaseCount + 2;
    if (!state.supportId) state.supportId = id;
    state.revision += 1;
    const tg = tenGod(state.hero[1][2][0], charts[id][2][0]);
    notify(`${def.name}接受两时辰短约；当前可用${tg}·${coopEntries[tg][0]}。`);
  }

  function hash32(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function checkRoadGuestWindow() {
    if (!state.flags.reachedDock || !state.flags.milestoneRestored || state.phase !== 9 || state.encounters.road_guest.met) return;
    const e = state.encounters.road_guest, key = `${state.dayIndex}:${state.phase}:ferry`;
    if (e.receipts[key] !== undefined) return;
    e.attempts += 1;
    const chance = Math.min(.8, .35 + (e.attempts - 1) * .15);
    const success = e.attempts >= 4 || hash32(JSON.stringify([state.worldSeed, "road_guest", key])) / 2 ** 32 < chance;
    e.receipts[key] = success;
    if (success) { e.met = true; notify("夜路上传来脚步声，行脚客在旧渡口出现。"); }
    else notify(`驿路窗口经过一次，没有遇到行脚客；第${e.attempts}次有效尝试已记录。`);
  }

  function rest() {
    if (!currentSpotSafe()) return notify("只能在安全地标调息。");
    const tellHerbStory = activeGuide() && activeGuide().id === "wait" && nearestSpot().id === "herb";
    state.phase = (state.phase + 1) % phases.length;
    if (state.phase === 0) state.dayIndex += 1;
    state.phaseCount += 1;
    state.tick += 3600;
    state.spirit = 100;
    Object.values(state.npcs).forEach(n => n.focus = Math.min(60, n.focus + 18));
    [...state.party].forEach(id => {
      const npc = state.npcs[id];
      if (npc.contractUntil !== null && state.phaseCount >= npc.contractUntil) {
        state.party = state.party.filter(x => x !== id);
        npc.travel = "independent"; npc.contractUntil = null;
        if (state.supportId === id) state.supportId = state.party[0] || null;
        state.log.unshift(`${npcDefs[id].name}的短约结束，在安全处回到自己的行程。`);
      }
    });
    checkRoadGuestWindow();
    state.revision += 1;
    notify(`调息完成，时辰来到${phases[state.phase]}。`);
    if (tellHerbStory) playScene("herb");
  }

  function firstEntry() {
    if (state.flags.reachedDock) return;
    const env = projectEnvironment();
    state.flags.firstEntryMode = env.fog > 45 && traceActive() ? "trace" : env.water && env.wind > 0 ? "mixed" : env.water ? "water" : "wind";
    setFlag("reachedDock");
    grantClue("clue_hidden_return");
    notify(`抵达旧渡口；首次路线记录为${{water:"水路",wind:"风路",trace:"识路",mixed:"水风混合"}[state.flags.firstEntryMode]}。`);
    playScene("ferry");
  }

  function trainingContextActions(s) {
    const env = state.environment;
    if (s.id === "camp" && !env.trainingBridgeOpen) {
      if (!state.flags.trainingWindSeen) return [{ id: "inspect_lamp", label: "查看灯焰与布条", primary: true, run: () => trainingAction("inspect_lamp") }];
      if (env.trainingScreen === "cross") return [
        { id: "screen_reset", label: "撤回屏风", run: () => trainingAction("screen_reset") },
        { id: "screen_good", label: "改为斜放在迎风侧", primary: true, run: () => trainingAction("screen_good") }
      ];
      if (env.trainingScreen !== "angled") return [
        { id: "screen_wrong", label: "摆法一：横着挡在灯前", run: () => trainingAction("screen_wrong") },
        { id: "screen_good", label: "摆法二：斜放在迎风侧", primary: true, run: () => trainingAction("screen_good") }
      ];
      if (!env.trainingLampLit) return [
        { id: "screen_reset", label: "撤回屏风", run: () => trainingAction("screen_reset") },
        { id: "light_lamp", label: "点灯验证", primary: true, run: () => trainingAction("light_lamp") }
      ];
      if (!env.trainingBridgeRevealed) return [{ id: "jing_reveal", label: "照向雾中桥面（景门）", primary: true, run: () => trainingAction("jing_reveal") }];
      return [{ id: "kai_open", label: "启动旧桥台（开门）", primary: true, run: () => trainingAction("kai_open") }];
    }
    if (s.id === "camp" && !state.flags.reachedVillage) return [{ id: "review_training", label: "回看：风路 → 屏风 → 灯 → 桥", run: () => notify("你先改变布局让灯稳定，再借景门显出落点、借开门启动桥台。现在亲自走过旧桥。") }];
    if (s.id === "village" && env.trainingBridgeOpen && !state.flags.reachedVillage) return [{ id: "observe", label: "抵达雾村·观察", primary: true, run: () => observeSpot(s) }];
    return null;
  }

  function contextDescription(s) {
    if (!s) return "移动到金色目标附近查看当前行动。";
    const env = state.environment;
    if (s.id === "camp" && !state.flags.trainingWindSeen) return "灯一亮就灭。先比较灯焰和门边布条朝向，不需要懂任何术语。";
    if (s.id === "camp" && env.trainingScreen === "cross") return "风已经减弱，但屏风挡住黄色光路。失败原因就在画面里，可以立即撤回。";
    if (s.id === "camp" && env.trainingScreen === "angled" && !env.trainingLampLit) return "风已绕开灯台，黄色光路仍通。现在点灯验证。";
    if (s.id === "camp" && env.trainingLampLit && !env.trainingBridgeRevealed) return "灯焰稳定了。现在用灯光照向雾中的桥面。";
    if (s.id === "camp" && env.trainingBridgeRevealed && !env.trainingBridgeOpen) return "桥痕已经清晰；灯稳、桥痕清晰、开门当值三项条件都已满足。";
    if (s.id === "camp" && env.trainingBridgeOpen && !state.flags.reachedVillage) return "旧桥已经从雾里升起。沿亮起的石阶去雾村。";
    if (s.id === "village" && env.trainingAwning === "flat" && !state.flags.trainingTransferSolved) return "帆布不再拍打，却压住了风铃和回铃出口。可以撤回重试。";
    if (s.id === "village" && state.flags.reachedVillage && !state.flags.trainingTransferSolved) return "换了物件也一样：看风从哪里来，再保留风铃需要的回铃出口。";
    return s.text;
  }

  function contextActions(s = nearestSpot()) {
    if (!s) return [];
    const training = trainingContextActions(s);
    if (training) return training;
    const guided = activeGuide();
    if (guided && guided.section === "学徒教学" && s.id !== guided.target) return [];
    const actions = [{ id: "observe", label: "观察", run: () => observeSpot(s) }];
    if (s.id === "market" && !marketAvailable()) return actions;
    if (state.learned[state.selectedSkill] && castSpec(s, state.selectedSkill)) {
      actions.push({ id: "cast", label: `施展·${skill(state.selectedSkill).name} -${castCost(state.hero, skill(state.selectedSkill).element)}`, primary: true, run: () => castAt(s) });
    }
    if (["workshop","ridge","herb","canal"].includes(s.id)) actions.push({ id: "learn", label: "阅读手记", run: () => manualAction("learn", s) });
    if (s.id === "canal") {
      if (!state.environment.gateRepaired) actions.push({ id: "repair", label: "手工装回轴芯", run: () => manualAction("repairGate", s) });
      if (state.environment.rootMode === "blocked") actions.push({ id: "roots", label: "手工牵根", run: () => manualAction("roots", s) });
    }
    if (s.id === "wall") actions.push({ id: "vent", label: `调整风板·${{closed:"全闭",notch:"窄口",open:"全开"}[state.environment.ventState]}`, run: () => manualAction("vent", s) });
    if (s.id === "herb" && !state.environment.herbShield) actions.push({ id: "shield", label: "手工加固护屏", run: () => manualAction("shield", s) });
    if (s.id === "gate") actions.push({ id: "trace", label: "标出隐路", run: () => manualAction("trace", s) });
    if (s.id === "ferry") {
      if (!state.flags.letterDelivered) actions.push({ id: "deliver", label: "交付渡口信", run: () => manualAction("deliver", s) });
      if (!state.flags.bellReturned) actions.push({ id: "bell", label: "归还古铃", run: () => manualAction("returnBell", s) });
      if (state.flags.bellReturned && !state.flags.tianyiResolved) actions.push({ id: "guide", label: "请教归路", run: () => manualAction("tianyi", s) });
      if (state.flags.cargoDisputeKnown && !state.flags.cargoDisputeResolved) actions.push({ id: "cargo", label: "处理货箱纠纷", run: () => manualAction("cargo", s) });
    }
    if (s.id === "shrine") {
      if (!state.flags.milestoneRestored) actions.push({ id: "milestone", label: "扶正废驿碑", run: () => manualAction("milestone", s) });
      if (state.flags.milestoneRestored && !state.flags.fastTravelUnlocked) actions.push({ id: "yima", label: "核对已访路线", run: () => manualAction("yima", s) });
      if (state.clues.clue_echo_name && !state.flags.inscriptionCompared) actions.push({ id: "huagai", label: "对照碑影", run: () => manualAction("huagai", s) });
    }
    if (s.id === "village" && !state.flags.publicStoryHeard) actions.push({ id: "xianchi", label: "查公开告示", run: () => manualAction("xianchi", s) });
    if (s.id === "village" && state.flags.chapterComplete && !state.flags.lanternLit) actions.push({ id: "lantern", label: "点亮普通行灯", run: () => manualAction("lantern", s) });
    if (s.id === "market" && !state.flags.missingNameReturned) actions.push({ id: "xunkong", label: "归还缺名", run: () => manualAction("xunkong", s) });
    if (s.safe && (state.spirit < 100 || (activeGuide() && activeGuide().action === "rest"))) actions.push({ id: "rest", label: "调息", run: () => rest() });
    npcsHere(s).forEach(id => {
      actions.push({ id: "talk:" + id, label: "交谈·" + npcDefs[id].name, run: () => talkNpc(id) });
      actions.push({ id: "party:" + id, label: state.party.includes(id) ? "暂别" : "邀请同行", run: () => toggleParty(id) });
    });
    const step = activeGuide();
    if (step && step.section === "送信任务") return s.id === step.target && step.action ? actions.filter(action => action.id === step.action) : [];
    return actions;
  }

  function primaryAction() {
    if (dialogueOpen()) return advanceDialogue();
    const actions = contextActions();
    const step = activeGuide();
    const action = (step && nearestSpot() && nearestSpot().id === step.target && actions.find(a => a.id === step.action)) || actions.find(a => a.primary) || actions[0];
    if (action) action.run();
    else notify("附近没有可交互目标。");
  }

  function runGuideAction() {
    if (dialogueOpen()) return advanceDialogue();
    const step = activeGuide(), here = nearestSpot();
    if (!step) return;
    const action = here && here.id === step.target && contextActions(here).find(a => a.id === step.action);
    if (action && step.direct !== false) return action.run();
    document.querySelector(".canvasWrap").scrollIntoView({ behavior: "smooth", block: "center" });
    notify(step.target ? `查看场景行动区，处理${guidePoint(step).name}。` : "第一关已完成，可以自由探索。");
  }

  function showGuideHint() {
    const step = activeGuide();
    if (!step || step.complete || !step.hints) return;
    if (state.guide.hintStep !== step.id) { state.guide.hintStep = step.id; state.guide.hintLevel = 0; }
    state.guide.hintLevel = Math.min(step.hints.length, state.guide.hintLevel + 1);
    state.revision += 1;
    markDirty();
  }

  function setGuide(enabled) {
    state.guide = { ...state.guide, enabled };
    state.revision += 1;
    notify(enabled ? "第一关指引已开启；画面会标出当前目标。" : "指引已关闭；可随时用“开启指引”恢复。");
  }

  function setViewMode(mode) {
    if (!["close", "map"].includes(mode) || state.viewMode === mode) return;
    state.viewMode = mode;
    state.revision += 1;
    notify(mode === "close" ? "返回现场视角；左上角仍保留总览地图。" : "切换为全图视角。");
  }

  function toggleLens() {
    state.lens = !state.lens;
    notify(state.lens ? "观局开启：现场标出形势骨架、风路与必须保留的作用通道。" : "观局收起：保留普通探索画面。");
  }

  function chooseElement(id) {
    state.selectedElement = id;
    state.selectedSkill = (skillList.find(s => s.element === id && state.learned[s.id]) || skillList.find(s => s.element === id)).id;
    notify(`切换为${elementNames[id]}·${skill(state.selectedSkill).name}。`);
  }

  function chooseSkill(delta) {
    const list = skillList.filter(s => s.element === state.selectedElement);
    let index = list.findIndex(s => s.id === state.selectedSkill);
    index = (Math.max(0, index) + delta + list.length) % list.length;
    state.selectedSkill = list[index].id;
    notify(`切换为${elementNames[state.selectedElement]}·${list[index].name}。`);
  }

  function constrainPlayer() {
    state.player.x = clamp(state.player.x, 20, 940);
    state.player.y = clamp(state.player.y, 32, 510);
    if (!state.environment.trainingBridgeOpen && state.player.y < 155) state.player.y = 155;
    if (!routeOpen() && state.player.x > 760) state.player.x = 760;
    if (routeOpen() && state.player.x > 775) firstEntry();
  }

  function moveStep(key, amount = 24) {
    const delta = { ArrowUp: [0,-amount], ArrowDown: [0,amount], ArrowLeft: [-amount,0], ArrowRight: [amount,0] }[key];
    if (!delta || !state.started || dialogueOpen()) return;
    state.facing = { x: delta[0] / amount, y: delta[1] / amount };
    state.player.x += delta[0];
    state.player.y += delta[1];
    constrainPlayer();
    markDirty();
  }

  function shenshaRows(input = state) {
    if (!input.hero) return shenshaCatalog.map(([id, name, event], i) => ({ id, name, event, state: input.done ? "完成" : input.shenshaKnown || i < 4 ? "可辨识" : "未识别" }));
    const occurrences = shenshaOccurrences(input.hero[1]);
    return shenshaCatalog.map(([id, name, event]) => {
      const complete = !!input.flags[eventFlags[id]];
      const evidence = occurrences[id];
      const notApplicable = id === "yangren" && stems.indexOf(input.hero[1][2][0]) % 2 === 1;
      return {
        id, name, event, evidence,
        historical: notApplicable ? "本查法不适用" : evidence.length ? `本命成立·${evidence.length}承载位` : "本命未见",
        state: complete ? "事件完成" : input.flags.shenshaKnown ? "已辨认·待条件" : "有线索"
      };
    });
  }

  function saveShape() {
    const payload = clone(state);
    delete payload.keys;
    payload.keys = {};
    return payload;
  }

  function checksum(payload) {
    const text = JSON.stringify(payload);
    return hash32(text).toString(16).padStart(8, "0");
  }

  function validateSave(payload) {
    if (!payload || payload.schemaVersion !== 4 || payload.contentVersion !== "0.4.0") throw new Error("不支持的存档版本");
    if (!Array.isArray(payload.hero) || !Array.isArray(payload.hero[1]) || payload.hero[1].length !== 4) throw new Error("角色命盘缺失");
    const selection = selectionFromChart(payload.hero[1]);
    if (payload.hero[2] && payload.hero[2].chartCode && payload.hero[2].chartCode !== encodeSelection(selection)) throw new Error("命盘与分享码冲突");
    if (!payload.player || !Number.isFinite(payload.player.x) || !Number.isFinite(payload.player.y)) throw new Error("角色位置损坏");
    if (!payload.inventory || Object.values(payload.inventory).some(n => !Number.isInteger(n) || n < 0)) throw new Error("背包数值损坏");
    if (!payload.environment || !["blocked","trimmed","shaped","bypassed"].includes(payload.environment.rootMode)) throw new Error("环境状态损坏");
    const oldTutorialComplete = !!payload.flags.reachedVillage;
    if (payload.environment.trainingScreen === undefined) payload.environment.trainingScreen = oldTutorialComplete ? "angled" : "home";
    if (!["home","cross","angled"].includes(payload.environment.trainingScreen)) throw new Error("教学屏风状态损坏");
    if (payload.environment.trainingLampLit === undefined) payload.environment.trainingLampLit = oldTutorialComplete;
    if (payload.environment.trainingBridgeRevealed === undefined) payload.environment.trainingBridgeRevealed = oldTutorialComplete;
    if (payload.environment.trainingBridgeOpen === undefined) payload.environment.trainingBridgeOpen = oldTutorialComplete;
    if (payload.environment.trainingAwning === undefined) payload.environment.trainingAwning = oldTutorialComplete ? "raised" : "home";
    if (!["home","flat","raised"].includes(payload.environment.trainingAwning)) throw new Error("教学风帆状态损坏");
    if (oldTutorialComplete && payload.flags.trainingTransferSolved === undefined) payload.flags.trainingTransferSolved = true;
    if (payload.guide === undefined) payload.guide = { enabled: !payload.flags.chapterComplete };
    if (!payload.guide || typeof payload.guide.enabled !== "boolean") throw new Error("指引状态损坏");
    if (!Number.isInteger(payload.guide.hintLevel)) payload.guide.hintLevel = 0;
    payload.guide.hintLevel = clamp(payload.guide.hintLevel, 0, 3);
    if (typeof payload.guide.hintStep !== "string") payload.guide.hintStep = "";
    if (payload.viewMode === undefined) payload.viewMode = "close";
    if (!["close","map"].includes(payload.viewMode)) throw new Error("镜头状态损坏");
    if (!payload.facing || !Number.isFinite(payload.facing.x) || !Number.isFinite(payload.facing.y) || !Math.hypot(payload.facing.x, payload.facing.y)) payload.facing = { x: 0, y: -1 };
    else {
      const length = Math.hypot(payload.facing.x, payload.facing.y);
      payload.facing = { x: payload.facing.x / length, y: payload.facing.y / length };
    }
    return payload;
  }

  function envelope(payload, generation) { return { generation, payload, checksum: checksum(payload) }; }
  function readEnvelope(text) {
    const parsed = JSON.parse(text);
    if (parsed.payload) {
      if (parsed.checksum !== checksum(parsed.payload)) throw new Error("存档校验失败");
      return validateSave(parsed.payload);
    }
    return parsed.schemaVersion === 4 ? validateSave(parsed) : migrateLegacy(parsed);
  }

  function migrateLegacy(old) {
    if (!old || !Array.isArray(old.hero) || !Array.isArray(old.hero[1])) throw new Error("旧存档缺少可确认的完整四柱");
    const chart = clone(old.hero[1]), selection = selectionFromChart(chart);
    const hero = [String(old.hero[0] || "迁移行者").slice(0, 20), chart, {
      selection, chartCode: encodeSelection(selection), source: { type: "migrated_unknown", fromSchema: old.schemaVersion || 3 }
    }];
    const next = makeState(hero);
    if (Number.isFinite(old.spirit)) next.spirit = clamp(Math.floor(old.spirit), 0, 100);
    if (Number.isInteger(old.phase)) next.phase = clamp(old.phase, 0, 11);
    if (old.player && Number.isFinite(old.player.x) && Number.isFinite(old.player.y)) next.player = { x: clamp(old.player.x, 20, 940), y: clamp(old.player.y, 32, 510) };
    if (old.selectedElement && elementNames[old.selectedElement]) next.selectedElement = old.selectedElement;
    if (old.selectedSkill && skill(old.selectedSkill)) next.selectedSkill = old.selectedSkill;
    if (old.learned) next.learned = { ...next.learned, ...old.learned };
    if (old.flags) {
      next.flags = { ...next.flags, ...old.flags };
      if (old.flags.waterRoute) { next.environment.gateRepaired = true; next.environment.rootMode = "shaped"; }
      if (old.flags.windRoute) next.environment.ventState = "open";
      if (old.flags.herb) next.environment.herbShield = true;
      if (old.flags.done || old.flags.chapterComplete) { next.flags.chapterComplete = true; next.flags.letterDelivered = true; next.inventory.letter = 0; }
    }
    Object.entries(old.npcs || {}).forEach(([id, npc]) => {
      if (!next.npcs[id]) return;
      next.npcs[id].social = npc.met ? "acquainted" : "unknown";
      next.npcs[id].focus = Number.isFinite(npc.focus) ? clamp(npc.focus, 0, 60) : 60;
    });
    next.log = ["旧版存档已迁移；缺失的创建来源明确记为 migrated_unknown。", ...(old.log || [])].slice(0, 18);
    next.started = true;
    return validateSave(next);
  }

  function saveLocal() {
    try {
      const currentKey = "guanqi-save-v4-current", previousKey = "guanqi-save-v4-previous";
      const current = localStorage.getItem(currentKey);
      if (current) localStorage.setItem(previousKey, current);
      let generation = 1;
      try { generation = current ? JSON.parse(current).generation + 1 : 1; } catch {}
      localStorage.setItem(currentKey, JSON.stringify(envelope(saveShape(), generation)));
      document.getElementById("saveState").textContent = `已保存·第${generation}代`;
      notify("当前进度已保存；上一代有效存档仍可恢复。");
    } catch (error) { notify("尚未保存：" + error.message); }
  }

  function loadShape(payload) {
    closeDialogue();
    state = validateSave(clone(payload));
    state.keys = {};
    state.started = true;
    if (typeof document !== "undefined") document.getElementById("start").classList.add("hide");
    markDirty();
  }

  function loadLocal(silent = false) {
    const keys = ["guanqi-save-v4-current", "guanqi-save-v4-previous"];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        loadShape(readEnvelope(raw));
        if (!silent) notify(key.endsWith("previous") ? "当前档损坏，已恢复上一代有效存档。" : "已读取最近有效存档。");
        return true;
      } catch {}
    }
    const legacy = localStorage.getItem("guanqi-save-v4");
    if (legacy) {
      try {
        loadShape(migrateLegacy(JSON.parse(legacy)));
        if (!silent) notify("旧版浏览器存档已迁移；原文件保留未覆盖。");
        return true;
      } catch {}
    }
    if (!silent) notify("没有找到可读取的有效存档。");
    return false;
  }

  function exportSave() {
    const data = JSON.stringify(envelope(saveShape(), Date.now()), null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = "guanqi-mist-ferry-save.json"; a.click();
    URL.revokeObjectURL(url);
    notify("存档文件已导出。");
  }

  function importSaveFile(file) {
    if (!file || file.size > 1024 * 1024) return notify("导入失败：存档不能超过 1 MiB。");
    const reader = new FileReader();
    reader.onload = () => {
      try { loadShape(readEnvelope(reader.result)); saveLocal(); notify("存档校验通过并已导入。"); }
      catch (error) { notify("导入失败：" + error.message); }
    };
    reader.readAsText(file);
  }

  function drawActor(g, x, y, palette, scale = 1, facing = 1, back = false) {
    const bob = Math.sin(state.tick / 7 + x) * 1.3;
    g.save();
    g.translate(x, y + bob); g.scale(scale * facing, scale);
    g.fillStyle = "rgba(18,28,25,.28)"; g.beginPath(); g.ellipse(0, 13, 12, 5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#263a34"; g.lineWidth = 3; g.beginPath(); g.moveTo(-5, 8); g.lineTo(-6, 16); g.moveTo(5, 8); g.lineTo(6, 16); g.stroke();
    g.fillStyle = palette.robe; g.beginPath(); g.moveTo(-10, -3); g.quadraticCurveTo(-13, 8, -9, 12); g.lineTo(9, 12); g.quadraticCurveTo(13, 8, 10, -3); g.closePath(); g.fill();
    g.fillStyle = palette.sash; g.fillRect(-10, 4, 20, 4);
    g.fillStyle = palette.skin || "#f1c9a5"; g.beginPath(); g.arc(0, -10, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = palette.hair || "#25302f"; g.beginPath(); g.arc(0, -13, 8.5, back ? 0 : Math.PI, Math.PI * 2); g.lineTo(8, -8); g.quadraticCurveTo(3, -12, -1, -9); g.quadraticCurveTo(-5, -13, -8, -8); g.closePath(); g.fill();
    if (!back) { g.fillStyle = "#273331"; g.beginPath(); g.arc(-2.5, -9, .8, 0, Math.PI * 2); g.arc(2.5, -9, .8, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = palette.sash; g.beginPath(); g.moveTo(2, -20); g.lineTo(7, -25); g.lineTo(8, -17); g.closePath(); g.fill();
    g.restore();
  }

  function cameraFor(c) {
    const scale = state.viewMode === "close" && !c.classList.contains("miniMap") ? 1.72 : 1;
    const halfW = c.width / scale / 2, halfH = c.height / scale / 2;
    return { scale, x: clamp(state.player.x, halfW, 960 - halfW), y: clamp(state.player.y, halfH, 540 - halfH) };
  }

  function worldToScreen(point, c, camera) {
    return { x: (point.x - camera.x) * camera.scale + c.width / 2, y: (point.y - camera.y) * camera.scale + c.height / 2 };
  }

  function drawGuideCompass(g, c, camera, guide) {
    if (state.viewMode !== "close" || !guide || !guide.target) return;
    const target = guidePoint(guide), point = worldToScreen(target, c, camera), margin = 58;
    if (point.x >= margin && point.x <= c.width - margin && point.y >= margin && point.y <= c.height - margin) return;
    const dx = point.x - c.width / 2, dy = point.y - c.height / 2;
    const factor = Math.min((c.width / 2 - margin) / Math.max(1, Math.abs(dx)), (c.height / 2 - margin) / Math.max(1, Math.abs(dy)));
    const x = c.width / 2 + dx * factor, y = c.height / 2 + dy * factor, angle = Math.atan2(dy, dx);
    g.save(); g.translate(x, y); g.rotate(angle);
    g.fillStyle = "rgba(24,36,33,.88)"; g.beginPath(); g.arc(0, 0, 25, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffd25c"; g.beginPath(); g.moveTo(15, 0); g.lineTo(-8, -9); g.lineTo(-3, 0); g.lineTo(-8, 9); g.closePath(); g.fill();
    g.restore();
    const steps = Math.max(1, Math.ceil(dist(state.player, target) / 30));
    g.font = "bold 12px sans-serif"; g.textAlign = "center"; g.fillStyle = "rgba(24,36,33,.86)"; g.fillRect(x - 43, y + 28, 86, 20);
    g.fillStyle = "#fff7d1"; g.fillText(`${target.name} · ${steps}步`, x, y + 42);
  }

  function draw() {
    const c = document.getElementById("game"), g = c.getContext("2d"), env = projectEnvironment(), camera = cameraFor(c), miniMap = c.classList.contains("miniMap");
    g.clearRect(0, 0, c.width, c.height);
    g.imageSmoothingEnabled = true;
    g.save();
    g.translate(c.width / 2, c.height / 2); g.scale(camera.scale, camera.scale); g.translate(-camera.x, -camera.y);
    if (worldArt && worldArt.complete && worldArt.naturalWidth) g.drawImage(worldArt, 0, 0, c.width, c.height);
    else { g.fillStyle = "#c9ddd4"; g.fillRect(0, 0, c.width, c.height); }
    g.fillStyle = "rgba(20,38,32,.08)"; g.fillRect(0, 0, c.width, c.height);
    if (env.water) {
      g.strokeStyle = "rgba(65,211,231,.62)"; g.lineWidth = 10; g.lineCap = "round";
      g.beginPath(); g.moveTo(300, 115); g.bezierCurveTo(335, 170, 325, 230, 345, 245); g.bezierCurveTo(390, 310, 520, 370, 650, 385); g.stroke();
      g.strokeStyle = "rgba(225,251,255,.8)"; g.lineWidth = 2; g.setLineDash([8, 16]); g.lineDashOffset = -state.tick / 3;
      g.stroke(); g.setLineDash([]);
    }
    g.fillStyle = env.herb >= 60 ? "rgba(70,156,86,.36)" : "rgba(156,102,58,.44)"; g.beginPath(); g.ellipse(245, 350, 54, 30, -.25, 0, Math.PI * 2); g.fill();
    if (state.environment.herbShield) { g.strokeStyle = "rgba(231,212,142,.9)"; g.lineWidth = 4; g.beginPath(); g.arc(245, 350, 48, Math.PI * 1.05, Math.PI * 1.9); g.stroke(); }
    if (state.environment.ventState !== "closed") {
      g.strokeStyle = "rgba(236,250,244,.75)"; g.lineWidth = 3;
      for (let i = 0; i < (state.environment.ventState === "open" ? 5 : 3); i++) {
        const y = 175 + i * 17; g.beginPath(); g.moveTo(520, y); g.quadraticCurveTo(550, y - 18, 582, y - 6); g.stroke();
      }
    }
    const training = state.environment;
    if (state.flags.trainingWindSeen) {
      g.strokeStyle = training.trainingScreen === "angled" ? "rgba(80,163,188,.35)" : "rgba(80,163,188,.9)";
      g.lineWidth = 5; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(90, 225); g.lineTo(112, 178); g.lineTo(104, 150); g.stroke(); g.setLineDash([]);
    }
    g.save(); g.translate(training.trainingScreen === "angled" ? 88 : 82, training.trainingScreen === "cross" ? 170 : 185); g.rotate(training.trainingScreen === "angled" ? -.65 : 0);
    g.fillStyle = "#8d563d"; g.fillRect(-19, -4, 38, 8); g.restore();
    g.fillStyle = training.trainingLampLit ? "#ffd45e" : "#9b6044"; g.beginPath(); g.arc(112, 178, training.trainingLampLit ? 7 : 4, 0, Math.PI * 2); g.fill();
    if (training.trainingBridgeRevealed) {
      g.strokeStyle = "rgba(255,212,94,.9)"; g.lineWidth = training.trainingBridgeOpen ? 8 : 3; g.setLineDash(training.trainingBridgeOpen ? [] : [5, 7]);
      g.beginPath(); g.moveTo(108, 168); g.lineTo(105, 120); g.stroke(); g.setLineDash([]);
    }
    links.forEach(([a, b]) => {
      if (!training.trainingBridgeOpen && ((a === "camp" && b === "village") || (a === "village" && b === "camp"))) return;
      const aa = byId(a), bb = byId(b);
      g.strokeStyle = state.visited[a] && state.visited[b] ? "rgba(245,221,151,.58)" : "rgba(25,42,36,.18)";
      g.lineWidth = 2; g.setLineDash([3, 8]); g.beginPath(); g.moveTo(aa.x, aa.y); g.lineTo(bb.x, bb.y); g.stroke(); g.setLineDash([]);
    });
    const fogAlpha = clamp(env.fog / 260, .05, .40);
    g.save(); g.globalAlpha = fogAlpha; g.strokeStyle = "#f3f6f1"; g.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const y = 90 + i * 40, drift = Math.sin(state.tick / 90 + i) * 18;
      g.lineWidth = 12 + (i % 3) * 6; g.beginPath(); g.moveTo(650 + drift, y);
      g.bezierCurveTo(720 + drift, y - 24, 785 - drift, y + 25, 905 + drift, y - 6); g.stroke();
    }
    g.restore();

    const guide = activeGuide();
    if (guide && guide.target) {
      const target = guidePoint(guide), pulse = 19 + Math.sin(state.tick / 7) * 4;
      g.save();
      g.strokeStyle = "rgba(255, 210, 92, .95)"; g.lineWidth = 3; g.setLineDash([10, 10]); g.lineDashOffset = -state.tick / 3;
      g.beginPath(); g.moveTo(state.player.x, state.player.y); g.lineTo(target.x, target.y); g.stroke(); g.setLineDash([]);
      g.fillStyle = "rgba(255, 210, 92, .16)"; g.strokeStyle = "#ffd25c"; g.lineWidth = 4;
      g.beginPath(); g.arc(target.x, target.y, pulse, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = "rgba(24,36,33,.88)"; g.fillRect(target.x - 34, target.y + 18, 68, 20);
      g.fillStyle = "#fff7d1"; g.textAlign = "center"; g.font = "bold 12px sans-serif"; g.fillText("下一步", target.x, target.y + 33);
      g.restore();
    }

    const nearest = nearestSpot();
    spots.forEach(s => {
      const visited = state.visited[s.id], here = nearest && nearest.id === s.id;
      const pulse = here ? 3 + Math.sin(state.tick / 8) * 2 : 0;
      g.fillStyle = s.id === "ferry" && state.flags.chapterComplete ? "#e3bf5a" : visited ? "#f7e4a9" : "#d5e2da";
      g.strokeStyle = here ? "#f8f0cf" : s.region === "ferry" ? "#4d87a1" : "#315c49";
      g.lineWidth = here ? 4 : 2; g.beginPath(); g.arc(s.x, s.y, 7 + pulse, 0, Math.PI * 2); g.fill(); g.stroke();
    if (!miniMap && (state.viewMode === "map" || here || (guide && guide.target === s.id) || dist(state.player, s) < 150)) {
        g.fillStyle = "rgba(18,31,27,.78)"; g.fillRect(s.x - Math.max(26, s.name.length * 8), s.y - 31, Math.max(52, s.name.length * 16), 21);
        g.fillStyle = "#fff8df"; g.textAlign = "center"; g.font = here ? "bold 14px sans-serif" : "13px sans-serif"; g.fillText(s.name, s.x, s.y - 16);
      }
    });

    Object.keys(npcDefs).forEach(id => {
      const spotId = npcSpot(id);
      if (!spotId) return;
      const s = byId(spotId);
      const colors = { a_lan:{robe:"#397a8f",sash:"#d9b34d"}, shi_heng:{robe:"#6b665d",sash:"#b74f38"}, sang_yu:{robe:"#638453",sash:"#d3a451"}, road_guest:{robe:"#705a82",sash:"#d8c469"} }[id];
      drawActor(g, s.x + 19, s.y + 18, colors, .82);
      g.fillStyle = "rgba(18,31,27,.72)"; g.fillRect(s.x - 6, s.y + 31, 50, 17); g.fillStyle = "#fff8df"; g.font = "11px sans-serif"; g.fillText(npcDefs[id].name, s.x + 19, s.y + 43);
    });
    state.party.forEach((id, i) => {
      drawActor(g, state.player.x - 22 - i * 18, state.player.y + 17, { robe: i ? "#8c6b32" : "#3d7787", sash: "#e4c15b" }, .7, -1);
    });
    if (state.lens) {
      g.strokeStyle = "rgba(169,72,49,.65)"; g.lineWidth = 2;
      spots.filter(s => castSpec(s, state.selectedSkill)).forEach(s => { g.beginPath(); g.arc(s.x, s.y, s.r + 10, 0, Math.PI * 2); g.stroke(); });
    }
    if (state.viewMode === "map" || miniMap) drawActor(g, state.player.x, state.player.y, { robe: "#275978", sash: "#c75138", hair: "#27302f" }, miniMap ? 1.7 : 1.05);
    g.restore();
    if (state.viewMode === "close" && !miniMap) drawActor(g, c.width / 2, c.height - 58, { robe: "#275978", sash: "#c75138", hair: "#27302f" }, 2.25, 1, true);
    if (miniMap) return;
    drawGuideCompass(g, c, camera, guide);
    g.textAlign = "left"; g.font = "13px sans-serif"; g.fillStyle = "rgba(255,253,246,.94)"; g.fillRect(16, 16, 390, 51);
    if (guide && !guide.complete) {
      g.fillStyle = "#182421"; g.font = "bold 14px sans-serif"; g.fillText(`当前目标：${guide.title}`, 29, 38);
      g.fillStyle = "#52615c"; g.font = "13px sans-serif"; g.fillText("跟随金色方向标，靠近后按 E 或点击行动", 29, 57);
    } else {
      g.fillStyle = "#182421"; g.fillText(`雾势 ${env.fog} · 药圃 ${env.herb} · 水 ${env.ferryOutput}/2 · 风 ${env.wind}`, 29, 38);
      g.fillStyle = "#52615c"; g.fillText(routeOpen() ? "雾门已有可行通路" : "公开路未通，可继续修水、通风或搜集识路线索", 29, 57);
    }
  }

  function update(now) {
    const delta = lastFrame ? Math.min(.083, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    if (state.started && !dialogueOpen()) {
      state.tick += delta * 60;
      const traceNow = traceActive();
      if (traceNow !== lastTraceState) { lastTraceState = traceNow; markDirty(); }
      const p = state.player, speed = 190 * delta;
      let dx = (state.keys.ArrowRight || state.keys.d ? 1 : 0) - (state.keys.ArrowLeft || state.keys.a ? 1 : 0);
      let dy = (state.keys.ArrowDown || state.keys.s ? 1 : 0) - (state.keys.ArrowUp || state.keys.w ? 1 : 0);
      if (dx || dy) {
        const m = Math.hypot(dx, dy);
        state.facing = { x: dx / m, y: dy / m };
        p.x += dx / m * speed;
        p.y += dy / m * speed;
        constrainPlayer();
      }
      const near = nearestSpot();
      const nearId = near ? near.id : "";
      if (nearId !== lastNearest) {
        lastNearest = nearId;
        if (near && !state.visited[near.id]) { state.visited[near.id] = true; state.revision += 1; }
        markDirty();
      }
    }
    draw();
    if (dirty) { syncPanel(); dirty = false; lastUi = now; }
    root.requestAnimationFrame(update);
  }

  function setHtml(id, html) { document.getElementById(id).innerHTML = html; }

  function syncPanel() {
    const env = projectEnvironment(), current = skill(state.selectedSkill), budget = chartBudget(state.hero[1]), s = nearestSpot(), guide = activeGuide();
    document.body.classList.toggle("guidedMode", !!(guide && !guide.complete));
    const mapCanvas = document.getElementById("game");
    mapCanvas.classList.remove("canvasHidden");
    mapCanvas.classList.toggle("miniMap", state.viewMode === "close");
    document.getElementById("world3d").classList.toggle("canvasHidden", state.viewMode === "map");
    document.getElementById("viewToggle").textContent = state.viewMode === "close" ? "总览地图" : "返回现场";
    document.getElementById("lensToggle").textContent = state.lens ? "收起观局" : "观局";
    document.getElementById("touchObserve").textContent = state.lens ? "收起观局" : "观局";
    const target = guidePoint(guide);
    const navHint = document.getElementById("navHint");
    navHint.classList.toggle("hide", !target);
    if (target) navHint.innerHTML = `<span>下一步</span><strong>${target.name} · ${Math.max(1, Math.ceil(dist(state.player, target) / 30))}步</strong>`;
    const arrayHint = document.getElementById("arrayHint");
    let arrayText = "";
    if (!state.flags.reachedVillage) {
      if (!state.flags.trainingWindSeen) arrayText = "灯为什么会熄？";
      else if (state.environment.trainingScreen === "cross") arrayText = "风挡住了，光也被挡住";
      else if (!state.environment.trainingLampLit) arrayText = state.environment.trainingScreen === "angled" ? "屏风已转好 · 点灯验证" : "已发现 · 风直吹灯";
      else if (!state.environment.trainingBridgeRevealed) arrayText = "灯已稳定 · 照向桥面";
      else if (!state.environment.trainingBridgeOpen) arrayText = "桥痕清晰 · 启动桥台";
      else arrayText = "旧桥已开启 · 亲自走过去";
    }
    arrayHint.textContent = arrayText;
    arrayHint.classList.toggle("hide", !arrayText);
    const siteReading = document.getElementById("siteReading");
    const showSiteReading = state.viewMode === "close" && state.lens && state.flags.trainingWindSeen && !state.environment.trainingBridgeOpen;
    siteReading.classList.toggle("hide", !showSiteReading);
    if (showSiteReading) {
      const screen = state.environment.trainingScreen;
      const windClosed = screen === "cross" || screen === "angled";
      const hallOpen = screen !== "cross";
      const lightOpen = screen !== "cross";
      document.getElementById("siteReadingKicker").textContent = screen === "angled" ? "刚才的动作" : "现场观察";
      document.getElementById("siteReadingTitle").textContent = screen === "angled" ? "藏风而不闭塞" : screen === "cross" ? "风停了，光也断了" : "风正穿过灯台";
      setHtml("siteChecks", [
        ["风是否绕开灯", windClosed, windClosed ? "是" : "否"],
        ["灯前是否留空", hallOpen, hallOpen ? "是" : "否"],
        ["照桥光路是否连通", lightOpen, lightOpen ? "是" : "否"]
      ].map(([name, good, value]) => `<span class="${good ? "good" : screen === "cross" ? "warn" : "bad"}">${good ? "✓" : "×"} ${name}·${value}</span>`).join(""));
      document.getElementById("siteVerdict").textContent = screen === "angled" ? "两项都满足：风绕开灯，灯光仍通。点灯验证后，再把这个经验称作“藏风而不闭塞”。" : screen === "cross" ? "只解决了一半：挡风有效，但黄色光路同时被截断。" : "先解决一个可见问题：把风引到灯旁，同时保留黄色光路。";
      document.getElementById("siteReadingSource").textContent = screen === "angled" ? "《葬书》讨论气的聚散与形势；屏风、灯与桥均为本作教学转译。" : "先看见风、屏风和灯光的关系，术语稍后再出现。";
    }
    const causes = [
      ["看风", !!state.flags.trainingWindSeen],
      ["转屏", state.environment.trainingScreen === "angled"],
      ["稳灯", !!state.environment.trainingLampLit],
      ["照桥", !!state.environment.trainingBridgeRevealed],
      ["开路", !!state.environment.trainingBridgeOpen]
    ];
    const currentCause = causes.findIndex(([, done]) => !done);
    setHtml("causeTrail", causes.map(([label, done], index) => `<li class="${done ? "done" : index === currentCause ? "current" : ""}"><span>${done ? "✓" : index + 1}</span><b>${label}</b></li>`).join(""));
    document.getElementById("heroName").textContent = state.hero[0];
    document.getElementById("spirit").textContent = state.spirit;
    document.getElementById("selected").textContent = `${elementNames[current.element]} ${current.name}`;
    document.getElementById("phase").textContent = phases[state.phase];
    document.getElementById("fog").textContent = env.fog;
    document.getElementById("party").textContent = state.party.map(id => npcDefs[id].name).join("、") || "独行";
    document.getElementById("goal").textContent = !state.environment.trainingBridgeOpen ? "当前目标：让灯稳定，找出通往雾村的旧桥。" : !state.flags.reachedVillage ? "当前目标：走过刚刚恢复的旧桥。" : state.flags.chapterComplete ? "主线已完成。可回访碑廊、空亡市与人物约定。" : state.flags.reachedDock ? "找到摆渡人，把渡口信交给他。" : routeOpen() ? "雾门已有通路，前往旧渡口。" : "送信任务：调查旧渠，让通往渡口的水路恢复。";
    document.getElementById("contextTitle").textContent = s ? s.name : "附近";
    document.getElementById("contextText").textContent = contextDescription(s);
    const actions = contextActions(s), expected = guide && s && s.id === guide.target ? guide.action : null;
    setHtml("contextActions", actions.map(a => `<button data-action="${a.id}" class="${a.primary ? "primary " : ""}${a.id === expected ? "guideRecommended" : ""}">${a.label}</button>`).join(""));
    actions.forEach(a => { const b = document.querySelector(`[data-action="${a.id}"]`); if (b) b.onclick = a.run; });

    const guideBox = document.getElementById("guide");
    guideBox.classList.toggle("hide", !guide);
    guideBox.classList.toggle("complete", !!(guide && guide.complete));
    document.getElementById("guideToggle").textContent = guide ? "关闭指引" : "开启指引";
    if (guide) {
      document.getElementById("guideSection").textContent = guide.section;
      document.getElementById("guideProgress").textContent = guide.complete ? "全部完成" : `第 ${guide.sectionIndex + 1} / ${guide.sectionTotal} 步`;
      document.getElementById("guideTitle").textContent = guide.title;
      document.getElementById("guideText").textContent = guide.text;
      document.getElementById("guideTarget").textContent = target ? target.name : "自由探索";
      const hintLevel = !guide.complete && state.guide.hintStep === guide.id ? state.guide.hintLevel : 0;
      const hintText = document.getElementById("guideHintText");
      hintText.classList.toggle("hide", !hintLevel);
      hintText.textContent = hintLevel && guide.hints ? guide.hints[hintLevel - 1] : "";
      document.getElementById("guideHint").classList.toggle("hide", guide.complete || !guide.hints);
      document.getElementById("guideHint").textContent = hintLevel >= (guide.hints || []).length ? "已显示完整提示" : hintLevel ? "再给一点提示" : "需要线索";
      const guideAction = s && s.id === guide.target && actions.find(a => a.id === guide.action);
      document.getElementById("guideDo").textContent = guideAction ? guide.direct === false ? "查看两种摆法" : `执行：${guideAction.label}` : guide.complete ? "返回场景" : "查看当前目标";
    }

    setHtml("routeSummary", [
      ["水路", env.water, state.environment.gateRepaired ? state.environment.rootMode === "blocked" ? "水门已修·根仍堵" : "8=6药圃+2渡口" : "缺旧轴修复"],
      ["风路", env.fog <= 45 && env.wind > 0, `风板${{closed:"全闭",notch:"窄口",open:"全开"}[state.environment.ventState]}·药圃${env.herb}`],
      ["识路", traceActive() || state.flags.reachedDock, state.flags.traceLearned ? traceActive() ? "标路窗口有效" : "三证齐·可标路" : "搜集渠痕/风铃/碑文"]
    ].map(([name, open, text]) => `<div class="${open ? "open" : ""}"><strong>${open ? "已通" : "未通"}·${name}</strong>${text}</div>`).join(""));

    const journal = [
      [state.flags.reachedVillage, "抵达雾村，了解停转的水车"],
      [routeOpen() || state.flags.reachedDock, "让水、风或真实路标穿过雾门"],
      [state.flags.reachedDock, "抵达旧渡口"],
      [state.flags.letterDelivered, "把渡口信交给摆渡人"]
    ];
    const currentIndex = journal.findIndex(([done]) => !done);
    setHtml("journal", journal.map(([done, text], i) => `<li class="${done ? "done" : i === currentIndex ? "current" : ""}">${done ? "已完成：" : ""}${text}</li>`).join(""));
    setHtml("inventory", Object.entries(state.inventory).filter(([, n]) => n > 0).map(([id, n]) => `<li>${itemNames[id] || id} ×${n}</li>`).join("") || "<li>空</li>");
    setHtml("clues", Object.keys(state.clues).map(id => `<li>${clueNames[id] || id}</li>`).join("") || "<li>尚未记录</li>");
    setHtml("travelActions", state.flags.fastTravelUnlocked ? '<button data-travel="camp">回营地</button><button data-travel="ferry">去渡口</button>' : "");
    document.querySelectorAll("[data-travel]").forEach(b => b.onclick = () => {
      const target = byId(b.dataset.travel); state.player = { x: target.x, y: target.y }; notify("沿已核对的驿路安全回返。");
    });

    setHtml("skills", skillList.map(sk => `<button data-skill="${sk.id}" ${state.learned[sk.id] ? "" : "disabled"} class="${sk.id === state.selectedSkill ? "active" : ""}"><strong>${elementNames[sk.element]}·${sk.name}</strong><span>${state.learned[sk.id] ? sk.description + " · " + castCost(state.hero, sk.element) + "灵力" : "未取得手记"}</span></button>`).join(""));
    document.querySelectorAll("[data-skill]").forEach(b => b.onclick = () => {
      state.selectedSkill = b.dataset.skill; state.selectedElement = skill(state.selectedSkill).element; markDirty();
    });
    document.querySelectorAll("[data-element]").forEach(b => b.classList.toggle("active", b.dataset.element === state.selectedElement));

    setHtml("npcs", Object.keys(npcDefs).map(id => {
      const npc = state.npcs[id], loc = state.party.includes(id) ? "同行" : npcSpot(id) ? byId(npcSpot(id)).name : id === "road_guest" ? "尚未相遇" : "按作息离开";
      return `<li><strong>${npcDefs[id].name}·${npcDefs[id].job}</strong><span>${loc}｜${{unknown:"未识",acquainted:"相识",trusted:"信任",estranged:"疏远"}[npc.social]}｜${npc.focus}专注</span></li>`;
    }).join(""));
    if (state.party.length) {
      setHtml("partyDetails", state.party.map(id => {
        const forward = tenGod(state.hero[1][2][0], charts[id][2][0]), reverse = tenGod(charts[id][2][0], state.hero[1][2][0]);
        return `<p><strong>${npcDefs[id].name}</strong>：你观察其日干为${forward}，其观察你为${reverse}。<button data-support="${id}" class="${state.supportId === id ? "active" : ""}">设为协作位</button></p>`;
      }).join(""));
      document.querySelectorAll("[data-support]").forEach(b => b.onclick = () => { state.supportId = b.dataset.support; notify(npcDefs[state.supportId].name + "准备协作下一次有效法式。"); });
    } else setHtml("partyDetails", "<p class='quiet'>可以独行；伙伴只改变处理方式，不持有唯一主线钥匙。</p>");

    const chart = state.hero[1], meta = state.hero[2] || {};
    setHtml("chartSummary", `<div class="chartHeader"><strong>角色命盘</strong><span>日主 ${chart[2][0]} · 游戏结构生成</span></div><p class="chartMeta">${meta.chartCode || ""}｜不推算公历、真太阳时与大运</p>`);
    setHtml("baziTable", baziTable(chart));
    setHtml("chartClassics", chartClassics(chart));
    setHtml("budget", Object.entries(budget).map(([name, amount]) => `<div class="budgetRow"><span>${name}</span><div class="budgetTrack"><div class="budgetFill" style="width:${amount / 8 * 100}%"></div></div><strong>${amount.toFixed(1)}</strong></div>`).join(""));
    setHtml("nodes", chart.map((p, i) => `<p><strong>${pillars[i]}柱 ${p}</strong>｜藏干 ${hidden[p[1]].map(([x, w]) => x + " " + w).join("、")}｜日主地势 ${stageFor(chart[2][0], p[1])}</p>`).join(""));
    const distSelf = tenGodDistribution(chart[2][0], chart, true);
    setHtml("relations", `<p><strong>自身十神（不计参照日干）</strong>：${Object.entries(distSelf).map(([k,v]) => k + " " + v.toFixed(1)).join("、")}</p><p><strong>结构关系</strong>：${relationRows(chart).join("；") || "本盘未出现当前目录中的成对关系"}。组合只记候选，不自动合化或判吉凶。</p>`);

    setHtml("events", shenshaRows().map(row => `<li><strong>${row.name}｜${row.event}</strong><span>${row.historical}｜${row.state}${row.evidence.length ? "｜" + row.evidence.map(e => e.carrier + "←" + e.proofs.join("/")).join("；") : "｜普通探索分支仍可用"}</span></li>`).join(""));
    setHtml("log", state.log.map(x => `<li>${escapeHtml(x)}</li>`).join(""));
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  function renderDraft() {
    if (!draft || typeof document === "undefined") return;
    const selection = draft[2].selection, budget = chartBudget(draft[1]), source = draft[2].source;
    document.getElementById("nameInput").value = draft[0];
    selectionKeys.forEach(k => document.getElementById(k).value = selection[k]);
    setHtml("creationPreview", `<strong>${escapeHtml(draft[0])}｜${draft[1].join(" ")}</strong><div class="previewMeta">日主 ${draft[1][2][0]}｜${draft[2].chartCode}｜${source.type === "random" ? "种子 " + source.seedHex : source.type === "template" ? "示例模板" : source.type === "custom" ? "自主定制" : "分享码导入"}</div><div class="previewBudget">${Object.entries(budget).map(([k,v]) => `<span>${k} ${v.toFixed(1)}/8 · ${castCost(draft, elementIds[k], null)}灵力</span>`).join("")}</div>`);
    document.getElementById("codeInput").value = draft[2].chartCode;
    const allLocked = selectionKeys.every(k => document.querySelector(`[data-lock="${k}"]`).checked);
    document.getElementById("random").disabled = allLocked;
    document.getElementById("creationHint").textContent = allLocked ? "四个自由变量都已锁定；解锁至少一项后可重新随机。" : "";
  }

  function validName() {
    const name = document.getElementById("nameInput").value.trim();
    if (!name || Array.from(name).length > 20) throw new Error("姓名需为 1–20 个字符。");
    return name;
  }

  function editDraft() {
    try {
      const selection = Object.fromEntries(selectionKeys.map(k => [k, Number(document.getElementById(k).value)]));
      draft = heroFromSelection(validName(), selection, { type: "custom" });
      const filter = document.getElementById("dayStem").value;
      document.getElementById("creationHint").textContent = filter && draft[1][2][0] !== filter ? `当前日柱不属于${filter}日主；草稿未被偷偷修改。` : "";
      renderDraft();
    } catch (error) { document.getElementById("creationHint").textContent = error.message; }
  }

  function chooseHero() {
    try {
      draft[0] = validName();
      if (localStorage.getItem("guanqi-save-v4-current") && !root.confirm("开始新旅程会替换当前进度；上一代有效存档会保留。继续吗？")) return;
      const old = localStorage.getItem("guanqi-save-v4-current");
      if (old) localStorage.setItem("guanqi-save-v4-previous", old);
      state = makeState(draft);
      state.started = true;
      document.getElementById("start").classList.add("hide");
      notify(`${draft[0]}携带渡口信出发；完整四柱从此固定。`);
      playScene("opening");
      markDirty();
    } catch (error) { document.getElementById("creationHint").textContent = error.message; }
  }

  function initCreation() {
    document.getElementById("yearCycle").innerHTML = cycle.map((p, i) => `<option value="${i}">${String(i).padStart(2,"0")} · ${p}</option>`).join("");
    document.getElementById("monthBranch").innerHTML = branches.map((b, i) => `<option value="${i}">${b}</option>`).join("");
    document.getElementById("dayCycle").innerHTML = cycle.map((p, i) => `<option value="${i}">${String(i).padStart(2,"0")} · ${p}</option>`).join("");
    document.getElementById("hourBranch").innerHTML = branches.map((b, i) => `<option value="${i}">${b}</option>`).join("");
    document.getElementById("dayStem").innerHTML += stems.map(s => `<option value="${s}">${s}</option>`).join("");
    setHtml("templates", templates.map((t, i) => `<button data-hero="${i}"><strong>${t[0]}</strong>${t[1].join(" ")}</button>`).join(""));
    draft = randomHero();
    renderDraft();
    document.querySelectorAll("[data-hero]").forEach(b => b.onclick = () => { draft = heroFromTemplate(templates[+b.dataset.hero], +b.dataset.hero); renderDraft(); });
    selectionKeys.forEach(k => document.getElementById(k).onchange = editDraft);
    document.getElementById("nameInput").oninput = () => { try { draft[0] = validName(); renderDraft(); } catch (e) { document.getElementById("creationHint").textContent = e.message; } };
    document.querySelectorAll("[data-lock]").forEach(x => x.onchange = renderDraft);
    document.getElementById("dayStem").onchange = editDraft;
    document.getElementById("lockDayStem").onchange = renderDraft;
    document.getElementById("fillDayStem").onclick = () => {
      const wanted = document.getElementById("dayStem").value;
      if (!wanted) return document.getElementById("creationHint").textContent = "先选择一个日主。";
      const current = Number(document.getElementById("dayCycle").value);
      const next = Array.from({length:60}, (_, i) => (current + i) % 60).find(i => stems[i % 10] === wanted);
      document.getElementById("dayCycle").value = next;
      editDraft();
    };
    document.getElementById("random").onclick = () => {
      try {
        const locks = {};
        selectionKeys.forEach(k => { if (document.querySelector(`[data-lock="${k}"]`).checked) locks[k] = Number(document.getElementById(k).value); });
        if (document.getElementById("lockDayStem").checked && document.getElementById("dayStem").value) locks.dayStem = document.getElementById("dayStem").value;
        draft = randomHero(validName(), locks);
        renderDraft();
      } catch (error) { document.getElementById("creationHint").textContent = error.message === "CONFLICTING_LOCKS" ? "日主筛选与锁定日柱冲突；草稿没有改变。" : error.message; }
    };
    document.getElementById("confirm").onclick = chooseHero;
    document.getElementById("importCode").onclick = () => {
      try { draft = importHero(document.getElementById("codeInput").value, validName()); renderDraft(); }
      catch { document.getElementById("creationHint").textContent = "分享码无效；格式应为 GQ1-YY-MM-DD-HH，索引必须在范围内。"; }
    };
    document.getElementById("copyCode").onclick = async () => {
      const code = draft[2].chartCode;
      try { await navigator.clipboard.writeText(code); document.getElementById("creationHint").textContent = "当前分享码已复制。"; }
      catch { document.getElementById("codeInput").select(); document.execCommand("copy"); }
    };
    const hasSave = !!localStorage.getItem("guanqi-save-v4-current");
    document.getElementById("continue").classList.toggle("hide", !hasSave);
    document.getElementById("continue").onclick = () => loadLocal();
  }

  function initDom() {
    initCreation();
    document.querySelectorAll("[data-element]").forEach(b => b.onclick = () => chooseElement(b.dataset.element));
    document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
      document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x === b));
      document.querySelectorAll("[data-pane]").forEach(x => x.classList.toggle("active", x.dataset.pane === b.dataset.tab));
      if (b.dataset.tab === "events") { state.flags.shenshaKnown = true; markDirty(); }
    });
    document.getElementById("save").onclick = saveLocal;
    document.getElementById("load").onclick = () => loadLocal();
    document.getElementById("exportSave").onclick = exportSave;
    document.getElementById("importSave").onclick = () => document.getElementById("saveFile").click();
    document.getElementById("saveFile").onchange = e => importSaveFile(e.target.files[0]);
    document.getElementById("rest").onclick = rest;
    document.getElementById("viewToggle").onclick = () => setViewMode(state.viewMode === "close" ? "map" : "close");
    document.getElementById("lensToggle").onclick = toggleLens;
    document.getElementById("dialogueNext").onclick = advanceDialogue;
    document.getElementById("dialogueSkip").onclick = closeDialogue;
    document.getElementById("guideDo").onclick = runGuideAction;
    document.getElementById("guideHint").onclick = showGuideHint;
    document.getElementById("guideDismiss").onclick = () => setGuide(false);
    document.getElementById("guideToggle").onclick = () => setGuide(!(state.guide && state.guide.enabled));
    document.getElementById("newGame").onclick = () => {
      closeDialogue();
      draft = randomHero(state.hero[0]);
      renderDraft();
      document.getElementById("start").classList.remove("hide");
    };
    document.getElementById("touchObserve").onclick = toggleLens;
    document.getElementById("touchAct").onclick = primaryAction;
    document.querySelectorAll("[data-move]").forEach(b => {
      const key = b.dataset.move;
      const down = () => { state.keys[key] = true; };
      const up = () => { state.keys[key] = false; };
      b.addEventListener("pointerdown", down); b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("pointerleave", up);
      b.onclick = () => moveStep(key);
    });
    addEventListener("keydown", e => {
      if (["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName)) return;
      if (dialogueOpen()) {
        if (["e","Enter"," "].includes(e.key)) advanceDialogue();
        if (e.key === "Escape") closeDialogue();
        e.preventDefault();
        return;
      }
      if ("wasd".includes(e.key.toLowerCase()) || e.key.startsWith("Arrow")) { state.keys[e.key.toLowerCase() === e.key ? e.key.toLowerCase() : e.key] = true; if (!e.repeat && e.key.startsWith("Arrow")) moveStep(e.key, 12); e.preventDefault(); }
      if ("12345".includes(e.key)) chooseElement(Object.keys(elementNames)[+e.key - 1]);
      if (e.key.toLowerCase() === "z") chooseSkill(-1);
      if (["x","c"].includes(e.key.toLowerCase())) chooseSkill(1);
      if (e.key.toLowerCase() === "e") primaryAction();
      if (e.key.toLowerCase() === "q") toggleLens();
      if (e.key.toLowerCase() === "r") {
        const here = nearestSpot(), id = here && npcsHere(here)[0];
        id ? toggleParty(id) : notify("附近没有可邀请的人。");
      }
      if (e.key.toLowerCase() === "j") document.querySelector('[data-tab="events"]').click();
      if (e.key.toLowerCase() === "m") rest();
    });
    addEventListener("keyup", e => { state.keys[e.key] = false; state.keys[e.key.toLowerCase()] = false; });
    root.requestAnimationFrame(update);
  }

  function viewState() {
    const guide = activeGuide(), target = guidePoint(guide);
    return {
      started: state.started,
      viewMode: state.viewMode,
      lens: !!state.lens,
      tick: state.tick,
      player: clone(state.player),
      facing: clone(state.facing),
      target: target ? { id: target.id, name: target.name, x: target.x, y: target.y } : null,
      environment: projectEnvironment(),
      training: {
        windSeen: !!state.flags.trainingWindSeen,
        screen: state.environment.trainingScreen,
        lampLit: !!state.environment.trainingLampLit,
        bridgeRevealed: !!state.environment.trainingBridgeRevealed,
        bridgeOpen: !!state.environment.trainingBridgeOpen,
        awning: state.environment.trainingAwning,
        transferSolved: !!state.flags.trainingTransferSolved
      },
      routeOpen: routeOpen(),
      chapterComplete: !!state.flags.chapterComplete
    };
  }

  root.GuanqiGame = {
    chartBudget, chartNodes, tenGod, tenGodDistribution, stageFor, relationRows, shenshaOccurrences,
    canEnterFerry, routeOpen, projectEnvironment, skillList, shenshaRows, saveShape, loadShape, templates,
    deriveChart, generate, encodeSelection, decodeSelection, importHero, castCost, makeState, migrateLegacy, guideStep,
    pillarVoid, naYinFor, baziTable, chartClassics, viewState, setViewMode,
    worldData: { spots: clone(spots), links: clone(links) }
  };
  if (typeof module !== "undefined") module.exports = root.GuanqiGame;
  if (typeof document !== "undefined") initDom();
})(typeof window !== "undefined" ? window : globalThis);
