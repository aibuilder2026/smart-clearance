import { expect, test } from '@playwright/test';
import { isPhone, openConsole } from './console';

// The console in Firefox and WebKit (desktop, tablet and phone): it signs in, renders without errors, and a change
// lands with its toast
test('smoke · the console works', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	await openConsole(page, '/', { signedIn: false });
	await page.getByLabel('Work email').fill('sameer.rao@smartclearance.com');
	await page.getByLabel('Password', { exact: true }).fill('anything');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
	await expect(page.locator('.cs-track').first()).toContainText('MF-2409-117');
	await page.goto('/clients/munchly/plan');
	await page.getByRole('group', { name: 'Plan' }).getByRole('button', { name: 'Growth' }).click();
	await expect(page.locator('.toast')).toHaveText('Munchly Foods on Growth');
	if (!isPhone(page)) await expect(page.locator('.cs-head')).toContainText('Growth');
	expect(errors).toEqual([]);
});
