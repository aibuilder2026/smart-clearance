// The swing, explained (SC-195, option A, How it adds up; screens/brand.jsx swingOf): for the batch a card shows, what
// destroying it would cost, what each exit did, the P&L either way and the swing between them. The card's figures are
// money.js's (the plan's, or once the lines are done actualNet's on what each channel took); each exit's line takes the
// units it took at the plan's own price and costs a pack (the ExpireSoon lot at the counter, its fee once), and what
// was not paid is the swing less the net recovered, so the bridge always lands on the card's P&L.
import type { CaseData, WriteOff } from './types';

export type SwingExit = {
	id: string;
	name: string;
	units: number;
	price: number;
	packPrice: number | null;
	charged: number;
	cost: number;
	itcLoss: number;
	net: number;
	perPack: number;
};
export type Swing = {
	wo: WriteOff;
	exits: SwingExit[];
	net: number;
	pnl: number;
	swing: number;
	/** the stock's book cost, which leaves the books either way */
	book: number;
	units: number;
	sku: CaseData['sku'];
	batch: CaseData['batch'];
	sold: number;
	given: number;
	/** the packs no exit took */
	left: number;
	itcLost: number;
	/** what destroying would have cost beyond the stock (its credit, disposal, EPR) and nobody paid */
	notPaid: number;
	/** what the packs left still cost, beyond their book cost */
	leftCost: number;
	/** the exits the Router left out, and why */
	out: { id: string; name: string; short: string; reason: string }[];
};

const NAMES: Record<string, string> = {
	kirana: 'Kirana scheme',
	staff: 'Staff sale',
	foodbank: 'Food bank',
	expiresoon: 'ExpireSoon'
};
const r2 = (n: number) => Math.round(n * 100) / 100;

export function swingOf(c: CaseData, posted: boolean): Swing {
	const P = c.plan;
	const wo = P.writeOff;
	const delta = posted ? c.actual.delta || 0 : 0;
	const took = posted && c.realised ? new Map(c.realised.lines.map((l) => [l.id, l.units])) : null;
	const exits = P.lines
		.filter((l) => l.units > 0 && l.id !== 'writeoff')
		.map((l): SwingExit | null => {
			const units = took ? (took.get(l.id) ?? 0) : l.units;
			if (!units) return null;
			const es = l.id === 'expiresoon';
			const price = es && delta && c.counter ? c.counter.price : l.price;
			const cost = es ? l.cost : r2((l.cost / l.units) * units);
			const itcLoss = r2((l.itcLoss / l.units) * units);
			const net = r2(units * price - cost - itcLoss);
			return {
				id: l.id,
				name: NAMES[l.id] ?? l.short,
				units,
				price,
				packPrice: l.packPrice,
				charged: Math.round((units * l.charged) / l.units),
				cost,
				itcLoss,
				net,
				perPack: r2(net / units)
			};
		})
		.filter((e): e is SwingExit => !!e);
	const net = posted ? c.actual.net : P.net;
	const pnl = posted ? c.actual.pnl : P.pnl;
	const swing = posted ? c.actual.swing : P.swing;
	const units = (pred: (e: SwingExit) => boolean) => exits.filter(pred).reduce((t, e) => t + e.units, 0);
	return {
		wo,
		exits,
		net,
		pnl,
		swing,
		book: P.bookCost,
		units: P.units,
		sku: c.sku,
		batch: c.batch,
		sold: units((e) => e.id !== 'foodbank'),
		given: units((e) => e.id === 'foodbank'),
		left: (took && c.realised?.godown) || P.leftover || 0,
		itcLost: r2(exits.reduce((t, e) => t + e.itcLoss, 0)),
		notPaid: r2(swing - net),
		leftCost: r2(pnl - (net - P.bookCost)),
		out: (P.rows ?? []).filter((r) => r.id !== 'writeoff' && !r.eligible && r.reason)
	};
}

/** how an exit came to its net, in words */
export function exitHow(e: SwingExit): string {
	const n = (v: number) => Math.round(v).toLocaleString('en-IN');
	if (e.id === 'kirana')
		return `${n(e.units)} packets, ${n(e.charged)} charged at ₹${(e.packPrice ?? e.price).toFixed(2)} (2 free with every 10), less ₹${n(e.cost)} van`;
	if (e.id === 'staff') return `${n(e.units)} packs at ₹${e.price.toFixed(2)}, by UPI`;
	if (e.id === 'foodbank')
		return `${n(e.units)} packs given: ₹${e.cost.toFixed(2)} handling, and their GST credit reversed (₹${e.itcLoss.toFixed(2)})`;
	if (e.id === 'expiresoon') return `${n(e.units)} packs at ₹${e.price.toFixed(2)}, less ₹${n(e.cost)} listing fee`;
	return `${n(e.units)} packs`;
}
