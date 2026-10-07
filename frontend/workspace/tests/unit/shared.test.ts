import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// What the workspace app shares with the rest of the frontend stays shared: its HTML shell is the landing page's, to the
// byte, and its cascade is the console's (the landing page's, with the screens' stylesheet after the components).
const here = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(here, '../..', p), 'utf8');
const imports = (css: string) => css.split('\n').filter((l) => /^@(layer|import|source)\b/.test(l));

describe("the workspace app shares the other apps' shell", () => {
	it('app.html is the same file', () => {
		expect(read('src/app.html')).toBe(read('../admin/src/app.html'));
	});
	it("app.css is the console's cascade", () => {
		expect(imports(read('src/app.css'))).toEqual(imports(read('../console/src/app.css')));
	});
});
