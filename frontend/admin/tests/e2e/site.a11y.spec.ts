import { expect, test } from '@playwright/test';
import { report, scan, type Finding } from '@smart-clearance/testing/a11y';
import { isPhone, openSite } from './site';

// smartclearance.com, the landing page: every section from the first viewport to the footer, the agents at work on
// the table with the card in focus paused and then sold, plus the sign-in menu, Find your workspace, the phone menu and
// Book a demo (empty, with its errors, and sent).
test('site · the whole page', async ({ page }, testInfo) => {
	await openSite(page);
	await report(testInfo, await scan(page, 'site'));
});

// the tour plays only with motion on; it is paused at a card before the scan, so every colour is at rest
test.describe('the table, with motion on', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });

	test('site · the agents at work: the card in focus, paused, then the result', async ({ page }, testInfo) => {
		await openSite(page);
		await page.evaluate(() => document.querySelector('.tb-stage')!.scrollIntoView());
		await page.waitForFunction(() => !!document.querySelector('.tb-focus h3'), null, { timeout: 15000 });
		await page.locator('.tb-ctl').getByRole('button', { name: 'Pause' }).click();
		await page.waitForTimeout(500);
		const findings: Finding[] = await scan(page, 'site · the table, paused at a card');
		await page.locator('.tb-ctl').getByRole('button', { name: 'Play' }).click();
		await page.waitForSelector('.tb-result', { timeout: 20000 });
		await page.waitForTimeout(500);
		findings.push(...(await scan(page, 'site · the table, sold')));
		await report(testInfo, findings);
	});
});

test('site · sign-in menu, Find your workspace and Book a demo', async ({ page }, testInfo) => {
	await openSite(page);
	const findings: Finding[] = [];
	await page.locator('.site-nav').getByRole('button', { name: 'Sign in' }).click();
	await page.waitForTimeout(400);
	findings.push(...(await scan(page, 'site · sign-in menu')));
	await page.keyboard.press('Escape');
	if (isPhone(page)) {
		await page.getByRole('button', { name: 'Menu' }).click();
		await page.waitForTimeout(600);
		findings.push(...(await scan(page, 'site · phone menu')));
		await page.keyboard.press('Escape');
		await page.waitForTimeout(400);
	}
	await page.locator('.foot').getByRole('button', { name: 'Find your workspace' }).click();
	await page.waitForTimeout(600);
	findings.push(...(await scan(page, 'site · Find your workspace')));
	await page.getByLabel('Email or mobile number').fill('priya.deshmukh@munchly.in');
	await page.getByRole('button', { name: 'Find workspaces' }).click();
	await page.waitForTimeout(300);
	findings.push(...(await scan(page, 'site · Find your workspace, found')));
	await page.keyboard.press('Escape');
	await page.waitForTimeout(400);
	await page.getByRole('button', { name: 'Talk to us about Growth' }).click();
	await page.waitForTimeout(600);
	findings.push(...(await scan(page, 'site · Book a demo')));
	await page.getByRole('button', { name: 'Send request' }).click();
	await page.waitForTimeout(300);
	findings.push(...(await scan(page, 'site · Book a demo, errors')));
	await page.getByLabel('Your name').fill('Ritu Malhotra');
	await page.getByLabel('Company').fill('Kesari Foods');
	await page.getByLabel('Work email').fill('ritu@kesari.in');
	await page.getByRole('button', { name: 'Send request' }).click();
	await page.waitForTimeout(400);
	findings.push(...(await scan(page, 'site · Book a demo, sent')));
	await report(testInfo, findings);
});

// the loader (SC-35): while the page loads it says so once, the page under it is busy, and it lifts once the film's
// poster is in; a change of theme plays under it and focus stays where the visitor left it
test('site · the loader, on a load and on a change of theme', async ({ page }, testInfo) => {
	test.skip(
		testInfo.project.name !== 'desktop-light' && testInfo.project.name !== 'phone-dark',
		'the loader is checked once in each theme'
	);
	const state = () =>
		page.evaluate(() => {
			const loader = (window as unknown as { SC3_LOADER?: { lifted: boolean; busy: boolean } }).SC3_LOADER;
			return { lifted: !!loader?.lifted, busy: !!loader?.busy };
		});
	// the film's poster held back, so the loader is still up to be scanned
	let release: () => void = () => {};
	const held = new Promise<void>((r) => (release = r));
	await page.route(/business(-night)?\.[\w-]+\.webp$|business(-night)?\.webp$/, async (route) => {
		await held;
		await route.continue();
	});
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('.loader [role="status"]')).toHaveText('Loading Smart-Clearance');
	await expect(page.locator('[aria-busy="true"]')).toHaveCount(1);
	const findings: Finding[] = await scan(page, 'site · the loader, on a load');
	release();
	await expect.poll(async () => (await state()).lifted, { timeout: 15_000 }).toBe(true);
	await expect(page.locator('.loader')).toHaveCount(0);
	await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

	// Dark or Light chosen from the keyboard: the page turns under the loader, and focus is back on Appearance
	const before = await page.evaluate(() => document.documentElement.dataset.theme);
	const to = before === 'dark' ? 'Light' : 'Dark';
	await page.getByRole('button', { name: 'Appearance' }).focus();
	await page.keyboard.press('Enter');
	await page.getByRole('menuitemradio', { name: to }).focus();
	await page.keyboard.press('Enter');
	await expect.poll(async () => (await state()).busy, { timeout: 15_000 }).toBe(false);
	await expect(page.locator('html')).toHaveAttribute('data-theme', to.toLowerCase());
	await expect(page.locator('.loader')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Appearance' })).toBeFocused();
	findings.push(...(await scan(page, 'site · after a change of theme')));
	await report(testInfo, findings);
});
