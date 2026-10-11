import { expect, type Locator, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { api } from './auth.ts';
import { as, hero, running, same, shows, story, WS, type Case } from './flow.ts';

// What the journey gained after SC-133 and SC-138's runs (SC-161), checked as Munchly Chips E2E reaches each: the
// statutory label photo (SC-147), the ExpireSoon listing and the kirana scheme on Execution (SC-151, SC-156), a tax
// invoice for every kirana order (SC-153), the Tally papers and the issued invoice's e-invoice (SC-148), the batch's
// Record and the distributor's Photos (SC-142, with SC-144 and SC-146's photo loader), the distributor's sums and
// effective prices (SC-141, SC-145), the Impact dashboard and the Command Center's card (SC-157), the console's Food by
// day and the web.app addresses (SC-149, SC-150), destroyed at the godown as Munchly's policy (SC-139), and the buttons
// that say what they are doing (SC-152). Munchly Chips Leftover E2E shares the steps up to the deal, so every check
// those steps make holds there too.

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** the parties' GSTINs as design3/core/data.js has them (SC-148): Munchly, Rakesh Traders, Agrawal Wholesale */
export const GSTIN = { munchly: '27AAKCM0000M1ZN', rakesh: '27ABHPR0000K1ZW', agrawal: '22AAGFA0000A1ZW' };
/** the invoice Munchly billed the chips on, three days after they were made (papers.js dispatchOf) */
export const DISPATCH = 'MFL/26-27/02417';
/** the chips' first kirana invoice in Rakesh Traders' series, after the history's 1164 to 1278 (SC-153) */
export const FIRST_KIRANA_INVOICE = 1279;

/** the card a labelled part of a screen sits in: the part is a direct child of its Card */
const cardOf = (page: Page, group: string) => page.getByRole('group', { name: group }).locator('xpath=..');

// ---------------------------------------------------------------------------------------------------------------
// SC-152: a button that calls the network says what it is doing. Every button the run presses is watched as its
// phase moves (data-phase on the kit's Button): what its face reads while it waits and once it is done, and any
// refusal it shows under it. A face with no words, or in a transparent ink (the old blank pill), is a finding.

type Pressed = { phase: string; text: string; note: string; ink: string; face: string; url: string };
const pressed: Pressed[] = [];

export async function watchButtons(page: Page) {
	await page.exposeBinding(
		'__e2eButton',
		({ page: p }, phase: string, text: string, note: string, ink: string, face: string) => {
			pressed.push({ phase, text, note, ink, face, url: p.url().replace(/^https?:\/\/[^/]+/, '') });
		}
	);
	await page.addInitScript(() => {
		const tell = (b: HTMLElement) => {
			const phase = b.getAttribute('data-phase') ?? '';
			if (!['busy', 'slow', 'done', 'error'].includes(phase)) return;
			// once its face has flown in (240 ms)
			setTimeout(() => {
				const face = b.querySelector<HTMLElement>('.btn-face:last-child') ?? b;
				const wrap = b.closest('.btn-wait');
				const note = wrap?.querySelector<HTMLElement>('.btn-note')?.innerText ?? '';
				// the words the button says it is doing, from its status line (the face can hold two words mid-flight)
				const said = wrap?.querySelector<HTMLElement>('[role=status]')?.textContent?.trim() ?? '';
				const w = window as unknown as { __e2eButton?: (...a: string[]) => void };
				const shows = (b.innerText || '').replace(/\s+/g, ' ').trim();
				w.__e2eButton?.(phase, said || shows, note, getComputedStyle(face).color, shows);
			}, 280);
		};
		new MutationObserver((list) => {
			for (const m of list)
				if (m.target instanceof HTMLElement && m.target.matches('button[data-phase]')) tell(m.target);
		}).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-phase'] });
	});
}

/** what the watched buttons said, into the run's figures and findings */
export function buttonsReport() {
	const run = running();
	const said = pressed.filter((p) => p.phase !== 'error');
	const words = [...new Set(said.filter((p) => p.phase !== 'done').map((p) => p.text))];
	const done = [...new Set(said.filter((p) => p.phase === 'done').map((p) => p.text))];
	run.figure(
		'Buttons seen waiting (SC-152)',
		`${said.filter((p) => p.phase !== 'done').length}: ${words.join(' · ') || 'none'}`
	);
	run.figure('Buttons seen done (SC-152)', done.join(' · ') || 'none');
	for (const p of pressed) {
		if (!p.face) run.find('warning', p.url, `a button in its ${p.phase} phase shows no words (SC-152)`);
		if (/rgba\(0, 0, 0, 0\)|transparent/.test(p.ink))
			run.find('warning', p.url, `a button's ${p.phase} face "${p.text}" is drawn in a transparent ink (SC-152)`);
		if (p.phase === 'error') run.find('warning', p.url, `a button was refused: "${p.text}" ${p.note}`.trim());
	}
	story('Blank waiting buttons (SC-152)', pressed.filter((p) => !p.face).length, 0);
}

// ---------------------------------------------------------------------------------------------------------------
// SC-150: the console names Munchly's workspace by its Firebase Hosting address

export async function consoleAddress(page: Page) {
	const head = norm(await page.locator('body').innerText());
	story(
		"Munchly's workspace address in the console (SC-150)",
		head.includes('munchly-smartclearance.web.app') ? 'munchly-smartclearance.web.app' : '(not shown)',
		'munchly-smartclearance.web.app'
	);
}

// ---------------------------------------------------------------------------------------------------------------
// SC-147: the label photo carries the statutory sticker, its codes readable: the pack's EAN-13 under GS1 India's 890
// and the batch's QR code (a GS1 Digital Link on id.munchly.example). Read back with Chromium's BarcodeDetector, as the
// label maker does, from the very file Rakesh uploads.

export async function labelCodes(page: Page, path: string) {
	const src = `data:image/webp;base64,${readFileSync(path).toString('base64')}`;
	const codes = await page.evaluate(async (src) => {
		// Chromium's BarcodeDetector, which TypeScript's DOM types do not carry yet
		type Detector = {
			new (o: { formats: string[] }): { detect(i: HTMLImageElement): Promise<{ format: string; rawValue: string }[]> };
			getSupportedFormats(): Promise<string[]>;
		};
		const B = (window as unknown as { BarcodeDetector?: Detector }).BarcodeDetector;
		if (!B) return null;
		const have = await B.getSupportedFormats();
		const formats = ['ean_13', 'qr_code', 'itf'].filter((f) => have.includes(f));
		const img = new Image();
		img.src = src;
		await img.decode();
		const found = await new B({ formats }).detect(img);
		return found.map((x) => ({ format: x.format, value: x.rawValue }));
	}, src);
	if (!codes) {
		running().find('note', '/photo', 'BarcodeDetector is not available in this browser: the label codes were not read');
		return;
	}
	const ean = codes.find((c) => c.format === 'ean_13')?.value;
	const qr = codes.find((c) => c.format === 'qr_code')?.value;
	running().figure('Label photo: EAN-13 (SC-147)', ean ?? '(not read)');
	running().figure('Label photo: QR code (SC-147)', qr ?? '(not read)');
	story('Label photo: a GS1 India EAN-13 (SC-147)', ean?.startsWith('890') ? 'read' : (ean ?? 'not read'), 'read');
	story(
		"Label photo: the batch's QR code (SC-147)",
		qr && qr.includes('id.munchly.example') && qr.includes(hero()) ? 'names the batch' : (qr ?? 'not read'),
		'names the batch'
	);
}

/** what Vision read from the label photo, against the batch's record (SC-147: the sticker still reads as the batch) */
export function visionRead(c: Case | null) {
	const r = c?.journey.photo.read;
	running().figure(
		'Vision read the label photo',
		r ? `${r.batch} · made ${r.mfg} · best before ${r.bestBefore} · MRP ₹${r.mrp} · matches ${r.matches}` : '(no read)'
	);
	const right =
		!!r &&
		r.batch === hero() &&
		/2026-05-18|18 May 2026/.test(r.mfg ?? '') &&
		/2026-11-18|18 Nov 2026/.test(r.bestBefore ?? '') &&
		r.mrp === 30 &&
		r.matches;
	story(
		'Vision read the sticker as the batch (SC-147)',
		right ? 'MF-2409-117, 18 May, 18 Nov, ₹30, matches' : 'off',
		'MF-2409-117, 18 May, 18 Nov, ₹30, matches'
	);
}

// ---------------------------------------------------------------------------------------------------------------
// SC-151 and SC-156: Execution's two channel cards, the ExpireSoon lot as buyers see it and the kirana scheme as the
// shops see it, each with its stops; the raw call and the push behind a button

/** the Lister's card at a state: live, awarded or collected (Listed, Bid, Won, Collected done in turn) */
export async function listerCard(page: Page, c: Case, at: 'live' | 'awarded' | 'collected') {
	const card = cardOf(page, 'The lot as buyers see it on ExpireSoon');
	await expect(card).toBeVisible();
	await expect(card).toContainText(at === 'live' ? /live|bid in|countered/ : at);
	const text = norm(await card.innerText());
	shows(`Lister card, ${at} (SC-151)`, text, [
		'Lister · ExpireSoon',
		c.journey.listing?.id ?? '(no listing)',
		'772 units',
		'MRP ₹30',
		'50% off',
		'Sold by Rakesh Traders, Nagpur',
		'Reserve ₹13.50',
		'Hidden in',
		...(at === 'live' ? [] : ['Won by Agrawal Wholesale', '₹14.20', '₹1,644 token paid'])
	]);
	const done = await card.locator('ol[aria-label="Where the lot stands"] li.done').count();
	story(`Lister card, ${at}: stops done (SC-151)`, done, { live: 1, awarded: 3, collected: 4 }[at]);
	const call = card.getByRole('button', { name: 'The API call' });
	await call.click();
	await expect(card.getByRole('region', { name: 'ExpireSoon request' })).toBeVisible();
	story(
		'Lister card: the API call behind its button (SC-151)',
		(await card.getByRole('region', { name: 'ExpireSoon response' }).count()) ? 'request and response' : 'request only',
		'request and response'
	);
	await running().done(`Execution: the ExpireSoon lot, ${at}, with its API call opened`);
	await call.click();
}

/** Outreach's card at a state: open, filled or delivered (Sent, First order, Closed, Van round) */
export async function schemeCard(page: Page, c: Case, at: 'open' | 'filled' | 'delivered') {
	const card = cardOf(page, 'The scheme as the shops see it');
	await expect(card).toBeVisible();
	await expect(card).toContainText(at);
	const text = norm(await card.innerText());
	const ordered = c.journey.orders.length;
	shows(`Scheme card, ${at} (SC-156)`, text, [
		'Outreach · 38 kiranas',
		'48-hour window',
		'588 packets',
		'₹21.60',
		'a pack · 2 free with every 10 · ₹18.00 effective',
		'From Rakesh Traders, Nagpur',
		'Offer window · 48 h',
		...(at === 'filled' ? [`${ordered} of 38 shops took every packet`, 'closed early'] : []),
		...(at === 'delivered' ? ["Delivered on Rakesh's van round", `588 packets to ${ordered} shops`] : [])
	]);
	const done = await card.locator('ol[aria-label="Where the scheme stands"] li.done').count();
	story(`Scheme card, ${at}: stops done (SC-156)`, done, { open: ordered ? 2 : 1, filled: 3, delivered: 4 }[at]);
	story(
		'Scheme card: no sample message on the card (SC-156)',
		(await card.locator('[lang=hi]').count()) ? 'a message shows' : 'behind its button',
		'behind its button'
	);
	const push = card.getByRole('button', { name: 'The push, as sent' });
	await push.click();
	await expect(card.locator('[lang=hi]')).toBeVisible();
	shows('Scheme card: the push, as sent (SC-156)', norm(await card.innerText()), [
		'one message to all 38 shops, each with its own name, in Hindi'
	]);
	await running().done(`Execution: the kirana scheme, ${at}, with the push as sent`);
	await push.click();
}

// ---------------------------------------------------------------------------------------------------------------
// SC-153: a tax invoice from Rakesh Traders for every kirana order, numbered in his series as the shop ordered: every
// packet at ₹21.60 less the scheme's 16.67%, so the taxable value is ₹18.00 a packet, with CGST and SGST at 2.5% each,
// the total to the rupee

type KiranaInvoice = NonNullable<Case['journey']['orders'][number]['invoice']>;
const no = (n: number) => `RT/26-27/${n}`;

/** the orders' invoices, in the order they were issued */
export const invoicesOf = (c: Case) =>
	c.journey.orders
		.map((o) => o.invoice)
		.filter((x): x is KiranaInvoice => !!x)
		.sort((a, b) => a.no.localeCompare(b.no));

/** each order's invoice, from the case: numbered in order, at ₹18.00 a packet taxable, 5% GST, to the rupee */
export function kiranaInvoices(c: Case) {
	const list = invoicesOf(c);
	story(
		'Kirana orders with a tax invoice (SC-153)',
		`${list.length} of ${c.journey.orders.length}`,
		`${c.journey.orders.length} of ${c.journey.orders.length}`
	);
	const sorted = list;
	story(
		'Kirana invoices numbered (SC-153)',
		sorted.length ? `${sorted[0].no} to ${sorted[sorted.length - 1].no}` : '(none)',
		`${no(FIRST_KIRANA_INVOICE)} to ${no(FIRST_KIRANA_INVOICE + c.journey.orders.length - 1)}`
	);
	const off = list.filter(
		(x) =>
			r2(x.taxable) !== r2(x.units * 18) ||
			r2(x.cgst) !== r2(x.taxable * 0.025) ||
			r2(x.sgst) !== r2(x.taxable * 0.025) ||
			x.total !== Math.round(x.taxable * 1.05)
	);
	story('Kirana invoices off the scheme (SC-153)', off.map((x) => x.no).join(', ') || 'none', 'none');
	const taxable = r2(list.reduce((t, x) => t + x.taxable, 0));
	same('Kirana invoices: taxable, the scheme line (SC-153)', taxable, 10584);
	running().figure('Kirana invoices: GST collected', `₹${r2(list.reduce((t, x) => t + x.tax, 0))}`);
	running().figure('Kirana invoices: total', money(list.reduce((t, x) => t + x.total, 0)));
	return list;
}

/** a kirana reads its own order and opens the tax invoice Rakesh issued it */
export async function kiranaOrderPage(page: Page, member: string, inv: KiranaInvoice) {
	await as(page, member, `/offer/${hero()}`, `reads its order and opens its tax invoice ${inv.no}`);
	const main = page.locator('#main');
	await expect(main).toContainText('Tax invoice');
	shows('Kirana order page (SC-153)', norm(await main.innerText()), [
		inv.no,
		'Rakesh Traders issued it',
		money(inv.total),
		'as a discount on the invoice'
	]);
	await running().done(`The shop's order, on its invoice ${inv.no}`);
	await main
		.getByRole('button', { name: /Tax invoice/ })
		.first()
		.click();
	const sheet = page.getByRole('dialog');
	await expect(sheet).toContainText('Tax Invoice');
	shows('Kirana tax invoice (SC-153)', norm(await sheet.innerText()), [
		inv.no,
		GSTIN.rakesh,
		'Unregistered',
		inv.shop.name,
		'CGST',
		'SGST',
		`${inv.units}`
	]);
	await running().done(`Kirana tax invoice ${inv.no}: ${inv.units} packets, ${money(inv.total)}`);
	await page.keyboard.press('Escape');
}

/** a kirana invoice's PDF, as Paperwork laid it out, from the link its sheet opens */
export async function kiranaPdf(inv: KiranaInvoice) {
	const { url } = await api<{ url: string }>('workspace', 'rakesh', `${WS}/documents/${hero()}/kirana.${inv.kirana}`);
	const pdf = await fetch(url);
	const head = new TextDecoder().decode(new Uint8Array(await pdf.arrayBuffer()).slice(0, 4));
	same(
		`Kirana invoice ${inv.no} PDF (SC-153)`,
		`${pdf.status} ${pdf.headers.get('content-type')} ${head}`,
		'200 application/pdf %PDF'
	);
}

// ---------------------------------------------------------------------------------------------------------------
// SC-148: the GST papers in Tally's layout. The issued tax invoice carries its e-invoice, the IRN worked out from the
// seller's GSTIN, the year and the number as the portal does; Munchly's credit note names the invoice it billed the
// batch on, and adjusts no GST

/** the IRN of an invoice Rakesh issued: SHA-256 of his GSTIN, the financial year, INV and its number */
export const irnOf = (invoiceNo: string) =>
	createHash('sha256').update(`${GSTIN.rakesh}2026-27INV${invoiceNo}`).digest('hex');

export async function issuedInvoice(page: Page, invoiceNo: string) {
	const text = norm(await page.locator('#main').innerText());
	shows('Tax invoice, issued (SC-148)', text, [
		'(ORIGINAL FOR RECIPIENT)',
		'e-Invoice',
		irnOf(invoiceNo),
		'Ack No.',
		'Signed QR code from the Invoice Registration Portal',
		GSTIN.rakesh,
		GSTIN.agrawal,
		'Consignee (Ship to)',
		'Buyer (Bill to)',
		'HSN/SAC',
		'Round off'
	]);
	story('Tax invoice: not a draft once issued (SC-148)', /\(DRAFT, for/.test(text) ? 'draft' : 'original', 'original');
}

export async function creditNote(page: Page) {
	shows('Price-support credit note (SC-148)', norm(await page.locator('#main').innerText()), [
		GSTIN.munchly,
		GSTIN.rakesh,
		'Against our invoice',
		DISPATCH,
		'This is a Computer Generated Document'
	]);
}

/** the pack's own card for each paper: an invoice Rakesh issued reads issued (SC-148) */
export async function packStatus(page: Page, type: string) {
	const card = page.getByRole('button', { name: new RegExp(type) }).first();
	return norm(await card.innerText());
}

/** Priya's pack: the kiranas' invoices as one card, opening the sales register (SC-153) */
export async function salesRegister(page: Page, list: KiranaInvoice[]) {
	const card = page.getByRole('button', { name: /Tax invoices to kiranas/ }).first();
	await expect(card).toBeVisible();
	await card.click();
	await expect(page.locator('#main')).toContainText('Sales Register');
	const text = norm(await page.locator('#main').innerText());
	const total = r2(list.reduce((t, x) => t + x.total, 0));
	shows('Sales register (SC-153)', text, [
		'Sales Register',
		`${list.length} invoices`,
		no(FIRST_KIRANA_INVOICE),
		no(FIRST_KIRANA_INVOICE + list.length - 1),
		'10,584.00',
		total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	]);
	await running().done(`The sales register: ${list.length} kirana invoices`);
}

// ---------------------------------------------------------------------------------------------------------------
// SC-142, SC-144, SC-146: the batch's Record (the photos sent for it, the audit trail, the yeses), and the photos
// loaded under the kit's skeleton, never black and never failed

/** every photo in a part of the screen has landed: drawn, its skeleton gone, none failed */
export async function photosLoaded(name: string, scope: Locator) {
	const imgs = scope.locator('img');
	await expect.poll(() => imgs.count(), { message: `${name}: a photo`, timeout: 20_000 }).toBeGreaterThan(0);
	await expect
		.poll(
			() =>
				imgs.evaluateAll((list) =>
					(list as HTMLImageElement[]).every(
						(i) => i.complete && i.naturalWidth > 0 && getComputedStyle(i).opacity === '1'
					)
				),
			{ message: `${name}: every photo drawn`, timeout: 30_000 }
		)
		.toBe(true);
	const failed = await scope.locator('.photo-failed').count();
	const skeletons = await scope.locator('.skeleton').count();
	story(
		`${name}: photos loaded (SC-144)`,
		failed ? `${failed} failed` : skeletons ? `${skeletons} still loading` : 'every photo drawn',
		'every photo drawn'
	);
}

/** Priya's Record of the batch: on its page in the ledger and on her batch page */
export async function record(page: Page) {
	const ref = hero();
	const main = page.locator('#main');
	await as(
		page,
		'priya',
		`/report/${ref}?tab=record`,
		"reads the batch's record: its photos, its audit trail, its yeses"
	);
	await expect(main).toContainText('Photos sent for this batch');
	await photosLoaded('Record', main.locator('.rec-photos'));
	const text = norm(await main.innerText());
	shows('Record: the label photo (SC-142)', text, [
		'Photos sent for this batch',
		'Label photo',
		'Sent by Rakesh',
		`Vision read`,
		ref,
		'Matches the export'
	]);
	const trail = norm(await page.locator('.rec-trail').innerText());
	const steps = Number(text.match(/Audit trail (\d+) steps?/)?.[1] ?? 0);
	running().figure('Record: audit trail', text.match(/Audit trail [^·]+· \d+ by people/)?.[0] ?? '(no count)');
	expect.soft(steps, 'Record: audit trail steps').toBeGreaterThan(10);
	shows('Record: the audit trail (SC-142)', trail, [
		'Priya',
		'Rakesh',
		['Watcher', 'flagged'],
		['kiranas', 'Ordered'],
		['Agrawal', 'ExpireSoon']
	]);
	const yeses = norm(await main.getByText('The yeses').locator('xpath=..').innerText());
	shows('Record: the yeses (SC-142)', yeses, [
		'Priya Deshmukh',
		['Approved the plan', 'approved the plan'],
		['Reviewed', 'reviewed']
	]);
	await running().done('Record: the photos sent, the audit trail and the yeses');

	// the photo opened whole
	await main.locator('.rec-photos button').first().click();
	const sheet = page.getByRole('dialog');
	await expect(sheet).toBeVisible();
	await photosLoaded('Record: the photo opened whole', sheet);
	await running().done('Record: the label photo, opened whole');
	await page.keyboard.press('Escape');

	// only the people's steps, then the trail as CSV
	await page.getByRole('group', { name: 'Whose steps' }).getByRole('button', { name: 'People' }).click();
	// as many rows as the trail's count of people's steps
	const byPeople = Number(text.match(/(\d+) by people/)?.[1] ?? -1);
	const shown = await page.locator('.rec-trail .rec-row').count();
	story("Record: People shows only the people's steps (SC-142)", shown, byPeople);
	await running().done("Record: only the people's steps");
	const [file] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Download the audit trail (CSV)' }).click()
	]);
	const path = running().keep(file.suggestedFilename());
	await file.saveAs(path);
	const lines = readFileSync(path, 'utf8').trim().split('\n').length - 1;
	running().figure('Record: audit trail CSV', `${file.suggestedFilename()}, ${lines} rows`);
	expect.soft(lines, 'Record: audit trail CSV rows').toBeGreaterThanOrEqual(steps);

	// and the operator's batch page has the same tab
	await as(page, 'priya', `/execution/${ref}`, "opens the Record from the batch's own page");
	await page.locator('.bh-tabs').getByRole('button', { name: 'Record' }).click();
	await expect(main).toContainText('Audit trail');
	await photosLoaded("Record on the batch's page", main.locator('.rec-photos'));
	await running().done("The batch's page: its Record tab");
}

