// SC-205: the production landing page, captured frame-exact at 2x on the virtual clock (vclock.js), segment by
// segment: each segment jumps to a scroll position, lets the page settle, then steps 1/25 s a frame. The hero film is
// paused and seeked to the virtual time each frame, so it plays at exactly 1x.
//   node capture-landing.mjs <outdir>
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const [out] = process.argv.slice(2);
const SEGS = [
	{ name: 'hero', y: 0, secs: 6 },
	{ name: 'teams', sel: '#teams', dy: -40, secs: 7 },
	{ name: 'agents', sel: '#agents', dy: 0, secs: 9 },
	{ name: 'yes', sel: '#yes', dy: -150, secs: 4 }
];
const FPS = 25;
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'no-preference' });
await ctx.addInitScript({ content: readFileSync(new URL('./vclock.js', import.meta.url), 'utf8') });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('page error:', m.text().slice(0, 200)));
await page.goto('https://smartclearance.web.app/', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000); // the loader lifts, the film and fonts land
await page.evaluate(() => document.fonts.ready);
for (const seg of SEGS) {
	const dir = `${out}/${seg.name}`;
	mkdirSync(dir, { recursive: true });
	await page.evaluate(() => (window.__vt.follow = true));
	await page.evaluate(({ y, sel, dy }) => {
		const top = sel ? document.querySelector(sel).getBoundingClientRect().top + scrollY + (dy || 0) : y;
		window.scrollTo({ top, behavior: 'instant' });
	}, seg);
	await page.waitForTimeout(seg.name === 'hero' ? 200 : 60); // a scroll event or two, then the clock is ours
	await page.evaluate(() => {
		window.__vt.follow = false;
		const v = document.querySelector('video');
		if (v) { v.pause(); window.__v0 = { t: window.__vt.now, at: v.currentTime }; }
	});
	const n = Math.round(seg.secs * FPS);
	for (let i = 0; i < n; i++) {
		await page.evaluate(async (d) => {
			await window.__vt.step(d);
			const v = document.querySelector('video');
			if (v && window.__v0 && v.getBoundingClientRect().bottom > 0) {
				const t = (window.__v0.at + (window.__vt.now - window.__v0.t) / 1000) % (v.duration || 15.2);
				if (Math.abs(v.currentTime - t) > 0.001) {
					await new Promise((r) => { v.addEventListener('seeked', r, { once: true }); v.currentTime = t; setTimeout(r, 400); });
				}
			}
		}, 1000 / FPS);
		await page.screenshot({ path: `${dir}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94, animations: 'allow', caret: 'initial' });
	}
	console.log('segment', seg.name, n, 'frames');
}
await browser.close();
