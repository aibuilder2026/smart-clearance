import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// WCAG 2.0, 2.1 and 2.2 at levels A and AA: the rules axe-core can decide automatically.
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Which impacts fail a test. Default: all of them, since WCAG AA conformance has no "minor" exemption.
// Narrow it with A11Y_FAIL_ON=critical,serious while a backlog is being worked down.
const FAIL_ON = (process.env.A11Y_FAIL_ON || 'critical,serious,moderate,minor').split(',').map(s => s.trim());

export type Finding = {
  rule: string; impact: string; help: string; helpUrl: string; wcag: string[];
  nodes: number; targets: string[]; state: string;
};

// Scan the page as it stands and return its WCAG violations, tagged with the state they were seen in.
// targetSizeExclude: selectors left out of the target-size rule only (the demo's scaled device previews,
// whose screens the app spec checks at full size); every other rule still covers them.
export async function scan(page: Page, state: string, opts: { targetSizeExclude?: string[] } = {}): Promise<Finding[]> {
  await page.waitForTimeout(250);
  const present: string[] = [];
  for (const sel of opts.targetSizeExclude || []) if (await page.locator(sel).count()) present.push(sel);
  const main = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (present.length) main.disableRules(['target-size']);
  const results = [await main.analyze()];
  if (present.length) {
    const sized = new AxeBuilder({ page }).withRules(['target-size']);
    for (const sel of present) sized.exclude(sel);
    results.push(await sized.analyze());
  }
  return results.flatMap(r => r.violations).map(v => ({
    rule: v.id,
    impact: v.impact || 'unknown',
    help: v.help,
    helpUrl: v.helpUrl,
    wcag: v.tags.filter(t => /^wcag\d/.test(t)),
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 4).map(n => n.target.map(String).join(' ')),
    state,
  }));
}

// Save the findings for the summary, attach them to the HTML report, and fail on the chosen impacts.
export async function report(testInfo: TestInfo, findings: Finding[]) {
  const dir = join(__dirname, 'results', testInfo.project.name);
  mkdirSync(dir, { recursive: true });
  const slug = testInfo.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  writeFileSync(join(dir, `${slug}.json`), JSON.stringify({ test: testInfo.title, project: testInfo.project.name, findings }, null, 2));
  await testInfo.attach('wcag-findings.json', { body: JSON.stringify(findings, null, 2), contentType: 'application/json' });
  const failing = findings.filter(f => FAIL_ON.includes(f.impact));
  const lines = failing.map(f => `${f.impact.padEnd(8)} ${f.rule} (${f.wcag.join(', ')}) × ${f.nodes} · ${f.state} · ${f.targets[0] || ''}`);
  expect(failing, `WCAG violations:\n${lines.join('\n')}`).toEqual([]);
}

// Skip the splash on every page load.
export async function skipSplash(page: Page) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('sc3-demo-splash', '1'); sessionStorage.setItem('sc3-app-splash', '1'); } catch (e) { /* storage blocked */ }
  });
}
