// Records walkthrough.html headlessly with Playwright's built-in video recorder.
// Output: out/raw.webm and out/offset.json (seconds between recording start and the page's clock start).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const HTML = 'file://' + resolve('walkthrough.html') + '?autoplay=1';
const TOTAL = 180;
mkdirSync('out', { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: 'out', size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto(HTML, { waitUntil: 'load' });
await page.waitForFunction(() => window.__startWall > 0, null, { timeout: 15000 });
const startWall = await page.evaluate(() => window.__startWall);
const offset = (startWall - t0) / 1000;
console.log(`page clock started ${offset.toFixed(2)}s after recording began`);
await page.waitForTimeout((TOTAL + 1.5) * 1000);
const video = page.video();
await ctx.close();
const path = await video.path();
renameSync(path, 'out/raw.webm');
writeFileSync('out/offset.json', JSON.stringify({ offset, total: TOTAL }));
await browser.close();
console.log('wrote out/raw.webm');
