const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const { chromium } = require("playwright");

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
    for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
      const mobile = viewport.width < 640;
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
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
      await page.locator("#courtyardLamp").click();
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.lampLit), false);

      const slider = page.locator("#screenSlide"), handle = page.locator("#screenHandle");
      await slider.focus(); await page.keyboard.press("End");
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).slide > .999);
      const end = await handle.boundingBox();
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.screen), "cross");
      await slider.focus(); await page.keyboard.press("Home");
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).slide < .001);
      const start = await handle.boundingBox();
      const from = { x: start.x + start.width / 2, y: start.y + start.height / 2 };
      const to = { x: end.x + end.width / 2, y: end.y + end.height / 2 };
      if (mobile) {
        const touch = await page.context().newCDPSession(page);
        await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x, y: from.y }] });
        for (let i = 1; i <= 18; i++) await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + (to.x - from.x) * .7 * i / 18, y: from.y + (to.y - from.y) * .7 * i / 18 }] });
        await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await touch.detach();
      } else {
        await page.mouse.move(from.x, from.y);
        await page.mouse.down();
        await page.mouse.move(from.x + (to.x - from.x) * .7, from.y + (to.y - from.y) * .7, { steps: 18 });
        await page.mouse.up();
      }
      await page.waitForFunction(() => GuanqiGame.viewState().training.screen === "angled");
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).shelter > .99);
      const safe = await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.courtyard));
      assert(safe.screenX < 1 && safe.screenZ < 1, "dragging must move the actual screen geometry");
      await page.screenshot({ path: path.join(os.tmpdir(), `guanqi-courtyard-${viewport.width}-screen.png`) });

      await page.locator("#lampHandle").click();
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).bridge > .98);
      await page.screenshot({ path: path.join(os.tmpdir(), `guanqi-courtyard-${viewport.width}-lit.png`) });
      await slider.focus(); await page.keyboard.press("Home");
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.bridgeOpen), false, "moving the screen must invalidate the open route");
      await page.mouse.move(from.x, from.y);
      await page.waitForFunction(() => JSON.parse(document.getElementById("world3d").dataset.courtyard).slide < .001);
      await handle.focus();
      for (let i = 0; i < 17; i++) await page.keyboard.press("ArrowRight");
      await page.locator("#courtyardLamp").click();
      await page.locator("#courtyardWalk").click();
      await page.waitForFunction(() => GuanqiGame.viewState().training.complete, { timeout: 20000 });
      assert.equal((await page.evaluate(() => JSON.parse(document.getElementById("world3d").dataset.courtyard))).node, "gate");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "mobile content must fit the viewport");
      await page.locator("#courtyardNotes").click();
      assert(await page.locator("#courtyardSource").isVisible());
      await page.locator("#courtyardSourceClose").click();
      await page.screenshot({ path: path.join(os.tmpdir(), `guanqi-courtyard-${viewport.width}-complete.png`) });
      await page.locator("#courtyardNext").click();
      assert.equal(await page.evaluate(() => GuanqiGame.viewState().training.active), false);
      await page.locator("#dialogueSkip").click();
      const before = await page.evaluate(() => GuanqiGame.viewState().player);
      await page.keyboard.down("ArrowRight");
      await page.waitForFunction(x => GuanqiGame.viewState().player.x > x + 2, before.x);
      await page.keyboard.up("ArrowRight");
      const after = await page.evaluate(() => GuanqiGame.viewState());
      assert(after.player.y < before.y, "screen-right movement must follow the fixed camera basis");
      assert.deepEqual(errors, []);
      console.log(`PASS: ${viewport.width}x${viewport.height}, render, real screen drag, failure recovery, light, bridge, walk, completion, next scene`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
