#!/usr/bin/env node
// SC-167's stills and recordings for the board, from the mockups served by design3's server (8787 by default):
//   node design3/designs/SC-167/shoot.mjs [--base http://127.0.0.1:8787/designs/SC-167] [--only a,b,c] [--video]
// PNG originals go to src/frames/option-<x>/ (gitignored); convert with cwebp and ffmpeg afterwards (convert.sh).
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
const here = path.dirname(new URL(import.meta.url).pathname);
const { chromium } = createRequire(path.resolve(here, "../../../frontend/testing/package.json"))("@playwright/test");
const args = process.argv.slice(2); const arg = k => { const i = args.indexOf("--" + k); return i < 0 ? null : args[i + 1]; };
const base = arg("base") || "http://127.0.0.1:8787/designs/SC-167";
const only = (arg("only") || "a,b,c").split(",");
// [name, query, width, height, theme, wait ms, keys to press]
const SHOTS = {
  a: [
    ["lobby-1440-light", "", 1440, 900, "light", 2600],
    ["lobby-1440-dark", "", 1440, 900, "dark", 2600],
    ["lobby-390-light", "", 390, 844, "light", 2600],
    ["console-1440-light", "?at=0.1.1", 1440, 900, "light", 5200],
    ["chips-1440-light", "?at=1.6.2", 1440, 900, "light", 4000],
    ["slow-1440-dark", "?at=3.2.2", 1440, 900, "dark", 4000],
    ["end-1440-light", "?at=1.8.5", 1440, 900, "light", 3500, ["ArrowRight"]],
    ["play-390-light", "?at=2.3.2", 390, 844, "light", 4000],
  ],
  b: [
    ["map-1440-light", "", 1440, 900, "light", 3600],
    ["map-1440-dark", "", 1440, 900, "dark", 3600],
    ["map-390-light", "", 390, 844, "light", 2600],
    ["console-1440-light", "?at=0.5.1", 1440, 900, "light", 5200],
    ["hop-1440-light", "?at=0.5.2", 1440, 900, "light", 4200, ["ArrowRight"]],
    ["chips-1440-light", "?at=1.6.2", 1440, 900, "light", 4000],
    ["mango-1440-dark", "?at=2.3.2", 1440, 900, "dark", 4000],
    ["slow-1440-light", "?at=3.2.2", 1440, 900, "light", 4000],
    ["yes-1440-dark", "?at=3.3.1", 1440, 900, "dark", 4200],
    ["end-1440-light", "?at=3.4.2", 1440, 900, "light", 3600, ["ArrowRight", "ArrowRight", "ArrowRight"]],
    ["play-390-light", "?at=1.6.1", 390, 844, "light", 4000],
  ],
  c: [
    ["title-1440-light", "", 1440, 900, "light", 2600],
    ["title-1440-dark", "", 1440, 900, "dark", 2600],
    ["title-390-light", "", 390, 844, "light", 2600],
    ["card-1440-dark", "?at=2.0.0", 1440, 900, "dark", 2400],
    ["console-1440-light", "?at=0.2.0", 1440, 900, "light", 5200],
    ["chips-1440-dark", "?at=1.2.2", 1440, 900, "dark", 4200],
    ["yes-1440-light", "?at=3.3.1", 1440, 900, "light", 4200],
    ["end-1440-dark", "?at=3.4.2", 1440, 900, "dark", 3600, ["ArrowRight", "ArrowRight", "ArrowRight"]],
    ["play-390-light", "?at=3.2.2", 390, 844, "light", 4200],
  ],
};
// [name, query, seconds, steps]: a step is [ms, "click", selector] or [ms, "key", key] or [ms, "hover", selector]
const VIDEOS = {
  a: [["motion", "", 16, [[2200, "click", ".la-card:nth-child(2) .btn"], [2600, "click", "[aria-label='Autoplay']"]]]],
  b: [["motion", "", 7, [[3800, "hover", ".rb-badge"]]], ["hop", "?at=0.5.1&play=1", 13, []]],
  c: [["motion", "", 18, [[2200, "click", ".sh-play"]]]],
};
const browser = await chromium.launch();
for (const o of only) {
  const dir = path.join(here, "src", "frames", `option-${o}`); fs.mkdirSync(dir, { recursive: true });
  for (const [name, q, w, h, theme, wait, keys] of SHOTS[o]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    const page = await ctx.newPage(); const errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    const sep = q ? "&" : "?";
    await page.goto(`${base}/option-${o}/mockup.html${q}${sep}theme=${theme}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(wait);
    for (const k of keys || []) { await page.keyboard.press(k); await page.waitForTimeout(900); }
    if (keys) await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(dir, `${name}.png`) });
    console.log(`${o} ${name}: ${errors.length ? "ERRORS " + errors.join(" | ") : "ok"}`);
    await ctx.close();
  }
  if (!args.includes("--video")) continue;
  for (const [name, q, seconds, steps] of VIDEOS[o]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light", recordVideo: { dir, size: { width: 1440, height: 900 } } });
    const page = await ctx.newPage();
    await page.goto(`${base}/option-${o}/mockup.html${q}${q ? "&" : "?"}theme=light`, { waitUntil: "networkidle" });
    let t = 0;
    for (const [at, kind, what] of steps) {
      await page.waitForTimeout(Math.max(0, at - t)); t = at;
      if (kind === "click") await page.click(what); else if (kind === "key") await page.keyboard.press(what); else if (kind === "hover") await page.hover(what);
    }
    await page.waitForTimeout(Math.max(0, seconds * 1000 - t));
    const v = page.video(); await ctx.close();
    fs.renameSync(await v.path(), path.join(dir, `${name}.webm`)); console.log(`${o} ${name}: ${seconds}s`);
  }
}
await browser.close();
