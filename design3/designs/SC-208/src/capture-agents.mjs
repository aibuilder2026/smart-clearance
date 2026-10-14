// SC-205: the console sign-in's agents at work, captured frame-exact from production at 2x, slowed.
//   node capture-agents.mjs <outdir> [seconds=26] [scale=0.33] [theme=dark]
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const [out, secs = '26', scale = '0.33', theme = 'dark'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const FPS = 25;
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: 'no-preference' });
await ctx.addInitScript({ content: readFileSync(new URL('./vclock.js', import.meta.url), 'utf8') });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('page error:', m.text().slice(0, 200)));
await page.goto('https://smartclearance-console.web.app/', { waitUntil: 'networkidle' });
await page.getByText('Watcher', { exact: true }).first().waitFor({ timeout: 30000 });
await page.waitForTimeout(4000); // the splash lifts, the fonts land, the field settles
await page.evaluate(() => document.fonts.ready);
// start on the walk's first moment: wait in real time for the caption before it sets off
await page.waitForFunction(() => document.querySelector('.ag-caption .n')?.textContent?.startsWith('A batch'), null, { timeout: 30000, polling: 10 });
await page.evaluate(() => (window.__vt.follow = false));
const dt = (1000 / FPS) * Number(scale);
const n = Math.round(Number(secs) * FPS);
const log = [];
for (let i = 0; i < n; i++) {
	await page.evaluate((d) => window.__vt.step(d), dt);
	const k = await page.evaluate(() => [...document.querySelectorAll('.ag-caption .n, .ag-caption b')].map((e) => e.textContent.trim()).join(' | '));
	log.push(`${i}\t${k}`);
	await page.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94, animations: 'allow', caret: 'initial' });
	if (i % 50 === 0) console.log(i, '/', n, k);
}
writeFileSync(`${out}/log.tsv`, log.join('\n'));
await browser.close();
