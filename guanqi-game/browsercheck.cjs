const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const { chromium } = require("playwright");

async function range(locator, value) {
  await locator.evaluate((input, next) => { input.value = String(next); input.dispatchEvent(new Event("input", { bubbles: true })); }, value);
}

async function drag(page, mobile, from, to) {
  if (mobile) {
    const touch = await page.context().newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
    for (let i = 1; i <= 18; i++) await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + (to.x - from.x) * i / 18, y: from.y + (to.y - from.y) * i / 18 }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await touch.detach();
  } else {
    await page.mouse.move(from.x, from.y); await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 18 }); await page.mouse.up();
  }
}

async function center(locator) {
  await locator.waitFor({state:"visible"});
  const box = await locator.boundingBox();
  assert(box, "the scene control must be visible");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const unavailable = await browser.newPage();
    await unavailable.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return type.startsWith("webgl") ? null : getContext.call(this, type, ...args);
      };
    });
    await unavailable.goto("http://127.0.0.1:4173/");
    await unavailable.locator("#renderWarning").waitFor({ state: "visible" });
    assert(await unavailable.locator("#confirm").isDisabled(), "a missing WebGL context must show a recoverable explanation instead of entering a blank scene");
    await unavailable.close();
    console.log("PASS: unavailable WebGL shows an explicit explanation");
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1366, height: 900 }]) {
      const mobile = viewport.width < 640;
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
      page.setDefaultTimeout(30000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      await page.goto("http://127.0.0.1:4173/?rendercheck=1");
      await page.waitForFunction(() => !!document.getElementById("world3d").dataset.renderHealth);
      const health = await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.renderHealth));
      assert.equal(health.opaque, 25);
      assert(health.uniqueColors >= 5, "the courtyard must contain rendered geometry, not a blank canvas");
      await page.locator("#confirm").click();
      await page.locator("#dialogueNext").click();
      await page.locator("#gateHandle").click();
      assert.equal((await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.courtyard))).node, "start");
      assert.equal(await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).bellRinging), true);
      await drag(page, mobile, await center(page.locator("#tinderHandle")), await center(page.locator("#lampHandle")));
      await page.waitForFunction(() => GuanqiGame.viewState().training.ignition > 0);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.lampLit), false, "lighting must animate before its result is applied");
      await page.waitForFunction(() => GuanqiGame.viewState().training.ignition === 0);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.lampLit), false);

      const slider = page.locator("#screenSlide"), handle = page.locator("#screenHandle");
      await range(slider, 100);
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).slide > .999);
      const end = await center(handle);
      await range(slider, 50);
      await page.waitForFunction(() => Math.abs(JSON.parse(document.getElementById("world3d").dataset.courtyard).slide - .5) < .001);
      const corner = await center(handle);
      await range(slider, 0);
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).slide < .001);
      await drag(page, mobile, await center(handle), corner);
      await page.waitForFunction(() => GuanqiGame.viewState().training.screen === "angled");
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).shelter > .99);
      assert.equal(await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).bellRinging), false, "a flat screen must stop the bell");
      await page.locator("#lampHandle").click();
      await page.waitForFunction(() => GuanqiGame.viewState().training.lampLit);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.bridgeOpen), false, "a stable lamp alone must not unlock the route");
      const quietStrikes = await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).bellStrikes);
      await page.screenshot({ path: path.join(os.tmpdir(), `guanqi-courtyard-${viewport.width}-quiet.png`) });

      const foldHandle = page.locator("#foldHandle"), foldScale = Math.max(100, viewport.width * .14);
      await page.locator("#screenToolFold").check();
      let grip = await center(foldHandle);
      await drag(page, mobile, grip, { x: grip.x + foldScale * .55, y: grip.y });
      await page.waitForFunction(() => GuanqiGame.viewState().training.bridgeOpen);
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).bridge > .98);
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).sound === "running");
      await page.waitForFunction(count => JSON.parse(document.getElementById("world3d").dataset.courtyard).bellStrikes > count, quietStrikes);
      assert.equal(await handle.isVisible(), false, "only the selected screen tool should cover the scene");
      await page.screenshot({ path: path.join(os.tmpdir(), `guanqi-courtyard-${viewport.width}-lit.png`) });
      await page.locator("#courtyardSound").uncheck();
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).muted);
      await page.locator("#courtyardSound").check();

      grip = await center(foldHandle);
      await drag(page, mobile, grip, { x: grip.x - foldScale * .55, y: grip.y });
      await page.waitForFunction(() => !GuanqiGame.viewState().training.bridgeOpen);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.lampLit), true, "silencing the bell should not extinguish a sheltered lamp");
      await page.locator("#screenToolPush").check();
      await drag(page, mobile, await center(handle), { x: corner.x + (end.x - corner.x) * .7, y: corner.y + (end.y - corner.y) * .7 });
      await page.locator("#screenToolFold").check();
      grip = await center(foldHandle);
      await drag(page, mobile, grip, { x: grip.x - foldScale * .55, y: grip.y });
      await page.waitForFunction(() => GuanqiGame.viewState().training.bridgeOpen);
      const secondSlide = await page.evaluate(() => GuanqiGame.viewState().training.slide);
      assert(secondSlide > .75, `the second arrangement must sit nearer the lamp, got ${secondSlide}`);
      await page.screenshot({ path: path.join(os.tmpdir(), `guanqi-courtyard-${viewport.width}-inward.png`) });
      await range(slider, 95);
      await range(page.locator("#screenFold"), 55);
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).lightBlocked);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.lampLit), true, "an obscured light beam must leave a sheltered flame burning");
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.bridgeOpen), false);
      await range(slider, Math.round(secondSlide * 100));
      await range(page.locator("#screenFold"), -55);
      await page.waitForFunction(() => GuanqiGame.viewState().training.bridgeOpen);
      await page.locator("#courtyardWalk").click();
      await page.waitForFunction(() => GuanqiGame.viewState().training.complete, { timeout: 20000 });
      assert.equal((await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.courtyard))).node, "gate");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "mobile content must fit the viewport");
      await page.locator("#courtyardNotes").click();
      assert(await page.locator("#courtyardSource").isVisible());
      await page.locator("#courtyardSourceClose").click();
      await page.screenshot({ path: path.join(os.tmpdir(), `guanqi-courtyard-${viewport.width}-complete.png`) });
      await page.locator("#sceneZoomIn").click();
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.view).zoom > 1);
      await drag(page, mobile, {x:30,y:200}, {x:90,y:230});
      assert.notEqual(await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.view).panX), 0);
      await page.locator("#sceneViewReset").click();
      await page.locator("#courtyardNext").click();
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.active), false);
      await page.locator("#dialogueSkip").click();
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.renderHealth).scope === "canal");
      console.log(`PASS: ${viewport.width}, courtyard and zoom/pan`);
      assert.equal(await page.locator("#journeyNext").isVisible(), false);
      await page.screenshot({path:path.join(os.tmpdir(),`guanqi-canal-${viewport.width}-before.png`)});
      await page.locator("#journeyPickup").click();
      await page.waitForFunction(() => GuanqiGame.viewState().journey.itemsTaken);
      await page.locator("#dialogueSkip").click();
      await drag(page,mobile,await center(page.locator("#journeyPickup")),await center(page.locator("#journeyInstall")));
      await page.waitForFunction(() => GuanqiGame.viewState().journey.repaired);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().environment.water),false,"repairing the gate must not bypass the root obstruction");
      await page.locator("#journeyNotes").click();
      await page.locator("#save").click();
      await page.locator("#journeyNotesClose").click();
      await page.locator("#journeyRoot").click();
      await page.locator("#journeyNotes").click();
      await page.locator("#load").click();
      await page.waitForFunction(() => {const scene=JSON.parse(document.getElementById("world3d").dataset.journey);return scene.busy===""&&scene.epoch===GuanqiGame.viewState().epoch;});
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().journey.rootMode),"blocked","loading must cancel an uncommitted root action");
      const rootGrip=await center(page.locator("#journeyRoot"));
      await drag(page,mobile,rootGrip,{x:rootGrip.x+65,y:rootGrip.y});
      await page.waitForFunction(() => GuanqiGame.viewState().environment.water);
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.journey).water > .95);
      const wheel=await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.journey).wheel);
      await page.waitForFunction(angle => Math.abs(JSON.parse(document.getElementById("world3d").dataset.journey).wheel-angle)>.2,wheel);
      await page.screenshot({path:path.join(os.tmpdir(),`guanqi-canal-${viewport.width}-after.png`)});
      console.log(`PASS: ${viewport.width}, canal, cancelled load queue and actual water flow`);
      await page.locator("#journeyNext").click();
      await page.waitForFunction(() => GuanqiGame.viewState().journey.room === "garden");
      await page.locator("#dialogueSkip").click();
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.renderHealth).scope === "garden");
      const ventBox=await page.locator("#journeyVent").boundingBox(),shieldBox=await page.locator("#journeyShield").boundingBox();
      assert(ventBox.x+ventBox.width<=shieldBox.x||shieldBox.x+shieldBox.width<=ventBox.x||ventBox.y+ventBox.height<=shieldBox.y||shieldBox.y+shieldBox.height<=ventBox.y,"wind and shield handles must never overlap");
      let ventGrip=await center(page.locator("#journeyVent"));
      await drag(page,mobile,ventGrip,{x:ventGrip.x+60,y:ventGrip.y});
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().journey.vent),"notch");
      for(let i=0;i<2;i++)for(const vent of [1,2,0])await range(page.locator("#journeyVentRange"),vent);
      await range(page.locator("#journeyVentRange"),1);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().journey.ready),true,"a gentle wind should reveal a valid route without an invisible waiting condition");
      await range(page.locator("#journeyVentRange"),2);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().journey.ready),false);
      await page.locator("#journeyNext").waitFor({state:"hidden"});
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.journey).wind>.95);
      await page.screenshot({path:path.join(os.tmpdir(),`guanqi-garden-${viewport.width}-strong-wind.png`)});
      const shieldGrip=await center(page.locator("#journeyShield"));
      await drag(page,mobile,shieldGrip,{x:shieldGrip.x,y:shieldGrip.y+65});
      await page.waitForFunction(() => GuanqiGame.viewState().journey.shield);
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.journey).shield>.95);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().journey.ready),true);
      await page.screenshot({path:path.join(os.tmpdir(),`guanqi-garden-${viewport.width}-sheltered.png`)});
      console.log(`PASS: ${viewport.width}, garden, two solutions and non-overlapping touch targets`);
      await page.locator("#journeyNotes").click();
      assert(await page.locator("#journeyNotebook").isVisible());
      await page.locator("#save").click();
      await page.locator("#journeyNotesClose").click();
      await page.reload();
      await page.locator("#continue").click();
      await page.waitForFunction(() => GuanqiGame.viewState().journey.room === "garden");
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().journey.shield),true,"the real local save must preserve stage and puzzle state");
      await page.locator("#journeyNext").click();
      await page.waitForFunction(() => GuanqiGame.viewState().journey.room === "ferry");
      await page.locator("#dialogueSkip").click();
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.renderHealth).scope === "ferry");
      const ferryHealth=await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.renderHealth));
      assert.equal(ferryHealth.opaque,25);assert(ferryHealth.uniqueColors>=5,"the final stage must contain visible rendered geometry");
      await page.screenshot({path:path.join(os.tmpdir(),`guanqi-ferry-${viewport.width}-before.png`)});
      await drag(page,mobile,await center(page.locator("#journeyLetter")),await center(page.locator("#journeyBoatLabel")));
      await page.waitForFunction(() => GuanqiGame.viewState().chapterComplete);
      assert.equal(await page.evaluate(() => GuanqiGame.saveShape().inventory.letter),0);
      assert.equal(await page.evaluate(() => GuanqiGame.saveShape().endingSnapshot.route),"mixed");
      await page.locator("#dialogueSkip").click();
      await page.screenshot({path:path.join(os.tmpdir(),`guanqi-ferry-${viewport.width}-complete.png`)});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth),false,"the full chapter UI must fit small screens");
      await page.locator("#journeyNotes").click();
      await page.locator("#save").click();
      await page.locator("#load").click();
      await page.locator("#journeyNotebook").waitFor({state:"hidden"});
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().journey.delivered),true);
      await page.locator("#journeyNotes").click();
      await page.locator("#newGame").click();
      await page.locator("#start").waitFor({state:"visible"});
      assert.equal(await page.locator("#journeyNotebook").isVisible(),false,"the native notebook must not trap a new-game or load operation");
      await page.locator("#continue").click();
      await page.waitForFunction(() => GuanqiGame.viewState().journey.delivered);
      await page.locator("#journeyNotes").click();
      await page.locator("#journeyExplore").click();
      await page.waitForFunction(() => !GuanqiGame.viewState().journey.active);
      const before = await page.evaluate(() => GuanqiGame.viewState().player);
      await page.keyboard.down("ArrowRight");
      await page.waitForFunction(x => GuanqiGame.viewState().player.x > x + 2, before.x);
      await page.keyboard.up("ArrowRight");
      const after = await page.evaluate(() => GuanqiGame.viewState());
      assert(after.player.y < before.y, "screen-right movement must follow the fixed camera basis");
      await page.locator("#returnJourney").click();
      await page.waitForFunction(() => GuanqiGame.viewState().journey.active);
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().journey.delivered),true);
      assert.deepEqual(errors, []);
      console.log(`PASS: ${viewport.width}x${viewport.height}, courtyard, zoom/pan, shaft drag, root drag, waterwheel, reversible wind boards, plant shelter, local save/resume, handover, ending and optional legacy map`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
