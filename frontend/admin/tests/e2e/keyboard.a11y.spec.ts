import { expect, test, type Page } from '@playwright/test';
import { report, scan, type Finding } from '@smart-clearance/testing/a11y';
import { isPhone, openSite } from './site';

// Behaviour axe-core cannot see, including what the port fixed in the prototype: menu buttons (APG), sheets taking, keeping
// and returning focus, the demo form, links and the theme on load, and the film's and the table's controls (WCAG 2.2.2).
// One desktop run is enough: the behaviour does not change with theme.
test.beforeEach(async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-light', 'keyboard checks run once, on desktop-light');
	await openSite(page);
});

const focusedName = (page: Page) =>
	page.evaluate(() => {
		const el = document.activeElement as HTMLElement | null;
		const label = el && (el as HTMLInputElement).labels && (el as HTMLInputElement).labels![0];
		return el
			? (el.getAttribute('aria-label') || (label && label.innerText) || el.innerText || el.tagName)
					.replace(/\s+/g, ' ')
					.trim()
					.slice(0, 60)
			: '';
	});
const inDialog = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

test('keyboard · the bar has no appearance control, and its links and its brand glide to their place (SC-165)', async ({
	page
}) => {
	await expect(page.getByRole('button', { name: 'Appearance' }), 'no appearance menu in the bar').toHaveCount(0);
	await expect(page.getByRole('radiogroup', { name: 'Appearance' }), 'nor a switch in the footer').toHaveCount(0);
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	const brand = page.locator('.site-nav .nav-brand');
	expect(
		await brand.locator('.wordmark').evaluate((e) => getComputedStyle(e).color),
		'the wordmark is white over the film'
	).toBe('rgb(255, 255, 255)');
	if (isPhone(page)) return; // the sections are in the phone's menu, which already glides to them
	// a link glides: the window passes through the page on its way to the section, and lands with it under the bar
	const glide = async (click: () => Promise<void>) => {
		const from = await page.evaluate(() => scrollY);
		await click();
		const seen = new Set<number>();
		for (let i = 0; i < 10; i += 1) {
			seen.add(await page.evaluate(() => Math.round(scrollY)));
			await page.waitForTimeout(60);
		}
		await page.waitForTimeout(1200);
		const to = await page.evaluate(() => Math.round(scrollY));
		seen.delete(from);
		seen.delete(to);
		return { from, to, between: seen.size };
	};
	const agents = await glide(() => page.locator('.site-nav').getByRole('link', { name: 'Agents' }).click());
	expect(agents.between, 'Agents glides there').toBeGreaterThan(1);
	expect(
		await page.evaluate(() => Math.abs(document.getElementById('agents')!.getBoundingClientRect().top))
	).toBeLessThan(80);
	expect(
		await brand.locator('.wordmark').evaluate((e) => getComputedStyle(e).color),
		'on the glass, the page ink'
	).not.toBe('rgb(255, 255, 255)');
	const top = await glide(() => brand.click());
	expect(top.between, 'the brand glides back to the top').toBeGreaterThan(1);
	expect(top.to).toBe(0);
});

test('keyboard · the two ways in on the bar: Console and Workspace open another tab, in that order (SC-150)', async ({
	page
}) => {
	const bar = page.locator('.site-nav');
	await expect(bar.getByRole('button', { name: 'Sign in' }), 'no Sign in in the bar').toHaveCount(0);
	await expect(bar.getByRole('button', { name: 'Book a demo' }), 'no Book a demo in the bar').toHaveCount(0);
	const consoleLink = bar.getByRole('link', { name: 'Console' });
	await expect(consoleLink).toHaveAttribute('href', 'https://smartclearance-console.web.app');
	await expect(consoleLink).toHaveAttribute('target', '_blank');
	await expect(consoleLink).toHaveAttribute('rel', 'noopener');
	if (isPhone(page)) return; // a phone keeps Console in the bar and has Workspace in its menu
	const workspaceLink = bar.getByRole('link', { name: 'Workspace' });
	await expect(workspaceLink).toHaveAttribute('href', 'https://munchly-smartclearance.web.app');
	await expect(workspaceLink).toHaveAttribute('target', '_blank');
	await consoleLink.focus();
	await page.keyboard.press('Tab');
	expect(await focusedName(page)).toBe('Workspace');
});

