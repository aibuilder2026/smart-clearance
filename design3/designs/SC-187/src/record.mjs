#!/usr/bin/env node
// SC-187: the interactions for the demo film, recorded on the workspace app's STUB (no backend): the yes, a kirana's
// order, and the certificate signed in place. The journey is put at the stage each needs by design3's own core
// scripts (money.js, data.js, store.js, flow.js, as the e2e spec's storeAt does), the store written before the app
// loads; a cursor init script (the journey stage's, SC-179) draws an arrow that glides to each press and ripples.
//   SC_REPO=/path/to/main node record.mjs --flow approve|order|sign|all [--origin http://localhost:4197] [--out clips]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const WT = path.resolve(HERE, "../../../.."); // this worktree: its design3 core and its stub build
const MAIN = process.env.SC_REPO || WT; // the Playwright install
const require = createRequire(path.join(MAIN, "frontend/testing/package.json"));
const { chromium, expect } = require("@playwright/test");
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]] : [])).filter(Boolean));
const ORIGIN = args.origin || "http://localhost:4197";
const OUT = path.resolve(args.out || path.join(HERE, "clips"));
fs.mkdirSync(OUT, { recursive: true });
const CHIPS = "MF-2409-117";

// --- the stub's journey at a stage (frontend/workspace/tests/e2e/workspace.ts storeAt) ---------------------------
const CORE = ["core/money.js", "core/papers.js", "core/data.js", "core/store.js", "core/flow.js"];
function storeAt(stage, after = [], scenario = "chips") {
  const window = { SC3_IMG: "sc3img:/" };
  const sandbox = vm.createContext({ window, console, Date, Intl, Math, JSON, btoa, unescape, encodeURIComponent });
  for (const p of CORE) vm.runInContext(fs.readFileSync(path.join(WT, "design3", p), "utf8"), sandbox);
  if (scenario !== "chips") window.SC3_FLOW.useScenario(scenario);
  window.SC3_FLOW.fastForward(stage);
  for (const a of after) window.SC3_FLOW.act(a);
  return JSON.stringify(window.SC3_STORE.get());
}

// --- the cursor (frontend/workspace/tests/journey/stage.ts CURSOR) -------------------------------------------------
const GLIDE = 520;
const CURSOR = `(() => {
	if (window.__e2eCursor) return;
	window.__e2eCursor = true;
	const KEY = 'e2e-cursor';
	const at = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
	const make = () => {
		let c = document.getElementById('e2e-cursor');
		if (c) return c;
		c = document.createElement('div');
		c.id = 'e2e-cursor';
		c.setAttribute('aria-hidden', 'true');
		c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M4 2.5v18.2l5-4.5 3.3 7.3 3.2-1.4-3.2-7.2 6.9-.3z" fill="#141a17" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
		c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transition:transform ${GLIDE - 60}ms cubic-bezier(.25,.7,.2,1);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))';
		const p = at() || [innerWidth * 0.55, innerHeight * 0.62];
		c.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
		document.documentElement.appendChild(c);
		return c;
	};
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', make); else make();
	addEventListener('mousemove', (e) => {
		const c = make();
		c.style.transitionDuration = e.buttons & 1 ? '0ms' : '${GLIDE - 60}ms';
		c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
		try { sessionStorage.setItem(KEY, JSON.stringify([e.clientX, e.clientY])); } catch {}
	}, true);
	addEventListener('mousedown', (e) => {
		if (e.target instanceof Element && e.target.closest('.signpad')) return;
		const r = document.createElement('div');
		r.setAttribute('aria-hidden', 'true');
		r.style.cssText = 'position:fixed;left:' + (e.clientX - 22) + 'px;top:' + (e.clientY - 22) + 'px;width:44px;height:44px;border-radius:50%;border:3px solid #f5c542;background:rgba(245,197,66,.28);z-index:2147483646;pointer-events:none;transform:scale(.35);opacity:1;transition:transform .5s ease-out,opacity .6s ease-out';
		document.documentElement.appendChild(r);
		requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transform = 'scale(1.5)'; r.style.opacity = '0'; }));
		setTimeout(() => r.remove(), 800);
	}, true);
})();`;

