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

test('console · sign-in and its sheets', async ({ page }, testInfo) => {
	await openConsole(page, '/', { signedIn: false });
	const findings: Finding[] = [...(await scan(page, 'console sign-in'))];
	await page.getByRole('button', { name: 'Continue with Google' }).click();
	await expect(page.getByRole('dialog', { name: 'Sign in with Google' })).toBeVisible();
	await page.waitForTimeout(700);
	findings.push(...(await scan(page, 'console sign-in · Google accounts')));
	await page.getByRole('button', { name: /Neha Kulkarni/ }).click();
	await expect(page.getByRole('dialog', { name: "Confirm it's you" })).toBeVisible();
	await page.waitForTimeout(700);
	findings.push(...(await scan(page, 'console sign-in · passkey')));
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
