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
	it('names the agents beside each moment, a person first in the third, and the agents its yes releases', () => {
		expect(f.how.moments.map((m) => [m.t, m.who.join('+')])).toEqual([
			['Spot it while there is time to sell', 'Data+Watcher+Vision'],
			['Price every exit, the bin included', 'Valuer+Router'],
			['Say yes once. The agents do the rest.', 'a person+Lister+Outreach+Negotiator+Paperwork+Impact']
		]);
		expect(f.how.moments[1].text).toMatch(/^Kiranas on a 2-free-with-10 scheme, /);
		expect(f.how.plan.released).toEqual(['Lister', 'Outreach', 'Negotiator', 'Paperwork', 'Impact']);
	});
	it("quotes the Watcher's alert, the Valuer's prices and the plan as the prototype's cards do", () => {
		expect(f.how.alert).toMatchObject({
			product: 'Masala Chips 150 g',
			where: "1,840 packs in a distributor's godown, Nagpur",
			atRisk: 1360,
			daysLeft: 47
		});
		expect(f.how.alert.gates.map((g) => `${g.app} ${g.has}/${g.need}`)).toEqual([
			'Blinkit 47/90',
			'Zepto 47/110',
			'Instamart 47/110'
		]);
		expect(f.how.prices.map((p) => [p.name, p.v, p.s, p.bin ? 'bin' : p.off ? 'off' : ''])).toEqual([
			['Kiranas', '₹17.50', 'up to 588 packs in 14 days', ''],
			['ExpireSoon', '₹15.00', "no limit; listed in the distributor's name", ''],
			['Staff sale', '₹12.00', 'up to 50 packs at the godown', 'off'],
			['Food bank', '−₹1.40', 'a donation reverses the GST credit', 'off'],
			['The bin', '−₹19.36', 'stock, GST credit, disposal and EPR', 'bin']
		]);
		expect(f.how.split).toEqual({ kiranas: 588, expiresoon: 772, shops: 31, total: 1360 });
		expect(f.how.plan).toMatchObject({ net: 21770 });
		expect(f.how.plan.lines.map((l) => [l.label, l.net])).toEqual([
			['588 packs to 31 kiranas', 10290],
			['772 packs on ExpireSoon', 11480]
		]);
	});
	it('sends the packs down the street and splits the batch by exit', () => {
		const ex = f.street.exits;
		expect(ex.map((e) => [e.name, e.line(e.packs)])).toEqual([
			['Kiranas', '588 packs · 31 shops'],
			['ExpireSoon', '772 packs · ₹14.20'],
			['Staff sale', 'priced, not needed'],
			['Food bank', 'priced, not needed'],
			['The bin', '−₹26,330 · not taken']
		]);
		// a taken exit's chip counts its packs in
		expect(ex[0].line(0)).toBe('0 packs · 31 shops');
		expect(ex.map((e) => e.per)).toEqual([
			'₹17.50 a pack, after the van',
			'₹14.20 a pack, countered from ₹15',
			'₹12 a pack, up to 50 packs',
			'−₹1.40 a pack: a donation reverses the GST credit',
			'−₹19.36 a pack'
		]);
		expect(ex.map((e) => [e.packs, e.total === undefined ? null : Math.round(e.total)])).toEqual([
			[588, 10290],
			[772, 10862],
			[0, null],
			[0, null],
			[0, -26330]
		]);
		expect(ex.map((e) => e.art)).toEqual([
			'kirana-plain',
			'marketplace-bag',
			'godown-plain',
			'donation-crate',
			'bin-plain'
		]);
		// about 50 packs a dot: 12 to the kiranas and 15 to the buyer, leaving interleaved
		expect(f.street.dots).toHaveLength(27);
		expect(f.street.dots.filter((d) => d === 'kirana')).toHaveLength(12);
		expect(f.street.dots.slice(0, 4)).toEqual(['expiresoon', 'kirana', 'expiresoon', 'kirana']);
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
