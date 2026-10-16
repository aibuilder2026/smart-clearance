// SC-219 cut 11 (as cut 9): the codes the film shows, read back from its own frames with Chromium's BarcodeDetector.
//   node qrcheck11.mjs <film.mp4> <seconds>...      (each frame is taken full size with ffmpeg, then read)
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const [film, ...times] = process.argv.slice(2);
mkdirSync('build/qr9', { recursive: true });
const browser = await chromium.launch();
const p = await browser.newPage();
// BarcodeDetector needs a secure context: a file:// page is one, about:blank is not
writeFileSync('build/qr9/blank.html', '<html><body></body></html>');
await p.goto('file://' + process.cwd() + '/build/qr9/blank.html');
for (const t of times) {
	const png = `build/qr9/f-${t}.png`;
	execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', t, '-i', film, '-frames:v', '1', png]);
	const b64 = readFileSync(png).toString('base64');
	const read = await p.evaluate(async (src) => {
		const i = new Image(); i.src = 'data:image/png;base64,' + src; await i.decode();
		return (await new BarcodeDetector({ formats: ['ean_13', 'qr_code'] }).detect(i)).map((f) => [f.format, f.rawValue]);
	}, b64);
	console.log(t, JSON.stringify(read));
}
await browser.close();
