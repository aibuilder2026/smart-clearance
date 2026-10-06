import { expect, test, type Page } from '@playwright/test';
import { openConsole } from './console';

// Behaviour axe-core cannot see, as design3/a11y/keyboard.a11y.spec.ts checks it on the prototype: sheets and alerts
// take, keep and return focus; menus follow the WAI-ARIA menu-button pattern. Plus what the port adds: every place is a
// real link, a table row opens by keyboard, and the setup flow says what a step is missing. One desktop run is enough.
// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument destructured
test.beforeEach(async ({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-light', 'keyboard checks run once, on desktop-light');
});

const inDialog = (page: Page) =>
	page.evaluate(() => !!document.activeElement?.closest('[role="dialog"], [role="alertdialog"]'));

test('keyboard · the sign-in: email, password, show, Sign in, and Enter signs in', async ({ page }) => {
	await openConsole(page, '/', { signedIn: false });
	const email = page.getByLabel('Work email');
	await email.focus();
	await page.keyboard.type('neha.kulkarni@smartclearance.com');
	await page.keyboard.press('Tab');
	await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
	await page.keyboard.type('anything');
	await page.keyboard.press('Tab');
	const show = page.getByRole('button', { name: 'Show password' });
	await expect(show).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('button', { name: 'Hide password' }), 'the toggle says what it does').toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
});

test('keyboard · Find a workspace takes focus, keeps Tab inside, and gives focus back on Escape', async ({ page }) => {
	await openConsole(page, '/', { signedIn: false });
	const opener = page.getByRole('button', { name: 'Find a workspace' });
	await opener.focus();
	await page.keyboard.press('Enter');
	const sheet = page.getByRole('dialog', { name: 'Find your workspace' });
	await expect(sheet).toBeVisible();
	await expect(sheet, 'the sheet itself takes focus, so it is named first').toBeFocused();
	for (let i = 0; i < 6; i++) {
		await page.keyboard.press('Tab');
		expect(await inDialog(page), `Tab ${i + 1} stays in the sheet`).toBe(true);
	}
	await page.keyboard.press('Escape');
	await expect(sheet).toHaveCount(0);
	await expect(opener, 'focus returns to what opened it').toBeFocused();
});

test('keyboard · the client actions menu (APG), and its alert takes focus and gives it back', async ({ page }) => {
	await openConsole(page, '/clients/munchly/agents');
	const trigger = page.getByRole('button', { name: 'Actions for Munchly Foods' });
	await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
	await trigger.focus();
	await page.keyboard.press('Enter');
	const menu = page.getByRole('menu', { name: 'Actions for Munchly Foods' });
	await expect(menu).toBeVisible();
	await expect(menu.getByRole('menuitem').first(), 'focus lands on the first item').toBeFocused();
	await page.keyboard.press('End');
	await expect(menu.getByRole('menuitem', { name: 'Pause every agent' })).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(menu.getByRole('menuitem').first(), 'ArrowDown wraps').toBeFocused();
	await page.keyboard.press('Escape');
	await expect(menu).toHaveCount(0);
	await expect(trigger, 'Escape gives focus back to the button').toBeFocused();

	await page.keyboard.press('Enter');
	await page.keyboard.press('End');
	await page.keyboard.press('Enter');
	const alert = page.getByRole('alertdialog', { name: 'Pause every agent for Munchly Foods?' });
	await expect(alert).toBeVisible();
	await expect(alert, 'the alert takes focus').toBeFocused();
	await page.keyboard.press('Tab');
	expect(await inDialog(page)).toBe(true);
	await page.keyboard.press('Escape');
	await expect(alert).toHaveCount(0);
	await expect(page.getByText('Off', { exact: true }), 'Escape cancels: nothing is paused').toHaveCount(0);
});

test('keyboard · every place is a link, and a clients row opens with Enter', async ({ page }) => {
	await openConsole(page, '/');
	const nav = page.getByRole('navigation', { name: 'Main' });
	for (const [name, href] of [
		['Overview', '/'],
		['Clients', '/clients'],
		['Agents', '/agents'],
		['Connectors', '/connectors'],
		['Plans', '/plans'],
		['Staff', '/staff'],
		['Audit log', '/audit']
	])
		await expect(nav.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute('href', href);
	await expect(nav.getByRole('link', { name: /^Overview/ })).toHaveAttribute('aria-current', 'page');

	await nav.getByRole('link', { name: /^Clients/ }).click();
	await expect(page).toHaveURL(/\/clients$/);
	const row = page.getByRole('row', { name: /Munchly Foods/ });
	await row.focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/clients\/munchly\/agents$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Munchly Foods');
	await page.getByRole('tab', { name: 'Supply chain' }).click();
	await expect(page, 'a tab is named in the address').toHaveURL(/\/clients\/munchly\/supply$/);
	await expect(page).toHaveTitle('Munchly Foods · Smart-Clearance Console');
});

test('keyboard · the setup flow says what a step is missing, and moves on once it is there', async ({ page }) => {
	await openConsole(page, '/new-client');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByRole('alert')).toHaveText("Enter the company's name.");
	await page.getByLabel('Company name').fill('Kesari Foods');
	await page.getByLabel('Home city').fill('Indore');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByRole('heading', { level: 2, name: 'Workspace' })).toBeVisible();
	await expect(page.getByLabel('Workspace address'), 'the address follows the name').toHaveValue('kesari');
	await expect(page.getByRole('list', { name: 'Steps' }).getByRole('button', { name: 'Company' })).toBeVisible();
});
