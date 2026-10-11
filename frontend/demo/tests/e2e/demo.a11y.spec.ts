import { expect, test, type Page } from '@playwright/test';
import { report, scan, type Finding } from '@smart-clearance/testing/a11y';
import {
	device,
	hold,
	holdable,
	isReal,
	LINE,
	next,
	nextUntil,
	openDemo,
	release,
	settle,
	stationOf,
	theEnd
} from './demo';

// The guided demo's build (SC-65, SC-167): the route map to start, every station of the four lines at every beat, by
// its own Next, in the three layouts its width gives it (the notes beside the stage, under it, or the real-phone mode);
// then the states a visitor opens: the map between lines and on Map, the end, phone only, the notes hidden, the
// appearance menu, the real phone's notes, and the moves made inside the devices that the beats skip (a workspace found,
// a button at work, a one-time code, the channels as a table, the compact tracker's sheet, the Lister's API call, the
// marketplace, an empty list, Meera's receipt, the destruction's evidence and its second yes). Every core
// component the demo uses, its devices' workspace and console screens included, is on screen in one of these scans
// (SC-58).

// The laptop and the phone on the stage are previews of the real screens, drawn at their own size and scaled down to
// fit (Device.svelte: a CSS transform of 0.3 to 0.84), so a 44 px button in them measures 13 to 37 px on the page: axe's
// target-size rule fails the sidebar's items and the sign-in's field in them (55 findings over the nine stages at 1440
// and 820 wide, measured on 7 Oct 2026). Target size (2.5.8) is judged on the same screens at full size, in the
// real-phone mode below 768 px and in the workspace app's own suite; every other rule still covers the previews.
const PREVIEWS = { targetSizeExclude: ['.demo .devices .dev-ring'] };
const check = (page: Page, state: string) => scan(page, state, PREVIEWS);

/** each line's stations, in the order the story plays them */
const STATIONS: [line: number, name: string, stations: string[]][] = [
	[
		LINE.console,
		'The platform',
		['Sign in', 'Overview', 'Existing clients', 'A new client', "Munchly's setup", 'Agent setup']
	],
	[
		LINE.chips,
		'Masala Chips',
		['Connect', 'Detect', 'Verify', 'Value', 'Decide', 'Approve', 'Execute', 'Settle', 'Report']
	],
	[LINE.mango, 'Mango Drink', ['Detect', 'Verify', 'Decide', 'Execute', 'Settle', 'Report']],
	[LINE.slow, 'a slow week', ['Execute', 'Settle', 'Expiry day', 'The second yes', 'Report']]
];

/** every beat of a station, by Next, scanned after each, until Next moves on to the following station or the end */
async function walk(page: Page, at: string, label: string, findings: Finding[]) {
	for (let beat = 1; beat <= 14; beat++) {
		await next(page);
		if (stationOf(page) !== at || (await theEnd(page).count())) return;
		findings.push(...(await check(page, `${label} · after Next ${beat}`)));
	}
	throw new Error(`${label} never ended`);
}

for (const [line, name, stations] of STATIONS)
	stations.forEach((station, s) =>
		test(`demo · ${name}: ${station}, beat by beat`, async ({ page }, testInfo) => {
			const label = `${name} · ${station}`;
			await openDemo(page, [line, s, 0]);
			const findings = await check(page, label);
			await walk(page, `${line}.${s}`, label, findings);
			await report(testInfo, findings);
		})
	);

test('demo · the start, a line pointed at, and a station opened from it', async ({ page }, testInfo) => {
	await openDemo(page);
	// the map draws itself once (about 1.5 s); scanned when it has
	await page.waitForTimeout(1800);
	const findings = await check(page, 'the start');
	if (!isReal(page)) {
		await page.getByRole('button', { name: /^Mango Drink/ }).hover();
		await expect(page.locator('.rb-peek')).toBeVisible();
		findings.push(...(await check(page, 'the start · a line pointed at')));
	}
	await report(testInfo, findings);
});

