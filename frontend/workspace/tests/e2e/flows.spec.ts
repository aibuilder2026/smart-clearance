import { expect, test, type Page } from '@playwright/test';
import { batchTab, isPhone, openWorkspace, title } from './workspace';

// The workspace app's journey on its stub, driven as the people in the story drive it: each step lands, the agents
// carry the batch on by themselves, and partners nobody is playing answer on their own (SC-65)

const signInField = (page: Page) => page.getByLabel('Work email or mobile number');
const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' });

test("flows · Priya's day: signing in, Setup, the agents' plan, the one yes, and execution", async ({ page }) => {
	test.setTimeout(150_000);
	await openWorkspace(page, '/', { as: null, stage: 0 });
	await expect(page).toHaveTitle('Sign in · Munchly Foods · Smart-Clearance');

	// a wrong address first: it is not in Munchly's workspace, and the page says where to look
	await signInField(page).fill('priya@gmail.com');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText("priya@gmail.com isn't a member of Munchly Foods' workspace.")).toBeVisible();
	await expect(page.getByRole('button', { name: 'Find your workspace' })).toBeVisible();
	await signInField(page).fill('priya.deshmukh@munchly.in');
	await expect(page.getByText("isn't a member"), 'editing clears it').toHaveCount(0);
	await page.getByRole('button', { name: 'Continue' }).click();
	const google = page.getByRole('dialog', { name: 'Sign in with Google' });
	await google.getByRole('button', { name: /Priya Deshmukh/ }).click();
	await expect(title(page)).toHaveText('Command Center');
	await expect(page).toHaveURL(/\/command$/);
	await expect(page).toHaveTitle('Priya · Munchly Foods · Smart-Clearance');

	// nothing is watched until the stock data is connected and the guardrails confirmed
	await page.getByRole('button', { name: 'Open Setup' }).click();
	await expect(title(page)).toHaveText('Setup');
	await page.getByRole('button', { name: 'Confirm and start watching' }).click();
	await expect(page.getByText('Watching since setup')).toBeVisible();

	// Rakesh bhai gives his permission, the Watcher flags the batch, he sends the label photo, Vision reads it, the
	// Valuer prices five channels and the Router splits the batch: about 35 seconds, with nobody else signed in
	await page.getByRole('button', { name: 'Open Command Center' }).click();
	const review = page.getByRole('button', { name: 'Review and approve', exact: true });
	await expect(review).toBeVisible({ timeout: 70_000 });
	// Priya hears of it in an in-app banner, as a push
	await expect(page.locator('.banners .banner').last()).toBeVisible();
	await review.click();
	// the batch's page, on its Route Room (SC-112)
	await expect(title(page)).toHaveText('Masala Chips 150 g');
	await expect(batchTab(page)).toContainText(/^Route/);
	await expect(page.getByText('Recommended split')).toBeVisible();

	// the one yes
	await review.click();
	const sheet = page.getByRole('dialog', { name: 'Approve the plan' });
	await sheet.getByRole('button', { name: 'Approve · release the agents' }).click();
	const placed = page.getByRole('dialog', { name: 'Plan placed' });
	await expect(placed).toBeVisible();
	await placed.getByRole('button', { name: 'Watch execution' }).click();
	await expect(batchTab(page)).toContainText('Execution');
	await expect(page).toHaveURL(/\/execution\/MF-2409-117$/); // Execution keeps the batch approved (SC-91)

	// the Lister, Outreach and the donation agent at work, then the kiranas' orders coming in
	await expect(page.getByText('pickup booked')).toBeVisible({ timeout: 15_000 });
	const units = page.getByRole('progressbar', { name: 'Units ordered' });
	await expect
		.poll(async () => Number(await units.getAttribute('aria-valuenow')), { timeout: 20_000 })
		.toBeGreaterThan(0);
	// the batch's Route Room again, from its tabs; back goes where the batch was opened from
	await expect(page.getByRole('button', { name: 'Back to Command Center' })).toBeVisible();
	await page.locator('.bh-tab', { hasText: /^Route/ }).click();
	await expect(page.getByText(/Approved by Priya · 09:40/)).toBeVisible();
});

test('flows · Rakesh bhai by phone: a wrong code, then 246810', async ({ page }) => {
	await openWorkspace(page, '/', { as: null });
	await signInField(page).fill('98230 44118');
	await page.getByRole('button', { name: 'Continue' }).click();
	const code = page.getByRole('dialog', { name: 'Enter the code' });
	await expect(code.getByText('Sent by SMS to +91 98230 44118.')).toBeVisible();
	await expect(code.getByLabel('Digit 1')).toBeFocused();
	await page.keyboard.type('135791');
	await expect(code.getByRole('alert')).toHaveText("That code doesn't match. This prototype sends 246810.");
	await expect(code.getByLabel('Digit 1'), 'the boxes are cleared').toHaveValue('');
	await code.getByLabel('Digit 1').click();
	await page.keyboard.type('246810');
	await expect(title(page)).toHaveText('Today');
	await expect(page).toHaveURL(/\/home$/);
	await expect(page.getByText('Rakesh Traders · Kalamna Market godown, Nagpur')).toBeVisible();
});

