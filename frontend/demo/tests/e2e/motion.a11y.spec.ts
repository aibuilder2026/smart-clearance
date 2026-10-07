import { expect, test, type Page } from '@playwright/test';
import { next, openDemo } from './demo';

// WCAG 2.2.2 Pause, Stop, Hide: with motion on, nothing in the demo may repeat forever; only loading indicators turn
// until the load ends. The stages as the agents leave them, autoplay running, and the finale. One desktop run is enough.
test.use({ contextOptions: { reducedMotion: 'no-preference' } });
// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument destructured
test.beforeEach(async ({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-light', 'motion checks run once, on desktop-light');
});

const LOADING = '.spinner, .skeleton, .spin';
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

for (const stage of [1, 2, 3, 5, 6, 7, 8, 9])
	test(`motion · stage ${stage}: nothing loops`, async ({ page }) => {
		await openDemo(page, stage);
		await page.waitForTimeout(1500);
		expect(await endless(page)).toEqual([]);
		// and once the visitor has moved the story on a beat
		await next(page);
		await page.waitForTimeout(1500);
		expect(await endless(page)).toEqual([]);
	});

test('motion · autoplay: the beats play on, and nothing loops while they do', async ({ page }) => {
	await openDemo(page, 6);
	await page.getByRole('button', { name: 'Autoplay' }).click();
	await expect(page.getByRole('button', { name: 'Pause autoplay' })).toBeVisible();
	// the approval opens, Priya approves, and stage 7's agents set to work
	await expect(page).toHaveURL(/#stage=7$/, { timeout: 15_000 });
	for (let i = 0; i < 4; i++) {
		await page.waitForTimeout(1500);
		expect(await endless(page), `${(i + 1) * 1.5} s into stage 7`).toEqual([]);
	}
	await page.getByRole('button', { name: 'Pause autoplay' }).click();
});

test('motion · the finale: nothing loops', async ({ page }) => {
	await openDemo(page, 9);
	for (let i = 0; i < 4 && !(await page.locator('.finale').count()); i++) await next(page);
	await expect(page.getByRole('button', { name: 'Play it again' })).toBeVisible();
	await page.waitForTimeout(3000);
	expect(await endless(page)).toEqual([]);
});
