import { describe, expect, it } from 'vitest';
import catalog from '#lib/seed/catalog.json';
import showcase from '#lib/seed/showcase.json';
import type { Catalog, Showcase } from '#lib/api/types.ts';
import { figures } from '#lib/landing/figures.ts';

// the landing page's copy, as the prototype says it (design3/site/site.jsx over design3/core): golden strings
const f = figures(showcase as Showcase, catalog as Catalog);

describe('the landing page figures', () => {
	it('names the batch and its stock', () => {
		expect(f.batchId).toBe('MF-2409-117');
		expect(f.atRisk).toBe(1360);
		expect(f.daysLeft).toBe(47);
		expect(f.shops).toBe(31);
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
			'772 packs to Agrawal Wholesale in Raipur at ₹14.20, countered from ₹15: ₹10,862 after the listing fee.',
			'₹12 a pack for up to 50 packs at the Nagpur godown. Not needed this time.',
			"−₹1.40 a pack, because a donation reverses the GST credit. Kept for food that can't sell.",
			'−₹19.36 a pack: the stock, the GST credit, disposal and EPR, −₹26,330 for the batch. Not taken.'
		]);
	});
	it('keeps the ledger', () => {
		expect(f.kl.net).toBe(10290);
		expect(Math.round(f.esNet)).toBe(10862);
		expect(Math.round(f.actual.net)).toBe(21152);
		expect(f.actual.swing).toBe(25722);
		expect(Math.round(f.actual.pnl)).toBe(-608);
		expect(f.plan.soldUnits).toBe(1360);
		expect(f.plan.itcRetained).toBe(1224);
	});
	it('puts the agents at their stops, and a person at the approval', () => {
		expect(f.stops.map((s) => (s.human ? 'person' : s.agents.join('+')))).toEqual([
			'Data',
			'Watcher',
			'Vision',
			'Valuer',
			'Router',
			'person',
			'Lister+Outreach+Negotiator',
			'Paperwork',
			'Impact'
		]);
	});
	it('tells the story through the cast', () => {
		expect(f.cast.map((c) => [c.person.name, c.role, c.did])).toEqual([
			['Rakesh bhai', 'Distributor, Nagpur', 'Made whole by a ₹8,768 credit note'],
			['Ganesh ji', 'Kirana, Itwari', '2 free with every 10'],
			['Anita Rao', 'Finance, Munchly', 'Credit note and GST memo drafted'],
			['Vikram Sethi', 'Sustainability, Munchly', '218 kg kept out of landfill']
		]);
		expect(f.returnDay).toBe('29 Oct');
	});
	it("offers the plans in the reader's words", () => {
		expect(f.plans.map((p) => p.scope)).toEqual([
			['One distributor', 'Up to 10 SKUs', '90 days'],
			['Every distributor in a region', 'All ten agents', 'Your own sign-in'],
			['Every region', 'Your SSO and data residency', 'A named team']
		]);
	});
});
