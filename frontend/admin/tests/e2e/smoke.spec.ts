import { expect, test } from '@playwright/test';
import { openSite } from './site';

// The landing page in Firefox and WebKit (desktop, tablet and phone): it renders without errors, its figures are
// there, and a menu and a sheet open and close.
test('smoke · the landing page works', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	await openSite(page);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Every near-expiry carton gets a second chance.');
	await expect(page.locator('.results')).toContainText('₹21,152');
	await page.locator('.site-nav').getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('menu', { name: 'Sign in to' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await page.locator('.hero').getByRole('button', { name: 'Find your workspace' }).click();
	await expect(page.getByRole('dialog', { name: 'Find your workspace' })).toBeVisible();
	await page.getByRole('button', { name: 'Close' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	expect(errors).toEqual([]);
});
