// The frontend's WCAG suite (SC-58: `corepack pnpm test:a11y`), on each app's production build: the same rule tags, the
// same target-size pass and the same report for every app, into its own test-results/a11y/<project>. Each scan also
// records which core components were on screen, and a11y-coverage.ts fails the run when an app uses a component no scan
// reached.
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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

// Where each core component shows on a page: the element it renders (and, for a pattern built on another component,
// the text that tells it apart). Columns and ThemeProvider render no element of their own (STRUCTURAL).
export const COMPONENTS: Record<string, { sel: string; text?: string }> = {
	Alert: { sel: '[role="alertdialog"]' },
	AppRoot: { sel: '.app' },
	Avatar: { sel: '.avatar' },
	Badge: { sel: '.badge' },
	Button: { sel: '.btn' },
	Card: { sel: '.card' },
	Check: { sel: 'label.check' },
	DataTable: { sel: '.table-wrap > table.table' },
	Empty: { sel: '.empty' },
	Field: { sel: '.field' },
	FindWorkspace: { sel: '.sheet', text: 'Find your workspace' },
	GateChips: { sel: 'span.gate.pass, span.gate.fail' },
	IconButton: { sel: '.iconbtn' },
	Input: { sel: 'input.input:not(.search)' },
	List: { sel: '.list' },
	ListRow: { sel: '.list-row' },
	Mark: { sel: 'svg.mark' },
	Menu: { sel: '[role="menu"]' },
	ModeMenuButton: { sel: 'button.iconbtn[aria-label="Appearance"]' },
	Money: { sel: '.money' },
	NoticeHost: { sel: '.banners .banner, .toasts .toast' },
	Page: { sel: 'header.navbar' },
	Product: { sel: '[data-product]' },
	Progress: { sel: '.progress[role="progressbar"]' },
	Roll: { sel: '.roll' },
	SearchField: { sel: 'input.input.search' },
	SectionTitle: { sel: '.row.between.wrap .t-title3' },
	Segmented: { sel: '.segmented' },
	Select: { sel: 'select.select' },
	Sheet: { sel: '.sheet' },
	Shell: { sel: 'nav.sidebar, nav.tabbar' },
	Spinner: { sel: 'svg.spinner' },
	Stepper: { sel: '.stepper' },
	Switch: { sel: 'button.switch' },
	Tabs: { sel: '.tabs[role="tablist"]' },
	Textarea: { sel: 'textarea.textarea' },
	Wordmark: { sel: '.wordmark' },
	WorkspaceMark: { sel: 'svg.wsmark' },
	// the workspace app's and the guided demo's (SC-62, SC-63; selectors added in SC-65)
	AgentFeed: { sel: '.feed .ev' },
	Aura: { sel: '.aura' },
	BatchRow: { sel: 'button.batchrow' },
	ChannelBars: { sel: '.chart svg[aria-label="Net rupees per unit by channel"]' },
	ChannelTable: { sel: '.table-wrap[aria-label="Channels compared"]' },
	ClusterMap: { sel: '.map svg[viewBox="0 0 640 400"]' },
	CodeBlock: { sel: 'pre.code' },
	Countdown: { sel: '.countdown' },
	DaysNum: { sel: '.num[style*="--wdth"]' },
	DocCard: { sel: '.docpick > button.card' },
	HaulLine: { sel: '.map svg[viewBox="0 0 640 96"]' },
	Kbd: { sel: 'kbd.kbd' },
	MixBar: { sel: '.chart svg[aria-label="Channel mix"]' },
	MoneyPanel: { sel: '.card-title', text: 'If destroyed' },
	OTP: { sel: '.otp[role="group"]' },
	PhoneFrame: { sel: '.device-phone' },
	PoweredBy: { sel: '.poweredby' },
	Skeleton: { sel: '.skeleton' },
	Splash: { sel: '.splash' },
	SplitBar: { sel: '.t-caption .tnum', text: 'units at risk' },
	StatusBadge: { sel: '.badge[data-status]' },
	StatusBar: { sel: '.statusbar' },
	Tile: { sel: '.tile' },
	Tracker: { sel: '.tracker[role="list"]' },
	TrackerCard: { sel: '.bezel .t-headline' },
	TrackerCompact: { sel: 'button.tk-compact' },
	TrendChart: { sel: '.chart svg[aria-label="Weekly recovered against would-be write-off"]' },
	VTracker: { sel: '.vtracker' },
	WindowFrame: { sel: '.device-window' }
};
export const STRUCTURAL = ['Columns', 'ThemeProvider'];

// the components each test's scans saw, by test, for report()
const seen = new Map<string, Set<string>>();

async function onScreen(page: Page): Promise<string[]> {
	return page.evaluate((map) => {
		const shown = (el: Element) => el.checkVisibility({ visibilityProperty: true });
		return Object.entries(map)
			.filter(([, m]) =>
				[...document.querySelectorAll(m.sel)].some((el) => shown(el) && (!m.text || el.textContent?.includes(m.text)))
			)
			.map(([name]) => name);
	}, COMPONENTS);
}

// In-app push banners and toasts float over the page for a few seconds and then leave. While one is up,
// axe counts whatever it covers as an obscured target, so target size is judged on the page they leave
// behind; the banners and toasts themselves are still checked by every other rule.
const TRANSIENT = ['.banners', '.toasts'];

// Scan the page as it stands and return its WCAG violations, tagged with the state they were seen in.
// targetSizeExclude: selectors left out of the target-size rule only (the demo's scaled device previews,
// whose screens the app spec checks at full size); every other rule still covers them.
export async function scan(page: Page, state: string, opts: { targetSizeExclude?: string[] } = {}): Promise<Finding[]> {
	await page.waitForTimeout(250);
	const id = test.info().testId;
	seen.set(id, new Set([...(seen.get(id) ?? []), ...(await onScreen(page))]));
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
	const dir = join(process.cwd(), 'test-results/a11y', testInfo.project.name);
	mkdirSync(dir, { recursive: true });
	const slug = testInfo.title
		.replace(/[^a-z0-9]+/gi, '-')
		.replace(/^-|-$/g, '')
		.toLowerCase();
	writeFileSync(
		join(dir, `${slug}.json`),
		JSON.stringify(
			{
				test: testInfo.title,
				project: testInfo.project.name,
				findings,
				components: [...(seen.get(testInfo.testId) ?? [])].sort()
			},
			null,
			2
		)
	);
	seen.delete(testInfo.testId);
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