test('flows · a first-time invitee joins: Shree Sai Kirana', async ({ page }) => {
	await openWorkspace(page, '/', { as: null });
	await page.getByRole('button', { name: /Shree Sai Kirana · invited/ }).click();
	await expect(signInField(page), 'the account fills the field').toHaveValue('+91 98230 60013');
	await page.getByRole('button', { name: 'Continue' }).click();
	const code = page.getByRole('dialog', { name: 'Enter the code' });
	await code.getByLabel('Digit 1').fill('2');
	await page.keyboard.type('46810');
	const join = page.getByRole('dialog', { name: 'Join Munchly Foods' });
	await expect(join.getByText("Shree Sai Kirana is invited to Munchly Foods' workspace")).toBeVisible();
	await expect(join.getByText(/Rakesh Traders added this number as a kirana retailer/)).toBeVisible();
	await join.getByRole('button', { name: 'Join the workspace' }).click();
	await expect(title(page)).toHaveText('Offers');
	await expect(page.getByText('Shree Sai Kirana', { exact: false }).first()).toBeVisible();

	// the admin sees the new member active, and the join in the audit log
	await page.getByRole('button', { name: 'Profile and settings' }).click();
	await page.getByRole('button', { name: /^Switch person/ }).click();
	await page
		.getByRole('dialog', { name: 'Switch person' })
		.getByRole('button', { name: /Arjun Nair/ })
		.click();
	await expect(title(page)).toHaveText('Workspace');
	await nav(page).getByRole('button', { name: 'Audit log' }).click();
	await expect(page.getByText("joined Munchly Foods' workspace").first()).toBeVisible();
});

test('flows · Agrawal ji on ExpireSoon: a bid, the counter, and accepting it', async ({ page }) => {
	// stage 6: the plan approved; the Lister puts the lot on ExpireSoon within a second
	await openWorkspace(page, '/market', { as: 'agrawal', stage: 6 });
	await expect(page).toHaveTitle('Agrawal ji · ExpireSoon');
	await page.getByRole('button', { name: 'View lot' }).click({ timeout: 10_000 });
	await expect(title(page)).toHaveText('Lot ES-24117');
	await page.getByRole('button', { name: /^Bid ₹13\.00 for 772$/ }).click();
	// the Negotiator answers: under the hidden reserve, so it counters at ₹14.20
	const accept = page.getByRole('button', { name: 'Accept ₹14.20 · pay ₹1,644 token' });
	await expect(accept).toBeVisible({ timeout: 15_000 });
	await accept.click();
	await expect(page.getByText('Lot won at ₹14.20')).toBeVisible();
	await nav(page).getByRole('button', { name: 'My bids' }).click();
	await expect(page.getByRole('button', { name: /ES-24117 · Masala Chips 150 g · 772 units/ })).toContainText('won');
});

test('flows · switching person from the profile', async ({ page }) => {
	await openWorkspace(page, '/command');
	await page.getByRole('button', { name: 'Profile and settings' }).click();
	await expect(title(page)).toHaveText('Profile');
	await page.getByRole('button', { name: /^Switch person/ }).click();
	const sheet = page.getByRole('dialog', { name: 'Switch person' });
	await expect(sheet.getByRole('button', { name: /Priya Deshmukh/ })).toContainText('you');
	await sheet.getByRole('button', { name: /Anita Rao/ }).click();
	await expect(title(page)).toHaveText('Paperwork');
	await expect(page).toHaveURL(/\/paperwork$/);
	await expect(page).toHaveTitle('Anita · Munchly Foods · Smart-Clearance');
	await expect(nav(page).getByRole('button', { name: 'Route Room' }), 'finance has no Route Room').toHaveCount(0);
	// a screen her role cannot open falls back to her home
	await page.goto('/route');
	await expect(title(page)).toHaveText('Paperwork');
});

test('flows · the shell: navigating, then back and forward', async ({ page }) => {
	await openWorkspace(page, '/command', { stage: 5 });
	// a batch in a journey is in the sidebar by name and stop, and opens its page where it stands (SC-112)
	if (!isPhone(page)) {
		await nav(page)
			.getByRole('button', { name: /^Masala Chips 150 g, MF-2409-117, at Approve/ })
			.click();
		await expect(title(page)).toHaveText('Masala Chips 150 g');
		await expect(page).toHaveURL(/\/route\/MF-2409-117$/);
		await expect(
			nav(page).getByRole('button', { name: /^Masala Chips 150 g/ }),
			'the batch is marked current'
		).toHaveAttribute('aria-current', 'page');
	}
	for (const [name, path, heading] of [
		['Batches', '/batches', 'Batches'],
		['Finance & ESG', '/report', 'Finance & ESG']
	]) {
		await nav(page).getByRole('button', { name }).click();
		await expect(title(page)).toHaveText(heading);
		await expect(page).toHaveURL(new RegExp(`${path}$`));
		await expect(nav(page).getByRole('button', { name }), 'the place is marked current').toHaveAttribute(
			'aria-current',
			'page'
		);
	}
	// the shell replaces the entry, so back leaves the app's screens for what came before; a screen's own links push
	await page.getByRole('button', { name: 'Notifications' }).click();
	await expect(title(page)).toHaveText('Inbox');
	await page.goBack();
	await expect(title(page)).toHaveText('Finance & ESG');
	await page.goForward();
	await expect(title(page)).toHaveText('Inbox');
	await page.getByRole('button', { name: 'Profile and settings' }).click();
	await expect(title(page)).toHaveText('Profile');
	await page.goBack();
	await expect(title(page)).toHaveText('Inbox');
	await page.goBack();
	await expect(page).toHaveURL(/\/report$/);
});

test('flows · reset demo data puts the batch back at the start', async ({ page }) => {
	await openWorkspace(page, '/profile');
	await page.getByRole('button', { name: /^Reset demo data/ }).click();
	await expect(page.locator('.toasts .toast')).toHaveText('Demo data reset');
	await nav(page).getByRole('button', { name: 'Command Center' }).click();
	await expect(page.getByRole('button', { name: 'Open Setup' })).toBeVisible();
	await page.reload();
	await expect(page.getByRole('button', { name: 'Open Setup' }), 'the reset is kept in this browser').toBeVisible();
});
