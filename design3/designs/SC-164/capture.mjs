#!/usr/bin/env node
// SC-164 · stills and recordings for the review board, on the frontend's Playwright (corepack pnpm install in frontend/).
// Serve design3 with byte ranges first, so the film can seek: npx http-server design3 -p 8791 -c-1
//   node design3/designs/SC-164/capture.mjs [--base http://127.0.0.1:8791] [--only current,a,b,c] [--no-motion]
// Writes PNG originals to src/frames/<what>/ (gitignored); frames.py turns them into WebP beside the board.
//   current: the page as it is, at its three ways into the demo (the hero, the pill, the close)
//   a, b, c: each option at rest, playing (Watch pressed) and ended, in light and dark at 1440 and on a phone, and a
//            recording of Watch pressed, the film playing, a chapter picked, and its end
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith("--") ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true] : []).filter(Boolean));
const here = path.dirname(new URL(import.meta.url).pathname);
const { chromium } = createRequire(path.resolve(here, "../../../frontend/testing/package.json"))("@playwright/test");
const base = args.base || "http://127.0.0.1:8791";
const only = (args.only || "current,a,b,c").split(",");
const VIEWS = [["light-1440", 1440, 900, "light"], ["dark-1440", 1440, 900, "dark"], ["light-390", 390, 844, "light"]];
const browser = await chromium.launch();
const shot = async (dir, name, w, h, theme, url, prep) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme });
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", e => errors.push(String(e))); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${url}${url.includes("?") ? "&" : "?"}theme=${theme}`, { waitUntil: "load" });
  await page.waitForTimeout(2600);
  if (prep) await prep(page);
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
  console.log(`${path.basename(dir)} ${name}: ${errors.length ? "ERRORS " + errors.join(" | ") : "no errors"}`);
  await ctx.close();
};
const watch = page => page.locator(".film-ctas").getByText("Watch the 5-minute demo").click();

if (only.includes("current")) {
  const dir = path.join(here, "src", "frames", "current"); fs.mkdirSync(dir, { recursive: true });
  const url = `${base}/site/Smart-Clearance%20site%20v3.html`;
  for (const [name, w, h, theme] of VIEWS) {
    await shot(dir, `hero-${name}`, w, h, theme, url, async p => { await p.waitForTimeout(1500); });
    await shot(dir, `pill-${name}`, w, h, theme, url, async p => { await p.locator("#ledger").scrollIntoViewIfNeeded(); await p.waitForTimeout(1600); });
    await shot(dir, `close-${name}`, w, h, theme, url, async p => { await p.locator(".close").scrollIntoViewIfNeeded(); await p.waitForTimeout(1600); });
  }
}
for (const o of ["a", "b", "c"].filter(x => only.includes(x))) {
  const dir = path.join(here, "src", "frames", `option-${o}`); fs.mkdirSync(dir, { recursive: true });
  const url = `${base}/designs/SC-164/option-${o}/mockup.html?switch=0`;
  const toRest = async p => { if (o === "b") { await p.locator("#film").scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -40)); await p.waitForTimeout(1400); } };
  const toPlaying = async p => { await watch(p); await p.waitForTimeout(o === "a" ? 2600 : 3200); if (o === "b") { await p.locator(".fb-frame").evaluate(e => e.scrollIntoView({ block: "center" })); await p.waitForTimeout(600); } };
  for (const [name, w, h, theme] of VIEWS) {
    await shot(dir, `rest-${name}`, w, h, theme, url, toRest);
    await shot(dir, `playing-${name}`, w, h, theme, url, toPlaying);
    await shot(dir, `end-${name}`, w, h, theme, `${url}&state=end`, async p => { if (o === "b") await toRest(p); await p.waitForTimeout(800); });
  }
  if (args["no-motion"]) continue;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "light", recordVideo: { dir, size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  await page.goto(`${url}&theme=light`, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  await watch(page); await page.waitForTimeout(5200);
  // a chapter picked: the stand-in holds the first 30 s, so the second chapter
  await page.locator(".fp-ch button").nth(1).click(); await page.waitForTimeout(3000);
  // the end: the stand-in run to its last second
  await page.evaluate(() => { const v = document.querySelector(".fp-media video"); if (v) v.currentTime = v.duration - 1.2; });
  await page.waitForTimeout(4200);
  const v = page.video(); await ctx.close();
  fs.renameSync(await v.path(), path.join(dir, "motion.webm")); console.log(`${o} motion`);
}
await browser.close();
