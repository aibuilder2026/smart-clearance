import { expect, test } from '@playwright/test';
import { report, scan, type Finding } from '@smart-clearance/testing/a11y';
import { isDesktop, openConsole } from './console';

// The console's build: the staff sign-in and every screen, seeded with Munchly Foods, plus the states a super admin
// opens most: an agent's settings, a menu, an alert and its toast, and every new-client step (SC-58: every core
// component the console uses is on screen in one of these scans)
const ROUTES = [
	'/',
	'/clients',
	'/clients/munchly/agents',
	'/clients/munchly/supply',
	'/clients/munchly/rules',
	'/clients/munchly/people',
	'/clients/munchly/integrations',
	'/clients/munchly/plan',
	'/clients/munchly/audit',
	'/agents',
	'/connectors',
	'/plans',
	'/staff',
	'/audit'
];
for (const r of ROUTES) {
	test(`console · ${r}`, async ({ page }, testInfo) => {
		await openConsole(page, r);
		await report(testInfo, await scan(page, `console ${r}`));
	});
}

test('console · sign-in, a wrong sign-in, and Find a workspace', async ({ page }, testInfo) => {
	await openConsole(page, '/', { signedIn: false });
	const findings: Finding[] = [...(await scan(page, 'console sign-in'))];
	await page.getByLabel('Work email').fill('nobody@smartclearance.com');
	await page.getByLabel('Password', { exact: true }).fill('anything');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toBeVisible();
	findings.push(...(await scan(page, 'console sign-in · a wrong sign-in')));
	await page.getByRole('button', { name: 'Find a workspace' }).click();
	const sheet = page.getByRole('dialog', { name: 'Find your workspace' });
	await expect(sheet).toBeVisible();
	await sheet.getByLabel('Email or mobile number').fill('priya.deshmukh@munchly.in');
	await sheet.getByRole('button', { name: 'Find workspaces' }).click();
	await expect(sheet.getByText('munchly.smartclearance.com')).toBeVisible();
	await page.waitForTimeout(700);
	findings.push(...(await scan(page, 'console sign-in · Find your workspace')));
	await report(testInfo, findings);
});

test('console · an agent, a menu, an alert and its toast, and a new client step by step', async ({
	page
}, testInfo) => {
	await openConsole(page, '/clients/munchly/agents');
	const findings: Finding[] = [];
	// the inspector sits beside the pipeline on desktop and opens as a sheet on tablets and phones
	await page
		.getByRole('button', { name: /^Negotiator/ })
		.first()
		.click();
	await page.waitForTimeout(800);
	findings.push(...(await scan(page, 'console · Negotiator settings')));
	if (!isDesktop(page)) await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Actions for Munchly Foods' }).click();
	await expect(page.getByRole('menu', { name: 'Actions for Munchly Foods' })).toBeVisible();
	findings.push(...(await scan(page, 'console · client actions menu')));
	await page.getByRole('menuitem', { name: 'Pause every agent' }).click();
	await expect(page.getByRole('alertdialog')).toBeVisible();
	await page.waitForTimeout(500);
	findings.push(...(await scan(page, 'console · pause alert')));
	await page.getByRole('button', { name: 'Pause', exact: true }).click();
	await expect(page.locator('.toast')).toHaveText('Every agent paused for Munchly Foods');
	findings.push(...(await scan(page, 'console · a toast')));

	await page.goto('/new-client');
	await page.waitForSelector('.cs-step');
	const next = async () => {
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.waitForTimeout(300);
	};
	await page.getByLabel('Company name').fill('Kesari Foods');
	await page.getByLabel('Home city').fill('Indore');
	findings.push(...(await scan(page, 'new client · company')));
	await next();
	await page.getByLabel('Staff email domain').fill('kesari.in');
	findings.push(...(await scan(page, 'new client · workspace and sign-in')));
	await next();
	await page.getByRole('radio', { name: 'The manufacturer' }).check();
	findings.push(...(await scan(page, 'new client · supply chain')));
	await next();
	await next();
	findings.push(...(await scan(page, 'new client · agents')));
	await next();
	await page.getByLabel("Workspace admin's name").fill('Ritu Malhotra');
	await page.getByLabel("Admin's work email").fill('ritu@kesari.in');
	await next();
	findings.push(...(await scan(page, 'new client · review')));
	// it opens on its Supply chain tab, its first stock export still to upload (SC-84)
	await page.getByRole('button', { name: 'Create workspace' }).click();
	await expect(page.getByRole('button', { name: 'Choose a CSV' })).toBeVisible();
	await page.waitForTimeout(700);
	findings.push(...(await scan(page, 'new client · its first stock export')));
	await report(testInfo, findings);
});