// ---------------------------------------------------------------------------------------------------------------
// SC-157: the Ledger's Impact reading as a dashboard, and the Impact card on the Command Center

export async function impactDashboard(page: Page, kept: string, co2: string, quarter: string) {
	const main = page.locator('#main');
	await as(page, 'priya', '/report?reading=impact', 'reads the Impact dashboard for the quarter');
	await expect(main).toContainText('Food, by week');
	const text = norm(await main.innerText());
	shows('Impact dashboard (SC-157)', text, [
		'Kept out of landfill',
		'Destroyed',
		'CO₂e avoided',
		'Food, by week',
		'Where the kilos went',
		'By distributor',
		'Rakesh Traders',
		kept,
		co2
	]);
	await running().done('Ledger: the Impact dashboard');
	await main.getByRole('button', { name: 'Show as a table' }).first().click();
	const weeks = await main.locator('.fw-table tbody tr').count();
	running().figure('Impact dashboard: weeks in the table', weeks);
	expect.soft(weeks, 'Impact dashboard: Food by week as a table').toBeGreaterThan(0);
	await running().done('Ledger: Food, by week, as a table');
	await main.getByRole('group', { name: 'Group by' }).getByRole('button', { name: 'Product' }).click();
	await expect(main).toContainText('By product');
	shows('Impact dashboard by product (SC-157)', norm(await main.innerText()), ['Masala Chips']);
	await running().done('Ledger: the kilos by product');

	await as(page, 'priya', '/command', "reads the Command Center's Impact card");
	const card = page.locator('.imc');
	await expect(card).toBeVisible();
	shows('Command Center Impact card (SC-157)', norm(await card.innerText()), [
		`Impact · ${quarter}`,
		kept,
		co2,
		'kept out of landfill'
	]);
	await running().done("Command Center: the quarter's Impact card");
	await card.getByRole('button', { name: 'Open the ledger' }).click();
	await expect(page).toHaveURL(/\/report\?reading=impact/);
	await expect(main).toContainText('Food, by week');
	story('Impact card opens the ledger on Impact (SC-157)', new URL(page.url()).search, '?reading=impact');
}

