// After a run: merge every test's WCAG findings into one table, by rule, and write results/a11y-report.md.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export default async function () {
  const root = join(dirname(fileURLToPath(import.meta.url)), 'results');
  if (!existsSync(root)) return;
  const rules = new Map(); let scans = 0; const projects = new Set();
  for (const project of readdirSync(root)) {
    const dir = join(root, project);
    if (!existsSync(dir) || project.endsWith('.md')) continue;
    for (const f of readdirSync(dir).filter(n => n.endsWith('.json'))) {
      const { test, findings } = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      scans++; projects.add(project);
      for (const v of findings) {
        const r = rules.get(v.rule) || { ...v, nodes: 0, places: new Set(), projects: new Set(), examples: [] };
        r.nodes += v.nodes; r.places.add(`${test} (${v.state})`); r.projects.add(project);
        if (r.examples.length < 3 && v.targets[0] && !r.examples.includes(v.targets[0])) r.examples.push(v.targets[0]);
        rules.set(v.rule, r);
      }
    }
  }
  const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const rows = [...rules.values()].sort((a, b) => (order[a.impact] ?? 9) - (order[b.impact] ?? 9) || b.nodes - a.nodes);
  const md = [
    '# WCAG 2.2 AA · axe-core findings',
    '',
    `${scans} tests across ${[...projects].join(', ')}. ${rows.length ? `${rows.length} rules failed.` : 'No violations.'}`,
    '',
    '| Impact | Rule | WCAG | Elements | Seen in | Example element |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(r => `| ${r.impact} | [${r.rule}](${r.helpUrl}): ${r.help} | ${r.wcag.join(', ')} | ${r.nodes} | ${r.places.size} states, ${[...r.projects].join(', ')} | \`${(r.examples[0] || '').replace(/\|/g, '\\|')}\` |`),
    '',
    '## Where each rule fails',
    '',
    ...rows.flatMap(r => [`### ${r.rule}`, '', ...[...r.places].slice(0, 25).map(p => `- ${p}`), r.places.size > 25 ? `- and ${r.places.size - 25} more` : '', '']),
  ].join('\n');
  writeFileSync(join(root, 'a11y-report.md'), md);
  console.log(`\nWCAG summary: ${rows.length} failing rules across ${scans} tests. Full table: design3/a11y/results/a11y-report.md`);
  for (const r of rows) console.log(`  ${r.impact.padEnd(8)} ${r.rule.padEnd(28)} ${String(r.nodes).padStart(5)} elements  ${r.wcag.join(',')}`);
}
