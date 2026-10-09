import { describe, expect, it } from 'vitest';
import { firstPaint } from '../src/lib/firstpaint';

// The first paint (SC-131): the cover goes first in <body>, and the page's stylesheets stop holding back the first paint
const page = [
	'<!doctype html><html><head><meta charset="utf-8" /><title>t</title>',
	'<link href="/a.css" rel="stylesheet">',
	'<link href="/print.css" rel="stylesheet" media="print">',
	'<link href="/x.js" rel="modulepreload">',
	'</head><body data-sveltekit-preload-data="hover"><div>page</div></body></html>'
].join('');

describe('firstPaint', () => {
	const out = firstPaint(page, { cover: '<script>cover()</script>', preconnect: 'https://api.example/v1' });

	it('puts the cover first in <body>', () => {
		expect(out).toContain('<body data-sveltekit-preload-data="hover"><script>cover()</script><div>page</div>');
	});

	it('fetches each stylesheet as a preload that becomes a stylesheet once loaded', () => {
		expect(out).toContain(
			`<link href="/a.css" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'">`
		);
		// the blocking link is left only inside <noscript>
		expect(out.split('<link href="/a.css" rel="stylesheet">').length - 1).toBe(1);
	});

	it('keeps a <noscript> copy, after the charset, for a browser without scripts', () => {
		expect(out).toContain('<meta charset="utf-8" /><link rel="preconnect" href="https://api.example" crossorigin>');
		expect(out).toContain('<noscript><link href="/a.css" rel="stylesheet"></noscript>');
	});

	it('leaves a stylesheet for another medium, and everything else, as it is', () => {
		expect(out).toContain('<link href="/print.css" rel="stylesheet" media="print">');
		expect(out).toContain('<link href="/x.js" rel="modulepreload">');
	});

	it('adds no preconnect without an API', () => {
		expect(firstPaint(page, { cover: '' })).not.toContain('preconnect');
	});
});
