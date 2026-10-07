import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import seed from '../src/lib/workspace/seed/workspace.json';
import { ALLOW } from './literals.allow';

// The literal ratchet (SC-67): no business datum stays in the workspace app's UI code. The names, places and ids of the
// stub's seed, its figures of 10 or more as they are drawn, times, rupee amounts, dates and batch-like ids are looked
// for in the text the UI code writes (markup text, string literals and attribute words; never comments, styles or class
// names), and in the person, distributor, product and kirana ids it names. A datum belongs in the data a screen reads
// from its source (frontend/core/src/lib/workspace/source.ts), set up in design3/core/data.js. The count may only go
// down; literals.allow.ts names the matches that are UI copy by coincidence, each with its reason.

const here = dirname(fileURLToPath(import.meta.url));
const core = join(here, '..');
const frontend = join(core, '..');

/** the files that are UI: the workspace's screens, its two apps, the model the screens share, the kit's two workspace
 *  parts that read data, and the host app. The stub (flow.ts, data.ts, store.svelte.ts) is the backend, not UI */
const walk = (dir: string): string[] =>
	readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p) : /\.(svelte|ts)$/.test(f) ? [p] : [];
	});
const W = join(core, 'src/lib/workspace');
export const UI_FILES = [
	...walk(join(W, 'screens')),
	join(W, 'RoleApp.svelte'),
	join(W, 'WorkspaceApp.svelte'),
	join(W, 'model.ts'),
	join(core, 'src/lib/components/TrackerCard.svelte'),
	join(core, 'src/lib/components/MoneyPanel.svelte'),
	...walk(join(frontend, 'workspace/src'))
].sort();

/* ---------- the denylist, from the seed ---------- */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
const S = seed as unknown as Record<string, Json>;
const leaves = (o: Json, key = '', out: [string, Json][] = []): [string, Json][] => {
	if (Array.isArray(o)) o.forEach((v) => leaves(v, key, out));
	else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => leaves(v, k, out));
	else out.push([key, o]);
	return out;
};
const strings = (o: Json, keys: string[]) =>
	leaves(o)
		.filter(([k, v]) => keys.includes(k) && typeof v === 'string' && v.length > 1)
		.map(([, v]) => v as string);
const obj = (k: string) => S[k];
// words of a name that name nothing on their own
const COMMON = new Set(
	'Market Yard godown Bazaar with and city Road Foods Traders Stores Store Kirana Provision General Super Mart Sons Agencies Distributors Wholesale Network India Ltd Bhandar Shree Sai'.split(
		' '
	)
);
const tokens = (v: string) => v.split(/[\s,&]+/).filter((t) => /^\p{Lu}\p{Ll}{2,}$/u.test(t) && !COMMON.has(t));

const NAMES = new Set<string>();
const add = (v: string, words = false) => {
	NAMES.add(v);
	if (words) tokens(v).forEach((t) => NAMES.add(t));
};
strings(obj('workspace'), ['name', 'short', 'domain', 'emailDomain', 'region']).forEach((v) => add(v, true));
strings(obj('client'), ['name', 'short', 'city', 'gstin', 'fssai']).forEach((v) => add(v, true));
// a product's code and a batch's id are caught by the id pattern, so they are not names too
for (const sku of Object.values(obj('skus') as Record<string, Record<string, Json>>)) {
	add(sku.brand as string);
	add(sku.name as string);
	add((sku.name as string).replace(/ \d+ ?(g|ml|kg|L)$/, ''));
}
strings(obj('distributors'), ['name', 'city', 'state', 'godown', 'address', 'gstin', 'cluster', 'territory']).forEach(
	(v) => add(v, true)
);
strings(obj('buyer'), ['name', 'city', 'state', 'address', 'gstin']).forEach((v) => add(v, true));
strings(obj('people'), ['name', 'short', 'org', 'city', 'email', 'phone']).forEach((v) => add(v, true));
strings(obj('kiranas'), ['name', 'area']).forEach((v) => add(v));
strings(obj('batches'), ['city', 'shelf']).forEach((v) => add(v));
strings(obj('docs'), ['no'])
	.filter((v) => /^[A-Z]{2,}[/-]/.test(v))
	.forEach((v) => add(v));