const DESKTOP = { viewport: { width: 1600, height: 1000 }, dpr: 1, size: { width: 1600, height: 1000 } };
// Playwright records the viewport at CSS size (a larger video size leaves the page in a corner), so the phone is 390×844
const PHONE = { viewport: { width: 390, height: 844 }, dpr: 2, size: { width: 390, height: 844 } };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let mouseAt = [0, 0];
/** the pointer glides to a point in a few steps, so the cursor is seen on its way */
async function glide(page, x, y, ms = 650) {
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = 1 - Math.pow(1 - t, 3);
    await page.mouse.move(mouseAt[0] + (x - mouseAt[0]) * e, mouseAt[1] + (y - mouseAt[1]) * e);
    await sleep(ms / steps);
  }
  mouseAt = [x, y];
}
/** a person presses a control: the cursor glides to it, rests, then clicks it */
async function press(page, locator, rest = 350) {
  await locator.scrollIntoViewIfNeeded();
  await sleep(250);
  const b = await locator.boundingBox();
  if (!b) throw new Error("no box for the control");
  await glide(page, b.x + b.width / 2, b.y + b.height / 2);
  await sleep(rest);
  await page.mouse.down(); await sleep(90); await page.mouse.up();
}
/** the page scrolled by the wheel, slowly, as someone reads */
async function wheel(page, dy, ticks = 8) {
  for (let i = 0; i < ticks; i++) { await page.mouse.wheel(0, dy / ticks); await sleep(70); }
}

async function openAs(page, who, p, { stage = 9, after = [], scenario = "chips" } = {}) {
  await page.addInitScript(([store, uid]) => {
    try {
      if (sessionStorage.getItem("sc-film")) return;
      sessionStorage.setItem("sc-film", "1");
      localStorage.setItem("sc3-store", store);
      localStorage.setItem("sc3-session", JSON.stringify({ uid, at: 1 }));
      sessionStorage.setItem("sc3-app-splash", "1");
    } catch {}
  }, [storeAt(stage, after, scenario), who]);
  await page.goto(ORIGIN + p);
  await page.waitForSelector(".app[data-mounted] .largetitle h1, .app[data-mounted] .bhead h1, .app[data-mounted] #main");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});
}

async function record(name, frame, flow) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: frame.viewport, deviceScaleFactor: frame.dpr, colorScheme: "light", isMobile: frame === PHONE, hasTouch: false, recordVideo: { dir: OUT, size: frame.size }, serviceWorkers: "block" });
  await ctx.addInitScript(CURSOR);
  const page = await ctx.newPage();
  mouseAt = [frame.viewport.width * 0.55, frame.viewport.height * 0.62];
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  let ok = true;
  try { await flow(page); } catch (e) { ok = false; console.log(`${name}: FAILED ${String(e).split("\n")[0]}`); await page.screenshot({ path: path.join(OUT, `${name}--failed.png`) }).catch(() => {}); }
  const video = page.video();
  await ctx.close();
  const tmp = await video.path();
  const file = path.join(OUT, `${name}.webm`);
  fs.renameSync(tmp, file);
  await browser.close();
  console.log(`${name}: ${ok ? "recorded" : "recorded (with a failure)"} ${file}${errors.length ? " ERRORS " + errors.join(" | ") : ""}`);
}

