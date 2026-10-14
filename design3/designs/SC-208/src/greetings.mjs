// SC-207: "hello" in seven Indian languages for the roadmap's languages card, shaped by Chromium (the film's own text
// renderer cannot shape Indic scripts), each as a transparent PNG at 2x: build/greet/<n>.png
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const WORDS = [['hi', 'नमस्ते', 'Hindi'], ['ta', 'வணக்கம்', 'Tamil'], ['te', 'నమస్కారం', 'Telugu'], ['bn', 'নমস্কার', 'Bengali'],
	['kn', 'ನಮಸ್ಕಾರ', 'Kannada'], ['gu', 'નમસ્તે', 'Gujarati'], ['mr', 'नमस्कार', 'Marathi']];
mkdirSync('build/greet', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [code, word, lang] of WORDS) {
	await page.setContent(`<html><body style="margin:0;background:transparent"><div id="w" lang="${code}" style="display:inline-block;padding:6px 10px;font:600 58px 'Kohinoor Devanagari','Tamil Sangam MN','Kohinoor Telugu','Kohinoor Bangla','Kannada Sangam MN','Kohinoor Gujarati',system-ui;color:#ecf3ef">${word}</div></body></html>`);
	await page.locator('#w').screenshot({ path: `build/greet/${code}.png`, omitBackground: true });
}
await browser.close();
console.log(WORDS.map((w) => w[0] + ' ' + w[2]).join(', '));
