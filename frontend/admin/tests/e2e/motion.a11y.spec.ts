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

const scrollTo = (p: Page, sel: string) => p.evaluate((s) => document.querySelector(s)!.scrollIntoView(), sel);
const STATES: [string, (page: Page) => Promise<void>][] = [
	['site · first viewport, the film playing', async () => {}],
	['site · the statement, half read', async (p) => scrollTo(p, '#how')],
	[
		"site · the table, at the person's yes",
		async (p) => {
			await scrollTo(p, '.tb-stage');
			await p.waitForFunction(() => document.querySelector('.tb-focus h3')?.textContent === 'You', null, {
				timeout: 15000
			});
		}
	],
	[
		'site · the table, the packs flying',
		async (p) => {
			await scrollTo(p, '.tb-stage');
			await p.waitForFunction(() => document.querySelector('.tb-focus h3')?.textContent === 'Outreach', null, {
				timeout: 15000
			});
		}
	],
	[
		'site · the table, sold',
		async (p) => {
			await scrollTo(p, '.tb-stage');
			await p.waitForSelector('.tb-result', { timeout: 25000 });
		}
	],
	['site · the chapters, their cards rising', async (p) => scrollTo(p, '#watch')],
	['site · the agents at work after the yes', async (p) => scrollTo(p, '#work')],
	['site · the ledger', async (p) => scrollTo(p, '#ledger')],
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
