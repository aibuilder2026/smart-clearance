import { expect, type Page, type TestInfo } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export const PROTOTYPE = 'http://127.0.0.1:8790';
export const PORT = 'http://127.0.0.1:4175';

/** Opens a page as a parity run sees it: the theme following the device, fonts loaded, motion settled. A prototype page
 *  scrolls inside its app root; `windowScroll` lets its document scroll instead, as the port's does, so a section taller
 *  than the window is captured whole on both sides. */
export async function open(page: Page, url: string, { windowScroll = false } = {}) {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('sc3-theme', 'system');
			localStorage.removeItem('sc-demo-requests');
		} catch {
			// storage blocked
		}
	});
	await page.goto(url, { waitUntil: 'networkidle' });
	// the landing page's loader (SC-35), on both sides, has lifted
	await page.waitForFunction(
		() => {
			const loader = (window as unknown as { SC3_LOADER?: { lifted: boolean } }).SC3_LOADER;
			return !loader || loader.lifted;
		},
		null,
		{ timeout: 15_000 }
	);
	if (windowScroll)
		await page.addStyleTag({
			content:
				'.site-root { position: relative !important; inset: auto !important; } .app { height: auto !important; overflow: visible !important; } .site { position: relative !important; inset: auto !important; overflow: visible !important; }'
		});
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(700);
}

/** the top-left w×h of an image */
function crop(img: PNG, w: number, h: number) {
	if (img.width === w && img.height === h) return img;
	const out = new PNG({ width: w, height: h });
	PNG.bitblt(img, out, 0, 0, w, h, 0, 0);
	return out;
}

/** Compares two screenshots: attaches both and their diff to the report, and fails above `max` (a share of pixels).
 *  Sizes may differ by a pixel or two of rounding; the common area is compared. */
export async function compare(testInfo: TestInfo, name: string, prototype: Buffer, port: Buffer, max: number) {
	const pa = PNG.sync.read(prototype);
	const pb = PNG.sync.read(port);
	await testInfo.attach(`${name} · prototype`, { body: prototype, contentType: 'image/png' });
	await testInfo.attach(`${name} · port`, { body: port, contentType: 'image/png' });
	const near = Math.abs(pa.width - pb.width) <= 2 && Math.abs(pa.height - pb.height) <= 2;
	expect.soft(near, `${name}: the port is ${pb.width}×${pb.height}, the prototype ${pa.width}×${pa.height}`).toBe(true);
	if (!near) return;
	const w = Math.min(pa.width, pb.width);
	const h = Math.min(pa.height, pb.height);
	const a = crop(pa, w, h);
	const b = crop(pb, w, h);
	const diff = new PNG({ width: w, height: h });
	const n = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.1 });
	await testInfo.attach(`${name} · diff`, { body: PNG.sync.write(diff), contentType: 'image/png' });
	const share = n / (w * h);
	testInfo.annotations.push({ type: 'parity', description: `${name}: ${(share * 100).toFixed(2)}%` });
	expect.soft(share, `${name}: share of pixels that differ`).toBeLessThanOrEqual(max);
}