strings(obj('setup'), ['name']).forEach((v) => add(v));
strings(obj('shelf'), ['shop', 'area', 'round']).forEach((v) => add(v));
strings((obj('initial') as Record<string, Json>).users, ['name', 'org', 'email', 'phone']).forEach((v) => add(v, true));
add((obj('quarter') as Record<string, Json>).label as string);
// places the stub's journey names that its seed does not
['Charminar'].forEach((v) => add(v));

/** ids of people, organisations, products and shops: data when UI code names them */
const IDS = new Set<string>([
	...Object.keys(obj('people') as object),
	...Object.keys(obj('distributors') as object),
	...Object.keys(obj('skus') as object),
	...((obj('kiranas') as { id: string }[]).map((k) => k.id) as string[]),
	...((obj('initial') as { users: { id: string }[] }).users.map((u) => u.id) as string[]),
	(obj('workspace') as { id: string }).id
]);

/** the seed's figures of 10 or more, as they are drawn */
const NUMBERS = new Set<string>();
for (const [, v] of leaves(S as unknown as Json))
	if (typeof v === 'number' && Math.abs(v) >= 10) {
		const n = Math.abs(v);
		NUMBERS.add(String(n));
		NUMBERS.add(n.toLocaleString('en-IN'));
		if (n % 1) NUMBERS.add(n.toFixed(2));
	}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alt = (xs: Iterable<string>) =>
	[...xs]
		.sort((a, b) => b.length - a.length)
		.map(esc)
		.join('|');
const MONTH = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
export const PATTERNS: [string, RegExp][] = [
	['name', new RegExp(`(?<![\\p{L}\\p{N}@.])(?:${alt(NAMES)})(?![\\p{L}\\p{N}])`, 'gu')],
	['id', /\b[A-Z]{2}-(?:[A-Z]{2}-)?\d{3,}(?:-\d+)?\b/g],
	['time', /\b\d{1,2}:\d{2}\b/g],
	['rupees', /₹ ?\d/g],
	[
		'date',
		new RegExp(
			`\\b\\d{1,2} (?:${MONTH})[a-z]*\\b|\\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]* \\d{1,2}\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b`,
			'gi'
		)
	],
	['figure', new RegExp(`(?<![\\p{L}\\p{N}.,:/₹+-])(?:${alt(NUMBERS)})(?![\\p{L}\\p{N}]|[.,]\\d)`, 'gu')]
];

/* ---------- reading the text a file writes ---------- */

