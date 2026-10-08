import type { Locator, Page } from '@playwright/test';

/** the splash shows once a session unless this is set (Director.svelte) */
const SPLASH = 'sc3-demo-splash';

/** How long each stage's agents take, on entering it, before the story waits on a person (core's workspace flow,
 *  Agents' delays): stage 2 the Watcher, 3 Vision's request, 4 the Valuer, 5 the Router, 7 the Lister, Outreach and
 *  Donation one after another, 9 Impact. Used where the notes, and so the beats, are not on screen. */
const AGENTS_MS = [0, 2400, 1800, 1500, 1600, 0, 4200, 0, 3500];
/** the longest an agent waits before its next step once a person has moved (Vision reading the photo, Paperwork), and
 *  a margin */
const STEP_MS = 3000;

/** below 768 px the demo is the real-phone mode: the person in focus full screen, under a slim bar */
export const isReal = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;

/** Opens the demo at a stage (1 to 9) with the splash already seen this session (unless `splash`), and waits for the
 *  devices, or the real phone's bar, and for that stage's agents to finish what they do on entering it. */
export async function openDemo(page: Page, stage = 1, { splash = false } = {}) {
	await page.addInitScript(
		([key, skip]) => {
			try {
				if (skip) sessionStorage.setItem(key, '1');
				else sessionStorage.removeItem(key);
			} catch {
				// storage blocked: the splash shows
			}
		},
		[SPLASH, !splash] as const
	);
	await page.goto(`/#stage=${stage}`);
	await page.waitForSelector('.demo .devices .dev-ring, .demo-real .real-bar');
	await page.evaluate(() => document.fonts.ready);
	if (!splash) await settle(page, AGENTS_MS[stage - 1]);
}

/** Waits for the agents to finish: with the notes on screen, until the beat in progress is no agent's; otherwise for
 *  `ms`, as long as they take. Then for a device to scroll to the section its beat names (420 ms, then a smooth
 *  scroll). */
export async function settle(page: Page, ms = STEP_MS) {
	if (await page.locator('.narr .beat').count())
		await page.waitForFunction(() => !document.querySelector('.narr .beat.now .beat-aura'), null, { timeout: 20_000 });
	else await page.waitForTimeout(ms);
	await page.waitForTimeout(900);
}

/** the stage in the address (1 to 9) */
export const stageOf = (page: Page) => Number(/stage=(\d)/.exec(page.url())?.[1] ?? 0);

/** Next (→): the person's move, an agent skipped ahead, or the next stage; then the agents settle */
export async function next(page: Page) {
	const at = stageOf(page);
	await page.keyboard.press('ArrowRight');
	await page.waitForTimeout(50);
	await settle(page, stageOf(page) !== at ? AGENTS_MS[stageOf(page) - 1] : STEP_MS);
}

/** A device's screen by whose it is ("Priya's laptop", "Rakesh bhai's phone"), or, in the real-phone mode, the one app
 *  on screen */
export function device(page: Page, label: string): Locator {
	if (isReal(page)) return page.locator('.demo-real .real-app');
	return page.locator('.dev', { has: page.locator('.dev-label b', { hasText: label }) }).locator('.dev-ring');
}

/** Next until a person's device is the one the story is on: their device on the stage, or the real phone's bar naming
 *  them (`short`, as "Agrawal ji") */
export async function nextUntil(page: Page, label: string, short: string) {
	const there = () =>
		isReal(page)
			? page.locator('.real-stage', { hasText: short }).count()
			: page.locator('.dev-label b', { hasText: label }).count();
	for (let i = 0; i < 12 && !(await there()); i++) await next(page);
	if (!(await there())) throw new Error(`${label} never came on`);
}

/** the beats ticked off in the notes */
export const beatsDone = (page: Page) => page.locator('.narr .beat.done').count();

declare global {
	interface Window {
		__hold?: (ms: number) => void;
		__release?: () => void;
	}
}
/** Lets a test hold the page's next timer of exactly `ms` until it releases it, so a state that lasts a moment (the
 *  splash, 0.6 s under reduced motion; a button at work, 0.5 s) can be scanned. Every other timer runs as usual (axe's
 *  own among them, which is why the page's clock is not paused instead). `armed`: held from the first load (the splash's
 *  timer starts as the page draws). Call before the page loads. */
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
