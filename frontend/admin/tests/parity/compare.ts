import type { Page } from '@playwright/test';

export { compare } from '@smart-clearance/testing/parity';

export const PROTOTYPE = 'http://127.0.0.1:8790';
export const PORT = 'http://127.0.0.1:4175';

/** Opens a page as a parity run sees it: the theme following the device, fonts loaded, motion settled. A prototype page
 *  other than the landing page scrolls inside its app root; `windowScroll` lets its document scroll instead, as the
 *  port's does, so a section taller than the window is captured whole on both sides. */
export async function open(page: Page, url: string, { windowScroll = false } = {}) {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('sc3-theme', 'system');
			localStorage.removeItem('sc-demo-requests');
		} catch {
			// storage blocked
		}
	});
	await page.goto(url, { waitUntil: 'networkidle' });
	// the landing page's loader (SC-35), on both sides, has lifted
	await page.waitForFunction(
		() => {
			const loader = (window as unknown as { SC3_LOADER?: { lifted: boolean } }).SC3_LOADER;
			return !loader || loader.lifted;
		},
		null,
		{ timeout: 15_000 }
	);
	if (windowScroll)
		await page.addStyleTag({
			content:
				'.site-root { position: relative !important; inset: auto !important; } .app { height: auto !important; overflow: visible !important; } .site { position: relative !important; inset: auto !important; overflow: visible !important; }'
		});
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(700);
}