test('demo · the map between lines, the map on M, and the end', async ({ page }, testInfo) => {
	await openDemo(page, [LINE.console, 5, 0]);
	const findings: Finding[] = [];
	// on to the chips: the map comes up with the token hopping to the next line
	for (let i = 0; i < 12 && !(await page.locator('.rb-over').count()); i++) {
		await page.keyboard.press('ArrowRight');
		await page.waitForTimeout(150);
	}
	const map = page.getByRole('dialog', { name: 'The route map' });
	await expect(map.locator('.rb-eyebrow')).toHaveText('Next line');
	await page.waitForTimeout(700);
	findings.push(...(await check(page, 'the map between lines')));
	await page.keyboard.press('Escape');
	await expect(map).toHaveCount(0);
	await settle(page);

	await page.keyboard.press('m');
	await expect(map).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, 'the map on M')));
	await page.keyboard.press('Escape');

	await openDemo(page, [LINE.slow, 4, 0]);
	for (let i = 0; i < 8 && !(await theEnd(page).count()); i++) await next(page);
	await expect(theEnd(page).getByRole('button', { name: 'Ride it again' })).toBeVisible();
	// the outcomes roll up (about a second); scanned when they have
	await page.waitForTimeout(1500);
	findings.push(...(await check(page, 'the end')));
	await report(testInfo, findings);
});

test('demo · phone only, the notes hidden, and the appearance menu', async ({ page }, testInfo) => {
	test.skip(isReal(page), 'the real-phone mode has no stage, top bar or notes beside it');
	await openDemo(page, [LINE.chips, 5, 0]);
	const findings: Finding[] = [];
	await page.keyboard.press('p');
	await expect(page.getByRole('button', { name: 'Laptop and phone' })).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, 'Approve · phone only')));
	await page.keyboard.press('n');
	await expect(page.locator('.narr')).toHaveCount(0);
	await page.waitForTimeout(500);
	findings.push(...(await check(page, 'Approve · phone only, notes hidden')));
	await page.keyboard.press('p');
	await page.waitForTimeout(500);
	findings.push(...(await check(page, 'Approve · laptop and phone, notes hidden')));
	await page.locator('.demo-top').getByRole('button', { name: 'Appearance' }).click();
	await expect(page.getByRole('menu')).toBeVisible();
	findings.push(...(await check(page, 'the appearance menu')));
	await report(testInfo, findings);
});

test("demo · the real phone's bar and its notes", async ({ page }, testInfo) => {
	test.skip(!isReal(page), 'the real-phone mode is below 768 px');
	await openDemo(page, [LINE.chips, 5, 0]);
	await page.locator('.real-stage').click();
	const notes = page.getByRole('dialog', { name: 'Masala Chips · Approve' });
	await expect(notes).toBeVisible();
	await page.waitForTimeout(500);
	const findings = await check(page, 'real phone · Approve · the notes');
	await notes.getByRole('button', { name: 'The route map' }).click();
	const map = page.getByRole('dialog', { name: 'The route map' });
	await expect(map).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, 'real phone · the route map')));
	await page.keyboard.press('Escape');
	await expect(map).toHaveCount(0);
	await report(testInfo, findings);
});

// The chips' first sign-ins as the visitor makes them inside the devices: Find your workspace, Continue at work,
// Google's account chooser, and Rakesh bhai's one-time code
test('demo · the sign-ins, made inside the devices', async ({ page }, testInfo) => {
	await holdable(page);
	await openDemo(page, [LINE.chips, 0, 0]);
	const findings: Finding[] = [];
	const laptop = device(page, "Priya's laptop");
	await laptop.getByRole('button', { name: 'Not your workspace? Find yours' }).click();
	const find = laptop.getByRole('dialog', { name: 'Find your workspace' });
	await expect(find).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, "Priya's sign-in · Find your workspace")));
	await page.keyboard.press('Escape');
	await expect(find).toHaveCount(0);

	// Continue looks Priya up (0.5 s): held there to scan the button at work
	await hold(page, 500);
	await laptop.getByRole('button', { name: 'Continue' }).click();
	await expect(laptop.locator('button[aria-busy="true"] svg.spinner')).toBeVisible();
	findings.push(...(await check(page, "Priya's sign-in · Continue at work")));
	await release(page);
	const google = laptop.getByRole('dialog', { name: 'Sign in with Google' });
	await expect(google).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, "Priya's sign-in · Google's account chooser")));
	await google.getByRole('button', { name: /Priya Deshmukh/ }).click();
	await expect(google).toHaveCount(0);
	await settle(page);
	await next(page); // she confirms the setup
	await next(page); // his invitation opened

	const phone = device(page, "Rakesh bhai's phone");
	await phone.getByRole('button', { name: 'Continue' }).click();
	const code = phone.getByRole('dialog', { name: 'Enter the code' });
	await expect(code).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, "Rakesh bhai's sign-in · the one-time code")));
	await code.getByRole('button', { name: 'Verify and continue' }).click();
	await expect(phone.getByRole('button', { name: 'Allow' }), 'signed in, he is asked for his permission').toBeVisible();
	await report(testInfo, findings);
});

