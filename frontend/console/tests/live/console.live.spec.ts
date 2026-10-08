import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// End to end on this machine: the landing page and the console against backend-api, signing in with Firebase
// Authentication. backend-api/scripts/e2e.sh sets these from Secret Manager and the database; the tests skip without them.
const PASSWORD = process.env.SC_LIVE_PASSWORD ?? '';
const SUPER_ADMIN = process.env.SC_LIVE_SUPER_ADMIN ?? '';
const SUPPORT = process.env.SC_LIVE_SUPPORT ?? '';
const CONSOLE = 'http://localhost:5174';
const HYDRATE = fileURLToPath(new URL('../../../../backend-api/scripts/hydrate.sh', import.meta.url));
const SITE = 'http://localhost:5173';

test.skip(!PASSWORD || !SUPER_ADMIN, 'run through backend-api/scripts/e2e.sh');

// a company no run has used: its slug is its workspace address
const stamp = Date.now().toString(36).slice(-5);
const company = `Livecheck ${stamp} Foods`;
const slug = `livecheck-${stamp}`;
const domain = `livecheck-${stamp}.example`;

async function signIn(page: Page, email: string, password = PASSWORD) {
	await page.goto(CONSOLE + '/');
	await page.waitForSelector('.app[data-mounted] .si-title, .app[data-mounted] .largetitle h1');
	if (await page.locator('.largetitle h1').count()) await signOut(page);
	await page.getByLabel('Work email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Sign in' }).click();
}

async function signOut(page: Page) {
	await page.locator('.sb-user:visible').first().click();
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.locator('.si-title')).toHaveText('Sign in');
}

test('live · a wrong password, then a Super admin signs in to the real data', async ({ page }) => {
	await signIn(page, SUPER_ADMIN, 'Not-the-password-1');
	await expect(page.getByRole('alert')).toHaveText(
		"That email and password don't match. Check both, or ask a Super admin to put your account back on its first password."
	);
	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
	await expect(page.locator('.cs-ov-tablecard')).toBeVisible();
	await page.goto(CONSOLE + '/clients');
	await expect(page.getByRole('row', { name: /Munchly Foods/ })).toBeVisible();
	await signOut(page);
});

