import type { Page } from '@playwright/test';

/** the landing page, hydrated, with the prototype's demo store cleared */
export async function openSite(page: Page, path = '/') {
	await page.addInitScript(() => {
		try {
			localStorage.removeItem('sc-demo-requests');
		} catch {
			// storage blocked
		}
	});
	await page.goto(path);
	await page.waitForSelector('.app[data-mounted] .site .hero');
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(300);
}

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
