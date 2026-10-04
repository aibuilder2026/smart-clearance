import { expect, test, type Page } from '@playwright/test';
import { report, scan, type Finding } from './helpers';
import { openSite } from './site';

// Behaviour axe-core cannot see, as design3/a11y/keyboard.a11y.spec.ts checks it on the prototype, plus what the port
// fixes: menu buttons (APG), sheets taking, keeping and returning focus, the demo form, links and the theme on load.
// One desktop run is enough: the behaviour does not change with theme.
test.beforeEach(async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-light', 'keyboard checks run once, on desktop-light');
	await openSite(page);
});

const focusedName = (page: Page) =>
	page.evaluate(() => {
		const el = document.activeElement as HTMLElement | null;
		const label = el && (el as HTMLInputElement).labels && (el as HTMLInputElement).labels![0];
		return el
			? (el.getAttribute('aria-label') || (label && label.innerText) || el.innerText || el.tagName)
					.replace(/\s+/g, ' ')
					.trim()
					.slice(0, 60)
			: '';
	});
const inDialog = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

test('keyboard · the appearance menu opens on its button, moves with the arrows, and gives focus back', async ({
	page
}, testInfo) => {
	const trigger = page.locator('.site-nav').getByRole('button', { name: 'Appearance' });
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
	await expect(item('Light'), 'ArrowDown wraps to the first item').toBeFocused();
	await page.keyboard.press('ArrowUp');
	await expect(item('Match device'), 'ArrowUp wraps to the last item').toBeFocused();
	const findings: Finding[] = await scan(page, 'appearance menu open');

	await page.keyboard.press('Escape');
	await expect(menu, 'Escape closes the menu').toHaveCount(0);
	await expect(trigger, 'focus returns to the menu button').toBeFocused();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	await page.keyboard.press('Enter');
	await expect(menu.locator('[aria-checked="true"]')).toBeFocused();
	await page.keyboard.press('Home');
	await page.keyboard.press('ArrowDown');
	await expect(item('Dark')).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(menu, 'choosing an item closes the menu').toHaveCount(0);
	await expect(trigger).toBeFocused();
	await expect(page.locator('html'), 'the choice is applied').toHaveAttribute('data-theme', 'dark');
	expect(await page.evaluate(() => localStorage.getItem('sc3-theme')), 'and remembered').toBe('dark');

	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(menu, 'Tab closes the menu and moves on').toHaveCount(0);
	expect(await focusedName(page), 'to the control after the menu button').toBe('Sign in');
	await report(testInfo, findings);
});

test('keyboard · the sign-in menu: its links open another tab, Tab moves on, Escape gives focus back', async ({
	page
}) => {
	const trigger = page.locator('.site-nav').getByRole('button', { name: 'Sign in' });
	const menu = page.getByRole('menu', { name: 'Sign in to' });
	await trigger.focus();
	await page.keyboard.press('ArrowDown');
	await expect(menu).toBeVisible();
	await expect(menu.getByRole('menuitem', { name: 'Find your workspace' })).toBeFocused();
	for (const name of ['Munchly Foods', 'Smart-Clearance staff']) {
		const link = menu.getByRole('menuitem', { name: new RegExp(name) });
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', 'noopener');
	}
	await page.keyboard.press('Escape');
	await expect(trigger).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(menu).toHaveCount(0);
	expect(await focusedName(page)).toBe('Book a demo');
});

test('keyboard · Find your workspace, from the menu: the sheet takes focus, keeps it and gives it back', async ({
	page
}) => {
	const trigger = page.locator('.site-nav').getByRole('button', { name: 'Sign in' });
	await trigger.focus();
	await page.keyboard.press('Enter');
	await page.keyboard.press('Enter'); // the first item: Find your workspace
	await page.waitForTimeout(700);
	expect.soft(await inDialog(page), 'focus moves into the sheet when it opens').toBe(true);
	expect
		.soft(
			await page.evaluate(() => {
				const el = document.activeElement;
				const by = el?.getAttribute('aria-labelledby');
				return el?.getAttribute('role') + ': ' + (by ? document.getElementById(by)?.textContent : '');
			}),
			'the sheet itself takes focus first, named by its title'
		)
		.toBe('dialog: Find your workspace');
	for (let i = 0; i < 9; i++) await page.keyboard.press('Tab');
	expect.soft(await inDialog(page), 'Tab stays inside the open sheet').toBe(true);
	await page.keyboard.press('Escape');
	await page.waitForTimeout(700);
	expect.soft(await page.locator('[role="dialog"]').count(), 'Escape closes the sheet').toBe(0);
	await expect(trigger, 'focus returns to the button that opened the menu').toBeFocused();
});

