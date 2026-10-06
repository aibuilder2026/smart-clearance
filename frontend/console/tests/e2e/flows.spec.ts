import { expect, test } from '@playwright/test';
import { openConsole } from './console';

// The console's own work, against the mock API: each change lands, says so, and is logged in the staff member's name

test('flows · signing in with a work email and a password, then out', async ({ page }) => {
	await openConsole(page, '/clients', { signedIn: false });
	await expect(page).toHaveTitle('Sign in · Smart-Clearance Console');
	await page.getByLabel('Work email').fill('nobody@smartclearance.com');
	await page.getByLabel('Password', { exact: true }).fill('anything');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert'), 'one message for any wrong sign-in').toHaveText(
		"That email and password don't match. Check both, or ask a Super admin to put your account back on its first password."
	);
	await page.getByLabel('Work email').fill('neha.kulkarni@smartclearance.com');
	await expect(page.getByRole('alert'), 'editing clears it').toHaveCount(0);
	await page.getByLabel('Password', { exact: true }).press('Enter');
	await expect(page.getByRole('heading', { level: 1 }), 'the address is kept').toHaveText('Clients');
	await page.getByRole('button', { name: /Neha Kulkarni/ }).click();
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.locator('.si-title')).toHaveText('Sign in');
});

test("flows · an agent's autonomy and settings, saved and logged", async ({ page }) => {
	await openConsole(page, '/clients/munchly/agents');
	const negotiator = page.getByRole('group', { name: 'Negotiator: autonomy' }).first();
	await negotiator.getByRole('button', { name: 'Act' }).click();
	await expect(page.locator('.toast')).toHaveText('Negotiator: Act, for Munchly Foods');
	await page.getByLabel('Never accepts below, per pack').fill('14');
	await page.getByLabel('Never accepts below, per pack').blur();
	await page.locator('.cs-inspector').getByRole('button', { name: 'Save' }).click();
	await expect(page.locator('.toast').last()).toHaveText('Negotiator saved for Munchly Foods');
	await expect(page.locator('.cs-stop.on .cs-sum')).toContainText('floor ₹14.00');
	await page.getByRole('tab', { name: 'Audit' }).click();
	await expect(page.locator('.list-row').first()).toContainText(
		'Changed the Negotiator agent for Munchly Foods: floor ₹13.50 to ₹14.00'
	);
	await expect(page.locator('.list-row').nth(1)).toContainText(
		'Set the Negotiator agent to Act for Munchly Foods (was Ask)'
	);
	await expect(page.locator('.list-row').first()).toContainText('Neha Kulkarni · Today');
});

test('flows · pausing every agent, from the menu and its alert', async ({ page }) => {
	await openConsole(page, '/clients/munchly/agents');
	await page.getByRole('button', { name: 'Actions for Munchly Foods' }).click();
	await page.getByRole('menuitem', { name: 'Pause every agent' }).click();
	await page.getByRole('button', { name: 'Pause', exact: true }).click();
	await expect(page.locator('.toast')).toHaveText('Every agent paused for Munchly Foods');
	await expect(page.locator('.cs-head')).toContainText('0 of 10 agents on');
	await expect(page.locator('.cs-stop.off')).toHaveCount(10);
});

test('flows · a demo request becomes a client, step by step', async ({ page }) => {
	await openConsole(page, '/');
	await page.locator('.list-row', { hasText: 'Kesari Foods' }).getByRole('button', { name: 'Set up' }).click();
	await expect(page).toHaveURL(/\/new-client\?request=rq-kesari$/);
	await expect(page.getByLabel('Company name'), 'the request fills the company').toHaveValue('Kesari Foods');
	await page.getByLabel('Home city').fill('Indore');
	const next = () => page.getByRole('button', { name: 'Continue' }).click();
	await next();
	await expect(page.getByLabel('Staff email domain')).toHaveValue('kesari.in');
	for (let i = 0; i < 4; i++) await next();
	await expect(page.getByLabel("Admin's work email")).toHaveValue('ritu@kesari.in');
	await next();
	await page.getByRole('button', { name: 'Create workspace' }).click();
	await expect(page).toHaveURL(/\/clients\/kesari\/agents$/);
	await expect(page.locator('.toast')).toHaveText("Kesari Foods's workspace is set up");
	await expect(page.locator('.cs-head')).toContainText('Setting up');
	await page.getByRole('link', { name: /^Overview/ }).click();
	await expect(page.locator('.list-row', { hasText: 'ritu@kesari.in' })).toContainText('set up');
	await expect(page.getByText('waiting for Ritu Malhotra to accept the invitation')).toBeVisible();
});

test('flows · inviting a person checks the address, then adds them', async ({ page }) => {
	await openConsole(page, '/clients/munchly/people');
	const form = page.locator('.cs-invite');
	await form.getByLabel('Name').fill('Sunil Rao');
	await form.getByLabel('Work email or mobile number').fill('sunil@gmail.com');
	await form.getByRole('button', { name: 'Send invitation' }).click();
	await expect(form.getByRole('alert')).toHaveText(
		'Munchly Foods staff need a munchly.in address. Partners can use any address or a phone number.'
	);
	await form.getByLabel('Work email or mobile number').fill('sunil.rao@munchly.in');
	await form.getByRole('button', { name: 'Send invitation' }).click();
	await expect(page.locator('.toast')).toHaveText('Invitation sent to Sunil Rao');
	await expect(page.getByRole('row', { name: /Sunil Rao/ })).toContainText('invited');
});

test('flows · an unknown client, and an unknown page', async ({ page }) => {
	await openConsole(page, '/clients/nobody');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('No such client');
	await page.goto('/nowhere');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not found');
});
