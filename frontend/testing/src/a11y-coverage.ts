// The a11y suite's coverage (SC-58), run by each app's test:a11y after Playwright: every core component the app uses
// (its imports from @smart-clearance/core, the dev routes left out) must have been on screen in at least one scan, in any
// project. The scans record what they saw (a11y.ts, COMPONENTS) in test-results/a11y/<project>/<test>.json.
//   node ../testing/src/a11y-coverage.ts      (from the app's folder)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { COMPONENTS, STRUCTURAL } from './a11y.ts';

const core = new URL('../../core/src/lib/', import.meta.url).pathname;
const known = new Set(
	['components', 'patterns'].flatMap((d) =>
		readdirSync(join(core, d))
			.filter((f) => f.endsWith('.svelte'))
			.map((f) => basename(f, '.svelte'))
	)
);

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((f) => {
		const path = join(dir, f);
		if (statSync(path).isDirectory()) return f === '(dev)' ? [] : files(path);
		return /\.(svelte|ts)$/.test(f) ? [path] : [];
	});
}

// the core components the app imports, and where
const used = new Map<string, string>();
const use = (name: string, path: string) => known.has(name) && !used.has(name) && used.set(name, path);
let workspace = false;
for (const path of files('src')) {
	for (const m of readFileSync(path, 'utf8').matchAll(
		/import\s*\{([^}]*)\}\s*from\s*'@smart-clearance\/core([^']*)'/g
	)) {
		if (m[2] === '/workspace') workspace = true;
		for (const name of m[1].split(',').map((n) => n.replace(/^\s*type\s+/, '').trim())) use(name, path);
	}
}
// an app on the workspace app (SC-62: the workspace host and the guided demo) uses every core component its screens
// do: they live in core (src/lib/workspace), importing the kit by path or from the package's index
// An app can name the workspace screens it never shows, with why, in its package.json (`a11yCoverage.unreached`, paths
// under core/src/lib): the guided demo has no workspace admin, so the admin's screens are never on its screen
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { a11yCoverage?: { unreached?: string[] } };
const unreached = new Set((pkg.a11yCoverage?.unreached ?? []).map((p) => join(core, p)));
if (workspace)
	for (const path of files(join(core, 'workspace')).filter((p) => !unreached.has(p))) {
		const text = readFileSync(path, 'utf8');
		for (const m of text.matchAll(/from\s*'(?:\.\.\/)+(?:components|patterns)\/(\w+)\.svelte'/g)) use(m[1], path);
		for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*'(?:\.\.\/)+index'/g))
			for (const name of m[1].split(',').map((n) => n.replace(/^\s*type\s+/, '').trim())) use(name, path);
	}

// what the scans saw, and the findings they made
const results = 'test-results/a11y';
const seen = new Set<string>();
let tests = 0;
let findings = 0;
for (const project of readdirSync(results)) {
	for (const f of readdirSync(join(results, project)).filter((f) => f.endsWith('.json'))) {
		const r = JSON.parse(readFileSync(join(results, project, f), 'utf8'));
		tests += 1;
		findings += r.findings.length;
		for (const c of r.components ?? []) seen.add(c);
	}
}

const unknown = [...used.keys()].filter((c) => !COMPONENTS[c] && !STRUCTURAL.includes(c));
const missed = [...used.keys()].filter((c) => COMPONENTS[c] && !seen.has(c));
const app = basename(process.cwd());
console.log(
	`a11y coverage (${app}): ${used.size} core components used, ${used.size - missed.length - unknown.length} on screen ` +
		`in ${tests} scanned tests, ${findings} WCAG findings`
);
if (unknown.length || missed.length) {
	for (const c of unknown) console.error(`  ${c} (${used.get(c)}): no selector in COMPONENTS (testing/src/a11y.ts)`);
	for (const c of missed) console.error(`  ${c} (${used.get(c)}): used, but on screen in no scan`);
	process.exit(1);
}
