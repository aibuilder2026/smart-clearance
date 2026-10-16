// SC-237: the workspace app's real Command Center, for the hero film's office monitor (chapter 4). The workspace app's
// stub build (PUBLIC_API_BASE empty, served by `vite preview`) is opened as the supply chain operator with the story's
// journey at a stage, the way the workspace e2e suite opens it (design3's own core scripts fast-forward the store, which
// is written before the app loads). The landing page names no client (AGENTS.md, SC-28), so before the shot the screen's
// client, people, partners, batch ids and address are swapped for neutral words in the page itself, as the landing
// page's own workspace section names its workspace "Your brand". Writes src/cc-<stage>.png at 2x.
//   node tools/capture.mjs <base url> [stage,stage,...] [width] [height]
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const HERE = new URL('..', import.meta.url);
const ROOT = new URL('../../../', HERE);
const require = createRequire(new URL('frontend/workspace/package.json', ROOT));
const { chromium } = require('@playwright/test');

const BASE = process.argv[2] ?? 'http://localhost:4291';
const STAGES = (process.argv[3] ?? '2,6,8').split(',').map(Number);
const W = Number(process.argv[4] ?? 1440), H = Number(process.argv[5] ?? 900);
const OUT = new URL('src/', HERE);
mkdirSync(OUT, { recursive: true });

// the store at the start of a stage, as frontend/workspace/tests/e2e/workspace.ts storeAt() makes it
const CORE = ['core/money.js', 'core/papers.js', 'core/data.js', 'core/store.js', 'core/flow.js'];
function storeAt(stage) {
	const window = { SC3_IMG: 'sc3img:/' };
	const sandbox = vm.createContext({ window, console, Date, Intl, Math, JSON, btoa, unescape, encodeURIComponent });
	for (const p of CORE) vm.runInContext(readFileSync(new URL('design3/' + p, ROOT), 'utf8'), sandbox);
	window.SC3_FLOW.fastForward(stage);
	return JSON.stringify(window.SC3_STORE.get());
}

// the client's words, swapped in the page for neutral ones, in order (a space may be a no-break space)
const SWAP = [
	['munchly-smartclearance\\.web\\.app', 'your-brand-smartclearance.web.app'],
	['Munchly Foods', 'Your brand'],
	["Munchly's", "Your brand's"],
	['Munchly (?=[A-Z])', ''],
	['Munchly', 'Your brand'],
	['Priya Deshmukh', 'You'],
	['Priya', 'You'],
	['Rakesh Traders', 'the distributor'],
	['Rakesh bhai', 'the distributor'],
	['Rakesh', 'the distributor'],
	['Lakshmi Agencies', 'the Hyderabad distributor'],
	['Patil Distributors', 'the Pune distributor'],
	['Gupta & Sons', 'the Indore distributor'],
	['Agrawal Wholesale', 'a wholesale buyer'],
	['Agrawal ji', 'the buyer'],
	['Agrawal', 'the buyer'],
	['Feeding India', 'the food bank'],
	['MF-\\d{4}-(\\d{3})', 'Batch $1'],
];
// the landing page's own workspace mark for "Your brand" (site.jsx YOURS)
const MARK = `<defs><linearGradient id="ybg" x1="6" y1="2" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient></defs><path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#ybg)"/><text x="32" y="43" text-anchor="middle" fill="#ffffff" style="font: 700 30px var(--font-ui)">Y</text>`;
// runs in the page, now and again on every change the app makes, so a feed line drawn later is swapped too
function neutral([swap, mark]) {
	const rules = swap.map(([a, b]) => [new RegExp(a.replace(/ /g, '[\\s\\u00a0]'), 'g'), b]);
	const fix = (t) => rules.reduce((s, [re, b]) => s.replace(re, b), t);
	const apply = () => {
		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		const nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		for (const n of nodes) {
			const t = fix(n.nodeValue);
			if (t !== n.nodeValue) n.nodeValue = t;
		}
		for (const el of document.querySelectorAll('[aria-label],[title]'))
			for (const k of ['aria-label', 'title']) {
				const v = el.getAttribute(k);
				if (v && fix(v) !== v) el.setAttribute(k, fix(v));
			}
		// people's portraits: a plain disc in their place
		for (const img of document.querySelectorAll('img'))
			if (/\/p-[a-z]+[^/]*\.(webp|png|jpg)/.test(img.currentSrc || img.src) && img.style.visibility !== 'hidden') {
				img.style.visibility = 'hidden';
				if (img.parentElement) img.parentElement.style.background = '#dfe7e3';
			}
		for (const m of document.querySelectorAll('svg.wsmark')) if (!m.dataset.yours) { m.innerHTML = mark; m.dataset.yours = '1'; }
	};
	apply();
	const mo = new MutationObserver(() => { mo.disconnect(); apply(); mo.observe(document.body, { subtree: true, childList: true, characterData: true }); });
	mo.observe(document.body, { subtree: true, childList: true, characterData: true });
}

const browser = await chromium.launch({ headless: true });
for (const stage of STAGES) {
	const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
	const page = await ctx.newPage();
	page.on('pageerror', (e) => console.log(stage, 'pageerror:', e.message));
	await page.addInitScript(([store]) => {
		localStorage.setItem('sc3-store', store);
		localStorage.setItem('sc3-session', JSON.stringify({ uid: 'priya', at: 1 }));
		sessionStorage.setItem('sc3-app-splash', '1');
	}, [storeAt(stage)]);
	const plain = readFileSync(new URL('design3/system/img/pack-snack-plain.webp', ROOT));
	await page.route(/pack-(chips|mango|biscuits|chikki)[^/]*\.webp/, (r) => r.fulfill({ body: plain, contentType: 'image/webp' }));
	await page.goto(BASE + '/command');
	await page.waitForSelector('.app[data-mounted] .largetitle h1');
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(1500);
	await page.evaluate(neutral, [SWAP, MARK]);
	await page.waitForTimeout(1200);
	const left = await page.evaluate(() => [...document.body.innerText.matchAll(/Munchly|Priya|Rakesh|Lakshmi|Agrawal|MF-\d/g)].map((m) => m[0]));
	if (left.length) console.log(stage, 'still named:', [...new Set(left)].join(', '));
	await page.screenshot({ path: new URL(`cc-${stage}.png`, OUT).pathname });
	console.log('shot stage', stage);
	await ctx.close();
}
await browser.close();
