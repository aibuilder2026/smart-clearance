// SC-219 cut 14: the four apps' own screens as tall strips, for the architecture's 3D screens to scroll through. The
// landing page from its live site (the window scrolled a screen at a time, the bar kept on the first only), the console's
// Overview and the workspace's Command Center from the live guided demo (smartclearance-demo.web.app, the production UI
// on its stub: nothing is signed in to and nothing is kept; the laptop's own scroller stepped a screen at a time), and the
// guided demo's route map and one of its stages. Each step's screenshot is kept; tiles14.py stitches them into WebPs.
//   node tiles14.mjs <outdir>
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const DEMO = 'https://smartclearance-demo.web.app/';
const meta = {};
const browser = await chromium.launch({ headless: true });

// the landing page: the window, a screen at a time
{
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block', reducedMotion: 'reduce' });
	const page = await ctx.newPage();
	await page.goto('https://smartclearance.web.app/', { waitUntil: 'networkidle' }); await page.waitForTimeout(5000);
	// every lazy image and section in, then back to the top
	for (let y = 0; y < 5400; y += 450) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(160); }
	await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1500);
	// the page as it opens (its bar and pill in place), then a screen at a time with everything fixed hidden, so the strip
	// carries the page alone and the 3D screen lays the bar back over it
	await page.screenshot({ path: `${OUT}/landing-base.png` });
	meta.landingFixed = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).position === 'fixed' && e.getBoundingClientRect().height > 20 && e.getBoundingClientRect().height < 200)
		.map((e) => { const r = e.getBoundingClientRect(); return { cls: String(e.className).slice(0, 40), x: r.x, y: r.y, w: r.width, h: r.height }; }));
	await page.evaluate(() => document.querySelectorAll('body *').forEach((e) => { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') e.style.visibility = 'hidden'; }));
	const ys = [0, 900, 1800, 2700, 3600];
	for (const [i, y] of ys.entries()) {
		await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(900);
		const real = await page.evaluate(() => window.scrollY);
		await page.screenshot({ path: `${OUT}/landing-${i}.png` }); (meta.landing ||= []).push(real);
	}
	await ctx.close();
}

// the console's Overview and the workspace's Command Center, inside the guided demo's laptop: the page as it opens, then its
// scroller unfolded to its full height and shot whole (the Command Center is live, so screens shot a second apart do not
// line up; one shot does)
for (const [n, at] of [['console', '0.1.0'], ['cmd', '2.0.0']]) {
	const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 });
	await page.goto(`${DEMO}#at=${at}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(4500);
	const el = page.locator('.device-window > div:nth-child(2)').first();
	await el.screenshot({ path: `${OUT}/${n}-base.png` });
	const box = await page.evaluate(() => {
		const root = document.querySelector('.device-window > div:nth-child(2)');
		let best = null;
		root.querySelectorAll('*').forEach((e) => { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 40 && (!best || e.scrollHeight > best.scrollHeight)) best = e; });
		const r = root.getBoundingClientRect(), s = best.getBoundingClientRect();
		const stack = [...best.querySelectorAll('*')].find((e) => getComputedStyle(e).position === 'sticky' && !e.classList.contains('navbar'));
		const out = { left: s.left - r.left, top: s.top - r.top, w: s.width, h: s.height, H: r.height, W: r.width, sh: best.scrollHeight, stackLeft: stack ? stack.getBoundingClientRect().left - r.left : null };
		best.setAttribute('data-tile-scroll', '1');
		return out;
	});
	// the scroller alone, unfolded: its own box grown to its content, nothing sticking, then shot whole
	await page.evaluate(() => {
		const s = document.querySelector('[data-tile-scroll]');
		s.querySelectorAll('*').forEach((e) => { if (getComputedStyle(e).position === 'sticky') e.style.position = 'relative'; });
		const nb = s.querySelector('.navbar'); if (nb) nb.style.visibility = 'hidden';
		s.style.height = s.scrollHeight + 'px'; s.style.maxHeight = 'none'; s.style.overflow = 'visible';
		// and every box round it, up to the page, so nothing clips it
		for (let e = s.parentElement; e && e !== document.documentElement; e = e.parentElement) { e.style.overflow = 'visible'; e.style.maxHeight = 'none'; if (getComputedStyle(e).height !== 'auto') e.style.height = 'auto'; e.style.contain = 'none'; e.style.transform = 'none'; }
	});
	await page.waitForTimeout(1200);
	await page.locator('[data-tile-scroll]').screenshot({ path: `${OUT}/${n}-col.png` });
	meta[n + 'Box'] = box; console.log(n, JSON.stringify(box));
	await page.close();
}

// the guided demo: its route map as it opens, then a stage with the laptop and the phone at work
{
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
	const page = await ctx.newPage();
	await page.goto(DEMO, { waitUntil: 'networkidle' }); await page.waitForTimeout(4500);
	await page.screenshot({ path: `${OUT}/demo-0.png` });
	await page.goto(`${DEMO}#at=2.2.3`, { waitUntil: 'networkidle' }); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(4500);
	await page.screenshot({ path: `${OUT}/demo-1.png` });
	await ctx.close();
}
writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
console.log(JSON.stringify(meta));
await browser.close();
