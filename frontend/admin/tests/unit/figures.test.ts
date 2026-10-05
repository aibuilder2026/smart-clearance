import { describe, expect, it } from 'vitest';
import catalog from '#lib/seed/catalog.json';
import showcase from '#lib/seed/showcase.json';
import type { Catalog, Showcase } from '#lib/api/types.ts';
import { figures } from '#lib/landing/figures.ts';

// the landing page's copy, as the prototype says it (design3/site/site.jsx over design3/core): golden strings
const f = figures(showcase as Showcase, catalog as Catalog);

describe('the landing page figures', () => {
	it('tells one illustrative batch and names no client', () => {
		expect(f.atRisk).toBe(1360);
		expect(f.daysLeft).toBe(47);
		expect(f.shops).toBe(31);
		const text = JSON.stringify(f);
		for (const name of ['Munchly', 'munchly', 'MF-2409', 'Agrawal', 'Raipur', 'Rakesh', 'Priya'])
			expect(text).not.toContain(name);
	});
	it('names the agents under each of the three steps, a person first in the third', () => {
		expect(f.steps.map((s) => [s.t, s.who.join('+')])).toEqual([
			['Spot it in time', 'Data+Watcher+Vision'],
			['Price every exit', 'Valuer+Router'],
			['Say yes once', 'a person+Lister+Outreach+Negotiator+Paperwork+Impact']
		]);
	});
	it('prices the five exits', () => {
		expect(f.exits.map((e) => [e.name, e.line])).toEqual([
			['Kiranas', '588 packs · 31 shops'],
			['ExpireSoon', '772 packs · ₹14.20'],
			['Staff sale', 'priced, not needed'],
			['Food bank', 'priced, not needed'],
			['The bin', '−₹26,330 · not taken']
		]);
		expect(f.exits.map((e) => e.detail)).toEqual([
			'588 packs to 31 kiranas at ₹18 a pack, 2 free with every 10: ₹10,290 after the van.',
			'772 packs to one buyer on ExpireSoon at ₹14.20, countered from ₹15: ₹10,862 after the listing fee.',
			'₹12 a pack for up to 50 packs at the Nagpur godown. Not needed this time.',
			"−₹1.40 a pack, because a donation reverses the GST credit. Kept for food that can't sell.",
			'−₹19.36 a pack: the stock, the GST credit, disposal and EPR, −₹26,330 for the batch. Not taken.'
		]);
	});
	it('shows what the batch came to, each figure with its arithmetic', () => {
		expect(f.results.map((r) => [Math.round(r.n), r.l, r.w])).toEqual([
			[
				21152,
				'recovered',
				'₹10,290 from 31 kiranas, after the van, and ₹10,862 from a marketplace buyer, after the listing fee'
			],
			[
				25722,
				'better than the bin',
				"−₹608 on the brand's books with the plan, price support included, against −₹26,330 to destroy it"
			],
			[0, 'cartons destroyed', '1,360 packs sold on tax invoices, so the ₹1,224 GST credit stays']
		]);
	});
	it('puts the agents at their stops, a person at the approval, and says what each stop did', () => {
		expect(f.stops.map((s) => s.who.join('+'))).toEqual([
			'Data',
			'Watcher',
			'Vision',
			'Valuer',
			'Router',
			'a person',
			'Lister+Outreach+Negotiator',
			'Paperwork',
			'Impact'
		]);
		expect(f.stops.map((s) => s.done)).toEqual([
			'stock export mapped · permission given',
			"1,360 packs won't sell in the 47 days left",
			'label read · the date matches',
			'five exits priced · the bin costs ₹26,330',
			'588 packs to 31 kiranas · 772 to one buyer',
			'approved in one tap · ₹21,770 on screen',
			'listed · offers sent · a bid countered to ₹14.20',
			'invoice, credit note and GST memo drafted',
			'₹21,152 recovered · 218 kg kept out of landfill'
		]);
	});
	it('lists what it works with, as the board shows them', () => {
		expect(f.connectors.map((c) => c.name + (c.status === 'soon' ? ' · soon' : ''))).toEqual([
			'Distributor stock exports',
			'Tally',
			'BigQuery',
			'Google Workspace',
			'ExpireSoon',
			'GST e-invoice',
			'WhatsApp Business · soon'
		]);
	});
	it("offers the plans in the reader's words", () => {
		expect(f.plans.map((p) => p.scope)).toEqual([
			['One distributor', 'Up to 10 SKUs', '90 days'],
			['Every distributor in a region', 'All ten agents', 'Your own sign-in'],
			['Every region', 'Your SSO and data residency', 'A named team']
		]);
	});
});
