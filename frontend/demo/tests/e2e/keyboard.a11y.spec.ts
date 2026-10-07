import { expect, test, type Page } from '@playwright/test';
import { report, scan } from '@smart-clearance/testing/a11y';
import { beatsDone, device, next, openDemo, settle, stageOf } from './demo';

// Behaviour axe-core cannot see (SC-65): the demo's keys (→ and ← by beats and stages, 1 to 9, P and N), the stage bar
// by keyboard, the appearance menu as a WAI-ARIA menu button, the finale's buttons in reach, and keys typed into a
// device's field staying in that field. One desktop run is enough.
// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument destructured
test.beforeEach(async ({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-light', 'keyboard checks run once, on desktop-light');
});

const stageBar = (page: Page) => page.getByRole('navigation', { name: 'Stages' });
const title = (page: Page) => page.locator('.narr-title');

test('keyboard · → and ← move by beats and stages, and 1 to 9 jump, in the address', async ({ page }) => {
	await openDemo(page, 1);
	await expect(title(page)).toHaveText('Connect');
	expect(await beatsDone(page)).toBe(0);
	await next(page);
	expect(await beatsDone(page), '→ makes the beat in progress').toBe(1);
	await page.keyboard.press('ArrowLeft');
	await settle(page);
	expect(await beatsDone(page), '← starts the stage again').toBe(0);
	await expect(page).toHaveURL(/#stage=1$/);
	await page.keyboard.press('ArrowLeft');
	await settle(page);
	await expect(page, 'and stays on the first').toHaveURL(/#stage=1$/);

	await page.keyboard.press('4');
	await settle(page, 1500);
	await expect(page).toHaveURL(/#stage=4$/);
	await expect(title(page)).toHaveText('Value');
	await page.keyboard.press('ArrowRight');
	await settle(page, 1600);
	await expect(page, '→ on a stage whose beats are done moves to the next').toHaveURL(/#stage=5$/);
	await page.keyboard.press('6');
	await settle(page, 0);
	await expect(page).toHaveURL(/#stage=6$/);
	await page.keyboard.press('ArrowLeft');
	await settle(page, 1600);
	await expect(page, "← at a stage's first beat goes to the stage before").toHaveURL(/#stage=5$/);
	for (const [key, name] of [
		['9', 'Report'],
		['1', 'Connect'],
		['7', 'Execute']
	] as const) {
		await page.keyboard.press(key);
		await expect(page).toHaveURL(new RegExp(`#stage=${key}$`));
		await expect(title(page)).toHaveText(name);
	}
});

test('keyboard · P toggles phone only, N toggles the notes', async ({ page }) => {
	await openDemo(page, 2);
	await expect(page.locator('.devices .dev')).toHaveCount(2);
	await page.keyboard.press('p');
	await expect(page.locator('.devices .dev'), 'phone only').toHaveCount(1);
	await expect(page.getByRole('button', { name: 'Laptop and phone' })).toBeVisible();
	await page.keyboard.press('P');
	await expect(page.locator('.devices .dev')).toHaveCount(2);
	await expect(page.getByRole('button', { name: 'Phone only' })).toBeVisible();
	await page.keyboard.press('n');
	await expect(page.getByRole('complementary', { name: 'Narration' }), 'the notes hidden').toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Show notes' })).toBeVisible();
	await page.keyboard.press('N');
	await expect(page.getByRole('complementary', { name: 'Narration' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Hide notes' })).toBeVisible();
});

test('keyboard · the stage bar: each stage a button, the current one named, Enter and Space jump', async ({ page }) => {
	await openDemo(page, 3);
	const bar = stageBar(page);
	await expect(bar.getByRole('button')).toHaveCount(9);
	const current = bar.locator('[aria-current="step"]');
	await expect(current).toHaveCount(1);
	await expect(current).toHaveAccessibleName('Verify, stage 3');
	await expect(bar.getByRole('button', { name: 'Detect, stage 2, done' }), 'the stages before are done').toBeVisible();

	await bar.getByRole('button', { name: /stage 5$/ }).focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/#stage=5$/);
	await expect(bar.locator('[aria-current="step"]')).toHaveAccessibleName(/stage 5$/);
	await page.keyboard.press('Shift+Tab');
	await expect(bar.getByRole('button', { name: /stage 4, done$/ })).toBeFocused();
	await page.keyboard.press('Space');
	await expect(page).toHaveURL(/#stage=4$/);
	await expect(bar.locator('[aria-current="step"]')).toHaveAccessibleName(/stage 4$/);
	await expect(bar.getByRole('button', { name: /stage 4/ }), 'focus stays on the stage bar').toBeFocused();
});

test('keyboard · the appearance menu (APG): open, arrows, choose, Escape and Tab', async ({ page }, testInfo) => {
	await openDemo(page, 1);
	const trigger = page.locator('.demo-top').getByRole('button', { name: 'Appearance' });
	await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	const menu = page.getByRole('menu', { name: 'Appearance' });
	const item = (name: string) => menu.getByRole('menuitemradio', { name });

	await trigger.focus();
	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(menu.locator('[aria-checked="true"]'), 'focus lands on the checked choice').toBeFocused();
	await page.keyboard.press('Home');
	await expect(item('Light')).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(item('Dark')).toBeFocused();
	await page.keyboard.press('End');
	await expect(item('Match device')).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(item('Light'), 'ArrowDown wraps').toBeFocused();
	const findings = await scan(page, 'the appearance menu, by keyboard', {
		targetSizeExclude: ['.demo .devices .dev-ring']
	});
	await page.keyboard.press('Escape');
	await expect(menu).toHaveCount(0);
	await expect(trigger, 'Escape gives focus back').toBeFocused();

	await page.keyboard.press('Enter');
	await page.keyboard.press('Home');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(menu, 'choosing closes the menu').toHaveCount(0);
	await expect(trigger).toBeFocused();
	await expect(page.locator('html'), 'the choice is applied').toHaveAttribute('data-theme', 'dark');
	await expect(page, 'the menu moved nothing in the demo').toHaveURL(/#stage=1$/);
	expect(await beatsDone(page)).toBe(0);

	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(menu, 'Tab closes the menu').toHaveCount(0);
	await expect(page.locator('.demo-top').getByRole('button', { name: 'Restart' })).toBeFocused();
	await report(testInfo, findings);
});

test("keyboard · the finale's buttons are the next stops for Tab, and each works by keyboard", async ({ page }) => {
	await openDemo(page, 9);
	for (let i = 0; i < 4 && !(await page.locator('.finale').count()); i++) await next(page);
	const again = page.getByRole('button', { name: 'Play it again' });
	const stay = page.getByRole('button', { name: 'Stay on the last stage' });
	await expect(again).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(again, 'Tab goes into the finale, not behind it').toBeFocused();
	await page.keyboard.press('Tab');
	await expect(stay).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.locator('.finale')).toHaveCount(0);
	await expect(page).toHaveURL(/#stage=9$/);

	await next(page);
	await expect(again).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(again).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.locator('.finale')).toHaveCount(0);
	await expect(page, 'Play it again starts from stage 1').toHaveURL(/#stage=1$/);
	await expect(title(page)).toHaveText('Connect');
});

test("keyboard · keys typed into a device's field stay in the field", async ({ page }) => {
	await openDemo(page, 1);
	const field = device(page, "Priya's laptop").getByLabel('Work email or mobile number');
	await field.click();
	await field.press('End');
	await field.press('ArrowLeft');
	await field.press('ArrowRight');
	await page.keyboard.type('3pn');
	await expect(field).toHaveValue('priya.deshmukh@munchly.in3pn');
	await expect(page, 'no jump to stage 3').toHaveURL(/#stage=1$/);
	await expect(page.locator('.devices .dev'), 'P did not switch to phone only').toHaveCount(2);
	await expect(page.getByRole('complementary', { name: 'Narration' }), 'N did not hide the notes').toBeVisible();
	expect(await beatsDone(page), '→ and ← moved no beat').toBe(0);
	expect(stageOf(page)).toBe(1);
});
