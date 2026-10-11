import { expect, test, type Page } from '@playwright/test';
import { LINE, next, openDemo, stationOf, theEnd, type Place } from './demo';

// WCAG 2.2.2 Pause, Stop, Hide: with motion on, nothing in the demo may repeat forever; only loading indicators turn
// until the load ends. The route map drawing itself, a station of each line as its agents leave it, the map between
// lines, autoplay running, and the end. One desktop run is enough.
test.use({ contextOptions: { reducedMotion: 'no-preference' } });
// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument destructured
test.beforeEach(async ({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-light', 'motion checks run once, on desktop-light');
});

const LOADING = '.spinner, .skeleton, .spin, .btn-arc';
const endless = (page: Page) =>
	page.evaluate(
		(loading) =>
			document
				.getAnimations()
				.filter((a) => a.effect && a.effect.getTiming().iterations === Infinity)
				.map((a) => {
					const fx = a.effect as KeyframeEffect;
					const el = fx.target as Element | null;
					if (el && el.closest(loading)) return null;
					const name = (a as CSSAnimation).animationName || 'web animation';
					return el
						? `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}${fx.pseudoElement || ''} (${name})`
						: name;
				})
				.filter(Boolean),
		LOADING
	);

test('motion · the start: the map draws itself once, and nothing loops', async ({ page }) => {
	await openDemo(page);
	// the lines trace, the stations pop in, and the outcomes' pins ping twice (about 3.5 s in all)
	await page.waitForTimeout(4000);
	expect(await endless(page)).toEqual([]);
});

/** [name, place] */
const STATIONS: [string, Place][] = [
	['The platform: Overview', [LINE.console, 1, 0]],
	['The platform: Agent setup', [LINE.console, 5, 0]],
	['Masala Chips: Connect', [LINE.chips, 0, 0]],
	['Masala Chips: Detect', [LINE.chips, 1, 0]],
	['Masala Chips: Verify', [LINE.chips, 2, 0]],
	['Masala Chips: Approve', [LINE.chips, 5, 0]],
	['Masala Chips: Execute', [LINE.chips, 6, 0]],
	['Masala Chips: Report', [LINE.chips, 8, 0]],
	['Mango Drink: Execute', [LINE.mango, 3, 0]],
	['Mango Drink: Report', [LINE.mango, 5, 0]],
	['a slow week: Expiry day', [LINE.slow, 2, 0]],
	['a slow week: The second yes', [LINE.slow, 3, 0]]
];
for (const [name, place] of STATIONS)
	test(`motion · ${name}: nothing loops`, async ({ page }) => {
		await openDemo(page, place);
		await page.waitForTimeout(1500);
		expect(await endless(page)).toEqual([]);
		// and once the visitor has moved the story on a beat
		await next(page);
		await page.waitForTimeout(1500);
		expect(await endless(page)).toEqual([]);
	});

test('motion · the map between lines: the token hops once, and nothing loops', async ({ page }) => {
	await openDemo(page, [LINE.chips, 8, 0]);
	for (let i = 0; i < 12 && !(await page.locator('.rb-over').count()); i++) {
		await page.keyboard.press('ArrowRight');
		await page.waitForTimeout(150);
	}
	await expect(page.getByRole('dialog', { name: 'The route map' })).toBeVisible();
	await page.waitForTimeout(1500);
	expect(await endless(page)).toEqual([]);
});

test('motion · autoplay: the beats play on, and nothing loops while they do', async ({ page }) => {
	await openDemo(page, [LINE.chips, 5, 0]);
	await page.getByRole('button', { name: 'Play the route' }).click();
	await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
	// the approval opens, Priya approves, and Execute's agents set to work
	await expect.poll(() => stationOf(page), { timeout: 15_000 }).toBe(`${LINE.chips}.6`);
	for (let i = 0; i < 4; i++) {
		await page.waitForTimeout(1500);
		expect(await endless(page), `${(i + 1) * 1.5} s into Execute`).toEqual([]);
	}
	await page.getByRole('button', { name: 'Pause' }).click();
});

test('motion · the end: nothing loops', async ({ page }) => {
	await openDemo(page, [LINE.slow, 4, 0]);
	for (let i = 0; i < 8 && !(await theEnd(page).count()); i++) await next(page);
	await expect(page.getByRole('button', { name: 'Ride it again' })).toBeVisible();
	await page.waitForTimeout(3000);
	expect(await endless(page)).toEqual([]);
});
