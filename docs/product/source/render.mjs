// PRODUCT.md's pictures (SC-224): each page here, in headless Chromium at 1000 px wide and a device scale factor of 2,
// saved as a lossy WebP beside PRODUCT.md's other images in docs/product/. Needs the frontend's Playwright with
// Chromium (corepack pnpm install in frontend/) and cwebp (brew install webp).
//   node docs/product/source/render.mjs            every picture
//   node docs/product/source/render.mjs usp        one
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const require = createRequire(path.join(repo, 'frontend/testing/package.json'));
const { chromium } = require('@playwright/test');

const PAGES = ['problem', 'usp', 'agentic', 'outcome'];
const only = process.argv.slice(2);
const work = mkdtempSync(path.join(tmpdir(), 'sc-product-'));
const browser = await chromium.launch();
try {
	const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 });
	for (const name of only.length ? only : PAGES) {
		await page.goto(pathToFileURL(path.join(here, `${name}.html`)).href, { waitUntil: 'networkidle' });
		await page.evaluate(async () => {
			await document.fonts.ready;
			await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
		});
		const png = path.join(work, `${name}.png`);
		await page.screenshot({ path: png, fullPage: true });
		const out = path.join(repo, 'docs/product', `${name}.webp`);
		execFileSync('cwebp', ['-quiet', '-q', '92', '-m', '6', png, '-o', out]);
		console.log('rendered', path.relative(repo, out));
	}
} finally {
	await browser.close();
	rmSync(work, { recursive: true, force: true });
}
