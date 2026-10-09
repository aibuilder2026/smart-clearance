// SC-112's motion recordings: each option played through at 1440 × 900 from the design3 server (8787), recorded by
// Playwright and saved as option-x/motion.mp4 with ffmpeg (the webm original stays in src/).
//   node design3/designs/SC-112/record.mjs [a|b|c ...]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pw = "frontend/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
const local = join(here, "../../..", pw);
const { chromium } = await import(existsSync(local) ? local : join(process.env.SC_MAIN || "/Users/arundutta/projects/smart-clearance", pw));
const BASE = process.env.SC112_BASE || "http://127.0.0.1:8787/designs/SC-112";

// click the first visible element that matches, as a person would
async function tap(page, sel, wait = 1500) {
  const el = page.locator(sel).filter({ visible: true }).first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await el.hover().catch(() => {}); await page.waitForTimeout(250);
  await el.click(); await page.waitForTimeout(wait);
}
const FLOWS = {
  a: async page => {
    await tap(page, ".sb-batch >> nth=0", 1700);
    await tap(page, ".sc-tab:has-text('Journey')", 1500);
    await tap(page, ".sc-tab:has-text('Execution')", 1500);
    await tap(page, ".sc-tab:has-text('Paperwork')", 1500);
    await tap(page, ".sc-tab:has-text('Route Room')", 1500);
    await tap(page, ".sb-batch:has-text('Mango')", 1700);
    await tap(page, ".nb-back", 1500);
  },
  b: async page => {
    await tap(page, ".sb-item:has-text('Batches')", 1700);
    await tap(page, ".rl-row:has-text('Masala Chips') >> nth=0", 1700);
    await tap(page, ".rl-part:has-text('Execution')", 1500);
    await tap(page, ".rl-part:has-text('Journey')", 1500);
    await tap(page, ".rl-row:has-text('Mango')", 1700);
    await tap(page, ".rl-back", 1700);
  },
  c: async page => {
    await tap(page, "button:has-text('Review and approve') >> nth=0", 1900);
    await tap(page, "button[aria-label^='Verify']", 1600);
    await tap(page, "button[aria-label^='Value']", 1600);
    await tap(page, "button[aria-label^='Decide']", 1600);
    await tap(page, "button[aria-label^='Execute']", 1900);
    await tap(page, "button[aria-label^='Detect']", 1900);
    await tap(page, ".c-switch", 900);
    await tap(page, "[role^=menuitem]:has-text('Mango')", 1900);
  },
};

const which = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(FLOWS);
const browser = await chromium.launch();
for (const o of which) {
  const dir = join(here, "src", "rec-" + o); mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light", recordVideo: { dir, size: { width: 1440, height: 900 } } });
  await ctx.addInitScript(() => { try { localStorage.setItem("sc3-theme", "light"); } catch (e) {} });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.error("pageerror", o, e.message));
  await page.goto(`${BASE}/option-${o}/mockup.html`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: ".sc112-moments { display: none !important; }" });
  await page.waitForTimeout(1600);
  await FLOWS[o](page);
  await page.waitForTimeout(600);
  const video = page.video(); await ctx.close();
  const webm = await video.path(); const keep = join(dir, "motion.webm"); renameSync(webm, keep);
  const mp4 = join(here, "option-" + o, "motion.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", keep, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "27", "-preset", "slow", "-movflags", "+faststart", "-an", mp4]);
  console.log("recorded", o, readdirSync(dir).length);
}
await browser.close();
