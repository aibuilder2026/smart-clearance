import { expect, test, type Page } from '@playwright/test';
import { openConsole } from './console';

// WCAG 2.2.2 Pause, Stop, Hide: with motion on, nothing may repeat forever; only
// loading indicators turn until the load ends. One desktop run is enough.
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

const STATES: [string, string, { signedIn?: boolean }?][] = [
	['console · sign-in', '/', { signedIn: false }],
	['console · overview', '/'],
	['console · Munchly agents', '/clients/munchly/agents'],
	['console · new client', '/new-client']
];
for (const [name, path, opts] of STATES)
	test(`motion · ${name}: nothing loops`, async ({ page }) => {
		await openConsole(page, path, opts);
		await page.waitForTimeout(1500);
		expect(await endless(page)).toEqual([]);
	});
