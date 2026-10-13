import { expect, type Locator, type Page } from '@playwright/test';
import { running } from './flow.ts';
import { loaded, type Note, type Stage } from './stage.ts';

// Papers read on the stage (SC-201, SC-202): a paper opened from its card, in a sheet or beside the pack, read top to
// bottom and ending on who signed it, then closed as a person closes it.

/** a signature on a paper: a specimen's image, or the ink drawn on the certificate at the facility (SC-183) */
export const sigs = (scope: Locator) =>
	scope.locator('img[alt^="Signed by"], svg[role="img"][aria-label^="Signed by"]');

/** the sheet open on a screen, closed with its Close button (or Escape where it has none) */
export async function closeSheet(s: Stage, page: Page) {
	const d = page.getByRole('dialog').last();
	if (!(await d.isVisible().catch(() => false))) return;
	const close = d.getByRole('button', { name: 'Close', exact: true }).first();
	if (await close.isVisible().catch(() => false)) await s.click(close, 400);
	else await page.keyboard.press('Escape');
	await expect(d)
		.toBeHidden({ timeout: 10_000 })
		.catch(() => {});
}

/** a paper opened from its card and read top to bottom, each of its pages (a certificate and its log), in its sheet or
 *  beside the pack, ending on who signed it. A note, where the paper has one, sits beside its head first. The sheet
 *  stays open with `keep` */
export async function readPaper(s: Stage, page: Page, opener: Locator, note?: Note, keep = false) {
	await s.click(opener, 700);
	const d = page.getByRole('dialog').last();
	const inSheet = await d.isVisible().catch(() => false);
	const papers = (inSheet ? d : page.locator('#main')).locator('.paper');
	await expect(papers.first()).toBeVisible({ timeout: 20_000 });
	await loaded(page, 8000);
	if (note) await s.spot(papers.first().locator('.tl-title, .pp-head').first(), note);
	for (let i = 0, n = await papers.count(); i < n; i++) {
		const paper = papers.nth(i);
		await s.read(paper);
		const sig = sigs(paper).last();
		if (await sig.isVisible().catch(() => false)) await s.point(sig, 900);
	}
	if (inSheet && !keep) await closeSheet(s, page);
	return { paper: papers.first(), inSheet };
}

/** the card on the swing's formula: the same for every batch */
const SUM: Note = {
	tag: 'The swing',
	title: "The plan's P&L, less the bin's",
	text: 'Destroying every pack at risk would have cost the stock, the GST credit reversed, disposal and EPR. The swing is how much better the plan did than that: what was recovered, plus the costs nobody had to pay.'
};

/** the operator opens a batch's swing on its Journey (SC-195's How the swing adds up) and reads how it adds up, section
 *  by section: the swing in words (with `outcome` beside it), the bridge, the bin, the plan, the formula, and how the
 *  loss was kept small. The last frame rests on the swing */
export async function showSwing(s: Stage, hero: string, name: string, outcome: Note) {
	const page = await s.open('priya', `/journey/${hero}`, `opens the ${name} to show its swing`);
	const note = page.locator('#main').locator('button.sw-note').first();
	await expect(note).toBeVisible({ timeout: 30_000 });
	await s.point(note, 1200);
	await s.click(note, 700);
	const sheet = page.getByRole('dialog', { name: 'How the swing adds up' });
	await expect(sheet).toBeVisible();
	await s.spot(sheet.locator('.sw-hero'), outcome);
	await running().done('How the swing adds up: the swing, in words');
	await s.point(sheet.locator('.sw-bridge'), 2200);
	await running().done("The bridge: from the bin's P&L to the plan's");
	const section = (h: string) => sheet.locator('section', { has: page.getByRole('heading', { name: h }) });
	await s.read(section('If it were destroyed'), 1500);
	await s.point(section('If it were destroyed').locator('.sw-row.strong').last(), 1800);
	await running().done('If it were destroyed: the stock, the GST credit, disposal and EPR');
	await s.read(section('What the plan did'), 1500);
	await s.point(section('What the plan did').locator('.sw-row.strong').last(), 1800);
	await running().done('What the plan did: each exit, what was recovered, the P&L with the plan');
	await s.spot(sheet.locator('.sw-sum'), SUM);
	await running().done("The swing: the plan's P&L less the bin's");
	await s.read(section('How the loss was kept small'), 1800);
	await s.point(section('How the loss was kept small').locator('.sw-why'), 2600);
	await running().done('How the loss was kept small');
	await s.reveal(sheet.locator('.sw-hero'));
	await page.waitForTimeout(2500);
}
