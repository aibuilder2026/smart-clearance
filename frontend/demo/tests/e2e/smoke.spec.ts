import { expect, test } from '@playwright/test';
import { isReal, openDemo, stageOf } from './demo';

// The guided demo in Firefox and WebKit (desktop, tablet and phone): it opens on a stage without errors, and → moves
// the story on a beat
test('smoke · the demo opens on a stage, and → moves it on', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	await openDemo(page, 1);
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
	expect(stageOf(page)).toBe(1);
	expect(errors).toEqual([]);
});