test('keyboard · Find your workspace, from the footer: the sheet takes focus, keeps it and gives it back', async ({
	page
}) => {
	const trigger = page.locator('.foot').getByRole('button', { name: 'Find your workspace' });
	await trigger.focus();
	await page.keyboard.press('Enter');
	await page.waitForTimeout(700);
	expect.soft(await inDialog(page), 'focus moves into the sheet when it opens').toBe(true);
	expect
		.soft(
			await page.evaluate(() => {
				const el = document.activeElement;
				const by = el?.getAttribute('aria-labelledby');
				return el?.getAttribute('role') + ': ' + (by ? document.getElementById(by)?.textContent : '');
			}),
			'the sheet itself takes focus first, named by its title'
		)
		.toBe('dialog: Find your workspace');
	for (let i = 0; i < 9; i++) await page.keyboard.press('Tab');
	expect.soft(await inDialog(page), 'Tab stays inside the open sheet').toBe(true);
	await page.keyboard.press('Escape');
	await page.waitForTimeout(700);
	expect.soft(await page.locator('[role="dialog"]').count(), 'Escape closes the sheet').toBe(0);
	await expect(trigger, 'focus returns to the button that opened it').toBeFocused();
});

test('keyboard · Find your workspace finds members, invitees and nobody, and names the workspace only', async ({
	page
}) => {
	await page.locator('.foot').getByRole('button', { name: 'Find your workspace' }).click();
	const field = page.getByLabel('Email or mobile number');
	const results = async (value: string) => {
		await field.fill(value);
		await field.press('Enter');
		await page.waitForTimeout(150);
		return (await page.locator('[role="dialog"] .card').allInnerTexts()).join(' / ').replace(/\s+/g, ' ');
	};
	// the workspace only: never the person's role, or whether they were deactivated (SC-43)
	const workspace = /^Munchly Foods munchly-smartclearance\.web\.app Open$/;
	expect(await results('priya.deshmukh@munchly.in')).toMatch(workspace);
	expect(await results('98230 44118')).toMatch(workspace);
	expect(await results('+91 98230 60013')).toMatch(workspace);
	expect(await results('9823060012')).toMatch(workspace);
	expect(await results('someone.new@munchly.in')).toMatch(workspace);
	expect(await results('orders@agrawalwholesale.example')).toMatch(/No workspace uses that yet/);
	await field.fill('12345');
	await field.press('Enter');
	await expect(page.locator('#fw-id-error')).toHaveText('Enter an email address, or a 10-digit mobile number.');
	await expect(field).toHaveAttribute('aria-invalid', 'true');
	await expect(field).toHaveAttribute('aria-describedby', 'fw-id-error');
});

test('keyboard · Book a demo: Enter sends, errors are tied to their fields, and the first takes focus', async ({
	page
}) => {
	await page.locator('.film-ctas').getByRole('button', { name: 'Book a demo' }).click();
	const name = page.getByLabel('Your name');
	await name.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('#bd-name-error')).toHaveText('Enter your name.');
	await expect(page.locator('#bd-email-error')).toHaveText('Enter a work email address, like name@company.in.');
	await expect(name, 'the first field with a problem takes focus').toBeFocused();
	await expect(name).toHaveAttribute('aria-invalid', 'true');
	await expect(name).toHaveAttribute('aria-describedby', 'bd-name-error');
	await name.fill('Ritu Malhotra');
	await expect(name).not.toHaveAttribute('aria-invalid', 'true');
	await page.getByLabel('Company').fill('Kesari Foods');
	await page.getByLabel('Work email').fill('Ritu@Kesari.in');
	await page.getByLabel('Work email').press('Enter');
	await expect(page.getByText('Thanks, Ritu.')).toBeVisible();
	const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sc-demo-requests') || '[]'));
	expect(saved[0]).toMatchObject({
		name: 'Ritu Malhotra',
		company: 'Kesari Foods',
		email: 'ritu@kesari.in',
		plan: null,
		status: 'new'
	});
});

test('keyboard · links: back to the top, and other sites in a new tab', async ({ page }) => {
	await page.evaluate(() => window.scrollTo(0, 3000));
	await page.locator('.nav-brand').click();
	await expect.poll(() => page.evaluate(() => window.scrollY), { message: '#top scrolls back to the top' }).toBe(0);
	for (const a of await page.locator('a[href^="http"]').all()) {
		await expect(a).toHaveAttribute('target', '_blank');
		await expect(a).toHaveAttribute('rel', 'noopener');
	}
});

