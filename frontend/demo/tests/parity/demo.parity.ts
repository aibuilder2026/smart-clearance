import { test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { compare } from '@smart-clearance/testing/parity';
import { settle } from '../e2e/demo';

// The guided demo against design3/demo (SC-65): each of the nine stages once its agents have finished (both sides run
// the same stub and the same delays), in the five projects, so the three layouts are compared (the notes beside the
// stage, under it, and the real-phone mode below 768 px); the finale in each; and on desktops phone only and the notes
// hidden.
// The splash is skipped on both sides (it shows once a session), and the pointer rests in a corner.
// Accepted differences, kept under the thresholds: text rasterised from Google Fonts in the prototype and the same faces
// self-hosted here, and the icons Lucide 1.51 draws differently from the prototype's 0.468.
const PROTOTYPE = 'http://127.0.0.1:8790/demo/Smart-Clearance%20demo%20v3.html';
const PORT = 'http://127.0.0.1:4184/';

/** how long each stage's agents take on entering it, where the notes are not on screen to say (as tests/e2e/demo.ts) */
const AGENTS_MS = [0, 2400, 1800, 1500, 1600, 0, 4200, 0, 3500];

async function open(browser: Browser, testInfo: TestInfo, url: string, stage: number): Promise<Page> {
	const context = await browser.newContext({ ...testInfo.project.use });
	const page = await context.newPage();
	await page.addInitScript(() => {
		try {
			sessionStorage.setItem('sc3-demo-splash', '1');
			localStorage.setItem('sc3-theme', 'system');
		} catch {
			// storage blocked
		}
	});
	await page.goto(`${url}#stage=${stage}`, { waitUntil: 'networkidle' });
	await page.waitForSelector('.demo .devices .dev-ring, .demo-real .real-bar');
	await page.evaluate(() => document.fonts.ready);
	await settle(page, AGENTS_MS[stage - 1]);
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

/** [name, stage, the share of pixels allowed to differ] */
const STAGES: [string, number, number][] = [
	['stage 1 · connect', 1, 0.003],
	['stage 2 · detect', 2, 0.003],
	['stage 3 · verify', 3, 0.003],
	['stage 4 · value', 4, 0.003],
	['stage 5 · decide', 5, 0.003],
	['stage 6 · approve', 6, 0.003],
	['stage 7 · execute', 7, 0.003],
	['stage 8 · settle', 8, 0.003],
	['stage 9 · report', 9, 0.003]
];
for (const [name, stage, max] of STAGES)
	test(`parity · ${name}`, async ({ browser }, testInfo) => {
		const [a, b] = await Promise.all([open(browser, testInfo, PROTOTYPE, stage), open(browser, testInfo, PORT, stage)]);
		await compare(testInfo, name, await shot(a), await shot(b), max);
	});

/** the same keys on both sides, then each settles */
async function press(page: Page, keys: string[]) {
	for (const k of keys) {
		await page.keyboard.press(k);
		await settle(page, 3000);
	}
	await rest(page);
}
/** [name, stage, the keys, the share of pixels allowed to differ, desktops only] */
const VIEWS: [string, number, string[], number, boolean][] = [
	['stage 6 · phone only', 6, ['p'], 0.003, true],
	['stage 3 · the notes hidden', 3, ['n'], 0.003, true],
	['stage 1 · phone only, the notes hidden', 1, ['p', 'n'], 0.003, true],
	['the finale', 9, ['ArrowRight', 'ArrowRight'], 0.003, false]
];
for (const [name, stage, keys, max, desktop] of VIEWS)
	test(`parity · ${name}`, async ({ browser }, testInfo) => {
		test.skip(
			desktop && (testInfo.project.use.viewport?.width ?? 1440) < 1100,
			'phone only and the notes: on desktops'
		);
		const [a, b] = await Promise.all([open(browser, testInfo, PROTOTYPE, stage), open(browser, testInfo, PORT, stage)]);
		await Promise.all([press(a, keys), press(b, keys)]);
		await compare(testInfo, name, await shot(a), await shot(b), max);
	});
