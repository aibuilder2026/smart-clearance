// SC-219 cut 13: the app's own screens for the architecture (arch13/scr/), captured at 2x from the live guided demo
// (smartclearance-demo.web.app, the production UI on its stub: nothing is signed in to and nothing is kept), plus the live
// workspace's sign-in page, the landing page and the demo's own start. Each spec lands on a beat of the demo (#at=act.station.
// beat), may press a button inside the laptop or the phone, and takes the laptop's page (below its chrome) or the phone's
// screen as PNG. screens13.py turns them into the WebPs the page loads.
//   node screens13.mjs <outdir> [name,name,...]
import { createRequire } from 'node:module';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const OUT = process.argv[2], only = process.argv[3] ? process.argv[3].split(',') : null;
const DEMO = 'https://smartclearance-demo.web.app/';
const SPECS = [
	{ n: 'console', at: '0.1.0', dev: 'desk', steps: [{ wait: 1500, shot: '0' }] },
	{ n: 'cmd', at: '2.0.0', dev: 'desk', steps: [{ shot: '0' }] },
	{ n: 'kir0', at: '2.3.0', dev: 'phone', steps: [{ shot: '0' }] },
	{ n: 'vision', at: '2.1.3', dev: 'desk', steps: [{ shot: '0' }, { next: true }, { wait: 2500, shot: '1' }] },
	{ n: 'lister', at: '1.6.3', dev: 'desk', steps: [{ shot: '0' }] },
	{ n: 'sheet', at: '2.2.3', dev: 'desk', steps: [{ shot: '0' }] },
	{ n: 'yes', at: '2.2.3', dev: 'phone', steps: [{ shot: '0' }, { click: 'Approve · release the agents', dev: 'phone' }, { wait: 120, shot: '1' }, { wait: 450, shot: '2' }, { wait: 900, shot: '3' }, { wait: 1800, shot: '4' }] },
	{ n: 'sched2', at: '0.5.1', dev: 'desk', steps: [{ wait: 800 }, { wheel: 420 }, { wait: 900, shot: '0' }, { click: 'Run now', nth: 1, dev: 'desk' }, { wait: 150, shot: '1' }, { wait: 500, shot: '2' }, { wait: 1200, shot: '3' }] },
	{ n: 'agents2', at: '0.5.0', dev: 'desk', steps: [{ wait: 800 }, { wheel: 380 }, { wait: 900, shot: '0' }, { wheel: 700 }, { wait: 900, shot: '1' }, { wheel: 700 }, { wait: 900, shot: '2' }] },
	{ n: 'photo2', at: '2.1.2', dev: 'phone', steps: [{ click: 'Take a photo', dev: 'phone' }, { wait: 1200, shot: '0' }, { click: 'Send photo', dev: 'phone' }, { wait: 120, shot: '1' }, { wait: 400, shot: '2' }, { wait: 800, shot: '3' }, { wait: 1500, shot: '4' }] },
	{ n: 'lockpc', at: '2.0.1', dev: 'phone', steps: [{ shotEl: '.device-phone .lock-note', as: 'note' }, { js: "document.querySelectorAll('.device-phone .lock-note').forEach(e=>e.style.visibility='hidden')" }, { wait: 200, shot: '0' }] },
	{ n: 'locklc', at: '2.1.1', dev: 'phone', steps: [{ shotEl: '.device-phone .lock-note', as: 'note' }, { js: "document.querySelectorAll('.device-phone .lock-note').forEach(e=>e.style.visibility='hidden')" }, { wait: 200, shot: '0' }] },
	{ n: 'neg', at: '1.6.4', dev: 'phone', steps: [{ js: "const s=document.querySelector('.device-phone .scroll'); s.scrollTop=s.scrollHeight" }, { wait: 500, shot: '0' }, { click: 'Bid ₹13.00 for 772', dev: 'phone' }, { wait: 300, shot: '1' }, { wait: 1200, shot: '2' }, { js: "const s=document.querySelector('.device-phone .scroll'); s.scrollTop=s.scrollHeight" }, { wait: 2500, shot: '3' }] },
	{ n: 'record2', at: '2.5.2', dev: 'desk', steps: [{ click: 'Record', dev: 'desk' }, { wait: 1500 }, { wheel: 520 }, { wait: 900, shot: '0' }] },
];
const browser = await chromium.launch({ headless: true });
for (const sp of SPECS) {
	if (only && !only.includes(sp.n)) continue;
	const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
	page.on('pageerror', (e) => console.log(sp.n, 'pageerror:', e.message));
	await page.goto(`${DEMO}#at=${sp.at}`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(3500);
	const el = (dev) => dev === 'phone' ? page.locator('.device-phone .screen').first() : page.locator('.device-window > div:nth-child(2)').first();
	for (const st of sp.steps) {
		if (st.wait) await page.waitForTimeout(st.wait);
		if (st.js) await page.evaluate(st.js);
		if (st.wheel) { const b = await el(sp.dev).boundingBox(); await page.mouse.move(b.x + b.width * 0.55, b.y + b.height * 0.6); await page.mouse.wheel(0, st.wheel); }
		if (st.click) { const b = page.locator(st.dev === 'phone' ? '.device-phone' : '.device-window').getByRole('button', { name: st.click, exact: !!st.exact }); await (st.nth ? b.nth(st.nth) : b.first()).click(); }
		if (st.next) await page.getByRole('button', { name: 'Next', exact: false }).last().click();
		if (st.shotEl) await page.locator(st.shotEl).first().screenshot({ path: `${OUT}/${sp.n}-${st.as}.png` });
		if (st.shot) { await el(sp.dev).screenshot({ path: `${OUT}/${sp.n}-${st.shot}.png` }); console.log('shot', sp.n, st.shot); }
	}
	await page.close();
}
// the landing page and the guided demo's own start, as each opens; the live workspace's sign-in page (nothing typed)
for (const [n, url, vw, vh] of [['landing', 'https://smartclearance.web.app/', 1440, 900], ['demo', DEMO, 1440, 900], ['wsignin', 'https://munchly-smartclearance.web.app/', 1128, 895]]) {
	if (only && !only.includes(n)) continue;
	const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, serviceWorkers: 'block' });
	const page = await ctx.newPage();
	await page.goto(url, { waitUntil: 'networkidle' }); await page.waitForTimeout(n === 'wsignin' ? 6000 : 4500);
	await page.screenshot({ path: `${OUT}/${n}-0.png` }); console.log('shot', n);
	await ctx.close();
}
await browser.close();
