#!/usr/bin/env node
// SC-187: screens that need no journey: the guided demo's route map (the live site) and the landing page's hero.
//   SC_REPO=/Users/arundutta/projects/smart-clearance node capture-extra.mjs
import { createRequire } from "node:module";
import path from "node:path";
const MAIN = process.env.SC_REPO || path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../..");
const require = createRequire(path.join(MAIN, "frontend/testing/package.json"));
const { chromium } = require("@playwright/test");
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "extra");
const browser = await chromium.launch();
const shots = [
  ["https://smartclearance-demo.web.app/", "extra--demo-route-map", { width: 1600, height: 1000 }, 2, 6000],
  ["https://smartclearance.web.app/", "extra--landing-hero", { width: 1600, height: 1000 }, 2, 9000],
];
for (const [url, name, viewport, dpr, wait] of shots) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, reducedMotion: "no-preference", colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`${name}: ${url}`);
  await ctx.close();
}
await browser.close();
