// SC-208: the agents' icons (and a few the new scenes use), drawn by Chromium from the design system's own Lucide paths
// (design3/system/icons.js), white strokes on transparent at 192 px: build/icons/<name>.png
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const src = readFileSync(new URL('../../../system/icons.js', import.meta.url), 'utf8');
const ICONS = new Function('window', src + '; return window.SC3_ICONS;')({});
const NAMES = ['radar', 'scan-line', 'scale', 'split', 'send', 'store', 'messages-square', 'file-check', 'leaf', 'database', 'hand',
	'truck', 'warehouse', 'package', 'shield-check', 'history', 'activity', 'shopping-bag', 'users', 'heart-handshake', 'trash-2'];
const out = new URL('./build/icons/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 192, height: 192 }, deviceScaleFactor: 1 });
for (const n of NAMES) {
	if (!ICONS[n]) { console.log('missing', n); continue; }
	await page.setContent(`<html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg></body></html>`);
	await page.locator('svg').screenshot({ path: `${out}${n}.png`, omitBackground: true });
}
await browser.close();
console.log('icons', NAMES.length);
