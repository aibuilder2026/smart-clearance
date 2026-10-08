import { expect, test, type Page } from '@playwright/test';
import { hold, openWorkspace, release, type Open } from './workspace';

// WCAG 2.2.2 Pause, Stop, Hide in the workspace app: with motion on, nothing may repeat forever; only loading
// indicators turn until the load ends. Checked where the app moves most: the sign-in's hero, the Command Center, an
// agent at work in the Route Room, Execution while the agents work, and the camera while Vision reads the label. One
// desktop run is enough.
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

const STATES: [string, string, Open, string?][] = [
	['the sign-in', '/', { as: null }],
	['the Command Center, the batch cleared', '/command', {}],
	// stage 2: Vision asks Rakesh bhai for the label photo and waits for it, at work (its aura on)
	['the Route Room, Vision waiting for the label', '/route', { stage: 2 }, '.aura'],
	// stage 6: the plan approved; the Lister, Outreach and the donation agent at work
	['Execution, the agents at work', '/execution', { stage: 6 }]
];
for (const [name, path, o, live] of STATES)
	test(`motion · ${name}: nothing loops`, async ({ page }) => {
		await openWorkspace(page, path, o);
		if (live) await expect(page.locator(live).first()).toBeVisible({ timeout: 10_000 });
		await page.waitForTimeout(1500);
		expect(await endless(page)).toEqual([]);
	});

test('motion · the camera while Vision reads the label: nothing loops', async ({ page }) => {
	await openWorkspace(page, '/photo', { as: 'rakesh', stage: 2, clock: true });
	await page.getByRole('button', { name: 'Take a photo' }).click();
	await page.getByRole('button', { name: 'Send photo' }).click();
	await expect(page.getByText('Sent · Vision is reading the label')).toBeVisible();
	// Vision reads for about two seconds; the clock holds it there while the animations are counted
	await page.waitForTimeout(300);
	await hold(page);
	expect(await endless(page)).toEqual([]);
	await release(page);
	await expect(page.getByText('Verified · matches your records')).toBeVisible({ timeout: 10_000 });
});
