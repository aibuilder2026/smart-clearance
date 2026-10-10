import { describe, expect, it } from 'vitest';
import { dispatchOf, einvoice, fy, qr, sha256, words } from '../src/lib/workspace/papers';
import { run } from './design3';

// What the GST papers print beyond their figures (SC-148) is design3/core/papers.js's: core's port gives the same IRN,
// acknowledgement and signed QR text, the same words, years and dispatch invoices, and the same QR codes, module for
// module, for every version the papers' QR codes reach.
const W = run('core/papers.js');
const P = W.SC3_PAPERS;

describe("the papers' figures are papers.js's", () => {
	it('hashes as SHA-256', () => {
		expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
		for (const s of ['27ABHPR0000K1ZW2026-27INVINV/26-27/0931', '₹ नमस्ते', '']) expect(sha256(s)).toBe(P.sha256(s));
	});
	it('writes amounts in words, years and dispatch invoices', () => {
		for (const n of [0, 7, 548, 8768, 11510, 10962.4, 2441535.98, 123456789]) expect(words(n)).toBe(P.words(n));
		expect(words(11510)).toBe('INR Eleven Thousand Five Hundred Ten Only');
		for (const d of ['2026-10-05', '2026-03-31', '2026-04-01']) {
			expect(fy(d)).toBe(P.fy(d));
			expect(fy(d, true)).toBe(P.fy(d, true));
		}
		for (const b of [
			{ id: 'MF-2409-117', mfg: '2026-05-18' },
			{ id: 'MF-2407-116', mfg: '2026-03-31' }
		])
			expect(dispatchOf(b)).toEqual(P.dispatchOf(b));
		expect(dispatchOf({ id: 'MF-2409-117', mfg: '2026-05-18' }).no).toBe('MFL/26-27/02417');
	});
	it('gives an issued invoice its e-invoice', () => {
		const inv = { no: 'INV/26-27/0931', date: '2026-10-05', issuedAt: '2026-10-05T11:00', total: 11510, hsn: '2005' };
		const seller = { gstin: '27ABHPR0000K1ZW' },
			buyer = { gstin: '22AAGFA0000A1ZW' };
		const e = einvoice(inv, seller, buyer);
		expect(e).toEqual(P.einvoice(inv, seller, buyer));
		expect(e.irn).toBe(sha256('27ABHPR0000K1ZW2026-27INVINV/26-27/0931'));
		expect(e.ackNo).toMatch(/^1126\d{11}$/);
		expect(e.signed.split('.')).toHaveLength(3);
	});
	it('draws QR codes module for module', () => {
		const texts = ['https://id.munchly.example/01/18900000001016/10/MF-2409-117?17=261118'];
		for (let n = 1; n <= 700; n += 61) texts.push('x'.repeat(n) + 'é₹' + n);
		for (const t of texts)
			for (const level of ['L', 'M'] as const) {
				const mine = qr(t, level),
					theirs = P.qr(t, level);
				expect([mine.version, mine.mask]).toEqual([theirs.version, theirs.mask]);
				expect(mine.modules).toEqual(theirs.modules);
			}
	});
});