test('keyboard · the landing page is in day from the first paint, on a dark device with dark saved (SC-165)', async ({
	browser
}) => {
	const context = await browser.newContext({ colorScheme: 'dark' });
	const page = await context.newPage();
	await page.addInitScript(() => {
		localStorage.setItem('sc3-theme', 'dark');
		const seen: string[] = [];
		(window as unknown as { __themes: string[] }).__themes = seen;
		// the root element may not exist yet when this runs, so watch the document for it
		new MutationObserver((records) => {
			for (const r of records)
				if (r.target === document.documentElement)
					seen.push(document.documentElement.getAttribute('data-theme') || 'none');
		}).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-theme'] });
	});
	await page.goto('/');
	await page.waitForSelector('.app[data-mounted]');
	const themes = await page.evaluate(() => (window as unknown as { __themes: string[] }).__themes);
	expect(themes[0], 'the first theme set is day').toBe('light');
	expect(themes, 'and it is never night').not.toContain('dark');
	expect(
		await page.evaluate(() => localStorage.getItem('sc3-theme')),
		'the saved choice is left for the other apps'
	).toBe('dark');
	await context.close();
});

test.describe('the film and the table, with motion on (SC-60, SC-111)', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });

	test('keyboard · the film pauses and plays, loops without a cut, reads the journey\'s chapters, and the heading rests on "chance"', async ({
		page
	}) => {
		await openSite(page);
		const ctl = page.locator('.film-ctl').getByRole('button');
		await expect(ctl).toHaveText(/Pause/);
		await ctl.focus();
		await page.keyboard.press('Enter');
		await expect(ctl, 'one button, so focus stays on it').toHaveText(/Play/);
		expect(await page.evaluate(() => document.querySelector<HTMLVideoElement>('video.front')!.paused)).toBe(true);
		await page.keyboard.press('Enter');
		await expect(ctl).toHaveText(/Pause/);
		// near its end the film runs back into its first frame and plays on (SC-111), still under Pause; the strip reads
		// the four chapters of the journey's day
		await page.evaluate(() => {
			const v = document.querySelector<HTMLVideoElement>('video.front')!;
			v.currentTime = v.duration - 0.2;
		});
		await expect
			.poll(() => page.evaluate(() => document.querySelector<HTMLVideoElement>('video.front')!.currentTime), {
				timeout: 6000
			})
			.toBeLessThan(2);
		expect(await page.evaluate(() => document.querySelector<HTMLVideoElement>('video.front')!.paused)).toBe(false);
		await expect(page.locator('.film-story')).toHaveAttribute('aria-label', 'The journey, through one day');
		await expect(page.locator('.film-story .fs')).toHaveCount(4);
		await expect(ctl).toHaveText(/Pause/);
		// the word on screen, not the one leaving (inert while it fades out); the turns take 5 s, slower on a busy machine
		await expect(page.locator('.film-word [aria-hidden]:not([inert])')).toHaveText('chance', { timeout: 15000 });
	});

	test('motion · the agents work the batch on the table once, each in focus, and hold on the result', async ({
		page
	}) => {
		await openSite(page);
		await page.evaluate(() => document.querySelector('.tb-stage')!.scrollIntoView());
		const focus = page.locator('.tb-focus');
		await expect(focus.locator('h3')).toHaveText('Data', { timeout: 5000 });
		await expect(focus.locator('h3')).toHaveText('You', { timeout: 12000 });
		await expect(focus).toContainText('Approved in one tap, ₹21,770 on screen');
		await expect(page.locator('.tb-result')).toContainText('₹21,152 recovered, instead of −₹26,330 to destroy it', {
			timeout: 15000
		});
		await expect(page.locator('.tb-node.on')).toHaveCount(11);
		await expect(page.locator('.tb-tag.kirana .tb-tag-body > span')).toHaveText('588 of 588 packs · 31 shops');
		await expect(page.locator('.tb-tag.dump .tb-tag-body > span')).toHaveText('218 kg kept out');
	});

	test('keyboard · Pause holds the agent in focus, Play carries on, a step in the rail jumps and holds, Replay runs it again', async ({
		page
	}) => {
		await openSite(page);
		await page.evaluate(() => document.querySelector('.tb-stage')!.scrollIntoView());
		const step = () => page.evaluate(() => document.querySelector('.tb-focus .n')?.textContent || '');
		await expect.poll(step, { message: 'a card opens as the tour reaches each agent', timeout: 5000 }).not.toBe('');
		const ctl = page.locator('.tb-ctl');
		await ctl.getByRole('button', { name: 'Pause' }).focus();
		await page.keyboard.press('Enter');
		await expect(ctl.getByRole('button', { name: 'Play' }), 'one button, so focus stays on it').toBeFocused();
		const held = await step();
		await page.waitForTimeout(2600);
		expect(await step(), 'the tour holds while paused').toBe(held);
		await page.keyboard.press('Enter');
		await expect(ctl.getByRole('button', { name: 'Pause' })).toBeFocused();
		await expect.poll(step, { message: 'Play carries the tour on', timeout: 4000 }).not.toBe(held);

		await page.locator('.tb-focus .rail').getByRole('button', { name: 'Negotiator' }).click();
		await expect(page.locator('.tb-focus h3')).toHaveText('Negotiator');
		await expect(ctl.getByRole('button', { name: 'Play' }), 'a step chosen by hand holds the tour').toBeVisible();
		await page.waitForTimeout(2000);
		expect(await step()).toBe('9 of 11');
		await ctl.getByRole('button', { name: 'Play' }).click();
		const replay = page.locator('.tb-result').getByRole('button', { name: 'Replay' });
		await expect(replay).toBeVisible({ timeout: 8000 });
		await replay.focus();
		await page.keyboard.press('Enter');
		await expect(page.locator('.tb-focus .n')).toHaveText('1 of 11', { timeout: 2000 });
	});
});