test('keyboard · Find your workspace finds members, invitees and nobody', async ({ page }) => {
	await page.locator('.hero').getByRole('button', { name: 'Find your workspace' }).click();
	const field = page.getByLabel('Email or mobile number');
	const results = async (value: string) => {
		await field.fill(value);
		await field.press('Enter');
		await page.waitForTimeout(150);
		return (await page.locator('[role="dialog"] .card').allInnerTexts()).join(' / ').replace(/\s+/g, ' ');
	};
	expect(await results('priya.deshmukh@munchly.in')).toMatch(
		/Munchly Foods munchly\.smartclearance\.com supply-chain operator Open/
	);
	expect(await results('98230 44118')).toMatch(/distributor/);
	expect(await results('+91 98230 60013')).toMatch(/invited as kirana retailer/);
	expect(await results('9823060012')).toMatch(/deactivated by the admin/);
	expect(await results('someone.new@munchly.in')).toMatch(/your company's workspace/);
	expect(await results('orders@agrawalwholesale.example')).toMatch(/No workspace uses that yet/);
	await field.fill('12345');
	await field.press('Enter');
	await expect(page.locator('#fw-id-error')).toHaveText('Enter an email address, or a 10-digit mobile number.');
	await expect(field).toHaveAttribute('aria-invalid', 'true');
	await expect(field).toHaveAttribute('aria-describedby', 'fw-id-error');
});

test('keyboard · Book a demo: Enter sends, errors are tied to their fields, and the first takes focus', async ({
	page
}) => {
	await page.locator('.site-nav').getByRole('button', { name: 'Book a demo' }).click();
	const name = page.getByLabel('Your name');
	await name.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('#bd-name-error')).toHaveText('Enter your name.');
	await expect(page.locator('#bd-email-error')).toHaveText('Enter a work email address, like name@company.in.');
	await expect(name, 'the first field with a problem takes focus').toBeFocused();
	await expect(name).toHaveAttribute('aria-invalid', 'true');
	await expect(name).toHaveAttribute('aria-describedby', 'bd-name-error');
	await name.fill('Ritu Malhotra');
	await expect(name).not.toHaveAttribute('aria-invalid', 'true');
	await page.getByLabel('Company').fill('Kesari Foods');
	await page.getByLabel('Work email').fill('Ritu@Kesari.in');
	await page.getByLabel('Work email').press('Enter');
	await expect(page.getByText('Thanks, Ritu.')).toBeVisible();
	const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sc-demo-requests') || '[]'));
	expect(saved[0]).toMatchObject({
		name: 'Ritu Malhotra',
		company: 'Kesari Foods',
		email: 'ritu@kesari.in',
		plan: null,
		status: 'new'
	});
});

test('keyboard · links: back to the top, and other sites in a new tab', async ({ page }) => {
	await page.evaluate(() => window.scrollTo(0, 3000));
	await page.locator('.nav-brand').click();
	await expect.poll(() => page.evaluate(() => window.scrollY), { message: '#top scrolls back to the top' }).toBe(0);
	for (const a of await page.locator('a[href^="http"]').all()) {
		await expect(a).toHaveAttribute('target', '_blank');
		await expect(a).toHaveAttribute('rel', 'noopener');
	}
});

test('keyboard · a saved appearance applies before the first paint', async ({ browser }) => {
	const context = await browser.newContext({ colorScheme: 'light' });
	const page = await context.newPage();
	await page.addInitScript(() => {
		localStorage.setItem('sc3-theme', 'dark');
		const seen: string[] = [];
		(window as unknown as { __themes: string[] }).__themes = seen;
		// the root element may not exist yet when this runs, so watch the document for it
		new MutationObserver((records) => {
			for (const r of records)
				if (r.target === document.documentElement)
					seen.push(document.documentElement.getAttribute('data-theme') || 'none');
		}).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-theme'] });
	});
	await page.goto('/');
	await page.waitForSelector('.app[data-mounted]');
	const themes = await page.evaluate(() => (window as unknown as { __themes: string[] }).__themes);
	expect(themes[0], 'the first theme set is the saved one').toBe('dark');
	expect(themes, 'and it never flips to light on the way').not.toContain('light');
	await context.close();
});

test.describe('the street of exits, with motion on', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });

	test('keyboard · focusing an exit pans the street to it and says it', async ({ page }) => {
		const chip = (name: string) => page.locator('.ex-chip', { hasText: name });
		await chip('Kiranas').scrollIntoViewIfNeeded();
		await chip('Staff sale').focus();
		await expect(chip('Staff sale')).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });
		await expect(page.locator('.ex-cap b')).toHaveText('Staff sale.');
		const x = await page.locator('.ex-pano').evaluate((el) => getComputedStyle(el).transform);
		expect(x, 'the panorama has moved along the street').not.toBe('none');
	});
});
