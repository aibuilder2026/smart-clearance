// The partners' own history (SC-130, design3/core/ledger.js partners): what a distributor, a kirana and a food bank
// each read of the batches they took part in. Each batch comes as its facts (PartnerCase): the stub reads the
// history's cases from the seed design3 writes (stub.svelte.ts), the live workspace reads backend-api's
// (GET …/partner), each cut to the partner's own part; these work out the same moments, money, offers and pickups
// from either. The batch in a journey reads the journey's own state, as the prototype does. Nothing here reads the
// seed, so a live build carries none of it. core/tests/partners.test.ts holds them to ledger.js.
import { fmt } from '../format';
import type {
	CaseData,
	Distributor,
	Doc,
	Hero,
	PartnerCase,
	PtMoment,
	PtOffer,
	PtPickup,
	PtWhole,
	Shop,
	Sku
} from './types';

/** what the moments and the money name: the products, the distributors, the buyer, the client */
export type PartnerWorld = {
	skus: Record<string, Sku>;
	distributors: Record<string, Distributor>;
	buyer: { name: string; city: string };
	/** the client's name (Munchly Foods Ltd), and the workspace's short name (Munchly) */
	client: string;
	short: string;
	/** a shop's share of the scheme: its sales over 14 days, this many times */
	capTimes: number;
	/** the client's people by id, for who approved a destruction (SC-139); a name the live workspace sends stands as it is */
	people?: Record<string, { short: string }>;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const num = fmt.num;
const rate = fmt.rate;
export const stepAt = (c: Pick<PartnerCase, 'steps'>, k: string) =>
	(c.steps || []).find((s) => s.step === k)?.at ?? null;
/** the van round's own day: when it leaves, where the facts say (a compressed journey runs it before then, SC-137),
 *  else when it ran, as the history stamps it */
export const vanDay = (c: Pick<PartnerCase, 'steps'>) => {
	const s = (c.steps || []).find((x) => x.step === 'van');
	return s ? weekday(s.leaves ?? s.at) : '';
};
const took = (c: PartnerCase, id: string) => c.realised?.lines.find((l) => l.id === id && l.units > 0) ?? null;
const planned = (c: PartnerCase, id: string) => c.plan.lines.find((l) => l.id === id && l.units > 0) ?? null;
/** the weekday of an IST day (2026-08-31 → Monday) */
export const weekday = (iso: string) =>
	new Date(iso.slice(0, 10) + 'T00:00:00+05:30').toLocaleDateString('en-IN', {
		weekday: 'long',
		timeZone: 'Asia/Kolkata'
	});
/** an IST time (2026-08-27T12:10) some hours on */
export const plusHours = (iso: string, h: number) => {
	const t = new Date(new Date(iso + ':00+05:30').getTime() + (h + 5.5) * 3600e3);
	const p = (x: number) => String(x).padStart(2, '0');
	return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}T${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
};

/* ---------- a distributor ---------- */

/** every batch a distributor cleared, newest first by the day it was flagged */
export const distPast = (cases: readonly PartnerCase[], distId: string) =>
	cases.filter((c) => c.dist === distId && c.cleared).sort((a, z) => (a.flagged < z.flagged ? 1 : -1));
/** the papers a distributor sees: those he issues (his tax invoice and its e-way bill check) and those issued to him
 *  (the client's price-support and expiry credit notes); and copies of what concerns his packs (the food bank's
 *  receipt, the destruction certificate). The client's GST ITC memo and FSSAI checklist stay the client's */
export function distPapers(c: Pick<PartnerCase, 'docs'>): { mine: Doc[]; copies: Doc[] } {
	const has = (d: Doc | undefined): d is Doc => !!d && d.status !== 'not required';
	const doc = (id: string) => c.docs.find((d) => d.id === id);
	// packs destroyed at his own godown (SC-139): the agency's certificate is issued for him, so it is his paper
	const his = (d: Doc | undefined) => !!d && d.id === 'destruction' && d.at === 'godown';
	return {
		mine: ['invoice', 'eway', 'support', 'expiry', 'destruction']
			.map(doc)
			.filter(
				(d): d is Doc =>
					!!d && (d.id === 'destruction' ? his(d) && has(d) : d.status !== 'not required' || d.id === 'eway')
			),
		copies: ['receipt', 'destruction'].map(doc).filter((d): d is Doc => has(d) && !his(d))
	};
}
/** what credit a cleared batch brought him: the price support, and on expiry day the expiry credit note (under SC-139's
 *  route B with the GST he reverses and the agency's charges) */
export const creditOf = (c: PartnerCase) =>
	(c.support?.total ?? 0) +
	(c.expiry ? ((c.expiry.at === 'godown' ? c.expiry.amount : c.expiry.credit) ?? c.expiry.credit ?? 0) : 0);

/** what happened to a cleared batch, from where he stands: each moment with its day and time */
export function moments(c: PartnerCase, w: PartnerWorld): PtMoment[] {
	const out: PtMoment[] = [];
	const add = (k: string, icon: string, title: string, sub: string) => {
		const t = stepAt(c, k);
		if (t) out.push({ k, at: t, icon, title, sub });
	};
	const kl = took(c, 'kirana'),
		es = took(c, 'expiresoon'),
		st = took(c, 'staff'),
		fb = took(c, 'foodbank');
	const doc = (id: string) => c.docs.find((d) => d.id === id);
	const dist = w.distributors[c.dist];
	const kp = planned(c, 'kirana'),
		ep = planned(c, 'expiresoon');
	add(
		'detect',
		'radar',
		`The Watcher flagged ${num(c.plan.units)} packs at risk`,
		`${c.batch.daysLeft} days left, failing Blinkit, Zepto and Instamart's gates`
	);
	add('photo', 'camera', 'You sent the label photo', 'Vision read the batch, the dates and the MRP');
	add(
		'approve',
		'check',
		`${w.short} approved the plan`,
		c.plan.lines
			.filter((l) => l.units > 0 && l.id !== 'writeoff')
			.map((l) => `${num(l.units)} to ${l.short}`)
			.join(' · ')
	);
	if (ep && c.listing)
		add(
			'listing',
			'shopping-bag',
			`${num(ep.units)} listed on ExpireSoon in your name`,
			`Lot ${c.listing.id} at ${rate(ep.price)}`
		);
	if (kp)
		add(
			'offer',
			'send',
			`The scheme went to ${c.offered} of your kiranas`,
			`Buy 10, get 2 · ${rate(kp.packPrice!)} a packet`
		);
	if (fb && c.partner)
		add(
			'donation',
			'heart-handshake',
			`${c.partner.name} booked for ${num(fb.units)} packs`,
			`Pickup from ${dist.godown}`
		);
	if (kl && c.kirana)
		add(
			'orders',
			'store',
			`${c.kiranas.length} kiranas ordered ${num(kl.units)} packets`,
			c.kirana.ordered < c.kirana.planned ? `of ${num(c.kirana.planned)} offered` : 'The scheme filled'
		);
	if (es && c.award)
		add(
			'accept',
			'handshake',
			`${w.buyer.name} took the counter at ${rate(c.award.price)}`,
			`${fmt.inr(c.award.token)} token paid`
		);
	if (fb && c.partner && c.receipt)
		add('collect', 'package-check', `${c.partner.name} collected ${num(fb.units)} packs`, `Receipt ${c.receipt.no}`);
	if (kl && c.realised?.godown)
		add(
			'closeOffer',
			'clock',
			'The scheme closed after 48 hours',
			`${num(c.realised.godown)} packets were not ordered`
		);
	if (st) add('staff', 'users', `Your staff sale sold ${num(st.units)} packs`, `at ${rate(st.price)}`);
	if (es)
		add('truck', 'truck', `${w.buyer.name}'s truck collected the lot`, `${num(es.units)} packs to ${w.buyer.city}`);
	add(
		'papers',
		'file-check',
		'The Paperwork agent drafted your papers',
		distPapers(c)
			.mine.filter((d) => d.status !== 'not required')
			.map((d) => d.no)
			.join(' · ')
	);
	const inv = doc('invoice');
	if (inv && inv.status !== 'not required')
		add(
			'invoice',
			'receipt',
			`You issued ${inv.no} from Tally`,
			`${fmt.inr(inv.total || inv.amount)} to ${w.buyer.name}`
		);
	const van = stepAt(c, 'van');
	if (kl && van)
		add(
			'van',
			'route',
			`Your ${vanDay(c)} van round delivered the scheme`,
			`${c.kiranas.length} shops · ${num(kl.units)} packets`
		);
	const x = c.expiry && c.expiry.units ? c.expiry : null;
	// destroyed at his godown on expiry day (SC-139): asked, the evidence sent, the operator's yes
	const xd = c.destruction;
	if (xd) {
		add(
			'destroyAsk',
			'warehouse',
			`Asked to destroy ${num(xd.units)} expired packs at your godown`,
			'Through an authorised agency, with two photos and its certificate'
		);
		add(
			'destroySent',
			'camera',
			"You sent the destruction's evidence",
			`${xd.agency?.name ?? 'the agency'} · certificate ${xd.certificate ?? ''}`
		);
		add(
			'destroyApproved',
			'badge-check',
			`${(xd.approvedBy && (w.people?.[xd.approvedBy]?.short ?? xd.approvedBy)) || w.short} approved the destruction`,
			'Vision checked both photos'
		);
	}
	const godown = x?.at === 'godown';
	add(
		'report',
		x ? 'warehouse' : 'badge-check',
		x
			? godown
				? `${num(x.units)} packs destroyed at your godown`
				: `${num(x.units)} packs expired at your godown`
			: 'Settled: you ended whole',
		x
			? godown
				? `${w.short} credited the dealer price, the GST you reverse and the agency's charges: ${fmt.inr(x.amount ?? 0)} on ${doc('expiry')?.no ?? ''}`
				: `${w.short} took them back for full credit: ${fmt.inr(x.credit)} on ${doc('expiry')?.no ?? ''}`
			: `${fmt.inr(c.support?.total ?? 0)} price support on ${doc('support')?.no ?? ''}`
	);
	return out.sort((a, z) => (a.at! < z.at! ? -1 : 1));
}

/** what he received against what he paid: the price support (and on expiry day the expiry credit) makes them equal.
 *  The buyer pays the price he took, the Negotiator's counter, not the price listed */
export function whole(c: PartnerCase, w: PartnerWorld): PtWhole {
	const rows: PtWhole['rows'] = [];
	const kl = took(c, 'kirana'),
		es = took(c, 'expiresoon'),
		st = took(c, 'staff'),
		fb = took(c, 'foodbank');
	if (kl) rows.push({ k: `From ${c.kiranas.length} kiranas`, sub: `${num(kl.units)} packets`, v: kl.gross });
	if (es && c.award)
		rows.push({
			k: `From ${w.buyer.name}`,
			sub: `${num(es.units)} packets at ${rate(c.award.price)}`,
			v: r2(es.units * c.award.price)
		});
	if (st) rows.push({ k: 'Your staff sale', sub: `${num(st.units)} packs`, v: st.gross });
	if (fb && c.partner) rows.push({ k: `Given to ${c.partner.name}`, sub: `${num(fb.units)} packs`, v: 0 });
	const cn = c.docs.find((d) => d.id === 'support'),
		ex = c.docs.find((d) => d.id === 'expiry');
	rows.push({ k: 'Price-support credit note', sub: cn?.no, v: c.support?.total ?? 0, paper: 'support' });
	if (ex && c.expiry)
		rows.push({ k: `Expiry credit note for ${num(c.expiry.units)} packs`, sub: ex.no, v: ex.amount, paper: 'expiry' });
	const sku = w.skus[c.sku];
	const recv = r2(rows.reduce((t, r) => t + r.v, 0));
	// destroyed at his godown (SC-139): he also reverses the input GST on them and pays the agency, which the note makes good
	const g = c.expiry && c.expiry.at === 'godown' ? c.expiry : null;
	const extra = g ? { reversal: g.reversal || 0, charges: g.charges || 0 } : null;
	const paid = r2(
		c.plan.units * sku.dp! +
			(c.support?.van ?? 0) +
			(c.support?.fee ?? 0) +
			(extra ? extra.reversal + extra.charges : 0)
	);
	return { rows, recv, paid, gain: Math.round(recv - paid), dp: sku.dp!, units: c.plan.units, extra };
}

/** the batch in a journey: what has happened so far, by the journey's moments, then the next three still to come. The
 *  stub reads them off the journey's feed; a partner on the live workspace, who is not sent the feed, off the steps
 *  backend-api stamped on the batch (STEP_KEY) */
export const STEP_KEY: Record<string, string> = {
	detect: 'watch',
	ask: 'ask',
	photo: 'photo',
	read: 'read',
	approve: 'approved',
	listing: 'list',
	offer: 'outreach',
	accept: 'accepted',
	orders: 'orders',
	truck: 'dispatch',
	papers: 'papers',
	van: 'van',
	report: 'ledger'
};
export const feedOfSteps = (c: Pick<PartnerCase, 'steps'>) =>
	c.steps.filter((s) => STEP_KEY[s.step]).map((s) => ({ key: STEP_KEY[s.step], at: s.at }));
export function storyMoments(
	feed: readonly { key?: string; at: string }[],
	c: CaseData,
	h: Pick<Hero, 'orders'>,
	w: PartnerWorld,
	permit: boolean
): PtMoment[] {
	const ordered = h.orders.reduce((t, o) => t + o.units, 0);
	// the packs the Watcher flagged: the plan's, or (a partner is not sent the plan) the batch's own at risk
	const flagged = c.plan.lines.length ? c.plan.units : c.risk.atRisk || c.plan.units;
	const MOMENTS: [string, string, string][] = [
		...(permit ? ([['permit', 'handshake', 'You gave the one-time permission']] as [string, string, string][]) : []),
		['watch', 'radar', `The Watcher flagged ${num(flagged)} packs at risk`],
		['ask', 'scan-line', 'Vision asked you for a label photo'],
		['photo', 'camera', 'You sent the label photo'],
		['read', 'scan-line', 'Vision read the label'],
		['approved', 'check', `${w.short} approved the plan`],
		...(c.lines.expiresoon.units
			? ([['list', 'shopping-bag', `${num(c.lines.expiresoon.units)} listed on ExpireSoon in your name`]] as [
					string,
					string,
					string
				][])
			: []),
		...(c.lines.kirana.units
			? ([['outreach', 'send', `The scheme went to ${c.offered} of your kiranas`]] as [string, string, string][])
			: []),
		...(c.lines.expiresoon.units
			? ([['accepted', 'handshake', `${w.buyer.name} took the counter at ${rate(c.award.price)}`]] as [
					string,
					string,
					string
				][])
			: []),
		...(c.lines.kirana.units
			? ([
					[
						'orders',
						'store',
						`${h.orders.length || c.kiranas.length} kiranas ordered ${num(ordered || c.lines.kirana.units)} packets`
					]
				] as [string, string, string][])
			: []),
		...(c.lines.expiresoon.units
			? ([['dispatch', 'truck', `You loaded ${w.buyer.name}'s truck`]] as [string, string, string][])
			: []),
		['papers', 'file-check', 'The Paperwork agent drafted your papers'],
		...(c.lines.kirana.units
			? ([['van', 'route', `Your ${c.van.day} van round delivered the scheme`]] as [string, string, string][])
			: []),
		['ledger', 'badge-check', 'Settled: you ended whole']
	];
	const items: PtMoment[] = [];
	let next = 0;
	for (const [k, icon, title] of MOMENTS) {
		const e = feed.find((x) => x.key === k);
		if (e) items.push({ k, icon, title, at: e.at });
		else if (next < 3 && feed.length) {
			items.push({ k, icon, title, ahead: true });
			next++;
		}
	}
	return items;
}
/** the batch in a journey's money, on the plan: the kiranas, the buyer (the price he took once he has) and the price
 *  support make up what he paid. A partner is not sent the client's plan (the live workspace, SC-94): his lines are the
 *  credit note's rows, on the plan until it settles, then what each line took, with the expiry credit on expiry day */
export function storyWhole(c: CaseData, h: Pick<Hero, 'award' | 'phase'>, short: string): PtWhole {
	if (!c.plan.lines.length) return rowsWhole(c, h, short);
	const KL = c.lines.kirana,
		ES = c.lines.expiresoon;
	const sp = c.support ?? c.supportPlan;
	const rows: PtWhole['rows'] = [];
	if (KL.units) rows.push({ k: 'From your kiranas', sub: `${num(KL.units)} packets on the scheme`, v: KL.gross });
	if (ES.units)
		rows.push({ k: `From ${c.buyer.name}`, sub: `${num(ES.units)} packets`, v: h.award ? c.award.gross : ES.gross });
	rows.push({ k: 'Price-support credit note', sub: `from ${short}`, v: sp.total });
	const recv = rows.reduce((t, r) => t + r.v, 0),
		paid = c.plan.units * c.sku.dp! + sp.van + sp.fee;
	return { rows, recv, paid, gain: Math.round(recv - paid), dp: c.sku.dp!, units: c.plan.units };
}
function rowsWhole(c: CaseData, h: Pick<Hero, 'phase'>, short: string): PtWhole {
	const settled = h.phase === 'settled' || h.phase === 'cleared';
	const sp = settled || c.support.rows.length ? c.support : c.supportPlan;
	const label: Record<string, (n: number) => Pick<PtWhole['rows'][number], 'k' | 'sub'>> = {
		kirana: (n) => ({ k: 'From your kiranas', sub: `${num(n)} packets on the scheme` }),
		expiresoon: (n) => ({ k: `From ${c.buyer.name}`, sub: `${num(n)} packets` }),
		staff: (n) => ({ k: 'Your staff sale', sub: `${num(n)} packs` })
	};
	const rows: PtWhole['rows'] = sp.rows
		.filter((r) => label[r.id] && r.units > 0)
		.map((r) => ({ ...label[r.id](r.units), v: r2(r.units * r.price) }));
	rows.push({ k: 'Price-support credit note', sub: `from ${short}`, v: sp.total, paper: 'support' });
	const x = settled && c.expiry && c.expiry.units > 0 && c.expiry.credit ? c.expiry : null;
	if (x)
		rows.push({
			k: `Expiry credit note for ${num(x.units)} packs`,
			sub: `from ${short}`,
			v: x.credit!,
			paper: 'expiry'
		});
	const units = sp.rows.reduce((t, r) => t + r.units, 0) + (settled ? (c.realised?.godown ?? 0) : 0);
	const recv = r2(rows.reduce((t, r) => t + r.v, 0));
	const paid = r2(units * c.sku.dp! + sp.van + sp.fee);
	return { rows, recv, paid, gain: Math.round(recv - paid), dp: c.sku.dp!, units };
}

/* ---------- a kirana ---------- */

/** a shop's scheme: pay the pack price for 10 of every 12, sell all 12 at MRP */
export const scheme = (n: number, pack: number, mrp: number) => {
	const free = Math.floor(n / 12) * 2,
		paid = n - free;
	return { n, free, paid, pay: r2(paid * pack), sell: n * mrp, margin: r2(n * mrp - paid * pack) };
};
/** a shop's offer from a batch's facts: ordered, declined (Not this time), open, or expired, when its 48 hours ended or
 *  the scheme filled before the shop ordered */
function offerOf(c: PartnerCase, shop: Shop, w: PartnerWorld): PtOffer {
	const kl = planned(c, 'kirana')!,
		sku = w.skus[c.sku];
	const o = c.kiranas.find((x) => x.kirana === shop.id),
		dec = c.declined?.[shop.id];
	const sent = stepAt(c, 'offer')!,
		filled = !!c.kirana && c.kirana.ordered >= c.kirana.planned;
	const open = !!c.offer && c.offer.status === 'open' && !filled;
	const closed = filled
		? (c.offer?.closedAt ?? stepAt(c, 'orders')!)
		: stepAt(c, 'closeOffer') || c.offer?.closesAt || plusHours(sent, 48);
	const status = o ? 'ordered' : dec ? 'declined' : open ? 'open' : 'expired';
	return {
		ref: c.ref,
		...(c.offer ? { open } : {}),
		sku,
		dist: w.distributors[c.dist],
		sent,
		closed,
		share: shop.sales14 * w.capTimes,
		pack: kl.packPrice!,
		mrp: sku.mrp,
		bestBefore: c.batch.bestBefore,
		status,
		why: status === 'expired' ? (filled ? 'filled' : 'time') : null,
		...(c.offer ? { declinedAt: dec?.at ?? null } : {}),
		units: o ? o.units : 0,
		orderedAt: o ? (o.at ?? stepAt(c, 'orders')) : null,
		van: o ? stepAt(c, 'van') : null,
		m: o ? scheme(o.units, kl.packPrice!, sku.mrp) : null
	};
}
/** every offer a shop was sent: the batch in a journey's first (the stub's, from the journey's state), then its
 *  distributor's other batches with a kirana line, newest first */
export function offersFor(
	shop: Shop,
	cases: readonly PartnerCase[],
	w: PartnerWorld,
	story: { c: CaseData; h: Hero; day0: string } | null
): PtOffer[] {
	const past = cases
		.filter(
			(c) => c.dist === shop.distributor && planned(c, 'kirana') && stepAt(c, 'offer') && c.ref !== story?.c.batch.id
		)
		.map((c) => offerOf(c, shop, w))
		.sort((a, z) => (a.sent < z.sent ? 1 : -1));
	if (!story || story.c.dist.id !== shop.distributor || !story.h.offer) return past;
	const { c, h, day0 } = story;
	const KL = c.lines.kirana,
		sku = c.sku;
	const o = h.orders.find((x) => x.id === shop.id),
		dec = h.declined?.[shop.id];
	const filled = h.orders.reduce((t, x) => t + x.units, 0) >= KL.units;
	const sent = `${day0}T${h.offer!.at}`;
	const status = o ? 'ordered' : dec ? 'declined' : filled ? 'expired' : 'open';
	const last = h.orders.reduce((t, x) => (x.at > t ? x.at : t), '00:00');
	const mine: PtOffer = {
		ref: c.batch.id,
		story: true,
		open: !filled,
		sku,
		dist: c.dist,
		sent,
		closed: filled ? `${day0}T${last}` : plusHours(sent, 48),
		share: shop.sales14 * w.capTimes,
		pack: KL.packPrice!,
		mrp: sku.mrp,
		bestBefore: c.batch.bestBefore!,
		status,
		why: status === 'expired' ? 'filled' : null,
		declinedAt: dec ? `${day0}T${dec.at}` : null,
		units: o ? o.units : 0,
		orderedAt: o ? `${day0}T${o.at}` : null,
		van: o && h.van.status === 'done' ? addDaysIso(day0, 4) + 'T09:00' : null,
		m: o ? scheme(o.units, KL.packPrice!, sku.mrp) : null
	};
	return [mine, ...past];
}
const addDaysIso = (iso: string, n: number) => {
	const d = new Date(iso + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
};

/* ---------- a food bank ---------- */

/** the donations a food bank collected from the client's cleared batches, newest first, each with the receipt it
 *  issued as it collected */
export function pickupsFor(
	org: string,
	cases: readonly PartnerCase[],
	w: PartnerWorld,
	except?: string | null
): PtPickup[] {
	return cases
		.filter((c) => c.partner?.name === org && c.donation && c.receipt && stepAt(c, 'collect') && c.ref !== except)
		.map((c) => {
			const dist = w.distributors[c.dist];
			return {
				ref: c.ref,
				sku: w.skus[c.sku],
				dist,
				units: c.donation!.units,
				kg: c.receipt!.kg ?? 0,
				meals: c.receipt!.meals ?? 0,
				receipt: c.receipt!,
				spot: c.donation!.spot,
				from: `${dist.godown}, ${dist.city}`,
				asked: stepAt(c, 'donation'),
				confirmed: stepAt(c, 'pickup'),
				collected: stepAt(c, 'collect')!,
				bestBefore: c.batch.bestBefore,
				daysLeft: c.batch.daysLeft
			};
		})
		.sort((a, z) => (a.collected < z.collected ? 1 : -1));
}
/** the FSSAI surplus-food checklist that came with a donation */
export const fssaiItems = (p: PtPickup, client: string) => [
	'Sealed, undamaged packs',
	`Best before ${fmt.date(p.bestBefore)}, ${p.daysLeft} days left when booked`,
	'Ambient storage, away from sunlight',
	`Batch ${p.ref} on every carton`,
	`Donor: ${client} via ${p.dist.name}`
];
