import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// design3 is the source of truth: the landing page's stylesheet equals design3/site/site.css except for its two marked
// changes, window scrolling and the CSS-gated pan (frontend/admin/README.md)
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
@media (prefers-reduced-motion: reduce) { .site { scroll-behavior: auto; } }`,
	`  /* the signature move: the street pans as the page scrolls, holding on each exit (motion allowed, desktops only) */
  .ex-track { height: 250vh; }
  .ex-stick { position: sticky; }
  /* clip, not hidden: a focused chip must never scroll the stage under the pan */
  .ex-pan.panned { --zoom: 1.8; position: relative; max-width: 1248px; margin: 0 auto; overflow: hidden; overflow: clip; border-radius: 20px; box-shadow: var(--shadow-2), 0 0 0 var(--hair) var(--line); }
  .ex-pan.panned .ex-pano { width: calc(var(--zoom) * 100%); max-width: none; margin: 0; border-radius: 0; box-shadow: none; }`
];

describe('site.css matches design3/site/site.css', () => {
	it('outside its two marked changes', () => {
		let source = read('../../../../design3/site/site.css');
		for (const r of REPLACED) {
			expect(source, 'the replaced rules are still in design3: re-port them if they changed').toContain(r);
			source = source.replace(r, '');
		}
		expect(norm(strip(read('../../src/lib/landing/site.css')))).toBe(norm(source));
	});
});
