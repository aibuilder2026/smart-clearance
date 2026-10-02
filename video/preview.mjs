// Renders check frames of walkthrough.html at given times (seconds) without recording.
// usage: node preview.mjs "intro:9,warning:28,doors:66,plan:90"  (name:absolute-seconds, waits settle time)
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
mkdirSync('out/preview', { recursive: true });
const spec = (process.argv[2] || 'intro:9,warning:30,photo:46,doors:68,plan:91,selling:114,road:126,paperwork:142,report:156,mango:168,outro:176')
  .split(',').map(p => { const [n, t] = p.split(':'); return [n, parseFloat(t)]; });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('file://' + resolve('walkthrough.html'), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => { document.getElementById('play').hidden = true; window.start(); });
for (const [name, t] of spec) {
  // jump to 3 s before the target so entrance animations settle, then let it play to t
  await page.evaluate((t) => { startWall = performance.now() - (t - 3) * 1000; }, t);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `out/preview/${name}.png` });
  console.log('shot', name, 'at', t);
}
await browser.close();
