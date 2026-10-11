import { expect, test, type Page } from '@playwright/test';
import { report, scan } from '@smart-clearance/testing/a11y';
import { atOf, beatsDone, device, LINE, next, openDemo, settle, stationOf, theEnd } from './demo';

// Behaviour axe-core cannot see (SC-65, SC-167): the demo's keys (→ and ← by beats and stations, 1 to 4 to a line's
// start, M the map, P and N), the route map and the strip by keyboard, the map as a dialog that gives focus back, the
// appearance menu as a WAI-ARIA menu button, the end's buttons in reach, and keys typed into a device's field staying
// in that field. One desktop run is enough.
// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument destructured
test.beforeEach(async ({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-light', 'keyboard checks run once, on desktop-light');
});

const strip = (page: Page) => page.getByRole('list', { name: 'Stations on this line' });
const title = (page: Page) => page.locator('.narr-title');

test('keyboard · → and ← move by beats and stations, and 1 to 4 jump to a line, in the address', async ({ page }) => {
	await openDemo(page, [LINE.chips, 0, 0]);
	await expect(title(page)).toHaveText('Connect');
	expect(await beatsDone(page)).toBe(0);
	await next(page);
	expect(await beatsDone(page), '→ makes the beat in progress').toBe(1);
	await page.keyboard.press('ArrowLeft');
	await settle(page);
	expect(atOf(page), '← goes back a beat').toEqual([LINE.chips, 0, 0]);
	expect(await beatsDone(page)).toBe(0);

	for (const [key, line, name] of [
		['3', LINE.mango, 'Detect'],
		['1', LINE.console, 'Sign in'],
		['4', LINE.slow, 'Execute'],
		['2', LINE.chips, 'Connect']
	] as const) {
		await page.keyboard.press(key);
		await settle(page);
		expect(stationOf(page)).toBe(`${line}.0`);
		await expect(title(page)).toHaveText(name);
	}
	await page.keyboard.press('2');
	await settle(page);
	for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
	await settle(page);
	await expect(page.locator('.narr').getByRole('button', { name: 'Next · Detect' })).toBeVisible();
	await page.keyboard.press('ArrowRight');
	await settle(page);
	expect(stationOf(page), '→ on a station whose beats are done moves to the next').toBe(`${LINE.chips}.1`);
});

test('keyboard · M opens the map as a dialog: focus in it, Escape closes it and gives focus back', async ({ page }) => {
	await openDemo(page, [LINE.mango, 1, 0]);
	const mapButton = page.getByRole('button', { name: 'Open the route map' });
	await mapButton.focus();
	await page.keyboard.press('m');
	const map = page.getByRole('dialog', { name: 'The route map' });
	await expect(map).toBeVisible();
	await expect(map.getByRole('button', { name: 'Close the map' }), 'focus goes into the map').toBeFocused();
	await page.keyboard.press('ArrowRight');
	expect(stationOf(page), 'the story keys wait while the map is up').toBe(`${LINE.mango}.1`);
	await page.keyboard.press('Escape');
	await expect(map).toHaveCount(0);
	await expect(mapButton, 'and comes back where it was').toBeFocused();

	// a station on the map, by keyboard
	await page.keyboard.press('Enter');
	await expect(map).toBeVisible();
	await map.getByRole('button', { name: 'Masala Chips: Report' }).focus();
	await page.keyboard.press('Enter');
	await expect(map).toHaveCount(0);
	await settle(page);
	expect(stationOf(page)).toBe(`${LINE.chips}.8`);
});

test('keyboard · P toggles phone only, N toggles the notes', async ({ page }) => {
	await openDemo(page, [LINE.chips, 1, 0]);
	await expect(page.locator('.devices .dev')).toHaveCount(2);
	await page.keyboard.press('p');
	await expect(page.locator('.devices .dev'), 'phone only').toHaveCount(1);
	await expect(page.getByRole('button', { name: 'Laptop and phone' })).toBeVisible();
	await page.keyboard.press('P');
	await expect(page.locator('.devices .dev')).toHaveCount(2);
	await page.keyboard.press('n');
	await expect(page.getByRole('complementary', { name: 'Narration' }), 'the notes hidden').toHaveCount(0);
	await page.keyboard.press('N');
	await expect(page.getByRole('complementary', { name: 'Narration' })).toBeVisible();
});

test('keyboard · the strip: each station a button, the current one named, Enter and Space jump', async ({ page }) => {
	await openDemo(page, [LINE.chips, 2, 0]);
	const bar = strip(page);
	await expect(bar.getByRole('button')).toHaveCount(9);
	await expect(bar.locator('[aria-current="step"]')).toHaveAccessibleName('Verify');
	await expect(bar.getByRole('button', { name: 'Detect, done' }), 'the stations before are done').toBeVisible();
	await bar.getByRole('button', { name: 'Decide' }).focus();
	await page.keyboard.press('Enter');
	await settle(page);
	expect(stationOf(page)).toBe(`${LINE.chips}.4`);
	await expect(bar.locator('[aria-current="step"]')).toHaveAccessibleName('Decide');
	await page.keyboard.press('Shift+Tab');
	await expect(bar.getByRole('button', { name: 'Value, done' })).toBeFocused();
	await page.keyboard.press('Space');
	await settle(page);
	expect(stationOf(page)).toBe(`${LINE.chips}.3`);
	await expect(bar.getByRole('button', { name: /^Value/ }), 'focus stays on the strip').toBeFocused();
});

test('keyboard · the start: every station and badge a button, Enter opens the story there', async ({ page }) => {
	await openDemo(page);
	const map = page.getByRole('group', { name: /The demo's route map/ });
	await expect(map.getByRole('button')).toHaveCount(30);
	await map.getByRole('button', { name: 'Masala Chips · a slow week: Expiry day' }).focus();
	await page.keyboard.press('Enter');
	await page.waitForSelector('.demo .devices .dev-ring');
	await settle(page);
	expect(stationOf(page)).toBe(`${LINE.slow}.2`);
});

test('keyboard · the appearance menu (APG): open, arrows, choose, Escape and Tab', async ({ page }, testInfo) => {
	await openDemo(page, [LINE.chips, 0, 0]);
	const trigger = page.locator('.demo-top').getByRole('button', { name: 'Appearance' });
	await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
	const menu = page.getByRole('menu', { name: 'Appearance' });
	const item = (name: string) => menu.getByRole('menuitemradio', { name });
	await trigger.focus();
	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();
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
	await expect(page.locator('html'), 'the choice is applied').toHaveAttribute('data-theme', 'dark');
	expect(atOf(page), 'the menu moved nothing in the demo').toEqual([LINE.chips, 0, 0]);
	await page.keyboard.press('Enter');
	await page.keyboard.press('Tab');
	await expect(menu, 'Tab closes the menu').toHaveCount(0);
	await report(testInfo, findings);
});

test("keyboard · the end's buttons are the next stops for Tab, and each works by keyboard", async ({ page }) => {
	await openDemo(page, [LINE.slow, 4, 0]);
	for (let i = 0; i < 8 && !(await theEnd(page).count()); i++) await page.keyboard.press('ArrowRight');
	const again = page.getByRole('button', { name: 'Ride it again' });
	const stay = page.getByRole('button', { name: 'Stay on the last stop' });
	await expect(again).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(again, 'Tab goes into the end, not behind it').toBeFocused();
	await page.keyboard.press('Tab');
	await expect(stay).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(theEnd(page)).toHaveCount(0);
	await page.keyboard.press('ArrowRight');
	await expect(again).toBeVisible();
	await page.keyboard.press('Tab');
	await page.keyboard.press('Enter');
	await expect(theEnd(page)).toHaveCount(0);
	await settle(page);
	expect(stationOf(page), 'Ride it again starts from the console').toBe(`${LINE.console}.0`);
});

test("keyboard · keys typed into a device's field stay in the field", async ({ page }) => {
	await openDemo(page, [LINE.chips, 0, 0]);
	const field = device(page, "Priya's laptop").getByLabel('Work email or mobile number');
	await field.click();
	await field.press('End');
	await field.press('ArrowLeft');
	await field.press('ArrowRight');
	await page.keyboard.type('3pnm');
	await expect(field).toHaveValue('priya.deshmukh@munchly.in3pnm');
	expect(atOf(page), 'no jump to a line, no beat moved').toEqual([LINE.chips, 0, 0]);
	await expect(page.locator('.devices .dev'), 'P did not switch to phone only').toHaveCount(2);
	await expect(page.getByRole('complementary', { name: 'Narration' }), 'N did not hide the notes').toBeVisible();
	await expect(page.getByRole('dialog', { name: 'The route map' }), 'M did not open the map').toHaveCount(0);
});