// YouTube stands in for the theatre's checks: its player script makes an empty frame, so the run needs no network and
// the film's end can be called (SC-164)
const YOUTUBE_STUB = `
	window.YT = { Player: function (el, o) {
		var f = document.createElement('iframe'); f.src = 'about:blank'; el.replaceWith(f);
		this.getIframe = function () { return f; }; this.getCurrentTime = function () { return 0; };
		this.seekTo = function () {}; this.playVideo = function () {}; this.destroy = function () { f.remove(); };
		var me = this; window.__filmEnd = function () { o.events.onStateChange({ data: 0 }); };
		setTimeout(function () { o.events.onReady({ target: me }); });
	} };
	window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();`;

test('keyboard · Watch opens the demo film over the page, keeps focus in it, ends on the guided demo, and Escape gives it back (SC-164)', async ({
	page
}, testInfo) => {
	const watch = page.locator('.film-ctas').getByText('Watch the 5-minute demo');
	test.skip(
		(await watch.evaluate((e) => e.tagName)) !== 'BUTTON',
		'this build has no film id (PUBLIC_DEMO_FILM): Watch opens the guided demo'
	);
	const youtube: string[] = [];
	page.on('request', (r) => /youtube|ytimg|googlevideo/.test(r.url()) && youtube.push(r.url()));
	await page.route('https://www.youtube.com/iframe_api', (r) =>
		r.fulfill({ contentType: 'text/javascript', body: YOUTUBE_STUB })
	);
	expect(youtube, 'nothing of YouTube before Watch').toHaveLength(0);
	const y = await page.evaluate(() => scrollY);

	await watch.focus();
	await page.keyboard.press('Enter');
	const theatre = page.getByRole('dialog', { name: 'The 5-minute demo' });
	await expect(theatre).toBeVisible();
	expect(await inDialog(page), 'the theatre takes focus').toBe(true);
	await expect(theatre.locator('iframe[title="Smart-Clearance demo film"]')).toHaveCount(1);
	await expect(theatre.getByRole('navigation', { name: 'Chapters' }).getByRole('button')).toHaveCount(12);
	await theatre.getByText('Read the film instead').click();
	await expect(theatre.locator('.fp-read-in section')).toHaveCount(12);
	const findings: Finding[] = await scan(page, 'demo film open');
	for (let i = 0; i < 16; i += 1) await page.keyboard.press('Tab');
	expect(await inDialog(page), 'Tab stays in the theatre').toBe(true);

	await page.evaluate(() => (window as unknown as { __filmEnd: () => void }).__filmEnd());
	await expect(
		theatre.getByRole('link', { name: 'Try the guided demo' }),
		'the film ends on the guided demo'
	).toBeVisible();
	await expect(theatre.getByRole('link', { name: 'Try the guided demo' })).toHaveAttribute('target', '_blank');
	findings.push(...(await scan(page, 'demo film ended')));

	await page.keyboard.press('Escape');
	await expect(theatre, 'Escape closes the theatre').toHaveCount(0);
	await expect(watch, 'focus returns to Watch').toBeFocused();
	expect(await page.evaluate(() => scrollY), 'the page stays where it was').toBe(y);
	await report(testInfo, findings);
});
