import { expect, test } from '@playwright/test';
import { openWorkspace, title } from './workspace';

// The workspace app in Firefox and WebKit (desktop, tablet and phone): Priya signs in, her screens render without
// errors, and a change lands with its toast
test('smoke · the workspace app works', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	await openWorkspace(page, '/', { as: null });
	await page.getByRole('button', { name: 'Priya', exact: true }).click();
	await page.getByRole('button', { name: 'Continue' }).click();
	await page
		.getByRole('dialog', { name: 'Sign in with Google' })
		.getByRole('button', { name: /Priya Deshmukh/ })
		.click();
	await expect(title(page)).toHaveText('Command Center');
	await expect(page.getByText('Cleared · 0 cartons destroyed')).toBeVisible();
	await page.goto('/route');
	await expect(title(page)).toHaveText('Route Room');
	await expect(page.getByText(/Approved by Priya/)).toBeVisible();
	await page.getByRole('button', { name: 'Profile and settings' }).click();
	await page.getByRole('button', { name: /^Reset demo data/ }).click();
	await expect(page.locator('.toasts .toast')).toHaveText('Demo data reset');
	await page.goto('/command');
	await expect(page.getByRole('button', { name: 'Open Setup' }), 'the batch is back at the start').toBeVisible();
	expect(errors).toEqual([]);
});
