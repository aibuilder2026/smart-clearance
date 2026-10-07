import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// design3 is the source of truth: the landing page's stylesheet equals design3/site/site.css, apart from any marked
// change (none since SC-60: design3's page scrolls the window too)
const here = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(here, p), 'utf8');
const strip = (css: string) => css.replace(/\/\* @port[\s\S]*?@port-end \*\//g, '');
const norm = (css: string) =>
	css
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.join('\n');

describe('site.css matches design3/site/site.css', () => {
	it('outside its marked changes', () => {
		expect(norm(strip(read('../../src/lib/landing/site.css')))).toBe(norm(read('../../../../design3/site/site.css')));
	});
});

describe('docs.css matches design3/system/docs.css', () => {
	it('unchanged', () => {
		expect(norm(read('../../src/lib/ds/docs.css'))).toBe(norm(read('../../../../design3/system/docs.css')));
	});
});
