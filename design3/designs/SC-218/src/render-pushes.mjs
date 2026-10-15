// SC-205 cut 2: each push in pushes.json as a notification banner, rendered by Chromium at device scale 2 (so the Hindi
// is shaped properly) to a transparent PNG: build/push/<key>-<width>.png. node render-pushes.mjs <width>...
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
const require = createRequire('/Users/arundutta/projects/smart-clearance/frontend/workspace/package.json');
const { chromium } = require('@playwright/test');
const F = '/Users/arundutta/projects/smart-clearance/frontend/node_modules/.pnpm';
const geist = `${F}/@fontsource-variable+geist@5.3.0/node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2`;
const deva = `${F}/@fontsource-variable+noto-sans-devanagari@5.3.0/node_modules/@fontsource-variable/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-wght-normal.woff2`;
const icon = readFileSync('/Users/arundutta/projects/smart-clearance/design3/system/img/icon.svg', 'utf8');
const { pushes } = JSON.parse(readFileSync(new URL('./pushes.json', import.meta.url), 'utf8'));
const widths = process.argv.slice(2).map(Number);
mkdirSync('build/push', { recursive: true });
const b = await chromium.launch();
const page = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 900, height: 400 } });
for (const w of widths) for (const [k, p] of Object.entries(pushes)) {
  const html = `<html><head><style>
  @font-face { font-family: Geist; src: url('file://${geist}'); font-weight: 100 900; }
  @font-face { font-family: Deva; src: url('file://${deva}'); font-weight: 100 900; }
  body { margin: 0; background: transparent; font-family: Geist, Deva, sans-serif; }
  .n { box-sizing: border-box; width: ${w}px; margin: 24px; padding: 13px 15px 14px; border-radius: 20px;
       background: rgba(248, 251, 249, 0.97); box-shadow: 0 14px 34px rgba(0,0,0,.30), 0 2px 6px rgba(0,0,0,.18);
       border: 1px solid rgba(255,255,255,.7); color: #0f1a14; }
  .h { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #5d6d65; letter-spacing: .01em; }
  .h svg { width: 22px; height: 22px; border-radius: 6px; flex: none; }
  .h .a { flex: 1; font-weight: 560; text-transform: uppercase; letter-spacing: .06em; font-size: 11.5px; }
  .t { margin-top: 7px; font-size: 15.5px; font-weight: 650; line-height: 1.28; }
  .x { margin-top: 3px; font-size: 14px; line-height: 1.36; color: #26332c; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }
  </style></head><body><div class="n"><div class="h">${icon}<span class="a">${p.app ?? 'Smart-Clearance'}</span><span>now</span></div>
  <div class="t">${p.title}</div><div class="x">${p.body}</div></div></body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const el = await page.$('.n');
  const box = await el.boundingBox();
  await page.screenshot({ path: `build/push/${k}-${w}.png`, omitBackground: true, clip: { x: box.x - 22, y: box.y - 18, width: box.width + 44, height: box.height + 48 } });
}
await b.close();
console.log('rendered', Object.keys(pushes).length * widths.length);
