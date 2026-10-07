import { expect, test, type Page } from '@playwright/test';
import { report, scan, type Finding } from '@smart-clearance/testing/a11y';
import { fileURLToPath } from 'node:url';
import { go, hold, isDesktop, isPhone, openWorkspace, release, scanHeld } from './workspace';

// The workspace app's build (SC-65): every role's every screen with the batch cleared, the sign-in and each of its
// sheets, the splash, the sheets, menus, toasts and banners inside the app, and the states that exist only on the way
// (the plan waiting for a yes, Vision reading the label, the agents at work, the paperwork not drafted yet). Every core
// component the workspace's screens use is on screen in one of these scans (a11y-coverage.ts).

/** each person in the story, and every screen their role opens (core's NAV and routesFor) */
const PEOPLE: [string, string[]][] = [
	['priya', ['command', 'route', 'execution', 'batches', 'setup', 'report', 'paperwork', 'inbox', 'profile']],
	['rakesh', ['home', 'photo', 'van', 'orders', 'inbox', 'profile']],
	['ganesh', ['home', 'offer', 'orders', 'inbox', 'profile']],
	['agrawal', ['market', 'listing', 'bids', 'inbox', 'profile']],
	['anita', ['paperwork', 'report', 'batches', 'inbox', 'profile']],
	['vikram', ['report', 'paperwork', 'batches', 'inbox', 'profile']],
	['meera', ['pickups', 'inbox', 'profile']],
	['arjun', ['workspace', 'users', 'rules', 'integrations', 'audit', 'inbox', 'profile']]
];
for (const [who, screens] of PEOPLE)
	test(`workspace · ${who}'s screens, the batch cleared`, async ({ page }, testInfo) => {
		const findings: Finding[] = [];
		for (const [i, s] of screens.entries()) {
			if (i === 0) await openWorkspace(page, `/${s}`, { as: who });
			else await go(page, `/${s}`);
			findings.push(...(await scan(page, `${who} · /${s}`)));
		}
		await report(testInfo, findings);
	});

const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });
/** a sheet opens with a spring; scan it once it has settled */
const settled = (page: Page) => page.waitForTimeout(500);

test('sign-in · the page, a wrong email, and Find your workspace', async ({ page }, testInfo) => {
	await openWorkspace(page, '/', { as: null });
	const findings: Finding[] = [...(await scan(page, 'sign-in'))];
	await page.getByLabel('Work email or mobile number').fill('nobody@example.com');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText("nobody@example.com isn't a member of Munchly Foods' workspace.")).toBeVisible();
	findings.push(...(await scan(page, 'sign-in · a wrong email')));
	await page.getByRole('button', { name: 'Find your workspace' }).click();
	const sheet = dialog(page, 'Find your workspace');
	await expect(sheet).toBeVisible();
	await sheet.getByLabel('Email or mobile number').fill('priya.deshmukh@munchly.in');
	await sheet.getByRole('button', { name: 'Find workspaces' }).click();
	await expect(sheet.getByText('munchly.smartclearance.com').first()).toBeVisible();
	await settled(page);
	findings.push(...(await scan(page, 'sign-in · Find your workspace')));
	await report(testInfo, findings);
});

test('sign-in · Google: the account sheet, and signing in', async ({ page }, testInfo) => {
	await openWorkspace(page, '/', { as: null, clock: true });
	await page.getByLabel('Work email or mobile number').fill('priya.deshmukh@munchly.in');
	await page.getByRole('button', { name: 'Continue' }).click();
	const sheet = dialog(page, 'Sign in with Google');
	await expect(sheet).toBeVisible();
	await settled(page);
	const findings: Finding[] = [...(await scan(page, 'sign-in · the Google account sheet'))];
	// the account chosen: the sheet keeps it, with its spinner, for a moment before the app opens
	await sheet.getByRole('button', { name: /Priya Deshmukh/ }).click();
	await expect(sheet.locator('svg.spinner')).toBeVisible();
	await hold(page);
	findings.push(...(await scanHeld(page, 'sign-in · signing in')));
	await release(page);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Command Center');
	await report(testInfo, findings);
});

test('sign-in · a phone: the one-time code, a wrong code, and a first-time invitee joining', async ({
	page
}, testInfo) => {
	await openWorkspace(page, '/', { as: null });
	await page.getByLabel('Work email or mobile number').fill('98230 60013');
	await page.getByRole('button', { name: 'Continue' }).click();
	const code = dialog(page, 'Enter the code');
	await expect(code).toBeVisible();
	await settled(page);
	const findings: Finding[] = [...(await scan(page, 'sign-in · the one-time code'))];
	await code.getByLabel('Digit 1').click();
	await page.keyboard.type('111111');
	await expect(code.getByRole('alert')).toHaveText("That code doesn't match. This prototype sends 246810.");
	findings.push(...(await scan(page, 'sign-in · a wrong code')));
	await code.getByLabel('Digit 1').click();
	await page.keyboard.type('246810');
	const join = dialog(page, 'Join Munchly Foods');
	await expect(join).toBeVisible();
	await settled(page);
	findings.push(...(await scan(page, 'sign-in · joining the workspace')));
	await report(testInfo, findings);
});

