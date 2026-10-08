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
	// it opens on its Supply chain tab, where its first stock export is next (SC-84)
	await expect(page).toHaveURL(/\/clients\/kesari\/supply$/);
	await expect(page.locator('.toast')).toHaveText("Kesari Foods's workspace is set up");
	await expect(page.getByText('Not uploaded yet')).toBeVisible();
	await page.locator('input[type="file"]').setInputFiles({
		name: 'kesari_stock.csv',
		mimeType: 'text/csv',
		buffer: Buffer.from('distributor_name,item_code,batch_no\n')
	});
	await expect(page.getByText('Mapped', { exact: true })).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole('region', { name: 'Field mapping' })).toContainText('item_code');
	await expect(page.locator('.cs-head')).toContainText('Setting up');
	await page.getByRole('link', { name: /^Overview/ }).click();
	await expect(page.locator('.list-row', { hasText: 'ritu@kesari.in' })).toContainText('set up');
	await expect(page.getByText('waiting for Ritu Malhotra to accept the invitation')).toBeVisible();
});

test('flows · inviting a person checks the address, then adds them', async ({ page }) => {
	await openConsole(page, '/clients/munchly/people');
	const form = page.locator('.cs-invite');
	await form.getByLabel('Name').fill('Sunil Rao');
	await form.getByLabel('Email', { exact: true }).fill('sunil@gmail.com');
	await form.getByRole('button', { name: 'Invite', exact: true }).click();
	await expect(form.getByRole('alert')).toHaveText(
		'Munchly Foods staff need a munchly.in address. Partners can use any address.'
	);
	await form.getByLabel('Email', { exact: true }).fill('sunil.rao@munchly.in');
	await form.getByRole('button', { name: 'Invite', exact: true }).click();
	await expect(page.locator('.toast')).toHaveText('Sunil Rao can sign in with the default password');
	await expect(page.getByRole('row', { name: /Sunil Rao/ })).toContainText('invited');
});

