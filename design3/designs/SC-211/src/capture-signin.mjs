// SC-207: Priya's sign-in on the live workspace (munchly-smartclearance.web.app) in dark mode at her tablet's size,
// captured frame-exact at 2x on the virtual clock (vclock.js): the agents behind the sign-in at work, her email typed
// into the field at a person's pace, a stand-in password, Sign in pressed. The sign-in request to Firebase is held and
// never answered, so nothing is sent and the button keeps saying it is signing in. The pointer is drawn in the film,
// from the moves written to moves.json.
//   node capture-signin.mjs <outdir>
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const [out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const FPS = 25, N = 180;
const EMAIL = 'priya.deshmukh@munchly.example';
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, colorScheme: 'dark', reducedMotion: 'no-preference', serviceWorkers: 'block' });
await ctx.route(/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/, () => {}); // held: never answered
await ctx.addInitScript({ content: readFileSync(new URL('./vclock.js', import.meta.url), 'utf8') });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('page error:', m.text().slice(0, 200)));
await page.goto('https://munchly-smartclearance.web.app/', { waitUntil: 'networkidle' });
await page.locator('input[type=email]').waitFor({ timeout: 30000 });
await page.waitForTimeout(5000); // the splash lifts, the fonts land, the agents set off
await page.evaluate(() => document.fonts.ready);
const box = async (sel) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
const email = await box('input[type=email]'), pass = await box('input[type=password]'), btn = await box('button[type=submit]');
const at = (b, fx = 0.5, fy = 0.5) => [b[0] + b[2] * fx, b[1] + b[3] * fy];
// the plan, frame by frame: [frame, action, target]
const plan = [[22, 'click', at(email, 0.22)], [92, 'click', at(pass, 0.22)], [128, 'click', at(btn)]];
const keys = [];
[...EMAIL].forEach((c, i) => keys.push([26 + i * 2, c]));
for (let i = 0; i < 12; i++) keys.push([96 + i * 2, 'x']);   // a stand-in: the field shows only its dots
await page.evaluate(() => (window.__vt.follow = false));
const log = [];
for (let i = 0; i < N; i++) {
	for (const [f, act, p] of plan) if (f === i) { await page.mouse.move(p[0], p[1]); await page.mouse.down(); await page.mouse.up(); log.push([i, act, p]); }
	for (const [f, c] of keys) if (f === i) await page.keyboard.type(c);
	await page.evaluate((d) => window.__vt.step(d), 1000 / FPS);
	await page.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94, animations: 'allow', caret: 'initial' });
	if (i % 30 === 0) console.log(i, '/', N);
}
writeFileSync(`${out}/moves.json`, JSON.stringify({ size: [1180, 820], email, pass, btn, clicks: log }, null, 1));
await browser.close();