test('live · Book a demo on the landing page becomes a client in the console', async ({ page }) => {
	// the landing page: Find your workspace names the workspace only, and Book a demo reaches backend-api
	await page.goto(SITE + '/');
	await page.locator('.hero').getByRole('button', { name: 'Find your workspace' }).click();
	const find = page.getByRole('dialog', { name: 'Find your workspace' });
	await find.getByLabel('Email or mobile number').fill('priya.deshmukh@munchly.example');
	await find.getByRole('button', { name: 'Find workspaces' }).click();
	await expect(find.locator('.card').first()).toHaveText(/^\s*Munchly Foods\s*munchly\.smartclearance\.com\s*Open\s*$/);
	await page.keyboard.press('Escape');
	await page.locator('.site-nav').getByRole('button', { name: 'Book a demo' }).click();
	await page.getByLabel('Your name').fill('Ritu Malhotra');
	await page.getByLabel('Company').fill(company);
	await page.getByLabel('Work email').fill(`ritu@${domain}`);
	await page.getByLabel('Work email').press('Enter');
	await expect(page.getByText('Thanks, Ritu.')).toBeVisible();

	// the console: the request is there, and the New client flow sets it up
	await signIn(page, SUPER_ADMIN);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
	await page.locator('.list-row', { hasText: company }).getByRole('button', { name: 'Set up' }).click();
	await expect(page).toHaveURL(/\/new-client\?request=rq-/);
	await expect(page.getByLabel('Company name')).toHaveValue(company);
	await page.getByLabel('Home city').fill('Indore');
	const next = () => page.getByRole('button', { name: 'Continue' }).click();
	await next();
	await expect(page.getByLabel('Staff email domain')).toHaveValue(domain);
	for (let i = 0; i < 4; i++) await next();
	await expect(page.getByLabel("Admin's work email")).toHaveValue(`ritu@${domain}`);
	await next();
	await page.getByRole('button', { name: 'Create workspace' }).click();
	// it opens on its Supply chain tab, where its first stock export is next (SC-84)
	await expect(page).toHaveURL(new RegExp(`/clients/${slug}/supply$`));
	await expect(page.locator('.toast')).toHaveText(`${company}'s workspace is set up`);
	await expect(page.getByRole('button', { name: 'Choose a CSV' })).toBeVisible();
	await page.goto(`${CONSOLE}/clients/${slug}/agents`);

	// an agent, a person and the plan, each written to the audit log in the signed-in name
	const negotiator = page.getByRole('group', { name: 'Negotiator: autonomy' }).first();
	await negotiator.getByRole('button', { name: 'Act' }).click();
	await expect(page.locator('.toast').last()).toHaveText(`Negotiator: Act, for ${company}`);
	await page.goto(`${CONSOLE}/clients/${slug}/people`);
	const form = page.locator('.cs-invite');
	await form.getByLabel('Name').fill('Sunil Rao');
	await form.getByLabel('Email', { exact: true }).fill(`sunil.rao@${domain}`);
	await form.getByRole('button', { name: 'Invite', exact: true }).click();
	await expect(page.locator('.toast').last()).toHaveText('Sunil Rao can sign in with the default password');
	await page.goto(`${CONSOLE}/clients/${slug}/plan`);
	await page.getByRole('group', { name: 'Plan' }).getByRole('button', { name: 'Growth' }).click();
	await expect(page.locator('.toast').last()).toHaveText(`${company} on Growth`);
	await page.goto(`${CONSOLE}/clients/${slug}/audit`);
	const log = page.locator('.list-row');
	await expect(log.first()).toContainText(`Moved ${company} from Pilot to Growth`);
	for (const line of [
		'Invited Sunil Rao as Member',
		`Set the Negotiator agent to Act for ${company} (was Ask)`,
		`Set up ${company} from its supply-chain profile`
	])
		await expect(log.filter({ hasText: line }), line).toHaveCount(1);
	await expect(log.first(), 'in the signed-in name').toContainText('Neha Kulkarni');
	await signOut(page);
});

test('live · Support may not change a plan', async ({ page }) => {
	test.skip(!SUPPORT, 'no active Support member in the database');
	await signIn(page, SUPPORT);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
	await page.goto(CONSOLE + '/clients/munchly/plan');
	await page.getByRole('group', { name: 'Plan' }).getByRole('button', { name: 'Enterprise' }).click();
	await expect(page.locator('.toast').last()).toHaveText("Only a Super admin can change a client's plan.");
	await signOut(page);
});