test("flows · a client's length of a journey day, on every tab, saved and logged (SC-68)", async ({ page }) => {
	await openConsole(page, '/clients/munchly/people');
	const badge = page.getByRole('button', { name: /^Length of a journey day/ });
	await expect(badge).toHaveText(/Real time/);
	await badge.click();
	const sheet = page.getByRole('dialog', { name: 'Length of a journey day' });
	await sheet.getByRole('radio', { name: /^Demo/ }).check();
	await expect(sheet.getByText('Munchly Foods is live.', { exact: false })).toBeVisible();
	await expect(sheet.locator('.list-row', { hasText: "The Watcher's 09:00 check" })).toContainText('every 5 minutes');
	await sheet.getByLabel('Or any number of minutes').fill('0');
	await expect(sheet.getByRole('alert')).toHaveText('Enter a whole number of minutes, from 1 to 1,440.');
	await expect(sheet.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
	await sheet.getByLabel('Or any number of minutes').fill('90');
	await expect(sheet.locator('.list-head')).toHaveText('At 1 h 30 min a day');
	await sheet.getByRole('button', { name: 'Save', exact: true }).click();
	await expect(page.locator('.toast').last()).toHaveText('Munchly Foods: a journey day now lasts 1 h 30 min');
	await expect(badge).toHaveText(/1 day = 1 h 30 min/);
	await page.getByRole('tab', { name: 'Audit' }).click();
	await expect(badge).toHaveText(/1 day = 1 h 30 min/);
	await expect(page.locator('.list-row').first()).toContainText(
		'Set the length of a journey day for Munchly Foods to 1 h 30 min (was a day)'
	);
});

test('flows · an unknown client, and an unknown page', async ({ page }) => {
	await openConsole(page, '/clients/nobody');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('No such client');
	await page.goto('/nowhere');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not found');
});

test("flows · an SKU's own gates, and a batch override, saved and logged (SC-47)", async ({ page, isMobile }) => {
	await openConsole(page, '/clients/munchly/supply');
	await expect(page.getByText('3 of 8 SKUs differ')).toBeVisible();
	// desktops open the SKU from its row in the table, phones from its row in the list
	const chips = isMobile
		? page.getByRole('button', { name: /^Masala Chips 150 g/ })
		: page.getByRole('row', { name: /Masala Chips 150 g/ });
	await chips.click();
	const sheet = page.getByRole('dialog', { name: 'Masala Chips 150 g' });
	await expect(sheet.getByText('2 open · an override holds for that batch until it closes')).toBeVisible();
	await sheet.getByRole('button', { name: 'Its own' }).click();
	await sheet.getByLabel('Blinkit takes at least', { exact: true }).fill('20');
	await sheet.getByRole('button', { name: 'Save gates' }).click();
	await expect(sheet.getByRole('alert'), 'checked before it is sent').toHaveText('Blinkit takes 30 to 180 days.');
	await sheet.getByLabel('Blinkit takes at least', { exact: true }).fill('75');
	await sheet.getByRole('button', { name: 'Save gates' }).click();
	await expect(page.locator('.toast').last()).toHaveText("Masala Chips 150 g's gates saved");

	await chips.click();
	await sheet.getByRole('button', { name: 'Override for this batch' }).first().click();
	await sheet.getByLabel('Zepto, Instamart, for this batch').fill('25');
	await sheet.getByRole('button', { name: 'Save the override' }).click();
	await expect(sheet.getByRole('alert')).toHaveText('Say why this batch is different.');
	await sheet.getByLabel('Why').fill('Instamart Nagpur clears this lot this week');
	await sheet.getByRole('button', { name: 'Save the override' }).click();
	await expect(sheet.locator('.cs-govr-h').first()).toContainText(
		'Overridden for this batch: Zepto and Instamart 25% of life'
	);
	await sheet.getByRole('button', { name: 'Remove' }).click();
	await expect(sheet.locator('.cs-govr-h')).toHaveCount(0);
	await page.keyboard.press('Escape');

	await page.getByRole('tab', { name: 'Audit' }).click();
	const rows = page.locator('.list-row');
	await expect(rows.nth(0)).toContainText("Removed MF-2409-117's quick-commerce gate override");
	await expect(rows.nth(1)).toContainText(
		"Overrode MF-2409-117's quick-commerce gates: Zepto and Instamart 25% of life (Instamart Nagpur clears this lot this week)"
	);
	await expect(rows.nth(2)).toContainText(
		"Set Masala Chips 150 g's quick-commerce gates: Blinkit 75+ days, Zepto and Instamart 60% of life"
	);
});

test('flows · the Overview: a stop chosen, a page, the chart as a table, and updates paused (SC-48)', async ({
	page,
	isMobile
}) => {
	await openConsole(page, '/');
	await expect(page.locator('.cs-ov-kpi').first()).toContainText('₹21,152');
	await page.getByRole('button', { name: /^Detect: 7 batches/ }).click();
	await expect(page, 'the view is in the address').toHaveURL(/\?stop=1$/);
	await expect(
		page.getByRole('heading', { name: 'At Detect' }).or(page.getByText('At Detect', { exact: true }))
	).toBeVisible();
	await expect(page.locator('.cs-ov-pager')).toContainText('1–7 of 7');
	await page.getByRole('button', { name: 'Every stop' }).click();
	await expect(page).toHaveURL(/\/$/);
	await page.getByRole('button', { name: 'Next page' }).click();
	await expect(page).toHaveURL(/\?page=2$/);
	await expect(page.locator('.cs-ov-pager')).toContainText('9–9 of 9');
	await page.reload();
	await expect(page.locator('.cs-ov-pager'), 'a reload keeps the page').toContainText('9–9 of 9');
	if (!isMobile) {
		await page.getByRole('button', { name: 'Show as a table' }).click();
		await expect(page.getByRole('region', { name: 'Recovered, by day' })).toContainText('₹21,152');
	}
	await page.getByRole('button', { name: 'Pause updates' }).click();
	await expect(page.locator('.cs-ov-live')).toContainText('Paused');
	await page.reload();
	await expect(page.locator('.cs-ov-live'), 'the choice is remembered').toContainText('Paused');
	await page.getByRole('button', { name: 'Resume updates' }).click();
	await expect(page.locator('.cs-ov-live')).toContainText('every 30 s');
});

test('flows · Sign in keeps its label and welcomes; Agents at work; a tab change draws the route (SC-49)', async ({
	page
}) => {
	await openConsole(page, '/', { signedIn: false });
	await page.getByLabel('Work email').fill('sameer.rao@smartclearance.com');
	await page.getByLabel('Password', { exact: true }).fill('anything');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.locator('.cs-si-btn', { hasText: 'Welcome, Sameer' }).waitFor({ state: 'attached' });
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
	const stops = page.getByRole('group', { name: 'Batches in flight by stop' });
	await expect(stops.getByRole('button')).toHaveCount(9);
	await expect(stops.getByRole('button', { name: /^Approve: 0 batches, waiting for a person/ })).toBeVisible();
	await expect(page.getByRole('img', { name: 'Closed today: 0 batches, ₹0 recovered' })).toBeVisible();
	await expect(page.locator('.cs-aw-tok')).toHaveCount(5);
	await page.goto('/clients/munchly/agents');
	await page.getByRole('tab', { name: 'Supply chain' }).click();
	await expect(page.locator('.cs-route')).toBeAttached();
	await expect(page.locator('.cs-in[data-kind="tab"]')).toBeVisible();
});
