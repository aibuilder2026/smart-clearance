import type { Page } from '@playwright/test';

/** the landing page, hydrated and its loader lifted, with the prototype's demo store cleared */
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
	await liftedLoader(page);
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(300);
}

/** the page's loader (SC-35) has lifted: the page as the visitor then sees it */
export const liftedLoader = (page: Page) =>
	page.waitForFunction(
		() => {
			const loader = (window as unknown as { SC3_LOADER?: { lifted: boolean } }).SC3_LOADER;
			return !loader || loader.lifted;
		},
		null,
		{ timeout: 15_000 }
	);

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