/** attributes whose value is never words a person reads */
const SKIP_ATTRS = new Set(
	'style class d viewBox points transform width height cx cy r rx ry x y x1 x2 y1 y2 fill stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray pathLength id for href src name type role tabindex autocomplete inputmode accept capture lang data-anchor data-x rel target method'.split(
		' '
	)
);
/** a string that is CSS, not words */
const CSS = /var\(--|\d(?:px|ms|em|rem|vh|vw|fr|deg)\b|minmax\(|repeat\(|oklab|cubic-bezier/;
const notWords = (s: string) => CSS.test(s) || /^#[0-9a-f]{3,8}$/i.test(s) || /^-?\d+(\.\d+)?%$/.test(s);

type Hit = { file: string; line: number; kind: string; match: string; text: string };

/** an expression that names the journey's state (s, st, state, ws.state, store.state) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parser's AST
const ofState = (o: any): boolean =>
	(o?.type === 'Identifier' && ['s', 'st', 'state'].includes(o.name)) ||
	(o?.type === 'MemberExpression' && !o.computed && o.property?.name === 'state');
type Ctx = { kind: 'text' | 'id'; value: string; at: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parser's AST, walked generically
type Node = any;
function contexts(src: string, ts: boolean): Ctx[] {
	const ast = parse(ts ? `<script lang="ts">${src}</script>` : src, { modern: true });
	const shift = ts ? '<script lang="ts">'.length : 0;
	const out: Ctx[] = [];
	const visit = (n: Node, skip = false): void => {
		if (!n || typeof n !== 'object') return;
		if (Array.isArray(n)) return n.forEach((x) => visit(x, skip));
		switch (n.type) {
			case 'StyleSheet':
			case 'Comment':
				return;
			case 'Attribute':
				if (SKIP_ATTRS.has(n.name) || n.name.startsWith('on')) return;
				return visit(n.value, skip);
			case 'StyleDirective':
			case 'ClassDirective':
				return;
			case 'Text':
				if (!skip) out.push({ kind: 'text', value: n.data, at: n.start - shift });
				return;
			case 'Literal':
				if (typeof n.value === 'string' && !n.regex) {
					if (IDS.has(n.value)) out.push({ kind: 'id', value: n.value, at: n.start - shift });
					else if (!notWords(n.value)) out.push({ kind: 'text', value: n.value, at: n.start - shift });
				}
				return;
			case 'TemplateElement': {
				const v = n.value.cooked ?? n.value.raw;
				if (!notWords(v)) out.push({ kind: 'text', value: v, at: n.start - shift });
				return;
			}
			case 'MemberExpression':
				// the journey's state keeps the donated batch in a slot of its own (state.mango): a field of State, not a datum
				if (!n.computed && n.property?.type === 'Identifier' && IDS.has(n.property.name) && !ofState(n.object))
					out.push({ kind: 'id', value: n.property.name, at: n.property.start - shift });
				break;
			case 'Property':
				// an object key that is an id ({ rakesh: … }) names the datum as much as its value does
				if (!n.computed && n.key?.type === 'Identifier' && IDS.has(n.key.name))
					out.push({ kind: 'id', value: n.key.name, at: n.key.start - shift });
				break;
			case 'TSTypeAnnotation':
			case 'TSTypeAliasDeclaration':
			case 'TSInterfaceDeclaration':
			case 'ImportDeclaration':
			case 'ExportAllDeclaration':
				return;
		}
		for (const [k, v] of Object.entries(n)) if (k !== 'loc' && k !== 'name_loc' && k !== 'metadata') visit(v, skip);
	};
	visit(ast.fragment);
	visit(ast.instance?.content);
	visit(ast.module?.content);
	return out;
}

export function scan(file: string): Hit[] {
	const src = readFileSync(file, 'utf8');
	const ts = file.endsWith('.ts');
	const rel = relative(frontend, file);
	const lineOf = (at: number) => src.slice(0, Math.max(0, at)).split('\n').length;
	const hits: Hit[] = [];
	for (const c of contexts(src, ts)) {
		if (c.kind === 'id') {
			hits.push({ file: rel, line: lineOf(c.at), kind: 'id', match: c.value, text: c.value });
			continue;
		}
		// one datum counts once: a match inside a longer one (the time in "Thu 16:50") is the same literal
		const found = PATTERNS.flatMap(([kind, re]) =>
			[...c.value.matchAll(re)].map((m) => ({ kind, match: m[0], from: m.index, to: m.index + m[0].length }))
		).sort((a, b) => a.from - b.from || b.to - b.from - (a.to - a.from));
		let end = -1;
		for (const f of found) {
			if (f.from < end) continue;
			end = f.to;
			hits.push({ file: rel, line: lineOf(c.at), kind: f.kind, match: f.match, text: c.value.trim().slice(0, 120) });
		}
	}
	return hits.filter((h) => !ALLOW.some((a) => a.file === h.file && a.match === h.match));
}

/** the count when the ratchet was set (390, SC-67); it only goes down. LITERALS=1 lists every match */
const BASELINE = 87;

describe('the literal ratchet', () => {
	const hits = UI_FILES.flatMap(scan);
	it('builds its denylist from the seed', () => {
		expect(NAMES.has('Rakesh Traders')).toBe(true);
		expect(NAMES.has('Munchly')).toBe(true);
		expect(NAMES.has('Nagpur')).toBe(true);
		expect(IDS.has('rakesh')).toBe(true);
		expect(NUMBERS.has('1,840')).toBe(true);
		expect(UI_FILES.length).toBeGreaterThan(60);
	});
	it('every allowance names a file the ratchet reads, and why', () => {
		for (const a of ALLOW) {
			expect(UI_FILES.map((f) => relative(frontend, f))).toContain(a.file);
			expect(a.reason.length).toBeGreaterThan(10);
		}
	});
	it(`finds no more business literals in UI code than it did (${BASELINE})`, () => {
		if (process.env.LITERALS || hits.length > BASELINE)
			console.log(hits.map((h) => `${h.file}:${h.line} ${h.kind} «${h.match}» in "${h.text}"`).join('\n'));
		expect(hits.length).toBeLessThanOrEqual(BASELINE);
	});
});
