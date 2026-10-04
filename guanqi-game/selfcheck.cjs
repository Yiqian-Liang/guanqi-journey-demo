const assert = require("assert");
const fs = require("fs");
const game = require("./game.js");

for (const [, chart] of game.templates) {
  const total = Object.values(game.chartBudget(chart)).reduce((a, b) => a + b, 0);
  assert(Math.abs(total - 8) < 1e-9, "chart budget must stay at 8");
}

const selection = game.generate("00000000");
assert.deepEqual(selection, { yearCycle: 38, monthBranch: 7, dayCycle: 16, hourBranch: 0 });
assert.deepEqual(game.deriveChart(selection), ["壬寅", "丁未", "庚辰", "丙子"]);
assert.equal(game.encodeSelection(selection), "GQ1-38-07-16-00");
assert.throws(() => game.generate("00000000", { unknown: 1 }), /UNKNOWN_LOCK/);
assert.throws(() => game.generate("00000000", { yearCycle: true }), /INVALID_LOCK/);
assert.throws(() => game.generate("00000000", { dayCycle: 50, dayStem: "乙" }), /CONFLICTING_LOCKS/);

const imported = game.importHero("GQ1-08-05-50-06");
assert.deepEqual(imported[1], ["壬申", "乙巳", "甲寅", "庚午"]);
assert.equal(imported[2].chartCode, "GQ1-08-05-50-06");
assert.equal(game.tenGod("甲", "癸"), "正印");
assert.equal(game.tenGod("癸", "甲"), "伤官");
assert.equal(game.chartNodes(imported[1]).filter(n => !n.visible).length, 11);
assert.equal(game.chartBudget(imported[1]).土, .8);
assert.equal(Object.values(game.tenGodDistribution("甲", imported[1], true)).reduce((a, b) => a + b, 0), 7);
assert.equal(Object.values(game.tenGodDistribution("癸", imported[1], false)).reduce((a, b) => a + b, 0), 8);
assert.equal(Object.keys(game.shenshaOccurrences(imported[1])).length, 12);
assert.equal(game.shenshaRows({ shenshaKnown: true }).length, 12);
assert.equal(game.naYinFor("甲子"), "海中金");
assert.equal(game.pillarVoid("甲子"), "戌亥");
assert(game.baziTable(imported[1]).includes("藏干"));
assert(game.baziTable(imported[1]).includes("神煞"));
assert(game.chartClassics(imported[1]).includes("先立日主"));
assert(game.chartClassics(imported[1]).includes("不据此强判格局"));

const world = game.makeState(imported);
world.phase = 3;
assert.deepEqual(game.projectEnvironment(world), { water: false, wind: 0, ferryOutput: 0, herbOutput: 0, spillOutput: 8, fog: 80, herb: 90 });
world.environment.gateRepaired = true;
world.environment.rootMode = "shaped";
assert.equal(game.projectEnvironment(world).fog, 35);
assert.equal(game.projectEnvironment(world).herb, 100);
world.environment.gateRepaired = false;
world.environment.rootMode = "blocked";
world.environment.ventState = "open";
assert.equal(game.projectEnvironment(world).fog, 40);
assert.equal(game.projectEnvironment(world).herb, 40);
world.environment.herbShield = true;
assert.equal(game.projectEnvironment(world).herb, 65);
world.environment.gateRepaired = true;
world.environment.rootMode = "trimmed";
world.environment.ventState = "notch";
world.environment.herbShield = false;
assert.equal(game.projectEnvironment(world).fog, 15);
assert.equal(game.projectEnvironment(world).herb, 75);

assert.equal(game.routeOpen({}), false);
assert.equal(game.routeOpen({ waterRoute: true }), true);
assert.equal(game.canEnterFerry({ traceRoute: true }), true);
assert.equal(game.skillList.length, 15);
for (const skill of game.skillList) assert.equal(game.castCost(imported, skill.element, null), 20, `sprout cost: ${skill.id}`);

