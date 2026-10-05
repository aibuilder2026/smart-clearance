// Pixel parity with the prototype, shared by every app's parity suite: two screenshots compared with pixelmatch, the
// pair and its diff attached to the report.
import { expect, type TestInfo } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

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
