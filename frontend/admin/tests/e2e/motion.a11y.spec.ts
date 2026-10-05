import { expect, test, type Page } from '@playwright/test';
import { openSite } from './site';

// WCAG 2.2.2 Pause, Stop, Hide, as design3/a11y/motion.a11y.spec.ts: with motion on, nothing may repeat forever; only
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

const STATES: [string, (page: Page) => Promise<void>][] = [
	['site · first viewport', async () => {}],
	[
		'site · how it works, its cards rising',
		async (p) => {
			await p.evaluate(() => window.scrollTo(0, (document.querySelector('#how') as HTMLElement).offsetTop));
		}
	],
	[
		'site · the packs taking the street',
		async (p) => {
			await p.evaluate(() => window.scrollTo(0, (document.querySelector('#exits') as HTMLElement).offsetTop));
		}
	],
	[
		'site · the batch split by exit',
		async (p) => {
			await p.evaluate(() => window.scrollTo(0, (document.querySelector('#exits') as HTMLElement).offsetTop));
			await p.waitForTimeout(4500);
			await p.evaluate(() =>
				window.scrollBy(0, (document.querySelector('.split') as HTMLElement).getBoundingClientRect().top - 120)
			);
		}
	],
	[
		"site · the crew at work, at the person's yes",
		async (p) => {
			await p.waitForFunction(() => /Approve/.test(document.querySelector('.hero-caption')?.textContent || ''));
		}
	],
	[
		'site · Book a demo open',
		async (p) => {
			await p.locator('.site-nav').getByRole('button', { name: 'Book a demo' }).click();
		}
	]
];

for (const [name, setup] of STATES) {
	test(`motion · nothing loops forever · ${name}`, async ({ page }) => {
		await openSite(page);
		await setup(page);
		await page.waitForTimeout(1500);
		expect(await endless(page), 'animations set to repeat forever').toEqual([]);
	});
}
