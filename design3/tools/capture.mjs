#!/usr/bin/env node
// Capture a design option page for its review board: stills in light and dark at 1440 and on a phone, and a short
// recording of the page as it plays (SC-154). Uses the frontend's Playwright (corepack pnpm install in frontend/ first).
//   node design3/tools/capture.mjs --base http://127.0.0.1:8789/designs/SC-154 --out design3/designs/SC-154 --options a,b,c [--seconds 10]
// Writes option-<x>/{light-1440,dark-1440,light-390}.png and option-<x>/motion.webm into --out/src/frames (PNG originals,
// gitignored); convert to WebP and MP4 afterwards (frames.py's Pillow, ffmpeg).
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith("--") ? [a.slice(2), all[i + 1]] : []).filter(Boolean));
const here = path.dirname(new URL(import.meta.url).pathname);
const { chromium } = createRequire(path.resolve(here, "../../frontend/testing/package.json"))("@playwright/test");
const base = args.base, out = path.resolve(args.out), seconds = Number(args.seconds || 10);
const options = (args.options || "a,b,c").split(",");
const browser = await chromium.launch();
for (const o of options) {
  const dir = path.join(out, "src", "frames", `option-${o}`); fs.mkdirSync(dir, { recursive: true });
  const url = `${base}/option-${o}/mockup.html?switch=0`;
  for (const [name, w, h, theme] of [["light-1440", 1440, 900, "light"], ["dark-1440", 1440, 900, "dark"], ["light-390", 390, 844, "light"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme });
    const page = await ctx.newPage(); const errors = [];
    page.on("pageerror", e => errors.push(String(e))); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${url}&theme=${theme}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(dir, `${name}.png`) });
    console.log(`${o} ${name}: ${errors.length ? "ERRORS " + errors.join(" | ") : "no errors"}`);
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "light", recordVideo: { dir, size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  await page.goto(`${url}&theme=light`, { waitUntil: "networkidle" });
  await page.waitForTimeout(seconds * 1000);
  const v = page.video(); await ctx.close();
  const p = await v.path(); fs.renameSync(p, path.join(dir, "motion.webm")); console.log(`${o} motion: ${seconds}s`);
}
await browser.close();