// SC-47: an SKU's own gates and a batch override, in the SKU sheet
test("a11y · an SKU's gates and a batch override", async ({ page, isMobile }, testInfo) => {
	await openConsole(page, '/clients/munchly/supply');
	const findings: Finding[] = [];
	await (
		isMobile
			? page.getByRole('button', { name: /^Choco Cream Biscuits 200 g/ })
			: page.getByRole('row', { name: /Choco Cream Biscuits 200 g/ })
	).click();
	await page.getByRole('dialog').waitFor();
	await page.waitForTimeout(500);
	findings.push(...(await scan(page, 'console · an SKU on the default, with an overridden batch')));
	await page.getByRole('button', { name: 'Change' }).click();
	await page.waitForTimeout(200);
	findings.push(...(await scan(page, 'console · changing a batch override')));
	await page.getByRole('button', { name: 'Its own' }).click();
	await page.getByLabel('Blinkit takes at least', { exact: true }).fill('10');
	await page.getByRole('button', { name: 'Save gates' }).click();
	await page.getByRole('alert').first().waitFor();
	findings.push(...(await scan(page, 'console · an SKU with its own gates, out of bounds')));
	await report(testInfo, findings);
});

// SC-68: the length of a journey day: its badge in the client's head, the sheet with a preset and the live client's
// note, a number out of range, and the badge once days are short
test('a11y · the length of a journey day', async ({ page }, testInfo) => {
	await openConsole(page, '/clients/munchly/agents');
	const findings: Finding[] = [];
	await page.getByRole('button', { name: /^Length of a journey day/ }).click();
	const sheet = page.getByRole('dialog', { name: 'Length of a journey day' });
	await sheet.waitFor();
	await page.waitForTimeout(500);
	findings.push(...(await scan(page, 'console · the journey day sheet, in real time')));
	await sheet.getByRole('radio', { name: /^Demo/ }).check();
	await expect(sheet.locator('.cs-jd-note')).toBeVisible();
	findings.push(...(await scan(page, 'console · the journey day sheet, a demo day for a live client')));
	await sheet.getByLabel('Or any number of minutes').fill('2000');
	await expect(sheet.getByRole('alert')).toBeVisible();
	findings.push(...(await scan(page, 'console · the journey day sheet, out of range')));
	await sheet.getByLabel('Or any number of minutes').fill('5');
	await sheet.getByRole('button', { name: 'Save', exact: true }).click();
	await expect(page.getByRole('button', { name: /^Length of a journey day/ })).toContainText('1 day = 5 min');
	await page.waitForTimeout(500);
	findings.push(...(await scan(page, 'console · a client on a five-minute day')));
	await report(testInfo, findings);
});

// SC-48: the Overview as a live dashboard: a stop chosen, the chart as a table, the closed batches, updates paused
test('a11y · the Overview dashboard, its table and its filters', async ({ page }, testInfo) => {
	await openConsole(page, '/');
	const findings: Finding[] = [];
	await page.getByRole('button', { name: /^Detect: 7 batches/ }).click();
	await page.waitForTimeout(300);
	findings.push(...(await scan(page, 'console · Overview, a stop chosen')));
	await page.getByRole('button', { name: 'Show as a table' }).click();
	await page.getByRole('button', { name: 'Pause updates' }).click();
	await page.waitForTimeout(300);
	findings.push(...(await scan(page, 'console · Overview, the chart as a table, updates paused')));
	await page.getByRole('button', { name: /^Closed \d/ }).click();
	await page.waitForTimeout(300);
	findings.push(...(await scan(page, 'console · Overview, no closed batches')));
	await report(testInfo, findings);
});
