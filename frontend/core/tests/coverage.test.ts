import { describe, expect, it } from 'vitest';
import { COVERAGE } from '../src/lib/coverage';
import { own, read } from './design3';

// every export of the prototype's kit (window.SC3) is either built in core or planned, and nothing is listed twice
const exported = (src: string) =>
	[
		...src.matchAll(
			/(?:window\.SC3 = Object\.assign\(window\.SC3 \|\| \{\}, |Object\.assign\(window\.SC3, )\{([\s\S]*?)\}\);/g
		)
	]
		.flatMap((m) => m[1].split(','))
		.map((s) => s.trim())
		.filter(Boolean);

const kit = ['system/kit.jsx', 'system/world.jsx', 'system/product.jsx'].flatMap((f) => exported(read(f)));
const index = own('src/lib/index.ts');

describe('coverage of design system v3', () => {
	it('reads the kit', () => expect(kit.length).toBeGreaterThan(70));
	it('lists every kit export exactly once', () => {
		expect(new Set(kit).size).toBe(kit.length);
		expect(Object.keys(COVERAGE).sort()).toEqual(kit.slice().sort());
	});
	it('exports everything it calls built', () => {
		const missing = Object.entries(COVERAGE)
			.filter(([name, c]) => c.status === 'built' && name !== 'Portal')
			.map(([name]) => name)
			.filter((name) => !new RegExp(`\\b${name}\\b`).test(index));
		expect(missing).toEqual([]);
	});
});
