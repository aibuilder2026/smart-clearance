import { test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { compare } from '@smart-clearance/testing/parity';
import { storeAt } from '../e2e/workspace';

// Every role's main screens of the workspace app, and the sign-in, against design3/app (SC-65): both in the same
// journey state, the batch cleared, with the same person signed in and the splash skipped. design3's own core makes the
// store for both (storeAt), each with its own path to the portraits. Each screen is captured in a window tall enough
// that it does not scroll, so the whole of it is compared, with the pointer in a corner so no hover differs.
// Accepted differences, kept under the threshold: text rasterised from Google Fonts in the prototype and the same faces
// self-hosted here, and the icons Lucide draws differently from the prototype's version (the sidebar's sliders).
// Measured on 7 Oct 2026 over four full runs (140 pairs each): typically 0.00 to 0.11%, and in each run one screen,
// a different one each time, at 0.26 to 0.39% (the most: Arjun's audit log on a phone), its text shifted by a
// sub-pixel. That one is the prototype's: loaded again and again, the port's page is identical every time, while about
// one load in sixteen of the prototype's lays its text out 0.18% differently from its other loads. So every screen
// allows 0.5%, where the console's allow 0.3%.
const MAX = 0.005;
const PROTOTYPE = 'http://127.0.0.1:8790/app/Smart-Clearance%20app%20v3.html';
const PORT = 'http://127.0.0.1:4182';

/** [person, screen] */
const SCREENS: [string, string][] = [
	['priya', 'command'],
	['priya', 'route'],
	['priya', 'execution'],
	['priya', 'batches'],
	['priya', 'setup'],
	['priya', 'report'],
	['priya', 'paperwork'],
	['priya', 'inbox'],
	['priya', 'profile'],
	['rakesh', 'home'],
	['rakesh', 'photo'],
	['rakesh', 'van'],
	['rakesh', 'orders'],
	['ganesh', 'home'],
	['ganesh', 'offer'],
	['ganesh', 'orders'],
	['agrawal', 'market'],
	['agrawal', 'listing'],
	['agrawal', 'bids'],
	['anita', 'paperwork'],
	['vikram', 'report'],
	['meera', 'pickups'],
	['arjun', 'workspace'],
	['arjun', 'users'],
	['arjun', 'rules'],
	['arjun', 'integrations'],
	['arjun', 'audit']
];

async function open(browser: Browser, testInfo: TestInfo, url: string, uid: string | null, img: string): Promise<Page> {
	const width = testInfo.project.use.viewport!.width;
	const context = await browser.newContext({ ...testInfo.project.use, viewport: { width, height: 900 } });
	const page = await context.newPage();
	await page.addInitScript(
		([store, uid]) => {
			try {
				localStorage.setItem('sc3-theme', 'system');
				localStorage.setItem('sc3-store', store);
				localStorage.removeItem('sc3-hero-paused');
				if (uid) localStorage.setItem('sc3-session', JSON.stringify({ uid, at: 1 }));
				else localStorage.removeItem('sc3-session');
				sessionStorage.setItem('sc3-app-splash', '1');
			} catch {
				// storage blocked
			}
		},
		[storeAt(9, img), uid] as const
	);
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.waitForSelector(uid ? '.largetitle h1' : '.si-title');
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(500);
	return page;
}

/** the window height at which nothing on the page scrolls: the app's root is fixed and its screens scroll inside it */
const fullHeight = (page: Page) =>
	page.evaluate(() => {
		let more = 0;
		for (const el of document.querySelectorAll('*')) {
			const y = getComputedStyle(el).overflowY;
			if ((y === 'auto' || y === 'scroll') && el.scrollHeight > el.clientHeight + 1)
				more = Math.max(more, el.scrollHeight - el.clientHeight);
		}
		return Math.ceil(window.innerHeight + more);
	});

/** every image on the page loaded and decoded (a taller window brings lazy ones into view), and the fonts in */
const settle = (page: Page) =>
	page.evaluate(async () => {
		await Promise.all(
			[...document.images].map((img) =>
				img.complete
					? img.decode().catch(() => {})
					: new Promise((done) => {
							img.addEventListener('load', done, { once: true });
							img.addEventListener('error', done, { once: true });
						})
			)
		);
		await document.fonts.ready;
	});

async function capture(pages: Page[]) {
	const width = pages[0].viewportSize()!.width;
	// grow both windows until neither scrolls (a taller window can reflow a little, so measure twice)
	for (let i = 0; i < 2; i++) {
		const height = Math.max(...(await Promise.all(pages.map(fullHeight))));
		await Promise.all(pages.map((p) => p.setViewportSize({ width, height })));
		await pages[0].waitForTimeout(400);
	}
	const height = pages[0].viewportSize()!.height;
	return Promise.all(
		pages.map(async (p) => {
			await p.mouse.move(width - 1, height - 1);
			await settle(p);
			await p.waitForTimeout(300);
			return p.screenshot({ animations: 'disabled' });
		})
	);
}

for (const [who, screen] of SCREENS)
	test(`parity · ${who} · ${screen}`, async ({ browser }, testInfo) => {
		const a = await open(browser, testInfo, `${PROTOTYPE}#/${screen}`, who, 'system/img/');
		const b = await open(browser, testInfo, `${PORT}/${screen}`, who, 'sc3img:/');
		const [pa, pb] = await capture([a, b]);
		await compare(testInfo, `${who} · ${screen}`, pa, pb, MAX);
	});

test('parity · sign-in', async ({ browser }, testInfo) => {
	const a = await open(browser, testInfo, PROTOTYPE, null, 'system/img/');
	const b = await open(browser, testInfo, PORT + '/', null, 'sc3img:/');
	const [pa, pb] = await capture([a, b]);
	await compare(testInfo, 'sign-in', pa, pb, MAX);
});
