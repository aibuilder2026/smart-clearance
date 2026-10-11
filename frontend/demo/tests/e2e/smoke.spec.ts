import { expect, test } from '@playwright/test';
import { atOf, isReal, LINE, openDemo } from './demo';

// The guided demo in Firefox and WebKit (desktop, tablet and phone): the route map opens without errors, the chips'
// first station opens from the address, and → moves the story on a beat
test('smoke · the demo opens on the route map and on a station, and → moves it on', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	await openDemo(page);
	await expect(page.getByRole('heading', { name: 'Three batches. Three endings.' })).toBeVisible();
	await openDemo(page, [LINE.chips, 0, 0]);
	if (isReal(page)) {
		// the real-phone mode: Priya's sign-in full screen, then her setup once → has signed her in
		await expect(page.locator('.real-app').getByRole('heading', { name: 'Sign in' })).toBeVisible();
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('.real-app').getByRole('button', { name: 'Confirm and start watching' })).toBeVisible();
	} else {
		await expect(page.locator('.devices .dev')).toHaveCount(2);
		await expect(page.locator('.narr .beat.done')).toHaveCount(0);
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('.narr .beat.done')).toHaveCount(1);
	}
	expect(atOf(page)).toEqual([LINE.chips, 0, 1]);
	expect(errors).toEqual([]);
});
