// Ported from design3/a11y/helpers.ts (the prototype's WCAG suite), so the port is held to the same scan: the same
// rule tags, the same target-size pass, the same report. Only the results folder moved.
import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// WCAG 2.0, 2.1 and 2.2 at levels A and AA: the rules axe-core can decide automatically.
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Which impacts fail a test. Default: all of them, since WCAG AA conformance has no "minor" exemption.
// Narrow it with A11Y_FAIL_ON=critical,serious while a backlog is being worked down.
const FAIL_ON = (process.env.A11Y_FAIL_ON || 'critical,serious,moderate,minor').split(',').map((s) => s.trim());

export type Finding = {
	rule: string;
	impact: string;
	help: string;
	helpUrl: string;
	wcag: string[];
	nodes: number;
	targets: string[];
	state: string;
	details: { target: string; html: string; why: string }[];
};

// In-app push banners and toasts float over the page for a few seconds and then leave. While one is up,
// axe counts whatever it covers as an obscured target, so target size is judged on the page they leave
// behind; the banners and toasts themselves are still checked by every other rule.
const TRANSIENT = ['.banners', '.toasts'];

// Scan the page as it stands and return its WCAG violations, tagged with the state they were seen in.
// targetSizeExclude: selectors left out of the target-size rule only (the demo's scaled device previews,
// whose screens the app spec checks at full size); every other rule still covers them.
export async function scan(page: Page, state: string, opts: { targetSizeExclude?: string[] } = {}): Promise<Finding[]> {
	await page.waitForTimeout(250);
	const present: string[] = [];
	for (const sel of opts.targetSizeExclude || []) if (await page.locator(sel).count()) present.push(sel);
	const results = [await new AxeBuilder({ page }).withTags(WCAG_TAGS).disableRules(['target-size']).analyze()];
	const sized = new AxeBuilder({ page }).withRules(['target-size']);
	for (const sel of present) sized.exclude(sel);
	await page.evaluate((sel) => {
		const s = document.createElement('style');
		s.id = 'a11y-hide-transient';
		s.textContent = `${sel} { visibility: hidden !important; }`;
		document.head.append(s);
	}, TRANSIENT.join(', '));
	try {
		results.push(await sized.analyze());
	} finally {
		await page.evaluate(() => document.getElementById('a11y-hide-transient')?.remove());
	}
	return results
		.flatMap((r) => r.violations)
		.map((v) => ({
			rule: v.id,
			impact: v.impact || 'unknown',
			help: v.help,
			helpUrl: v.helpUrl,
			wcag: v.tags.filter((t) => /^wcag\d/.test(t)),
			nodes: v.nodes.length,
			targets: v.nodes.slice(0, 4).map((n) => n.target.map(String).join(' ')),
			state,
			// the first lines of axe's own explanation: for contrast it carries the colours and the measured ratio
			details: v.nodes.slice(0, 4).map((n) => ({
				target: n.target.map(String).join(' '),
				html: n.html.replace(/\s+/g, ' ').slice(0, 160),
				why: (n.failureSummary || '').split('\n').slice(1, 3).join(' ').trim().slice(0, 240)
			}))
		}));
}

// Save the findings for the summary, attach them to the HTML report, and fail on the chosen impacts.
export async function report(testInfo: TestInfo, findings: Finding[]) {
	const dir = join(dirname(fileURLToPath(import.meta.url)), '../../test-results/a11y', testInfo.project.name);
	mkdirSync(dir, { recursive: true });
	const slug = testInfo.title
		.replace(/[^a-z0-9]+/gi, '-')
		.replace(/^-|-$/g, '')
		.toLowerCase();
	writeFileSync(
		join(dir, `${slug}.json`),
		JSON.stringify({ test: testInfo.title, project: testInfo.project.name, findings }, null, 2)
	);
	await testInfo.attach('wcag-findings.json', {
		body: JSON.stringify(findings, null, 2),
		contentType: 'application/json'
	});
	const failing = findings.filter((f) => FAIL_ON.includes(f.impact));
	const lines = failing.map(
		(f) => `${f.impact.padEnd(8)} ${f.rule} (${f.wcag.join(', ')}) × ${f.nodes} · ${f.state} · ${f.targets[0] || ''}`
	);
	expect(failing, `WCAG violations:\n${lines.join('\n')}`).toEqual([]);
}