const guided = game.makeState(imported);
assert.equal(guided.viewMode, "close");
assert.deepEqual(guided.facing, { x: 0, y: -1 });
assert.equal(game.guideStep(guided).id, "lamp_observe");
guided.flags.trainingWindSeen = true;
assert.equal(game.guideStep(guided).id, "screen");
guided.environment.trainingScreen = "angled";
assert.equal(game.guideStep(guided).id, "lamp");
guided.environment.trainingLampLit = true;
assert.equal(game.guideStep(guided).id, "jing");
guided.environment.trainingBridgeRevealed = true;
assert.equal(game.guideStep(guided).id, "kai");
guided.environment.trainingBridgeOpen = true;
assert.equal(game.guideStep(guided).id, "village");
guided.flags.reachedVillage = true;
assert.equal(game.guideStep(guided).id, "canal");
guided.flags.canalItemsTaken = true;
assert.equal(game.guideStep(guided).id, "repair");
guided.environment.gateRepaired = true;
assert.equal(game.guideStep(guided).id, "roots");
guided.environment.rootMode = "shaped";
assert.equal(game.guideStep(guided).id, "wait");
guided.phase = 2;
assert.equal(game.guideStep(guided).id, "ferry");
guided.flags.reachedDock = true;
assert.equal(game.guideStep(guided).id, "deliver");
guided.flags.letterDelivered = true;
assert.equal(game.guideStep(guided).id, "complete");

const source = fs.readFileSync(require.resolve("./game.js"), "utf8");
for (const skill of game.skillList) {
  const uses = source.split(skill.id).length - 1;
  assert(uses >= 2, `${skill.id} must be connected beyond its catalog row`);
}
assert(fs.existsSync(require.resolve("./assets/mist-ferry-world.png")), "rendered world art must exist");
assert(fs.existsSync(require.resolve("./assets/dialogue-cast.png")), "dialogue portrait sheet must exist");
assert(fs.existsSync(require.resolve("./world3d.js")), "over-shoulder 3D scene must exist");
assert(fs.existsSync(require.resolve("./vendor/three.module.js")), "Three.js module must exist");
assert(fs.existsSync(require.resolve("./vendor/three.core.js")), "Three.js core module must exist");
assert(fs.existsSync(require.resolve("./vendor/THREE_LICENSE.txt")), "Three.js license must exist");
const world3dSource = fs.readFileSync(require.resolve("./world3d.js"), "utf8");
assert(["来风", "照桥", "灯"].every(label => world3dSource.includes(label)), "3D site reading labels must exist");

const migrated = game.migrateLegacy({ hero: ["旧行者", imported[1]], flags: { waterRoute: true, done: true }, spirit: 42 });
assert.equal(migrated.hero[2].source.type, "migrated_unknown");
assert.equal(migrated.environment.gateRepaired, true);
assert.equal(migrated.environment.rootMode, "shaped");
assert.equal(migrated.inventory.letter, 0);
assert.equal(migrated.spirit, 42);

const olderV4 = game.makeState(imported);
delete olderV4.guide;
delete olderV4.viewMode;
delete olderV4.facing;
game.loadShape(olderV4);
assert.equal(game.saveShape().guide.enabled, true, "older v4 saves gain the guide without losing progress");
assert.equal(game.saveShape().viewMode, "close", "older v4 saves default to the over-shoulder view");
assert.deepEqual(game.saveShape().facing, { x: 0, y: -1 }, "older v4 saves gain a valid facing vector");

const oldProgress = game.makeState(imported);
oldProgress.flags.reachedVillage = true;
delete oldProgress.environment.trainingScreen;
delete oldProgress.environment.trainingLampLit;
delete oldProgress.environment.trainingBridgeRevealed;
delete oldProgress.environment.trainingBridgeOpen;
delete oldProgress.environment.trainingAwning;
game.loadShape(oldProgress);
assert.equal(game.saveShape().environment.trainingBridgeOpen, true, "old progress is not pushed back behind the new tutorial");
assert.equal(game.saveShape().flags.trainingTransferSolved, true, "old progress keeps the new tutorial complete");

console.log("PASS: guanqi-game selfcheck");
