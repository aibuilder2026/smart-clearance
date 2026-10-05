import { test } from '@playwright/test';
import { report, scan, type Finding } from '@smart-clearance/testing/a11y';

// the design system page (/ds, a dev route the e2e build turns on): every component core has built, in both themes and
// at every width, plus its open sheet and menu
test('ds · the design system page', async ({ page }, testInfo) => {
	await page.goto('/ds');
	await page.waitForSelector('.app[data-mounted] .ds');
	await page.evaluate(() => document.fonts.ready);
	const findings: Finding[] = [...(await scan(page, 'ds'))];
	await page.locator('#overlays').scrollIntoViewIfNeeded();
	await page.getByRole('button', { name: 'Open the approve sheet' }).click();
	await page.waitForTimeout(600);
	findings.push(...(await scan(page, 'ds · approve sheet')));
	await page.keyboard.press('Escape');
	await page.waitForTimeout(500);
	await page.locator('#overlays').getByRole('button', { name: 'Menu' }).click();
	await page.waitForTimeout(400);
	findings.push(...(await scan(page, 'ds · menu')));
	await report(testInfo, findings);
});
