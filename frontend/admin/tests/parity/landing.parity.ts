import { test, type Page } from '@playwright/test';
import { PORT, PROTOTYPE, compare, open } from './compare';

// The landing page against design3/site, section by section and with each overlay open. Accepted differences, kept
// under the thresholds: Lucide 1.51's drawing of a few icons (the phone menu button) against the prototype's 0.468,
// and the rasterising of a panel framer-motion leaves on its own compositing layer.
const SITE = '/site/Smart-Clearance%20site%20v3.html';
const SECTIONS: [string, number][] = [
	['.site-nav', 0.006],
	['.hero', 0.002],
	['#how', 0.002],
	['#exits', 0.002],
	['#agents', 0.002],
	['#teams', 0.002],
	['#pricing', 0.002],
	['.close', 0.002],
	['.foot', 0.002]
];

test('parity · every section of the landing page', async ({ browser }, testInfo) => {
	const shots: Record<string, Record<string, Buffer>> = { prototype: {}, port: {} };
	for (const [side, url] of [
		['prototype', PROTOTYPE + SITE],
		['port', PORT + '/']
	] as const) {
		const context = await browser.newContext(testInfo.project.use);
		const page = await context.newPage();
		await open(page, url, { windowScroll: side === 'prototype' });
		for (const [sel] of SECTIONS)
			shots[side][sel] = await page.locator(sel).first().screenshot({ animations: 'disabled' });
		await context.close();
	}
	for (const [sel, max] of SECTIONS) await compare(testInfo, sel, shots.prototype[sel], shots.port[sel], max);
});

const phone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
const OVERLAYS: [string, number, (page: Page) => Promise<unknown>][] = [
	['the sign-in menu', 0.003, (p) => p.locator('.site-nav').getByRole('button', { name: 'Sign in' }).click()],
	['the appearance menu', 0.003, (p) => p.locator('.site-nav').getByRole('button', { name: 'Appearance' }).click()],
	[
		'Find your workspace',
		0.006,
		(p) => p.locator('.hero').getByRole('button', { name: 'Find your workspace' }).click()
	],
	['Talk to us about Growth', 0.015, (p) => p.getByRole('button', { name: 'Talk to us about Growth' }).click()],
	['the phone menu', 0.006, (p) => (phone(p) ? p.getByRole('button', { name: 'Menu' }).click() : Promise.resolve())]
];

for (const [name, max, act] of OVERLAYS) {
	test(`parity · ${name}`, async ({ browser }, testInfo) => {
		const shots: Buffer[] = [];
		for (const url of [PROTOTYPE + SITE, PORT + '/']) {
			const context = await browser.newContext(testInfo.project.use);
			const page = await context.newPage();
			await open(page, url);
			test.skip(name === 'the phone menu' && !phone(page), 'the menu button is a phone control');
			await act(page);
			await page.waitForTimeout(700);
			await page.mouse.move(0, 0);
			shots.push(await page.screenshot({ animations: 'disabled', caret: 'hide' }));
			await context.close();
		}
		await compare(testInfo, name, shots[0], shots[1], max);
	});
}
