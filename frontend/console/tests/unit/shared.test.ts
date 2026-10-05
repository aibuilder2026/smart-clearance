import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// What the console shares with the rest of the frontend stays shared: its stylesheet is design3's, verbatim; its HTML
// shell is the landing page's, to the byte (the appearance applied before the first paint, by core's theme key); its
// cascade is the landing page's, with the screens' stylesheet added where design3/console loads it.
const here = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(here, '../..', p), 'utf8');
const norm = (css: string) =>
	css
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.join('\n');
const imports = (css: string) => css.split('\n').filter((l) => /^@(layer|import|source)\b/.test(l));

describe('console.css matches design3/console/console.css', () => {
	it('unchanged', () => {
		expect(norm(read('src/lib/console.css'))).toBe(norm(read('../../design3/console/console.css')));
	});
});

describe("the console shares the landing page's shell", () => {
	it('app.html is the same file', () => {
		expect(read('src/app.html')).toBe(read('../admin/src/app.html'));
		expect(read('src/app.html')).toContain("localStorage.getItem('sc3-theme')");
	});
	it("app.css is the same cascade, plus the screens' stylesheet after components.css", () => {
		const admin = imports(read('../admin/src/app.css'));
		const console_ = imports(read('src/app.css'));
		const at = admin.indexOf("@import '@smart-clearance/core/styles/components.css';") + 1;
		expect(console_).toEqual([
			...admin.slice(0, at),
			"@import '@smart-clearance/core/styles/screens.css';",
			...admin.slice(at)
		]);
	});
});
