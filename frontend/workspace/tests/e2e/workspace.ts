import type { Page } from '@playwright/test';
import { scan } from '@smart-clearance/testing/a11y';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// The workspace app's stub keeps the journey in the browser (localStorage `sc3-store`, version 5) and the person in
// `sc3-session`, as the prototype does. The suites put the journey where a test needs it: design3's own core
// (money.js, data.js, store.js, flow.js, run in a sandbox as the page runs them) fast-forwards to the start of a stage,
// and that store is written before the app loads. core/tests/workspace.test.ts holds the port's flow to the same state at
// every stage, so the prototype and the port read the same journey.

const design3 = new URL('../../../../design3/', import.meta.url);
const CORE = ['core/money.js', 'core/data.js', 'core/store.js', 'core/flow.js'];
const cache = new Map<string, string>();

/** The store at the start of stage n (0–9; 9 is the batch cleared, where no agent has anything left to do), as JSON.
 *  img: where the store's portraits live, `sc3img:/` for the port (core's imgUrl resolves it to the hashed file) and
 *  `system/img/` for the prototype's page. */
export function storeAt(stage: number, img = 'sc3img:/'): string {
	const key = `${stage}:${img}`;
	if (!cache.has(key)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the prototype's modules are untyped browser globals
		const window: Record<string, any> = { SC3_IMG: img };
		const sandbox = vm.createContext({ window, console, Date, Intl, Math, JSON });
		for (const p of CORE) vm.runInContext(readFileSync(new URL(p, design3), 'utf8'), sandbox);
		window.SC3_FLOW.fastForward(stage);
		cache.set(key, JSON.stringify(window.SC3_STORE.get()));
	}
	return cache.get(key)!;
}

export type Open = {
	/** who is signed in; null for the sign-in */
	as?: string | null;
	/** the journey's stage (storeAt) */
	stage?: number;
	/** show the splash, as on the first open in a session */
	splash?: boolean;
	/** wait for the screen (or the sign-in) to draw; false returns once the page has loaded */
	wait?: boolean;
	/** install Playwright's clock, so a passing state can be held on screen (hold, scanHeld) */
	clock?: boolean;
};

/** Opens the workspace app at a path, the journey at a stage (the batch cleared by default) and a person signed in
 *  (Priya, the operator, by default), the splash skipped. The first load of a test only: later loads keep what the test
 *  did. Waits for the app to mount and the screen's large title, or the sign-in, to draw. */
export async function openWorkspace(page: Page, path = '/', o: Open = {}) {
	const { as = 'priya', stage = 9, splash = false, wait = true, clock = false } = o;
	if (clock) {
		// the page's own timers, kept before the clock replaces them, for axe-core while the clock is held
		await page.addInitScript(() => {
			const w = window as unknown as Record<string, unknown>;
			w.__realTimers = { setTimeout, clearTimeout };
		});
		await page.clock.install();
	}
	await page.addInitScript(
		([store, uid, splash]) => {
			try {
				if (sessionStorage.getItem('sc-e2e')) return;
				sessionStorage.setItem('sc-e2e', '1');
				localStorage.setItem('sc3-store', store);
				if (uid) localStorage.setItem('sc3-session', JSON.stringify({ uid, at: 1 }));
				else localStorage.removeItem('sc3-session');
				if (splash) sessionStorage.removeItem('sc3-app-splash');
				else sessionStorage.setItem('sc3-app-splash', '1');
			} catch {
				// storage blocked
			}
		},
		[storeAt(stage), as, splash] as const
	);
	await page.goto(path);
	if (!wait) return;
	await page.waitForSelector(as ? '.app[data-mounted] .largetitle h1' : '.app[data-mounted] .si-title');
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(300);
}

/** Opens another screen of the app, by its address, and waits for it to draw. */
export async function go(page: Page, path: string) {
	await page.goto(path);
	await page.waitForSelector('.app[data-mounted] .largetitle h1');
	await page.waitForTimeout(300);
}

/** Holds the page's clock (openWorkspace's `clock`): its timers and animation frames wait, so a state that passes by
 *  itself (the splash, a toast, Vision reading the label, an agent at work) stays on screen. release() lets it run on. */
export async function hold(page: Page) {
	const now = await page.evaluate(() => Date.now());
	await page.clock.pauseAt(now + 20);
}
export const release = (page: Page) => page.clock.resume();

/** scan() while the clock is held: axe-core settles each rule on a timer, so it runs on the page's real timers, and the
 *  app's own stay held */
export async function scanHeld(page: Page, state: string) {
	const swap = (back: boolean) =>
		page.evaluate((back) => {
			const w = window as unknown as Record<string, unknown>;
			if (back) Object.assign(w, w.__heldTimers);
			else {
				w.__heldTimers = { setTimeout: w.setTimeout, clearTimeout: w.clearTimeout };
				Object.assign(w, w.__realTimers);
			}
		}, back);
	await swap(false);
	try {
		return await scan(page, state);
	} finally {
		await swap(true);
	}
}

/** the screen's large title */
/** the page's large title; on the operator's batch page, the batch's name in its head (SC-112) */
export const title = (page: Page) => page.locator('.largetitle h1, .bhead h1');
/** the batch's screen shown, its tab under the batch's head (SC-112) */
export const batchTab = (page: Page) => page.locator('.bh-tab[aria-current="page"]');

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
export const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 1440) >= 1100;
