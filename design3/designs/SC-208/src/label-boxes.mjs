// SC-206: where each part of a rendered label sits (CSS px of its 860 x 640 layout): the best-before line, the batch
// box, the FSSAI licence, the barcode and the QR code, for rings in the film.   node label-boxes.mjs build/labels/MF-2410-118.html
import { createRequire } from 'node:module';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const p = await (await browser.newContext({ viewport: { width: 860, height: 640 } })).newPage();
await p.goto('file://' + process.cwd() + '/' + process.argv[2]);
await p.waitForFunction(() => document.body.dataset.fit === '1');
const boxes = await p.evaluate(() => {
	const r = (el) => { const b = el.getBoundingClientRect(); return [b.x, b.y, b.x + b.width, b.y + b.height].map((v) => Math.round(v)); };
	return { bb: r(document.querySelector('#bb')), batch: r(document.querySelector('#batch')), mfg: r(document.querySelector('#mfg')),
		mrp: r(document.querySelector('#mrp')), lic: r(document.querySelector('.lic')), ean: r(document.querySelector('.ean')), qr: r(document.querySelector('.qr')),
		band: r(document.querySelector('.band')) };
});
console.log(JSON.stringify(boxes));
await browser.close();
