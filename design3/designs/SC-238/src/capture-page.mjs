// SC-211: capture a frame-exact page (window.renderAt(t) draws scene time t; nothing runs on its own clock) frame by
// frame at 1920 x 1080, served from this folder (src/) so a page can load the fonts. window.setCues(cues) gets the
// narration's cues first and may return {events} (the scene's sounds, for the mix), written beside the frames.
//   node capture-page.mjs <page> <outdir> <cues.json> [fps=25] [t1,t2,…|png]
// With times, only those frames (t<time>.jpg) are taken, for checking; "png" keeps alpha (an overlay over a picture).
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const [pagePath, out, cuesPath, fpsArg = '25', only = ''] = process.argv.slice(2);
const FPS = Number(fpsArg);
const cues = JSON.parse(readFileSync(cuesPath, 'utf8'));
const png = only === 'png';
mkdirSync(out, { recursive: true });
const ROOT = new URL('.', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
	const p = normalize(join(ROOT, decodeURIComponent(req.url.split('?')[0])));
	if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); res.end(); return; }
	res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.log('page:', m.text().slice(0, 300)));
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(`http://127.0.0.1:${port}/${pagePath}`);
await page.waitForFunction(() => window.pageReady === true, null, { timeout: 30000 });
const res = await page.evaluate((c) => window.setCues(c), cues);
if (res && res.events) writeFileSync(`${out}/events.json`, JSON.stringify(res.events, null, 1));
const END = (res && res.end) || cues.end;   // a scene may time its own end from the cues (SC-238's agents)
const times = only && !png ? only.split(',').map(Number) : Array.from({ length: Math.round(END * FPS) }, (_, i) => i / FPS);
const t0 = Date.now();
for (let i = 0; i < times.length; i++) {
	const t = times[i];
	await page.evaluate((tt) => window.renderAt(tt), t);
	const name = only && !png ? `t${t.toFixed(2)}.jpg` : `f${String(i).padStart(5, '0')}.${png ? 'png' : 'jpg'}`;
	await page.screenshot({ path: `${out}/${name}`, type: png ? 'png' : 'jpeg', ...(png ? { omitBackground: true } : { quality: 94 }) });
	if (i % 100 === 0) console.log(i, '/', times.length, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
writeFileSync(`${out}/frames.json`, JSON.stringify({ fps: FPS, cues, n: times.length }));
await browser.close(); server.close();
console.log('done', times.length, 'frames');
