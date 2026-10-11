import type { Locator, Page } from '@playwright/test';

// The guided demo's specs (SC-167): the route map to start, then four lines (the console's, the chips', the Mango
// Drink's, the slow week's), each a run of stations, each a run of beats. A place in the story is in the address,
// #at=line.station.beat (0.0.0 the console's sign-in); the map is the page with no hash.

/** the lines, by their place on the map */
export const LINE = { console: 0, chips: 1, mango: 2, slow: 3 } as const;
export type Place = [line: number, station: number, beat?: number];

/** below 768 px the demo is the real-phone mode: the person in focus full screen, under a slim bar */
export const isReal = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;

/** Opens the demo at a place in the story (or the route map, with none), waits for the devices (or the real phone's
 *  bar, or the map), the fonts, and that station's agents to finish what they do on entering it */
export async function openDemo(page: Page, place?: Place) {
	await page.goto(place ? `/#at=${place[0]}.${place[1]}.${place[2] ?? 0}` : '/');
	await page.waitForSelector(place ? '.demo .devices .dev-ring, .demo-real .real-bar' : '.rb-start');
	await page.evaluate(() => document.fonts.ready);
	if (place) await settle(page);
}

/** Waits for the agents: while the beat in progress is an agent's at work (its aura in the notes), they run on their own
 *  (1.5 s each) and the notes move on; then for a device to scroll to the section its beat names (420 ms, then a smooth
 *  scroll). Without the notes on screen, for `ms` */
export async function settle(page: Page, ms = 2500) {
	if (await page.locator('.narr .beat').count())
		await page.waitForFunction(() => !document.querySelector('.narr .beat.now .beat-aura'), null, { timeout: 30_000 });
	else await page.waitForTimeout(ms);
	await page.waitForTimeout(900);
}

/** where the story is, from the address: [line, station, beat] */
export const atOf = (page: Page): Place => {
	const m = /at=(\d+)\.(\d+)\.(\d+)/.exec(page.url());
	return m ? [+m[1], +m[2], +m[3]] : [-1, -1, -1];
};
/** the line and station in the address, as "line.station" */
export const stationOf = (page: Page) => atOf(page).slice(0, 2).join('.');

/** Next (→): the person's move, an agent skipped ahead, or the next station; then the agents settle. Between lines the
 *  map comes up with the token hopping to the next one; Escape closes it */
export async function next(page: Page) {
	await page.keyboard.press('ArrowRight');
	await page.waitForTimeout(50);
	if (await page.locator('.rb-over').count()) {
		await page.keyboard.press('Escape');
		await page.locator('.rb-over').waitFor({ state: 'detached' });
	}
	await settle(page);
}

/** A device's screen by whose it is ("Priya's laptop", "Rakesh bhai's phone", "Neha's laptop"), or, in the real-phone
 *  mode, the one app on screen */
export function device(page: Page, label: string): Locator {
	if (isReal(page)) return page.locator('.demo-real .real-app, .demo-real .real-console');
	return page.locator('.dev', { has: page.locator('.dev-label b', { hasText: label }) }).locator('.dev-ring');
}

/** Next until a person's device is the one the story is on: their device on the stage, or the real phone's bar naming
 *  the beat (`short`, words of its text) */
export async function nextUntil(page: Page, label: string, short: string) {
	const there = () =>
		isReal(page)
			? page.locator('.real-stage', { hasText: short }).count()
			: page.locator('.dev-label.focus b', { hasText: label }).count();
	for (let i = 0; i < 14 && !(await there()); i++) await next(page);
	if (!(await there())) throw new Error(`${label} never came on`);
}

/** the beats ticked off in the notes */
export const beatsDone = (page: Page) => page.locator('.narr .beat.done').count();
/** the end of the route, a dialog */
export const theEnd = (page: Page) => page.getByRole('dialog', { name: 'The end of the route' });

declare global {
	interface Window {
		__hold?: (ms: number) => void;
		__release?: () => void;
	}
}
/** Lets a test hold the page's next timer of exactly `ms` until it releases it, so a state that lasts a moment (a button
 *  at work, 0.5 s) can be scanned. Every other timer runs as usual (axe's own among them, which is why the page's clock
 *  is not paused instead). `armed`: held from the first load. Call before the page loads. */
export async function holdable(page: Page, armed?: number) {
	await page.addInitScript((first) => {
		const set = window.setTimeout.bind(window);
		let want: number | null = first ?? null;
		let held: (() => void) | null = null;
		window.__hold = (ms) => (want = ms);
		window.__release = () => {
			want = null;
			held?.();
			held = null;
		};
		window.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
			if (want === null || ms !== want || held) return set(fn, ms, ...args);
			held = () => set(fn, 0, ...args);
			want = null;
			return 0;
		}) as typeof window.setTimeout;
	}, armed);
}
export const hold = (page: Page, ms: number) => page.evaluate((t) => window.__hold?.(t), ms);
export const release = (page: Page) => page.evaluate(() => window.__release?.());
