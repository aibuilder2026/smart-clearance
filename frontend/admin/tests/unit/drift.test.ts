import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// design3 is the source of truth: the landing page's stylesheet equals design3/site/site.css except for its marked
// changes, window scrolling and the town's first paint from the server (frontend/admin/README.md)
const here = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(here, p), 'utf8');
const strip = (css: string) => css.replace(/\/\* @port[\s\S]*?@port-end \*\//g, '');
const norm = (css: string) =>
	css
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.join('\n');

const REPLACED = [
	`.site { position: absolute; inset: 0; overflow-x: hidden; overflow-y: auto; scroll-behavior: smooth; background: var(--bg); }
@media (prefers-reduced-motion: reduce) { .site { scroll-behavior: auto; } }`
];

describe('site.css matches design3/site/site.css', () => {
	it('outside its marked changes', () => {
		let source = read('../../../../design3/site/site.css');
		for (const r of REPLACED) {
			expect(source, 'the replaced rules are still in design3: re-port them if they changed').toContain(r);
			source = source.replace(r, '');
		}
		expect(norm(strip(read('../../src/lib/landing/site.css')))).toBe(norm(source));
	});
});

describe('docs.css matches design3/system/docs.css', () => {
	it('unchanged', () => {
		expect(norm(read('../../src/lib/ds/docs.css'))).toBe(norm(read('../../../../design3/system/docs.css')));
	});
});