// ---------------------------------------------------------------------------------------------------------------
// SC-149: the console's Overview draws Food by day, once (the Recovered figure keeps its own sparkline)

export async function consoleFood(page: Page) {
	const card = page.locator('.cs-ov-card', { hasText: 'Food, by day' });
	await expect(card).toBeVisible();
	const text = norm(await card.innerText());
	shows('Console: Food, by day (SC-149)', text, [
		'Food, by day',
		'kept out of landfill',
		'destroyed',
		'Kept out of landfill (sold or given)'
	]);
	story(
		"Console: no second 'Recovered, by day' chart (SC-149)",
		(await page.getByText('Recovered, by day').count()) ? 'still drawn' : 'gone',
		'gone'
	);
	await running().done('Console Overview: Food, by day');
	await card.getByRole('button', { name: 'Show as a table' }).click();
	const rows = await card.locator('tbody tr').count();
	running().figure('Console: Food by day, days in the table', rows);
	await running().done('Console Overview: Food, by day, as a table');
}

// ---------------------------------------------------------------------------------------------------------------
// SC-141 and SC-145: the distributor's figures add up as written

/** a cleared batch's sum line, "₹A credited + ₹B sold = ₹C" (Batches) or "₹B sold + ₹A credited = ₹C" (Orders) */
export function sumAddsUp(name: string, text: string) {
	const n = (s: string) => Number(s.replace(/[₹,]/g, ''));
	const m = text.match(/₹([\d,]+) (credited|sold) \+ ₹([\d,]+) (credited|sold) = ₹([\d,]+)/);
	if (!m) {
		story(`${name}: its sum (SC-145)`, '(no sum line)', 'adds up');
		return;
	}
	running().figure(`${name}: its sum`, m[0]);
	story(`${name}: its sum (SC-145)`, n(m[1]) + n(m[3]) === n(m[5]) ? 'adds up' : m[0], 'adds up');
}

/** the distributor's sum card: what his cleared batches cost him = what he sold + what Munchly credited him (SC-145) */
export async function sumCard(page: Page, name: string, here: 'Orders' | 'Batches') {
	const n = (s: string) => Number(s.replace(/[₹,]/g, ''));
	const card = page.locator('.pt-sum').locator('xpath=..');
	await expect(card).toBeVisible();
	const text = norm(await card.innerText());
	shows(`${name}: the sum card (SC-145)`, text, [
		['cleared batches add up', 'cleared batch adds up'],
		'this page',
		here === 'Orders' ? 'credited you' : 'you sold',
		'So you ended whole on every batch'
	]);
	const split = (await page.locator('.pt-split').getAttribute('aria-label')) ?? '';
	const m = split.match(/(₹[\d,]+) sold and (₹[\d,]+) credited, of (₹[\d,]+)/);
	running().figure(`${name}: the sum card`, split || '(none)');
	story(`${name}: sold + credited = cost (SC-145)`, m && n(m[1]) + n(m[2]) === n(m[3]) ? 'adds up' : split, 'adds up');
}
