import { describe, expect, it } from 'vitest';
import { D, SHOPS_ALL } from '../src/lib/workspace/data';
import { fastForward } from '../src/lib/workspace/flow';
import { invoicesOfCase, journeyInvoices, kiranaInvoice, offerMath } from '../src/lib/workspace/model';
import { store } from '../src/lib/workspace/store.svelte';
import { kase } from '../src/lib/workspace/stub.svelte';
import { stubPage } from '../src/lib/workspace/ledger';
import { run } from './design3';

// The kiranas' tax invoices (SC-153) are design3's: core's kiranaInvoice gives money.js's figures for every kirana line
// and any order size; the story's invoices, numbered from the distributor's next as the shops order, are ledger.js's
// storyInvoices; and every history batch's are the ones ledger.js issued, in the order the shops ordered.
const W = run(
	'core/money.js',
	'core/papers.js',
	'core/data.js',
	'core/store.js',
	'core/flow.js',
	'core/world.js',
	'core/ledger.js'
);
const M = W.SC3_MONEY;
const L = W.SC3_LEDGER;
const plain = (o: unknown) => JSON.parse(JSON.stringify(o));

describe("the kiranas' invoices are design3's", () => {
	it('works an order out as money.js does', () => {
		const lines = [
			kase.lines.kirana,
			...L.HISTORY.map((c: { lines: { kirana: { price: number } } }) => c.lines.kirana)
		].filter((l: { price: number }) => l.price);
		for (const line of lines)
			for (const n of [1, 10, 12, 16, 24, 37, 100]) {
				const sku = { gst: kase.sku.gst, hsn: kase.sku.hsn };
				expect(kiranaInvoice(n, line, sku, D.rules.scheme)).toEqual(plain(M.kiranaInvoice(n, line, sku)));
			}
		// Ganesh ji's 24 packets: ₹518.40 less 16.67% is the ledger's ₹432, with ₹21.60 of GST, ₹454 to pay
		const g = kiranaInvoice(24, kase.lines.kirana, kase.sku, D.rules.scheme);
		expect([g.gross, g.discount, g.taxable, g.cgst, g.sgst, g.roundOff, g.total]).toEqual([
			518.4, 86.4, 432, 10.8, 10.8, 0.4, 454
		]);
		expect(offerMath(24, kase)).toMatchObject({ taxable: 432, tax: 21.6, pay: 454, sell: 720, margin: 266 });
	});
	it("numbers the story's as ledger.js does, from the distributor's next", () => {
		for (const stage of [6, 7, 9]) {
			fastForward(stage);
			const s = store.state;
			const mine = journeyInvoices(kase, s.hero.orders, D.day0, SHOPS_ALL);
			expect(plain(mine)).toEqual(plain(L.storyInvoices(s)));
			if (mine.length) expect([mine[0].no, mine[0].total]).toEqual(['RT/26-27/1279', 454]);
		}
	});
	it('gives every history batch the invoices ledger.js issued', () => {
		for (const c of L.HISTORY) {
			const page = stubPage(c.ref, D, kase, store.state);
			if (!page) continue;
			expect(plain(invoicesOfCase(page.c, null, D.day0))).toEqual(
				plain(c.kiranas.map((k: { invoice: unknown }) => k.invoice))
			);
		}
		expect(L.KIRANA_START).toEqual({ 'kirana.rakesh': 1164, 'kirana.lakshmi': 873 });
	});
});
