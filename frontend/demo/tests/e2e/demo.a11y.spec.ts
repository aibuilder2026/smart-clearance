import { expect, test, type Page } from '@playwright/test';
import { report, scan, type Finding } from '@smart-clearance/testing/a11y';
import { device, hold, holdable, isReal, next, nextUntil, openDemo, release, settle, stageOf } from './demo';

// The guided demo's build (SC-65): every stage at every beat, by its own Next, in the three layouts its width gives it
// (the notes beside the stage, under it, or the real-phone mode); then the states a visitor opens: phone only, the
// notes hidden, the finale, the splash, the appearance menu, the real phone's notes, and the moves made inside the
// devices that the beats skip (a workspace found, a button at work, a one-time code, the channels as a table, the
// compact tracker's sheet, the marketplace, an empty list). Every core component the demo uses, its devices' workspace
// screens included, is on screen in one of these scans (SC-58).

// The laptop and the phone on the stage are previews of the real screens, drawn at their own size and scaled down to
// fit (Device.svelte: a CSS transform of 0.3 to 0.84), so a 44 px button in them measures 13 to 37 px on the page: axe's
// target-size rule fails the sidebar's items and the sign-in's field in them (55 findings over the nine stages at 1440
// and 820 wide, measured on 7 Oct 2026). Target size (2.5.8) is judged on the same screens at full size, in the
// real-phone mode below 768 px and in the workspace app's own suite; every other rule still covers the previews.
const PREVIEWS = { targetSizeExclude: ['.demo .devices .dev-ring'] };
const check = (page: Page, state: string) => scan(page, state, PREVIEWS);

/** every beat of a stage, by Next, scanned after each, until Next moves on to the following stage or the finale */
async function walk(page: Page, stage: number, findings: Finding[]) {
	for (let beat = 1; beat <= 12; beat++) {
		await next(page);
		if (stageOf(page) !== stage || (await page.locator('.finale').count())) return;
		findings.push(...(await check(page, `stage ${stage} · after Next ${beat}`)));
	}
	throw new Error(`stage ${stage} never ended`);
}

for (let stage = 1; stage <= 9; stage++)
	test(`demo · stage ${stage}, beat by beat`, async ({ page }, testInfo) => {
		await openDemo(page, stage);
		const findings = await check(page, `stage ${stage}`);
		await walk(page, stage, findings);
		await report(testInfo, findings);
	});

test('demo · the finale', async ({ page }, testInfo) => {
	await openDemo(page, 9);
	for (let i = 0; i < 4 && !(await page.locator('.finale').count()); i++) await next(page);
	await expect(page.getByRole('button', { name: 'Play it again' })).toBeVisible();
	await report(testInfo, await check(page, 'the finale'));
});

// The splash shows on a session's first visit and lifts by itself (0.6 s under reduced motion), so its timer is held
// while it is scanned
test('demo · the splash', async ({ page }, testInfo) => {
	await holdable(page, 600);
	await openDemo(page, 1, { splash: true });
	await expect(page.locator('.splash')).toBeVisible();
	const findings = await check(page, 'the splash');
	await release(page);
	await expect(page.locator('.splash')).toHaveCount(0);
	await report(testInfo, findings);
});

test('demo · phone only, the notes hidden, and the appearance menu', async ({ page }, testInfo) => {
	test.skip(isReal(page), 'the real-phone mode has no stage, top bar or notes beside it');
	await openDemo(page, 6);
	const findings: Finding[] = [];
	await page.keyboard.press('p');
	await expect(page.getByRole('button', { name: 'Laptop and phone' })).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, 'stage 6 · phone only')));
	await page.keyboard.press('n');
	await expect(page.locator('.narr')).toHaveCount(0);
	await page.waitForTimeout(500);
	findings.push(...(await check(page, 'stage 6 · phone only, notes hidden')));
	await page.keyboard.press('p');
	await page.waitForTimeout(500);
	findings.push(...(await check(page, 'stage 6 · laptop and phone, notes hidden')));
	await page.locator('.demo-top').getByRole('button', { name: 'Appearance' }).click();
	await expect(page.getByRole('menu')).toBeVisible();
	findings.push(...(await check(page, 'the appearance menu')));
	await report(testInfo, findings);
});

test("demo · the real phone's bar and its notes", async ({ page }, testInfo) => {
	test.skip(!isReal(page), 'the real-phone mode is below 768 px');
	await openDemo(page, 6);
	await page.locator('.real-stage').click();
	const notes = page.getByRole('dialog', { name: 'Stage 6 of 9' });
	await expect(notes).toBeVisible();
	await page.waitForTimeout(500);
	const findings = await check(page, 'real phone · stage 6 · the notes');
	await notes.getByRole('button', { name: 'Next', exact: true }).click();
	await page.waitForTimeout(800);
	findings.push(...(await check(page, 'real phone · stage 6 · the notes, the approve sheet behind')));
	await report(testInfo, findings);
});

// Stage 1's sign-ins as the visitor makes them inside the devices: Find your workspace, Continue at work, Google's
// account chooser, and Rakesh bhai's one-time code
test('demo · the sign-ins, made inside the devices', async ({ page }, testInfo) => {
	await holdable(page);
	await openDemo(page, 1);
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
	await openDemo(page, 4);
	const findings: Finding[] = [];
	const laptop = device(page, "Priya's laptop");
	await laptop.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Table' }).click();
	await expect(laptop.getByRole('table')).toBeVisible();
	await page.waitForTimeout(400);
	findings.push(...(await check(page, 'stage 4 · the channels as a table')));
	// the compact tracker, on a phone-sized screen, opens the journey as a sheet
	const phone4 = device(page, "Priya's phone");
	await phone4.locator('button.tk-compact').click();
	const journey = phone4.getByRole('dialog');
	await expect(journey.locator('.vtracker')).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await check(page, "stage 4 · the compact tracker's sheet")));
	await page.keyboard.press('Escape');
	await expect(journey).toHaveCount(0);

	// stage 7, on to Agrawal ji's turn: Ganesh ji opens the offer and orders, the other kiranas follow
	await page.keyboard.press('7');
	await settle(page, 4200);
	await nextUntil(page, "Agrawal ji's phone", 'Agrawal ji');
	const phone = device(page, "Agrawal ji's phone");
	await phone.getByRole('button', { name: 'Bids' }).click();
	await page.waitForTimeout(600);
	await expect(phone.locator('.empty')).toBeVisible();
	findings.push(...(await check(page, "stage 7 · Agrawal ji's bids, none yet")));
	await phone.getByRole('button', { name: 'Market' }).click();
	await page.waitForTimeout(600);
	await expect(phone.locator('input.search')).toBeVisible();
	findings.push(...(await check(page, "stage 7 · Agrawal ji's marketplace")));
	await report(testInfo, findings);
});
