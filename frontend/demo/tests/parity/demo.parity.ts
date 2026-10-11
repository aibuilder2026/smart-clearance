import { test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { compare } from '@smart-clearance/testing/parity';
import { LINE, settle, type Place } from '../e2e/demo';

// The guided demo against design3/demo (SC-65, SC-167): the route map to start, then every station of the four lines
// once its agents have finished (both sides run the same stub, the same console world and the same delays), in the five
// projects, so the three layouts are compared (the notes beside the stage, under it, and the real-phone mode below
// 768 px); the map on M and the end in each; and on desktops phone only and the notes hidden.
// The pointer rests in a corner.
// Accepted differences, kept under the thresholds: text rasterised from Google Fonts in the prototype and the same faces
// self-hosted here, and the icons Lucide 1.51 draws differently from the prototype's 0.468.
const PROTOTYPE = 'http://127.0.0.1:8790/demo/Smart-Clearance%20demo%20v3.html';
const PORT = 'http://127.0.0.1:4184/';

async function open(browser: Browser, testInfo: TestInfo, url: string, place?: Place): Promise<Page> {
	const context = await browser.newContext({ ...testInfo.project.use });
	const page = await context.newPage();
	await page.addInitScript(() => {
		try {
			localStorage.setItem('sc3-theme', 'system');
		} catch {
			// storage blocked
		}
	});
	await page.goto(place ? `${url}#at=${place[0]}.${place[1]}.${place[2] ?? 0}` : url, { waitUntil: 'networkidle' });
	await page.waitForSelector(place ? '.demo .devices .dev-ring, .demo-real .real-bar' : '.rb-start');
	await page.evaluate(() => document.fonts.ready);
	// a station: its agents finish (where the notes are not on screen to say, the slowest station's time); the map: it
	// draws itself once
	if (place) await settle(page, 4500);
	else await page.waitForTimeout(4000);
	await rest(page);
	return page;
}

/** The pointer in a corner, and the in-app banners and toasts an agent's step raised gone (6.2 s and 3.2 s): they come
 *  and go on the agents' timers, so the pages are compared as they rest */
async function rest(page: Page) {
	await page.mouse.move(0, 0);
	await page.waitForFunction(() => !document.querySelector('.banners .banner, .toasts .toast'), null, {
		timeout: 10_000
	});
	await page.waitForTimeout(800);
}

const shot = (page: Page) => page.screenshot({ animations: 'disabled' });

test('parity · the route map', async ({ browser }, testInfo) => {
	const [a, b] = await Promise.all([open(browser, testInfo, PROTOTYPE), open(browser, testInfo, PORT)]);
	await compare(testInfo, 'the route map', await shot(a), await shot(b), 0.003);
});

/** each line's stations: [line, its name, the stations] */
const LINES: [number, string, string[]][] = [
	[LINE.console, 'platform', ['sign in', 'overview', 'clients', 'new client', 'munchly', 'agents']],
	[LINE.chips, 'chips', ['connect', 'detect', 'verify', 'value', 'decide', 'approve', 'execute', 'settle', 'report']],
	[LINE.mango, 'mango', ['detect', 'verify', 'decide', 'execute', 'settle', 'report']],
	[LINE.slow, 'slow week', ['execute', 'settle', 'expiry day', 'second yes', 'report']]
];
for (const [line, lineName, stations] of LINES)
	stations.forEach((station, s) =>
		test(`parity · ${lineName} · ${station}`, async ({ browser }, testInfo) => {
			const name = `${lineName} · ${station}`;
			const [a, b] = await Promise.all([
				open(browser, testInfo, PROTOTYPE, [line, s]),
				open(browser, testInfo, PORT, [line, s])
			]);
			await compare(testInfo, name, await shot(a), await shot(b), 0.003);
		})
	);

/** the same keys on both sides, then each settles; with `until`, the last key again until it shows (at most 10) */
async function press(page: Page, keys: string[], until?: string) {
	for (const k of keys) {
		await page.keyboard.press(k);
		await settle(page, 3000);
	}
	if (until)
		for (let i = 0; i < 10 && !(await page.locator(until).count()); i++) {
			await page.keyboard.press(keys[keys.length - 1]);
			await settle(page, 3000);
		}
	await rest(page);
}
/** [name, place, the keys, until, desktops only] */
const VIEWS: [string, Place, string[], string | undefined, boolean][] = [
	['chips · approve · phone only', [LINE.chips, 5], ['p'], undefined, true],
	['chips · verify · the notes hidden', [LINE.chips, 2], ['n'], undefined, true],
	['chips · connect · phone only, the notes hidden', [LINE.chips, 0], ['p', 'n'], undefined, true],
	['mango · decide · the map on M', [LINE.mango, 2], ['m'], undefined, false],
	['the end', [LINE.slow, 4], ['ArrowRight'], '.finale', false]
];
for (const [name, place, keys, until, desktop] of VIEWS)
	test(`parity · ${name}`, async ({ browser }, testInfo) => {
		test.skip(
			desktop && (testInfo.project.use.viewport?.width ?? 1440) < 1100,
			'phone only and the notes: on desktops'
		);
		const [a, b] = await Promise.all([open(browser, testInfo, PROTOTYPE, place), open(browser, testInfo, PORT, place)]);
		await Promise.all([press(a, keys, until), press(b, keys, until)]);
		await compare(testInfo, name, await shot(a), await shot(b), 0.003);
	});
