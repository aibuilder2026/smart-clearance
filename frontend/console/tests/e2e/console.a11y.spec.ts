import { expect, test } from '@playwright/test';
import { report, scan, type Finding } from '@smart-clearance/testing/a11y';
import { isDesktop, openConsole } from './console';

// design3/a11y/console.a11y.spec.ts, on the port: the staff sign-in and every screen, seeded with Munchly Foods, plus
// the states a super admin opens most: an agent's settings and the new-client steps
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

test('console · an agent, a menu and an alert, and a new client step by step', async ({ page }, testInfo) => {
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
	await page.getByRole('button', { name: 'Cancel' }).click();

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
