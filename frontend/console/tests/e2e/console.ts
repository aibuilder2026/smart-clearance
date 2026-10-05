import type { Page } from '@playwright/test';

/** where the mock keeps the platform's state and the session (@smart-clearance/api/console) */
const STATE = 'sc-console';
const SESSION = 'sc-console-session';

/** Opens the console at a path, the mock at its seed and Neha Kulkarni (a super admin) signed in, unless `signedIn` is
 *  false. Waits for the app to hydrate and draw. */
export async function openConsole(page: Page, path = '/', { signedIn = true } = {}) {
	await page.addInitScript(
		([state, session, signed]) => {
			try {
				// the first load of a test only: later loads keep what the test did (a sign-in, a change)
				if (sessionStorage.getItem('sc-e2e')) return;
				sessionStorage.setItem('sc-e2e', '1');
				localStorage.removeItem(state);
				if (signed) localStorage.setItem(session, JSON.stringify({ uid: 'neha', at: 1 }));
				else localStorage.removeItem(session);
			} catch {
				// storage blocked
			}
		},
		[STATE, SESSION, signedIn] as const
	);
	await page.goto(path);
	await page.waitForSelector(signedIn ? '.app[data-mounted] .largetitle h1' : '.app[data-mounted] .si-title');
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(300);
}

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
export const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 1440) >= 1100;