test('sign-in · Explore as someone in the story', async ({ page }, testInfo) => {
	await openWorkspace(page, '/', { as: null });
	await page.getByRole('button', { name: 'Explore as someone in the story' }).click();
	await expect(dialog(page, 'Explore as someone in the story')).toBeVisible();
	await settled(page);
	await report(testInfo, await scan(page, 'sign-in · Explore as someone in the story'));
});

test('the splash, on the first open in a session', async ({ page }, testInfo) => {
	await openWorkspace(page, '/command', { splash: true, clock: true, wait: false });
	await page.waitForSelector('.app[data-mounted] .splash');
	await hold(page);
	const findings = await scanHeld(page, 'the splash');
	await release(page);
	await expect(page.locator('.splash')).toHaveCount(0);
	await report(testInfo, findings);
});

test('inside · the workspace sheet, switching person, a toast and an in-app banner', async ({ page }, testInfo) => {
	// the batch at its last stage: Impact posts the ledger a few seconds after the app opens, and Priya hears of it
	await openWorkspace(page, '/command', { stage: 8, clock: true });
	const banner = page.locator('.banners .banner');
	await expect(banner).toBeVisible({ timeout: 10_000 });
	await hold(page);
	const findings: Finding[] = [...(await scanHeld(page, 'an in-app banner'))];
	await release(page);
	await banner.click();

	await page.getByRole('button', { name: /^Munchly Foods workspace/ }).click();
	await expect(dialog(page, 'Workspace')).toBeVisible();
	await settled(page);
	findings.push(...(await scan(page, 'the workspace sheet')));
	await page.keyboard.press('Escape');
	await expect(dialog(page, 'Workspace')).toHaveCount(0);

	await go(page, '/profile');
	await page.getByRole('button', { name: /^Switch person/ }).click();
	await expect(dialog(page, 'Switch person')).toBeVisible();
	await settled(page);
	findings.push(...(await scan(page, 'the switch-person sheet')));
	await page.keyboard.press('Escape');

	await go(page, '/paperwork');
	await page.getByRole('button', { name: 'Export' }).click();
	await expect(page.locator('.toasts .toast')).toHaveText('Document pack exported');
	await hold(page);
	findings.push(...(await scanHeld(page, 'a toast')));
	await release(page);
	await report(testInfo, findings);
});

test("admin · the users' row menu, an invitation and a role", async ({ page }, testInfo) => {
	await openWorkspace(page, '/users', { as: 'arjun' });
	const findings: Finding[] = [];
	const actions = page.getByRole('button', { name: 'Actions for Shree Sai Kirana' });
	await actions.click();
	const menu = page.getByRole('menu', { name: 'Actions for Shree Sai Kirana' });
	await expect(menu).toBeVisible();
	findings.push(...(await scan(page, 'users · a row menu')));
	await menu.getByRole('menuitem', { name: 'Change role' }).click();
	await expect(dialog(page, 'Role for Shree Sai Kirana')).toBeVisible();
	await settled(page);
	findings.push(...(await scan(page, 'users · the role sheet')));
	await page.keyboard.press('Escape');

	await page.getByRole('button', { name: 'Invite' }).click();
	const invite = dialog(page, 'Invite someone');
	await expect(invite).toBeVisible();
	await invite.getByLabel('Name or organisation').fill('Laxmi Provision Store');
	await invite.getByLabel('Email or mobile number').fill('+91 98230 60014');
	await invite.getByLabel('Role').selectOption('retailer');
	await settled(page);
	findings.push(...(await scan(page, 'users · the invite sheet')));
	await report(testInfo, findings);
});

test("admin · the guardrails' steppers and switches, changed", async ({ page }, testInfo) => {
	await openWorkspace(page, '/rules', { as: 'arjun' });
	await page.getByRole('switch').first().click();
	await page
		.getByRole('button', { name: /^More / })
		.first()
		.click();
	await report(testInfo, await scan(page, 'guardrails · changed, not saved'));
});