const FLOWS = {
  // (a) Priya at the chips' Route Room at the planned stage: the plan, the approve sheet, the yes, Execution (about 12 s)
  approve: () => record("ui-approve", DESKTOP, async (page) => {
    await openAs(page, "priya", `/route/${CHIPS}`, { stage: 5 });
    await sleep(1800);
    await wheel(page, 520, 10);
    await sleep(900);
    const review = page.getByRole("button", { name: "Review and approve" });
    await press(page, review);
    const sheet = page.getByRole("dialog", { name: "Approve the plan" });
    await expect(sheet).toBeVisible();
    await sleep(1600);
    await press(page, sheet.getByRole("button", { name: "Approve · release the agents" }), 500);
    const placed = page.getByRole("dialog", { name: "Plan placed" });
    await expect(placed.getByRole("button", { name: "Watch execution" })).toBeVisible({ timeout: 15000 });
    await sleep(1500);
    await press(page, placed.getByRole("button", { name: "Watch execution" }));
    await page.waitForURL(/\/execution\//, { timeout: 10000 });
    await sleep(3500);
  }),
  // (b) Ganesh ji on the phone at the offer after approval: the Hindi offer read, the order, its invoice (about 10 s)
  order: () => record("ui-order", PHONE, async (page) => {
    await openAs(page, "ganesh", `/offer/${CHIPS}`, { stage: 6, after: ["list", "outreach"] });
    await sleep(1600);
    await wheel(page, 420, 8);
    await sleep(1200);
    const order = page.getByRole("button", { name: /· \d+ packets/ });
    await press(page, order, 450);
    await expect(page.getByText(/ऑर्डर हो गया|Ordered/).first()).toBeVisible({ timeout: 15000 });
    await sleep(2200);
    // the order's page with its tax invoice: the kirana's Orders names it, and the invoice opens in its sheet
    const invoice = page.getByRole("button", { name: /Tax invoice/ }).first();
    if (await invoice.count()) {
      await press(page, invoice);
      await sleep(2500);
    } else {
      await page.goto(ORIGIN + "/orders");
      await page.waitForSelector(".app[data-mounted] #main");
      await sleep(1200);
      const row = page.getByRole("button", { name: /Masala Chips/ }).first();
      if (await row.count()) { await press(page, row); await sleep(1500); }
      const inv = page.getByRole("button", { name: /Tax invoice/ }).first();
      if (await inv.count()) { await press(page, inv); await sleep(2500); }
    }
  }),
  // (c) the slow week on expiry day: Rakesh attaches the two photos and signs the certificate in its four places (about 15 s)
  sign: () => record("ui-sign", DESKTOP, async (page) => {
    // the stub's agents play a partner nobody plays after 12 s (flow.ts: sendDestruction, delay 12000), which would send
    // the evidence with the specimen signatures under Rakesh's hands; that one timer is dropped so he signs himself
    await page.addInitScript(() => {
      const st = window.setTimeout;
      window.setTimeout = (fn, ms, ...a) => (ms === 12000 ? 0 : st(fn, ms, ...a));
    });
    await openAs(page, "rakesh", `/destroy/${CHIPS}`, { scenario: "slow", stage: 8, after: ["vanRound", "expire"] });
    await sleep(1200);
    for (const which of ["before", "after"]) {
      const take = page.getByRole("button", { name: `Take the ${which} photo` });
      if (await take.count()) { await press(page, take, 200); await sleep(600); }
    }
    const cert = page.locator("#dz-cert");
    if (await cert.count() && !(await cert.inputValue())) { await press(page, cert); await page.keyboard.type("OCE/DC/26-27/0219", { delay: 45 }); await sleep(500); }
    await expect(page.getByText("0 of 4 signed")).toBeVisible();
    for (let i = 0; i < 4; i++) {
      const here = page.locator(".dz-here").first();
      if (!(await here.count())) break;
      await press(page, here, 200);
      const sheet = page.getByRole("dialog");
      const pad = sheet.locator(".signpad svg");
      await expect(pad).toBeVisible();
      await sleep(350);
      const box = await pad.boundingBox();
      // a signature: a tall first loop, a run of humps, and a flourish underneath, each stroke a curve of many points
      const strokes = [
        (t) => [0.12 + 0.18 * t, 0.66 - 0.55 * Math.sin(Math.PI * t) + 0.1 * t],
        (t) => [0.28 + 0.44 * t, 0.58 - 0.2 * Math.abs(Math.sin(Math.PI * 3.5 * t)) + 0.08 * Math.sin(Math.PI * t)],
        (t) => [0.16 + 0.6 * t, 0.84 - 0.07 * Math.sin(Math.PI * 2 * t)],
      ];
      for (const f of strokes) {
        const pts = Array.from({ length: 20 }, (_, k) => f(k / 19)).map(([u, v]) => [box.x + u * box.width, box.y + v * box.height]);
        await page.mouse.move(pts[0][0], pts[0][1]);
        await sleep(40);
        await page.mouse.down();
        for (const [x, y] of pts.slice(1)) { await page.mouse.move(x, y, { steps: 2 }); await sleep(6); }
        await page.mouse.up();
        mouseAt = pts[pts.length - 1];
        await sleep(120);
      }
      await sleep(350);
      await press(page, sheet.getByRole("button", { name: /^Sign as / }), 200);
      await expect(sheet).toBeHidden({ timeout: 8000 });
      await sleep(450);
    }
    await expect(page.getByText("4 of 4 signed")).toBeVisible();
    await sleep(2200);
  }),
};

const which = args.flow === "all" || !args.flow ? Object.keys(FLOWS) : [args.flow];
for (const f of which) await FLOWS[f]();
