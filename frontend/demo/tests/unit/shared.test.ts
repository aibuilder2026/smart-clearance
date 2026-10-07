import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { STAGES } from '../../src/lib/stages.ts';

// What the demo takes from design3 stays design3's: its stylesheet is design3/demo/demo.css, verbatim, and its stages
// are the director's, beat for beat. What it shares with the rest of the frontend stays shared: its HTML shell is the
// landing page's, to the byte, and its cascade is the workspace app's.
const here = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(here, '../..', p), 'utf8');
const norm = (css: string) =>
	css
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.join('\n');
const imports = (css: string) => css.split('\n').filter((l) => /^@(layer|import|source)\b/.test(l));
const director = read('../../design3/demo/director.jsx');

describe('the demo is design3/demo', () => {
	it('demo.css is unchanged', () => {
		expect(norm(read('src/lib/demo.css'))).toBe(norm(read('../../design3/demo/demo.css')));
	});
	it('every beat of the director, in order', () => {
		const theirs = [...director.matchAll(/\{ text: (`[^`]*`|"[^"]*"),/g)].map((m) => m[1]);
		const ours = STAGES.flatMap((st) => st.beats);
		expect(ours).toHaveLength(theirs.length);
		// the plain ones word for word; the computed ones by their opening words
		ours.forEach((b, i) => {
			const t = theirs[i];
			if (t.startsWith('"')) expect(b.text).toBe(JSON.parse(t));
			else expect(b.text.startsWith(t.slice(1, t.search(/\$\{|`$/)))).toBe(true);
		});
	});
	it('nine stages, each beat with a way to be done', () => {
		expect(STAGES).toHaveLength(9);
		for (const b of STAGES.flatMap((st) => st.beats)) expect(!!b.ui || !!b.done).toBe(true);
	});
});

describe("the demo shares the other apps' shell", () => {
	it('app.html is the same file', () => {
		expect(read('src/app.html')).toBe(read('../admin/src/app.html'));
	});
	it("app.css is the workspace app's cascade", () => {
		expect(imports(read('src/app.css'))).toEqual(imports(read('../workspace/src/app.css')));
	});
});
