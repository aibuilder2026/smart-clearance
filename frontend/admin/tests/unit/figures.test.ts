import { describe, expect, it } from 'vitest';
import catalog from '@smart-clearance/api/seed/catalog.json';
import showcase from '@smart-clearance/api/seed/showcase.json';
import type { Catalog, Showcase } from '@smart-clearance/api/site';
import { figures } from '#lib/landing/figures.ts';
import { ORDER } from '#lib/landing/scene.ts';

// the landing page's copy, as the prototype says it (design3/site/site.jsx over design3/core): golden strings
const f = figures(showcase as Showcase, catalog as Catalog);

describe('the landing page figures', () => {
	it('tells one illustrative batch and names no client', () => {
		expect(f.atRisk).toBe(1360);
		expect(f.daysLeft).toBe(47);
		expect(f.shops).toBe(31);
		const text = JSON.stringify(f);
		for (const name of ['Munchly', 'munchly', 'MF-2409', 'Agrawal', 'Raipur', 'Rakesh', 'Priya', 'Ganesh'])
			expect(text).not.toContain(name);
	});
	it('puts every agent at its post on the table, the person on the phone, and says what each did (SC-60)', () => {
		expect(ORDER.map((id) => `${f.agents[id].name} ${f.agents[id].where}: ${f.agents[id].icon}`)).toEqual([
			'Data at the godown: database',
			'Watcher at the godown: eye',
			'Vision at the godown: scan-line',
			'Valuer at the godown: scale',
			'Router at the godown: route',
			'You on your phone: hand',
			'Outreach at the kiranas: send',
			"Lister at the buyer's bay: store",
			"Negotiator at the buyer's truck: gavel",
			'Paperwork on your phone: file-text',
			'Impact at the landfill: leaf'
		]);
		expect(ORDER.map((id) => f.agents[id].did)).toEqual([
			'1,840 packs in stock, selling 12 a day',
			"1,360 packs won't sell in the 47 days left",
			'Read the label: the date matches',
			'Five exits priced; the bin would cost −₹26,330',
			'588 to 31 kiranas, 772 to one buyer',
			'Approved in one tap, ₹21,770 on screen',
			'588 packs to 31 kiranas, buy 10 get 2 free',
			"772 packs listed in the distributor's name",
			'Countered a bid to ₹14.20 a pack',
			'The invoice, credit note and GST memo, drafted',
			'218 kg kept out of landfill'
		]);
		expect(
			Object.values(f.agents)
				.filter((a) => a.human)
				.map((a) => a.name)
		).toEqual(['You']);
	});
	it('shows what the card in focus says live, the phone, the tags and the result', () => {
		expect(f.scene.lede).toMatch(
			/^1,360 packs of masala chips that won't sell in the 47 days they have left, on the table\./
		);
		expect(f.scene.prices.map((p) => [p.name, p.net, p.dot])).toEqual([
			['Kiranas', 17.5, 'kirana'],
			['ExpireSoon', 15, 'expiresoon'],
			['Staff sale', 12, 'staff'],
			['Food bank', -1.4, 'foodbank'],
			['The bin', -19.36, 'bin']
		]);
		expect(f.scene).toMatchObject({
			units: 1840,
			sellPerDay: 12,
			daysLeft: 47,
			product: 'Masala Chips 150 g',
			atRisk: 1360,
			kiranas: 588,
			kiranaNet: 10290,
			buyer: 772,
			buyerNet: 11480,
			shops: 31,
			price: 14.2,
			bid: 13,
			token: 1644,
			reserve: 13.5,
			buy: 10,
			free: 2,
			planNet: 21770,
			pctMRP: 53,
			offerTitle: 'आज का खास ऑफर'
		});
		expect(Math.round(f.scene.kg)).toBe(218);
		expect(Math.round(f.scene.swing)).toBe(26340);
		expect(Math.round(f.scene.support)).toBe(8768);
		expect(Math.round(f.scene.net)).toBe(21152);
		expect(f.scene.gates.map((g) => `${g.app} ${g.has}/${g.need}`)).toEqual([
			'Blinkit 47/90',
			'Zepto 47/110',
			'Instamart 47/110'
		]);
		expect(f.scene.result).toBe('₹21,152 recovered, instead of −₹26,330 to destroy it');
		expect(f.scene.after.map((a) => a.name)).toEqual(['Outreach', 'Lister', 'Negotiator', 'Paperwork', 'Impact']);
	});
	it('names the agents beside each chapter, a person first in the third, and the agents the yes releases', () => {
		expect(f.chapters.map((c) => [c.id, c.tone, c.who.join('+')])).toEqual([
			['watch', 'green', 'Data+Watcher+Vision'],
			['price', 'sunken', 'Valuer+Router'],
			['yes', 'amber', 'a person'],
			['work', 'night', 'Lister+Outreach+Negotiator+Paperwork+Impact']
		]);
		expect(f.chapters[1].lede).toMatch(/^Kiranas on a 2-free-with-10 scheme, /);
		expect(f.chapters[2].person).toBe(true);
		expect(f.chapters[3].wide).toBe(true);
		expect(f.how.plan.released).toEqual(['Lister', 'Outreach', 'Negotiator', 'Paperwork', 'Impact']);
	});
	it("quotes the Watcher's alert, the Valuer's prices and the plan as the prototype's cards do", () => {
		expect(f.how.alert).toMatchObject({
			product: 'Masala Chips 150 g',
			where: "1,840 packs in a distributor's godown, Nagpur",
			atRisk: 1360,
			daysLeft: 47
		});
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
	it('composes the kirana offer without a client in it, and shows the work after the yes', () => {
		expect(f.how.work.offer).toEqual({
			title: 'आज का खास ऑफर',
			body: 'नमस्ते! Masala Chips 150 g पर आज खास ऑफर: 10 पैकेट लो, 2 मुफ़्त. Best before 18 Nov 2026. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें.'
		});
		expect(f.how.work).toMatchObject({
			packPrice: 21.6,
			mrp: 30,
			buy: 10,
			free: 2,
			shops: 31,
			kiranas: 588,
			listed: 772,
			reserve: 13.5,
			bid: 13,
			price: 14.2,
			token: 1644,
			itcRetained: 1224
		});
		expect(Math.round(f.how.work.support)).toBe(8768);
	});
	it("posts Impact's ledger for the batch, each line with its arithmetic", () => {
		expect(f.ledger.map((l) => [l.k, Math.round(l.v), l.kind])).toEqual([
			['Recovered, net', 21152, 'money'],
			['Better than the bin', 25722, 'money'],
			['GST input credit kept', 1224, 'money'],
			['Kept out of landfill', 218, 'kg'],
			['Cartons destroyed', 0, 'zero']
		]);
		expect(f.ledger.map((l) => l.s)).toEqual([
			'₹10,290 from 31 kiranas after the van, ₹10,862 from a marketplace buyer after the fee',
			'against −₹26,330 to destroy the stock: the goods, the GST credit, disposal and EPR',
			'goods supplied under tax invoices, so the Section 17(5)(h) reversal does not apply',
			'544 kg CO₂e, indicative',
			'1,360 packs sold on tax invoices'
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
