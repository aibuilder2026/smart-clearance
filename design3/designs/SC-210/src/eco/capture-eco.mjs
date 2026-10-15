// SC-210: capture the agentic ecosystem frame by frame (eco.html renders the frame for a scene time t; nothing runs on
// its own clock), with where each node and layer lands on screen, for the compositor's labels.
//   node capture-eco.mjs <outdir> <cues.json> [fps=25] [only=t1,t2,…]
// The folder is served on a free local port (modules need http); the browser runs headless on the GPU.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const [out, cuesPath, fpsArg = '25', only = ''] = process.argv.slice(2);
const FPS = Number(fpsArg);
const cues = JSON.parse(readFileSync(cuesPath, 'utf8'));
mkdirSync(out, { recursive: true });
const ROOT = new URL('.', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = createServer((req, res) => {
	const p = normalize(join(ROOT, decodeURIComponent(req.url.split('?')[0])));
	if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); res.end(); return; }
	res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.log('page:', m.text().slice(0, 300)));
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(`http://127.0.0.1:${port}/eco.html`);
await page.waitForFunction(() => window.ecoReady === true, null, { timeout: 30000 });
await page.evaluate((c) => window.setCues(c), cues);
const times = only ? only.split(',').map(Number) : Array.from({ length: Math.round(cues.end * FPS) }, (_, i) => i / FPS);
const log = [];
const t0 = Date.now();
for (let i = 0; i < times.length; i++) {
	const t = times[i];
	const info = await page.evaluate((tt) => window.renderAt(tt), t);
	log.push({ i, t, ...info });
	const name = only ? `t${t.toFixed(2)}.jpg` : `f${String(i).padStart(5, '0')}.jpg`;
	await page.screenshot({ path: `${out}/${name}`, type: 'jpeg', quality: 95, animations: 'allow' });
	if (i % 100 === 0) console.log(i, '/', times.length, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
writeFileSync(`${out}/frames.json`, JSON.stringify({ fps: FPS, cues, frames: log }));
await browser.close(); server.close();
console.log('done', times.length, 'frames');
