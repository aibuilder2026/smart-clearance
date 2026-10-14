// SC-207: the guided demo's landing page (smartclearance-demo.web.app), captured frame-exact at 2x on the virtual
// clock (vclock.js): the route map at rest, then "Play the whole route" pressed and the demo setting off. The pointer is
// drawn in the film, from moves.json.
//   node capture-demo.mjs <outdir>
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const [out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const FPS = 25, N = 170, CLICK = 70;
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'no-preference', serviceWorkers: 'block' });
await ctx.addInitScript({ content: readFileSync(new URL('./vclock.js', import.meta.url), 'utf8') });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('page error:', m.text().slice(0, 200)));
await page.goto('https://smartclearance-demo.web.app/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Play the whole route/ }).waitFor({ timeout: 30000 });
await page.waitForTimeout(5000);
await page.evaluate(() => document.fonts.ready);
const b = await page.getByRole('button', { name: /Play the whole route/ }).evaluate((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
const target = [b[0] + b[2] * 0.42, b[1] + b[3] * 0.55];
await page.evaluate(() => (window.__vt.follow = false));
for (let i = 0; i < N; i++) {
	if (i === CLICK - 12) await page.mouse.move(target[0], target[1]);   // the hover, a moment before the press
	if (i === CLICK) { await page.mouse.down(); await page.mouse.up(); }
	await page.evaluate((d) => window.__vt.step(d), 1000 / FPS);
	await page.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94, animations: 'allow', caret: 'initial' });
	if (i % 30 === 0) console.log(i, '/', N);
}
writeFileSync(`${out}/moves.json`, JSON.stringify({ size: [1600, 900], button: b, target, hover: CLICK - 12, click: CLICK }, null, 1));
await browser.close();
