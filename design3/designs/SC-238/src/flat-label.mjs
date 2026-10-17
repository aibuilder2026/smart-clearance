// SC-238: a carton label printed flat, as the label maker prints it (design3/system/labels/label.py's HTML), at three
// times its CSS size (SC-210's relabel/flat.mjs).   node flat-label.mjs <jobs.json>      jobs: [{html, png, w, h}]
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch();
for (const j of jobs) {
	const ctx = await browser.newContext({ deviceScaleFactor: 3, viewport: { width: j.w, height: j.h } });
	const p = await ctx.newPage();
	await p.goto('file://' + resolve(j.html));
	await p.waitForLoadState('networkidle');
	await p.evaluate(() => document.fonts.ready);
	await p.screenshot({ path: j.png, type: 'png' });
	await ctx.close();
	console.log('flat', j.png);
}
await browser.close();