test("demo · inside the devices: the channels as a table, the tracker's sheet, the market, an empty list", async ({
	page
}, testInfo) => {
	await openDemo(page, [LINE.chips, 3, 0]);
	const findings: Finding[] = [];
	const laptop = device(page, "Priya's laptop");
	await laptop.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Table' }).click();
	await expect(laptop.getByRole('table')).toBeVisible();
	await page.waitForTimeout(400);
	findings.push(...(await check(page, 'Value · the channels as a table')));
	// the compact tracker, on a phone-sized screen, opens the journey as a sheet
	const phone = device(page, "Priya's phone");
	await phone.locator('button.tk-compact').click();
	const journey = phone.getByRole('dialog');
	await expect(journey.locator('.vtracker')).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, "Value · the compact tracker's sheet")));
	await page.keyboard.press('Escape');
	await expect(journey).toHaveCount(0);

	// Execute, on to Agrawal ji's turn: Ganesh ji opens the offer and orders, the other kiranas follow
	await openDemo(page, [LINE.chips, 6, 0]);
	// the Lister's raw call, opened from its card on Priya's laptop (SC-151)
	if (!isReal(page)) {
		const desk = device(page, "Priya's laptop");
		await desk.getByRole('button', { name: 'The API call' }).click();
		await expect(desk.locator('pre.code').first()).toBeVisible();
		findings.push(...(await check(page, "Execute · the Lister's API call open")));
	}
	await nextUntil(page, "Agrawal ji's phone", 'Agrawal');
	const agrawal = device(page, "Agrawal ji's phone");
	await agrawal.getByRole('button', { name: 'Bids' }).click();
	await page.waitForTimeout(600);
	await expect(agrawal.locator('.empty')).toBeVisible();
	findings.push(...(await check(page, "Execute · Agrawal ji's bids, none yet")));
	await agrawal.getByRole('button', { name: 'Market' }).click();
	await page.waitForTimeout(600);
	await expect(agrawal.locator('input.search')).toBeVisible();
	findings.push(...(await check(page, "Execute · Agrawal ji's marketplace")));
	await report(testInfo, findings);
});

test("demo · inside the devices: the Mango Drink's staff sale and Meera's receipt", async ({ page }, testInfo) => {
	await openDemo(page, [LINE.mango, 3, 0]);
	const findings: Finding[] = [];
	await nextUntil(page, "Lakshmi Agencies' phone", 'staff');
	const lakshmi = device(page, "Lakshmi Agencies' phone");
	// the consolidated receipt first (SC-174): the stand-in photo, read a moment later, matches every pack
	await lakshmi.getByRole('button', { name: 'Take a photo' }).click();
	await expect(lakshmi.getByText(/matches your count/)).toBeVisible();
	findings.push(...(await check(page, "Execute · Lakshmi Agencies' consolidated receipt read")));
	await lakshmi.getByRole('button', { name: /Record the sale/ }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'Lakshmi Agencies sells' })).toHaveCount(1);
	await page.waitForTimeout(500);
	findings.push(...(await check(page, "Execute · Lakshmi Agencies' staff sale recorded")));
	const meera = device(page, "Meera's phone");
	await meera.getByRole('button', { name: 'Confirm' }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'Meera at Feeding India confirms' })).toHaveCount(1);
	await meera.getByRole('button', { name: /Mark collected|Collected/ }).click();
	await expect(meera).toContainText('FI/HYD/26-27/0417');
	await page.waitForTimeout(500);
	findings.push(...(await check(page, "Execute · Meera's pickup collected")));
	await meera.locator('button.receipt-row').click();
	await expect(meera.getByRole('dialog')).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, "Execute · Meera's receipt open")));
	await report(testInfo, findings);
});

test("demo · inside the devices: the destruction's evidence and Priya's second yes", async ({ page }, testInfo) => {
	await openDemo(page, [LINE.slow, 2, 0]);
	const findings: Finding[] = [];
	await nextUntil(page, "Rakesh bhai's phone", 'Two photos');
	await page.waitForTimeout(800);
	findings.push(...(await check(page, "Expiry day · Rakesh bhai's evidence")));

	await openDemo(page, [LINE.slow, 3, 2]);
	const laptop = device(page, "Priya's laptop");
	const sheet = laptop.getByRole('dialog', { name: 'Approve the destruction' });
	await expect(sheet).toBeVisible();
	await page.waitForTimeout(600);
	findings.push(...(await check(page, 'The second yes · the destruction sheet')));
	await report(testInfo, findings);
});
