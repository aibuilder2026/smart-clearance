// SC-206: each label's HTML rendered at 4x (4096 x 2560), then read back with Chromium's BarcodeDetector.
//   node label-png.mjs build/labels/jobs.json
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch();
for (const j of jobs) {
	const ctx = await browser.newContext({ deviceScaleFactor: 4, viewport: { width: j.w, height: j.h } });
	const p = await ctx.newPage();
	await p.goto('file://' + j.html);
	await p.waitForFunction(() => document.body.dataset.fit === '1');
	await p.screenshot({ path: j.png, type: 'png' });
	const b64 = readFileSync(j.png).toString('base64');
	const read = await p.evaluate(async (src) => {
		const i = new Image(); i.src = 'data:image/png;base64,' + src; await i.decode();
		return (await new BarcodeDetector({ formats: ['ean_13', 'qr_code'] }).detect(i)).map(f => [f.format, f.rawValue]);
	}, b64);
	console.log(j.png, JSON.stringify(read), 'expect', JSON.stringify(j.expect));
	await ctx.close();
}
await browser.close();