test('the plan waiting for a yes, and the approve sheet', async ({ page }, testInfo) => {
	await openWorkspace(page, '/route', { stage: 5 });
	const findings: Finding[] = [...(await scan(page, 'Route Room · the plan waiting for approval'))];
	await page.getByRole('button', { name: 'Table' }).click();
	findings.push(...(await scan(page, 'Route Room · the channels as a table')));
	await page.getByRole('button', { name: 'Review and approve' }).click();
	const sheet = dialog(page, 'Approve the plan');
	await expect(sheet).toBeVisible();
	await settled(page);
	findings.push(...(await scan(page, 'the approve sheet')));
	await sheet.getByRole('button', { name: 'Approve · release the agents' }).click();
	await expect(dialog(page, 'Plan placed')).toBeVisible();
	await settled(page);
	findings.push(...(await scan(page, 'the approve sheet · the plan placed')));
	await report(testInfo, findings);
});

test('Execution while the agents work, and the batch about to be settled', async ({ page }, testInfo) => {
	// stage 6: the plan approved, the Lister, Outreach and the donation agent at work
	await openWorkspace(page, '/execution', { stage: 6, clock: true });
	await page.waitForTimeout(3500);
	await hold(page);
	const findings: Finding[] = [...(await scanHeld(page, 'Execution · the agents at work'))];
	await release(page);
	await report(testInfo, findings);
});

// stage 7: every kirana ordered and the lot awarded; the buyer's truck is next
test('Execution with every order in and the lot awarded', async ({ page }, testInfo) => {
	await openWorkspace(page, '/execution', { stage: 7, clock: true });
	await hold(page);
	await report(testInfo, await scanHeld(page, 'Execution · every order in, the lot awarded'));
});

test('Paperwork: a document opened, and the pack before it is drafted', async ({ page }, testInfo) => {
	await openWorkspace(page, '/paperwork', { as: 'anita' });
	// on desktops the document opens beside the pack; on tablets and phones, in a sheet
	await page.locator('.docpick > button.card').nth(2).click();
	if (!isDesktop(page)) {
		await expect(page.getByRole('dialog')).toBeVisible();
		await settled(page);
	}
	await report(testInfo, await scan(page, 'Paperwork · a document opened'));
});

test('Paperwork before the award: the pack not drafted yet', async ({ page }, testInfo) => {
	await openWorkspace(page, '/paperwork', { as: 'anita', stage: 7, clock: true });
	await hold(page);
	await expect(page.locator('.skeleton').first()).toBeVisible();
	await report(testInfo, await scanHeld(page, 'Paperwork · not drafted yet'));
});

test('Batches: a batch opened in its sheet', async ({ page }, testInfo) => {
	await openWorkspace(page, '/batches');
	await (
		isPhone(page)
			? page.getByRole('button', { name: /^Peanut Chikki 100 g/ })
			: page.getByRole('row', { name: /Peanut Chikki 100 g/ })
	).click();
	await expect(dialog(page, 'Peanut Chikki 100 g')).toBeVisible();
	await settled(page);
	await report(testInfo, await scan(page, 'Batches · a batch in its sheet'));
});

test("Report: the quarter and this batch's view", async ({ page }, testInfo) => {
	await openWorkspace(page, '/report', { as: 'vikram' });
	const findings: Finding[] = [];
	await page.getByRole('button', { name: 'This batch' }).click();
	await page.waitForTimeout(400);
	findings.push(...(await scan(page, "Report · this batch's view")));
	await page.getByRole('button', { name: 'Quarter' }).click();
	await page.waitForTimeout(400);
	findings.push(...(await scan(page, "Report · the quarter's view")));
	await report(testInfo, findings);
});

// a label photo for the camera on touch screens, where the shutter opens the phone's own camera (a file chooser here)
const LABEL = fileURLToPath(new URL('../../../../design3/system/img/label-shot.webp', import.meta.url));

test('the label photo: the request, the camera, and Vision reading it', async ({ page }, testInfo) => {
	// stage 2: the batch at risk; Vision asks Rakesh bhai for a photo of one carton label
	await openWorkspace(page, '/home', { as: 'rakesh', stage: 2, clock: true });
	await expect(page.getByRole('button', { name: 'Open camera' })).toBeVisible({ timeout: 10_000 });
	const findings: Finding[] = [...(await scan(page, 'Today · the photo request'))];
	await page.getByRole('button', { name: 'Open camera' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Label photo');
	await page.waitForTimeout(300);
	findings.push(...(await scan(page, 'the camera')));
	page.on('filechooser', (fc) => fc.setFiles(LABEL));
	await page.getByRole('button', { name: 'Take the photo' }).click();
	await expect(page.getByRole('button', { name: 'Send photo' })).toBeVisible();
	findings.push(...(await scan(page, 'the camera · a photo taken')));
	await page.getByRole('button', { name: 'Send photo' }).click();
	await expect(page.getByText('Sent · Vision is reading the label')).toBeVisible();
	await hold(page);
	findings.push(...(await scanHeld(page, 'the camera · Vision reading the label')));
	await release(page);
	await report(testInfo, findings);
});
