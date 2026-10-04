import { test } from '@playwright/test';
import { PORT, PROTOTYPE, compare, open } from './compare';

// /ds against the DS v3 page, for the sections core has built. Both are captured in a window tall enough that nothing
// scrolls. A section whose pieces are partly still to come (colour, imagery, overlays) differs by design and is left out.
const SECTIONS: [string, number][] = [
	['world', 0.003],
	['mark', 0.003],
	['workspace', 0.003],
	['type', 0.003],
	['shape', 0.003],
	// Lucide 1.51 draws a few of these icons differently from the prototype's 0.468
	['icons', 0.03],
	['buttons', 0.003],
	['controls', 0.003]
];

test('parity · the design system page', async ({ browser }, testInfo) => {
	test.skip(
		testInfo.project.name !== 'desktop-light' && testInfo.project.name !== 'desktop-dark',
		'the page is compared on desktop'
	);
	const shots: Record<string, Record<string, Buffer>> = { prototype: {}, port: {} };
	for (const [side, url] of [
		['prototype', PROTOTYPE + '/system/Smart-Clearance%20DS%20v3.html'],
		['port', PORT + '/ds']
	] as const) {
		const context = await browser.newContext({ ...testInfo.project.use, viewport: { width: 1440, height: 16000 } });
		const page = await context.newPage();
		await open(page, url);
		// the parts that differ by design (pieces still to come) take one height on both pages, so every section compared
		// starts at the same offset and is drawn on the same pixel grid
		await page.addStyleTag({
			content:
				'.ds-hero { height: 640px !important; overflow: hidden !important; } #colour, #motion, #imagery, #cards, #nav { height: 1200px !important; overflow: hidden !important; }'
		});
		await page.waitForTimeout(200);
		for (const [id] of SECTIONS) shots[side][id] = await page.locator('#' + id).screenshot({ animations: 'disabled' });
		await context.close();
	}
	for (const [id, max] of SECTIONS) await compare(testInfo, '#' + id, shots.prototype[id], shots.port[id], max);
});
