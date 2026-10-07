import { expect, test, type Locator, type Page } from '@playwright/test';
import { openWorkspace } from './workspace';

// Behaviour axe-core cannot see, in the workspace app: the sign-in by keyboard, the one-time code taking focus, sheets
// taking, keeping and returning focus, the users' row menu as a WAI-ARIA menu button, and the sign-in hero's Pause
// (WCAG 2.2.2). One desktop run is enough.
// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument destructured
test.beforeEach(async ({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-light', 'keyboard checks run once, on desktop-light');
});

const inDialog = (page: Page) =>
	page.evaluate(() => !!document.activeElement?.closest('[role="dialog"], [role="alertdialog"]'));

/** presses Tab until the target has focus, at most n times */
async function tabTo(page: Page, target: Locator, n = 8) {
	for (let i = 0; i < n; i++) {
		if (await target.evaluate((el) => el === document.activeElement)) return;
		await page.keyboard.press('Tab');
	}
	await expect(target).toBeFocused();
}

/** a sheet takes focus when it opens, keeps Tab inside, and gives focus back to its opener on Escape */
async function sheetKeepsFocus(page: Page, opener: Locator, name: string) {
	await opener.focus();
	await page.keyboard.press('Enter');
	const sheet = page.getByRole('dialog', { name });
	await expect(sheet).toBeVisible();
	await expect(sheet, `${name}: the sheet itself takes focus, so it is named first`).toBeFocused();
	for (let i = 0; i < 8; i++) {
		await page.keyboard.press('Tab');
		expect(await inDialog(page), `${name}: Tab ${i + 1} stays in the sheet`).toBe(true);
	}
	await page.keyboard.press('Escape');
	await expect(sheet).toHaveCount(0);
	await expect(opener, `${name}: focus returns to what opened it`).toBeFocused();
}

test('keyboard · the sign-in: the email, Enter, the Google account, Enter', async ({ page }) => {
	await openWorkspace(page, '/', { as: null });
	await page.getByLabel('Work email or mobile number').focus();
	await page.keyboard.type('priya.deshmukh@munchly.in');
	await page.keyboard.press('Enter');
	const sheet = page.getByRole('dialog', { name: 'Sign in with Google' });
	await expect(sheet).toBeVisible();
	await expect(sheet, 'the account sheet takes focus').toBeFocused();
	const account = sheet.getByRole('button', { name: /Priya Deshmukh/ });
	await tabTo(page, account);
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Command Center');
	await expect(page).toHaveURL(/\/command$/);
});

test("keyboard · a phone number: the one-time code's first box takes focus", async ({ page }) => {
	await openWorkspace(page, '/', { as: null });
	await page.getByLabel('Work email or mobile number').focus();
	await page.keyboard.type('98230 44118');
	await page.keyboard.press('Enter');
	const sheet = page.getByRole('dialog', { name: 'Enter the code' });
	await expect(sheet).toBeVisible();
	await expect(sheet.getByLabel('Digit 1'), 'the first box takes focus, ready for the code').toBeFocused();
	await page.keyboard.type('246810');
	await expect(page.getByRole('heading', { level: 1 }), 'six digits sign in').toHaveText('Today');
});

test('keyboard · the workspace sheet takes focus, keeps Tab inside, and gives focus back on Escape', async ({
	page
}) => {
	await openWorkspace(page, '/command');
	await sheetKeepsFocus(page, page.getByRole('button', { name: /^Munchly Foods workspace/ }), 'Workspace');
});

test('keyboard · the approve sheet takes focus, keeps Tab inside, and gives focus back on Escape', async ({ page }) => {
	await openWorkspace(page, '/route', { stage: 5 });
	await sheetKeepsFocus(page, page.getByRole('button', { name: 'Review and approve' }), 'Approve the plan');
	await expect(page.getByRole('button', { name: 'Review and approve' }), 'Escape approves nothing').toBeVisible();
});

test("keyboard · a user's row menu (APG): arrows, Home and End, and Escape gives focus back", async ({ page }) => {
	await openWorkspace(page, '/users', { as: 'arjun' });
	const trigger = page.getByRole('button', { name: 'Actions for Shree Sai Kirana' });
	await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
	await trigger.focus();
	await page.keyboard.press('Enter');
	const menu = page.getByRole('menu', { name: 'Actions for Shree Sai Kirana' });
	await expect(menu).toBeVisible();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	const items = menu.getByRole('menuitem');
	await expect(items).toHaveText(['Change role', 'Resend invite', 'Deactivate']);
	await expect(items.first(), 'focus lands on the first item').toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(items.nth(1)).toBeFocused();
	await page.keyboard.press('End');
	await expect(items.last()).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(items.first(), 'ArrowDown wraps').toBeFocused();
	await page.keyboard.press('ArrowUp');
	await expect(items.last(), 'ArrowUp wraps').toBeFocused();
	await page.keyboard.press('Home');
	await expect(items.first()).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(menu).toHaveCount(0);
	await expect(trigger, 'Escape gives focus back to the button').toBeFocused();

	// Enter on an item does what it says: Change role opens its sheet
	await page.keyboard.press('Enter');
	await expect(items.first()).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('dialog', { name: 'Role for Shree Sai Kirana' })).toBeVisible();
});

test.describe('with motion', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });

	test("keyboard · the sign-in hero's Pause animation stops the walk, and is remembered (WCAG 2.2.2)", async ({
		page
	}) => {
		await openWorkspace(page, '/', { as: null });
		const pause = page.getByRole('button', { name: 'Pause animation' });
		await pause.focus();
		await page.keyboard.press('Enter');
		const play = page.getByRole('button', { name: 'Play animation' });
		await expect(play, 'the same button, now Play').toBeFocused();
		const done = () => page.locator('.si-track .stop.done').count();
		const at = await done();
		await page.waitForTimeout(2200);
		expect(await done(), 'paused, the batch stays at its stage').toBe(at);

		await page.reload();
		await page.waitForSelector('.app[data-mounted] .si-title');
		await expect(page.getByRole('button', { name: 'Play animation' }), 'a paused hero stays paused').toBeVisible();
		await page.getByRole('button', { name: 'Play animation' }).focus();
		await page.keyboard.press('Enter');
		await expect(page.getByRole('button', { name: 'Pause animation' })).toBeFocused();
		await expect(page.getByRole('button', { name: 'Replay animation' }), 'it plays once and holds').toBeVisible({
			timeout: 12_000
		});
	});
});
