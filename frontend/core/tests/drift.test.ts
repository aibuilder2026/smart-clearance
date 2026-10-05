import { describe, expect, it } from 'vitest';
import { own, read } from './design3';

// design3 is the source of truth: the ported stylesheets must equal design3/system's, except inside marked
// /* @port … @port-end */ blocks, which are the port's own additions (README.md, "Ported CSS").
const port = (file: string) => own(`src/styles/${file}`);
const strip = (css: string) => css.replace(/\/\* @port[\s\S]*?@port-end \*\//g, '');
const norm = (css: string) =>
	css
		.split('\n')
		.map((l) => l.trimEnd())
		.filter((l) => l.trim())
		.join('\n');

describe('the ported stylesheets match design3/system', () => {
	it('tokens.css: the Google Fonts import is the only change', () => {
		const source = read('system/tokens.css').replace(/^@import url\("https:\/\/fonts\.googleapis\.com[^\n]*\n/m, '');
		expect(norm(strip(port('tokens.css')))).toBe(norm(source));
	});
	it('base.css is unchanged', () => {
		expect(norm(strip(port('base.css')))).toBe(norm(read('system/base.css')));
	});
	it('components.css is unchanged, plus the marked adapters', () => {
		expect(norm(strip(port('components.css')))).toBe(norm(read('system/components.css')));
		expect(port('components.css')).toContain('/* @port adapters');
	});
});
