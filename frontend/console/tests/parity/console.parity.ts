import { test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { compare } from '@smart-clearance/testing/parity';

// Every screen of the console against design3/console, signed in as Neha Kulkarni on the same seed. Each is captured in
// a window tall enough that its screen does not scroll, so the whole of it is compared. The prototype's console starts
// with no demo requests (the landing page in the same browser makes them); the port's mock starts with two, so the
// same two are put into the prototype's store first.
// Accepted differences, kept under the thresholds: text rasterised from Google Fonts in the prototype and the same faces
// self-hosted here, and the icons Lucide 1.51 draws differently from the prototype's 0.468 (the supply chain's factory
// and warehouse most of all). Measured on 5 Oct 2026: at most 0.09%, and 0.27% for the supply chain on a phone.
const PROTOTYPE = 'http://127.0.0.1:8790/console/Smart-Clearance%20console%20v3.html';
const PORT = 'http://127.0.0.1:4178';

/** [name, the prototype's hash, the port's path, the share of pixels allowed to differ] */
const SCREENS: [string, string, string, number][] = [
	['overview', '#/overview', '/', 0.003],
	['clients', '#/clients', '/clients', 0.003],
	['client · agents', '#/clients/munchly/agents', '/clients/munchly/agents', 0.003],
	['client · supply chain', '#/clients/munchly/supply', '/clients/munchly/supply', 0.005],
	['client · channels and rules', '#/clients/munchly/rules', '/clients/munchly/rules', 0.003],
	['client · people', '#/clients/munchly/people', '/clients/munchly/people', 0.003],
	['client · integrations', '#/clients/munchly/integrations', '/clients/munchly/integrations', 0.003],
	['client · plan', '#/clients/munchly/plan', '/clients/munchly/plan', 0.003],
	['client · audit', '#/clients/munchly/audit', '/clients/munchly/audit', 0.003],
	['new client', '#/new-client', '/new-client', 0.003],
	['agents', '#/agents', '/agents', 0.003],
	['connectors', '#/connectors', '/connectors', 0.003],
	['plans', '#/plans', '/plans', 0.003],
	['staff', '#/staff', '/staff', 0.003],
	['audit log', '#/audit', '/audit', 0.01]
];

// the port's two demo requests (@smart-clearance/api/console's mock), for the prototype's store
const REQUESTS = [
	{
		id: 'rq-kesari',
		at: '4 Oct, 11:20 am',
		name: 'Ritu Malhotra',
		company: 'Kesari Foods',
		email: 'ritu@kesari.in',
		makes: 'Snacks and drinks',
		plan: 'Pilot',
		note: 'Three distributors around Indore; namkeen and biscuits go short-dated every month.',
		status: 'new'
	},
	{
		id: 'rq-amrit',
		at: '5 Oct, 09:05 am',
		name: 'Farhan Siddiqui',
		company: 'Amrit Dairy',
		email: 'farhan@amritdairy.in',
		makes: 'Dairy',
		plan: 'Growth',
		note: '',
		status: 'new'
	}
];

const TALL = 2600;

async function open(browser: Browser, testInfo: TestInfo, url: string, signedIn: boolean): Promise<Page> {
	const width = testInfo.project.use.viewport!.width;
	const context = await browser.newContext({
		...testInfo.project.use,
		viewport: { width, height: signedIn ? TALL : 900 }
	});
	const page = await context.newPage();
	await page.addInitScript((signed) => {
		try {
			localStorage.setItem('sc3-theme', 'system');
			localStorage.removeItem('sc3-platform');
			localStorage.removeItem('sc-console');
			for (const key of ['sc3-console-session', 'sc-console-session'])
				if (signed) localStorage.setItem(key, JSON.stringify({ uid: 'neha', at: 1 }));
				else localStorage.removeItem(key);
		} catch {
			// storage blocked
		}
	}, signedIn);
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.waitForSelector(signedIn ? '.largetitle h1' : '.si-title');
	await page.evaluate((requests) => {
		const P = (window as unknown as { SC3_PLATFORM?: { update: (fn: (d: { requests: unknown[] }) => void) => void } })
			.SC3_PLATFORM;
		P?.update((d) => (d.requests = requests));
	}, REQUESTS);
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(800);
	return page;
}

const shot = (page: Page) => page.screenshot({ animations: 'disabled' });

for (const [name, hash, path, max] of SCREENS)
	test(`parity · ${name}`, async ({ browser }, testInfo) => {
		const a = await open(browser, testInfo, PROTOTYPE + hash, true);
		const b = await open(browser, testInfo, PORT + path, true);
		await compare(testInfo, name, await shot(a), await shot(b), max);
	});

test('parity · sign-in', async ({ browser }, testInfo) => {
	const a = await open(browser, testInfo, PROTOTYPE, false);
	const b = await open(browser, testInfo, PORT + '/', false);
	await compare(testInfo, 'sign-in', await shot(a), await shot(b), 0.003);
});
