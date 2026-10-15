// SC-218 cut 8: the extra icons the pipeline panels use (servers, Pub/Sub, storage, devices), drawn by Chromium from the
// architecture page's Lucide set (arch8/icons.js), white strokes on transparent at 192 px, beside cut 7's: build/icons/<name>.png
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const src = readFileSync(new URL('./arch8/icons.js', import.meta.url), 'utf8');
const w = {}; new Function('window', src)(w);
const ICONS = w.SC3_ICONS || Object.values(w)[0];
const NAMES = ['server', 'radio', 'hard-drive', 'tablet', 'monitor', 'flame', 'bot', 'cpu', 'braces', 'layers', 'key', 'workflow',
	'zap', 'webhook', 'calendar-clock', 'qr-code', 'stamp', 'bell-ring', 'cloud-upload', 'user-check', 'box', 'laptop', 'git-branch',
	'list-checks', 'clipboard-check', 'scroll-text', 'wallet', 'hand-coins'];
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