test("live · an SKU's own gates and a batch override, in the database the agents read (SC-47)", async ({ page }) => {
	await signIn(page, SUPER_ADMIN);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
	await page.goto(CONSOLE + '/clients/munchly/supply');
	await expect(page.getByText('3 of 8 SKUs differ')).toBeVisible();
	const chips = page.getByRole('row', { name: /Masala Chips 150 g/ });
	const sheet = page.getByRole('dialog', { name: 'Masala Chips 150 g' });
	await chips.click();
	await sheet.getByRole('button', { name: 'Its own' }).click();
	await sheet.getByLabel('Blinkit takes at least', { exact: true }).fill('75');
	await sheet.getByRole('button', { name: 'Save gates' }).click();
	await expect(page.locator('.toast').last()).toHaveText("Masala Chips 150 g's gates saved");
	await expect(page.getByText('4 of 8 SKUs differ')).toBeVisible();

	await chips.click();
	await sheet.getByRole('button', { name: 'Override for this batch' }).first().click();
	await sheet.getByLabel('Zepto, Instamart, for this batch').fill('25');
	await sheet.getByLabel('Why').fill('Instamart Nagpur clears this lot this week');
	await sheet.getByRole('button', { name: 'Save the override' }).click();
	await expect(sheet.locator('.cs-govr-h').first()).toContainText('Zepto and Instamart 25% of life');
	await expect(sheet.locator('.cs-gwho').first()).toContainText('Neha Kulkarni, Today,');
	await sheet.getByRole('button', { name: 'Remove' }).click();
	await expect(sheet.locator('.cs-govr-h')).toHaveCount(0);
	await sheet.getByRole('button', { name: "Munchly Foods' default" }).click();
	await sheet.getByRole('button', { name: 'Save gates' }).click();
	await expect(page.getByText('3 of 8 SKUs differ')).toBeVisible();

	await page.goto(CONSOLE + '/clients/munchly/audit');
	const log = page.locator('.list-row');
	await expect(log.nth(0)).toContainText("Put Masala Chips 150 g back on Munchly Foods' default quick-commerce gates");
	await expect(log.nth(1)).toContainText("Removed MF-2409-117's quick-commerce gate override");
	await expect(log.nth(2)).toContainText(
		"Overrode MF-2409-117's quick-commerce gates: Zepto and Instamart 25% of life (Instamart Nagpur clears this lot this week)"
	);
	await expect(log.nth(3)).toContainText(
		"Set Masala Chips 150 g's quick-commerce gates: Blinkit 75+ days, Zepto and Instamart 60% of life"
	);
	await signOut(page);
});

test('live · the Overview reads its figures and pages from the database (SC-48)', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 2200 });
	await signIn(page, SUPER_ADMIN);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
	await expect(page.locator('.cs-ov-kpi')).toHaveCount(4);
	await expect(page.locator('.cs-ov-live')).toContainText('Live');
	const pager = page.locator('.cs-ov-pager');
	await expect(pager).toContainText(/^1–8 of \d+/);
	await page.screenshot({ path: test.info().outputPath('overview.png') });
	// a stop, then the next page, each read from backend-api and kept in the address
	await page.getByRole('button', { name: /^Approve: \d+ batch/ }).click();
	await expect(page).toHaveURL(/\?stop=5$/);
	await expect(page.locator('.cs-ov-table tbody tr').first()).toContainText('Waiting for a yes');
	await page.getByRole('button', { name: 'Every stop' }).click();
	await page.getByRole('button', { name: 'Next page' }).click();
	await expect(pager).toContainText(/^9–16 of \d+/);
	await page.getByRole('button', { name: /^Closed \d+/ }).click();
	await expect(page.locator('.cs-ov-table tbody tr').first()).toContainText('recovered');
	await page.screenshot({ path: test.info().outputPath('overview-closed.png') });
	await signOut(page);
});

test('live · Agents at work draws the batches at each stop, and moves them as the agents do (SC-49)', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await signIn(page, SUPER_ADMIN);
	await page.locator('.cs-si-btn', { hasText: /^Welcome, / }).waitFor({ state: 'attached' });
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
	const stops = page.getByRole('group', { name: 'Batches in flight by stop' });
	await expect(stops.getByRole('button')).toHaveCount(9);
	await expect(page.locator('.cs-aw-tok').first()).toBeVisible();
	await expect(page.getByRole('img', { name: /^Closed today: \d+ batch/ })).toBeVisible();
	// the agents move a few batches on (hydrate --tick), and the next reading lights the stops they reached
	execFileSync(HYDRATE, ['--tick'], { stdio: 'ignore' });
	await page.getByRole('button', { name: 'Pause updates' }).click();
	await page.getByRole('button', { name: 'Resume updates' }).click();
	await page.locator('.cs-aw-stop.lit').first().waitFor({ state: 'attached', timeout: 15_000 });
	await expect(page.locator('.cs-aw-tok.moved').first()).toBeAttached();
	await page.screenshot({ path: test.info().outputPath('agents-at-work.png') });
	await signOut(page);
});
