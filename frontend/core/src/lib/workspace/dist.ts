// A distributor's portal, batch by batch (SC-133, design3/core/ledger.js partners): every batch of the client's at his
// godown in a journey, as where it stands now (DistNow): its plan's lines, the label photo, the scheme, the lot, the
// staff sale, the pickup, the papers. The batch in focus comes from the journey's state, as the prototype has it; the
// stub's second batch (the Mango Drink) from its own; on the live workspace every other batch from its partner facts
// (GET …/partner). From a DistNow: the batch's lines and where each stands, the steps that are his, and what it waits
// for (journeyOf); what it has sold (ordersNow). A cleared batch's orders, deliveries and label photo come from its
// facts. Nothing here reads the seed, so a live build carries none of it. core/tests/dist.test.ts holds them to
// ledger.js.
import { fmt } from '../format';
import { scheme as schemeOf, stepAt, vanDay } from './partners';
import type {
	CaseData,
	Destruction,
	DestructionStatus,
	Distributor,
	Hero,
	PartnerCase,
	Phase,
	Shop,
	Sku,
	State
} from './types';

/** what the texts name: the products, the distributors, the buyer, the scheme, the client */
export type DistWorld = {
	skus: Record<string, Sku>;
	distributors: Record<string, Distributor>;
	buyer: { name: string; city: string };
	scheme: { buy: number; free: number };
	short: string;
};
export type DistLine = { id: string; units: number; price: number; packPrice: number | null };
/** a batch in a journey at his godown, where it stands now */
export type DistNow = {
	ref: string;
	sku: string;
	dist: string;
	flagged: string;
	phase: Phase | string;
	units: number;
	shelf: string | null;
	photo: 'none' | 'requested' | 'reading' | 'verified';
	approved: boolean;
	lines: DistLine[];
	/** the kirana scheme: open or over, the shops it went to, the shops that ordered and their packets */
	offer: { open: boolean; offered: number; shops: number; units: number } | null;
	shops: { kirana: string; units: number; at: string | null }[];
	listing: { id: string } | null;
	award: { price: number; token: number } | null;
	awardAt: string | null;
	truck: boolean;
	van: boolean;
	papers: boolean;
	invoice: { no: string; total: number; issued: boolean } | null;
	staff: { status: 'open' | 'recorded'; units: number; price: number; sold: number | null } | null;
	donation: {
		status: string;
		partner: string;
		units: number;
		date: string | null;
		time: string | null;
	} | null;
	/** the van round that takes the scheme's orders, where the journey names it */
	round: { day: string; date: string; leaves: string } | null;
	/** the packs left at his godown on expiry day, destroyed there against evidence the client approves (SC-139) */
	destruction: { status: DestructionStatus; units: number; reason: string | null } | null;
	/** where it was read from: the batch in focus's state, the stub's second batch's, or the live workspace's partner
	 *  facts (a batch the app puts in focus before its screens act on it) */
	from: 'focus' | 'second' | 'facts';
};
export type DistStateLine = { id: string; plan: string; state: string; done: boolean; live: boolean };
export type DistTodo = {
	id: string;
	icon: 'camera' | 'users' | 'truck' | 'receipt' | 'route' | 'recycle';
	title: string;
	sub: string;
	cta: string;
	route?: 'photo' | 'van' | 'destroy';
	act?: 'issueInvoice';
};
export type DistJourney = {
	ref: string;
	sku: Sku;
	dist: Distributor;
	phase: Phase | string;
	stop: string;
	flagged: string;
	units: number;
	lines: DistStateLine[];
	todo: DistTodo[];
	waiting: string | null;
	from: DistNow['from'];
};
export type DistOrder = {
	id: string;
	units: number;
	who: string;
	what: string;
	sub: string;
	amount: number;
	at: string | null;
	paper?: { no: string; label: string; issue?: boolean } | null;
	shops?: { name: string; units: number; at: string | null }[];
};
export type DistDelivery = { id: string; at: string; title: string; sub: string };
export type DistPhoto = {
	ref: string;
	sku: Sku;
	sent: string;
	read: string | null;
	bestBefore: string;
	mfg: string | null;
	mrp: number;
};

export const STOP: Record<string, string> = {
	'at-risk': 'Verify',
	verified: 'Value',
	valued: 'Decide',
	planned: 'Approve',
	approved: 'Execute',
	executing: 'Execute',
	dispatched: 'Settle',
	settled: 'Settle',
	cleared: 'Cleared'
};
const ROUTED = ['approved', 'executing', 'dispatched', 'settled', 'cleared'];
const num = fmt.num;
const rate = fmt.rate;
const inr = fmt.inr;
const r2 = (n: number) => Math.round(n * 100) / 100;
const cartons = (u: number, per: number) => {
	const c = Math.floor(u / per);
	const r = u % per;
	return r * 2 === per ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? '' : 's'}`;
};
const addDays = (iso: string, n: number) => {
	const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
	const t = new Date(Date.UTC(y, m - 1, d + n));
	return t.toISOString().slice(0, 10);
};
const linesOf = (lines: readonly { id: string; units: number; price: number; packPrice?: number | null }[]) =>
	lines
		.filter((l) => l.units > 0 && l.id !== 'writeoff')
		.map((l) => ({ id: l.id, units: l.units, price: l.price, packPrice: l.packPrice ?? null }));
const plain = (round: { day: string; date: string; leaves: string }) => ({
	day: round.day,
	date: round.date,
	leaves: round.leaves
});

/* ---------- where each batch stands ---------- */

/** a batch's donation as his facts record it: booked, its pickup confirmed, collected */
const donationOf = (pc: PartnerCase): DistNow['donation'] =>
	pc.donation && pc.partner
		? {
				status: stepAt(pc, 'collect') ? 'collected' : stepAt(pc, 'pickup') ? 'confirmed' : 'booked',
				partner: pc.partner.name,
				units: pc.donation.units,
				date: null,
				time: null
			}
		: null;

/** where the destruction of the packs left at his godown stands, as his Today reads it (SC-139) */
const destructionOf = (d: Destruction | null | undefined): DistNow['destruction'] =>
	d ? { status: d.status, units: d.units, reason: d.reason ?? null } : null;

/** the batch in focus, from the journey's state; its donation's status where the state names it as its own. A partner
 *  is not sent the client's plan (the live workspace), so its lines, and the papers, come from his facts when the case
 *  has none */
export function nowOfFocus(
	h: Hero,
	c: CaseData,
	mango: State['mango'],
	day0: string,
	facts?: PartnerCase | null
): DistNow {
	const units = h.orders.reduce((t, o) => t + o.units, 0);
	const plan = c.plan.lines.length ? c.plan : (facts?.plan ?? c.plan);
	const kl = plan.lines.find((l) => l.id === 'kirana' && l.units > 0);
	const fb = plan.lines.find((l) => l.id === 'foodbank' && l.units > 0);
	const inv = [...c.docs, ...(facts?.docs ?? [])].find((d) => d.id === 'invoice' && d.status !== 'not required');
	// the state's times are the day's own (09:19) on the stub, the live workspace's as it shows them
	const iso = (t: string) => (/^\d\d:\d\d$/.test(t) ? `${day0}T${t}` : null);
	const d = fb && mango.id === c.batch.id && mango.donation ? mango.donation : null;
	// once a batch clears its donation leaves the journey's state (the live workspace): his facts still record it
	const given = !d && fb && facts ? donationOf(facts) : null;
	return {
		ref: c.batch.id,
		sku: c.sku.id,
		dist: c.dist.id,
		flagged: facts?.flagged ?? day0,
		phase: h.phase,
		units: plan.units,
		shelf: c.batch.shelf ?? null,
		photo: h.photo.status,
		approved: ROUTED.includes(h.phase),
		lines: h.plan || facts ? linesOf(plan.lines) : [],
		offer: h.offer
			? {
					open: h.offer.status === 'sent' && units < (kl?.units ?? 0),
					offered: c.offered || facts?.offered || 0,
					shops: h.orders.length,
					units
				}
			: null,
		shops: h.orders.map((o) => ({ kirana: o.id, units: o.units, at: iso(o.at) })),
		listing: h.listing ? { id: h.listing.id } : null,
		award: h.award ? { price: h.award.price, token: h.award.token } : null,
		awardAt: h.award ? iso(h.award.at) : null,
		truck: h.truck.status === 'dispatched',
		van: h.van.status === 'done',
		papers: !!h.docs,
		invoice: h.docs && inv ? { no: inv.no, total: inv.total ?? inv.amount, issued: !!h.invoiceIssued } : null,
		staff: h.staff
			? { status: h.staff.status, units: h.staff.units, price: h.staff.price, sold: h.staff.sold ?? null }
			: null,
		donation: d
			? {
					status: d,
					partner: c.donation.partner.name,
					units: c.donation.units,
					date: c.donation.date ?? null,
					time: c.donation.time ?? null
				}
			: given,
		round: plain(c.van),
		destruction: destructionOf(h.destruction ?? c.destruction ?? facts?.destruction),
		from: 'focus'
	};
}
/** the stub's second batch (the Mango Drink), executing from the story's start: the scheme open to its distributor's
 *  shops, the staff sale, the pickup */
export function nowOfSecond(
	m: State['mango'] & { staff?: { status: 'open' | 'recorded'; units: number; sold: number | null } | null },
	c: CaseData,
	shops: readonly Shop[],
	day0: string
): DistNow {
	const dn = c.donation;
	const st = dn.plan.lines.find((l) => l.id === 'staff' && l.units > 0);
	return {
		ref: dn.batch.id,
		sku: dn.sku.id,
		dist: dn.dist.id,
		flagged: day0,
		phase: m.phase,
		units: dn.plan.units,
		shelf: dn.batch.shelf ?? null,
		photo: 'verified',
		approved: ROUTED.includes(m.phase),
		lines: linesOf(dn.plan.lines),
		offer: { open: true, offered: shops.filter((k) => k.distributor === dn.dist.id).length, shops: 0, units: 0 },
		shops: [],
		listing: null,
		award: null,
		awardAt: null,
		truck: false,
		van: false,
		papers: false,
		invoice: null,
		staff: st
			? m.staff
				? { status: m.staff.status, units: m.staff.units, price: st.price, sold: m.staff.sold }
				: { status: 'open', units: st.units, price: st.price, sold: null }
			: null,
		donation: m.donation
			? { status: m.donation, partner: dn.partner.name, units: dn.units, date: dn.date ?? null, time: dn.time ?? null }
			: null,
		round: null,
		destruction: null,
		from: 'second'
	};
}
/** any other batch in a journey on the live workspace, from its partner facts and the phase the snapshot sends */
export function nowOfFacts(pc: PartnerCase, phase: Phase | string | null | undefined, shelf?: string | null): DistNow {
	const has = (k: string) => !!stepAt(pc, k);
	const lines = linesOf(pc.plan.lines);
	const st = lines.find((l) => l.id === 'staff');
	const inv = pc.docs.find((d) => d.id === 'invoice' && d.status !== 'not required');
	const ordered = pc.kirana?.ordered ?? pc.kiranas.reduce((t, k) => t + k.units, 0);
	const sold = pc.realised?.lines.find((l) => l.id === 'staff')?.units ?? null;
	return {
		ref: pc.ref,
		sku: pc.sku,
		dist: pc.dist,
		flagged: pc.flagged,
		phase: phase ?? (pc.cleared ? 'cleared' : has('approve') ? 'executing' : 'at-risk'),
		units: pc.plan.units,
		shelf: shelf ?? null,
		photo: has('read') ? 'verified' : has('photo') ? 'reading' : has('ask') ? 'requested' : 'none',
		approved: has('approve'),
		lines,
		offer: pc.offer
			? { open: pc.offer.status === 'open', offered: pc.offered, shops: pc.kiranas.length, units: ordered }
			: null,
		shops: pc.kiranas.map((k) => ({ kirana: k.kirana, units: k.units, at: k.at ?? null })),
		// each as its step has it: the lot once listed, the award once the buyer took it, the invoice once drafted
		listing: has('listing') ? pc.listing : null,
		award: has('accept') ? pc.award : null,
		awardAt: stepAt(pc, 'accept'),
		truck: has('truck'),
		van: has('van'),
		papers: has('papers'),
		invoice: inv && has('papers') ? { no: inv.no, total: inv.total ?? inv.amount, issued: has('invoice') } : null,
		staff: st ? { status: has('staff') ? 'recorded' : 'open', units: st.units, price: st.price, sold } : null,
		donation: donationOf(pc),
		round: null,
		destruction: destructionOf(pc.destruction),
		from: 'facts'
	};
}

/** his batches in a journey now: the batch in focus, the stub's second, and on the live workspace every other one he
 *  has, from its facts; the one asking most of him first */
export function distNows(
	i: {
		state: State;
		c: CaseData | null;
		day0: string;
		shops: readonly Shop[];
		/** the partner facts, and the phase each batch's own journey is at (the snapshot's) */
		cases: readonly PartnerCase[];
		phaseOf: (ref: string) => Phase | string | null | undefined;
		shelfOf?: (ref: string) => string | null | undefined;
	},
	distId: string
): DistNow[] {
	const out: DistNow[] = [];
	const { state: s, c } = i;
	const inJourney = (p: string | null | undefined) => !!p && p !== 'watching';
	if (c && c.dist.id === distId && inJourney(s.hero.phase))
		out.push(
			nowOfFocus(
				s.hero,
				c,
				s.mango,
				i.day0,
				i.cases.find((x) => x.ref === c.batch.id)
			)
		);
	if (c && s.mango.id && s.mango.id !== c.batch.id && c.donation.dist.id === distId && inJourney(s.mango.phase))
		out.push(nowOfSecond(s.mango, c, i.shops, i.day0));
	for (const pc of i.cases)
		if (pc.dist === distId && !pc.cleared && !out.some((n) => n.ref === pc.ref)) {
			const p = i.phaseOf(pc.ref);
			if (p === 'watching') continue;
			out.push(nowOfFacts(pc, p, i.shelfOf?.(pc.ref)));
		}
	return out;
}

/* ---------- a batch in a journey from where he stands ---------- */

/** each line of its plan and where it stands, his steps, what it waits for */
export function journeyOf(n: DistNow, w: DistWorld): DistJourney {
	const sku = w.skus[n.sku];
	const dist = w.distributors[n.dist];
	const buyer = w.buyer;
	const sc = w.scheme;
	const line = (id: string) => n.lines.find((l) => l.id === id) ?? null;
	const kl = line('kirana');
	const es = line('expiresoon');
	const st = line('staff');
	const fb = line('foodbank');
	const o = n.offer;
	const filled = !!o && (o.shops >= o.offered || (!!kl && o.units >= kl.units));
	const over = !!o && (!o.open || filled);
	const day = n.round ? `the ${n.round.day} round` : 'the van round';
	const lines: DistStateLine[] = [];
	if (kl)
		lines.push({
			id: 'kirana',
			plan: `${num(kl.units)} packets to your kiranas at ${rate(kl.packPrice ?? 0)}, ${sc.free} free with every ${sc.buy}`,
			state: !n.approved
				? 'goes out once the plan has its yes'
				: n.van
					? `delivered on ${day}`
					: !o
						? 'the scheme goes out next'
						: over
							? `${o.shops} ${o.shops === 1 ? 'shop' : 'shops'} · ${num(o.units)} packets · on ${day}`
							: `${o.shops} of ${o.offered} shops · ${num(o.units)} packets ordered`,
			done: n.van,
			live: !!o && !over && n.approved
		});
	if (es)
		lines.push({
			id: 'expiresoon',
			plan: `${num(es.units)} packs on ExpireSoon in your name, the buyer's own truck`,
			state: n.truck
				? `collected by ${buyer.name}'s truck`
				: n.award
					? `${buyer.name} took it at ${rate(n.award.price)} · token ${inr(n.award.token)} paid`
					: n.listing
						? `lot ${n.listing.id} listed at ${rate(es.price)} · waiting for a buyer`
						: !n.approved
							? 'listed once the plan has its yes'
							: 'listing now',
			done: n.truck,
			live: !!n.listing && !n.award
		});
	if (st)
		lines.push({
			id: 'staff',
			plan: `${num(st.units)} packs to your staff at ${rate(st.price)}, at ${dist.godown}`,
			state: !n.approved
				? 'opens once the plan has its yes'
				: n.staff && n.staff.status === 'recorded'
					? n.staff.sold == null
						? 'recorded'
						: `${num(n.staff.sold)} of ${num(st.units)} sold`
					: 'open: record what sold when the sale is over',
			done: !!n.staff && n.staff.status === 'recorded',
			live: false
		});
	if (fb) {
		const d = n.donation;
		lines.push({
			id: 'foodbank',
			plan: `${num(fb.units)} packs to ${d ? d.partner : 'a food bank'}, collected from your godown`,
			state: !n.approved
				? 'booked once the plan has its yes'
				: !d
					? 'the Donation agent is booking a food bank'
					: d.status === 'collected'
						? `collected by ${d.partner}`
						: d.status === 'declined'
							? `${d.partner} declined: the packs stay at your godown`
							: d.status === 'confirmed'
								? d.date
									? `${d.partner} collects ${d.date}${d.time ? `, ${d.time}` : ''}`
									: `${d.partner} confirmed the pickup`
								: `booked · waiting for ${d.partner}`,
			done: !!d && d.status === 'collected',
			live: !!d && d.status === 'booked'
		});
	}
	const todo: DistTodo[] = [];
	if (n.photo === 'requested')
		todo.push({
			id: 'photo',
			icon: 'camera',
			title: 'Send one photo of the carton label',
			sub: `${n.shelf ? `Shelf ${n.shelf} · one` : 'One'} carton of ${sku.name}, batch ${n.ref}`,
			cta: 'Open camera',
			route: 'photo'
		});
	if (st && n.approved && !(n.staff && n.staff.status === 'recorded'))
		todo.push({
			id: 'staff',
			icon: 'users',
			title: 'Record the staff sale',
			sub: `${num(st.units)} packs at ${rate(st.price)} · count what sold, once`,
			cta: 'Record what sold',
			route: 'van'
		});
	if (es && n.award && !n.truck && (!kl || over))
		todo.push({
			id: 'truck',
			icon: 'truck',
			title: `Load ${buyer.name}'s truck`,
			sub: `${num(es.units)} packs · ${cartons(es.units, sku.perCarton || 24)} · the balance has landed`,
			cta: 'Load the truck',
			route: 'van'
		});
	if (n.invoice && !n.invoice.issued)
		todo.push({
			id: 'invoice',
			icon: 'receipt',
			title: `Issue ${n.invoice.no} from Tally`,
			sub: `${inr(n.invoice.total)} to ${buyer.name}, drafted by the Paperwork agent`,
			cta: 'Issue from Tally',
			act: 'issueInvoice'
		});
	// destroyed at his godown on expiry day (SC-139): the evidence first, and again if the client asked for it again
	const xd = n.destruction;
	if (xd && (xd.status === 'requested' || xd.status === 'asked'))
		todo.unshift({
			id: 'destroy',
			icon: 'recycle',
			title: `Destroy ${num(xd.units)} expired ${xd.units === 1 ? 'pack' : 'packs'} at your godown`,
			sub:
				xd.status === 'asked' && xd.reason
					? `${w.short} asked again: ${xd.reason}`
					: 'Through an authorised agency · two photos and its certificate',
			cta: 'Send the evidence',
			route: 'destroy'
		});
	if (kl && n.papers && o && o.shops > 0 && !n.van)
		todo.push({
			id: 'van',
			icon: 'route',
			title: n.round ? `Run the ${n.round.day} van round` : 'Run the van round',
			sub: `${o.shops} ${o.shops === 1 ? 'shop' : 'shops'} · ${num(o.units)} packets${n.round ? ` · leaves the godown ${n.round.leaves}` : ''}`,
			cta: 'Start the round',
			route: 'van'
		});
	const waiting = todo.length
		? null
		: xd && xd.status === 'reading'
			? 'Vision is checking your destruction photos'
			: xd && xd.status === 'checked'
				? `${w.short} is reviewing your destruction evidence before it credits you`
				: n.photo === 'reading'
					? 'Vision is reading your label photo'
					: n.phase === 'at-risk' && n.photo === 'none'
						? 'The Watcher flagged it: Vision checks the batch first, and may ask you for one label photo'
						: !n.approved
							? `${w.short} is deciding the plan: nothing moves in your name until it says yes`
							: n.phase === 'cleared'
								? 'Settled: you ended whole'
								: o && !over && n.approved
									? `The scheme is open: ${o.shops} of ${o.offered} shops have ordered`
									: n.listing && !n.award
										? 'The lot waits for a buyer on ExpireSoon'
										: n.donation && n.donation.status !== 'collected' && n.donation.status !== 'declined'
											? `${n.donation.partner} collects from your godown`
											: n.approved && !n.papers
												? 'The Paperwork agent drafts your papers next'
												: 'The agents are on it';
	if (xd)
		lines.push({
			id: 'destroy',
			plan: `${num(xd.units)} ${xd.units === 1 ? 'pack' : 'packs'} expired at your godown, destroyed there`,
			state:
				{
					requested: "send the evidence: two photos and the agency's certificate",
					asked: 'asked again: send the evidence',
					reading: 'Vision is checking the photos',
					checked: `waiting for ${w.short}'s yes`,
					approved: `approved by ${w.short} · the credit note follows`
				}[xd.status] ?? xd.status,
			done: xd.status === 'approved',
			live: xd.status === 'reading' || xd.status === 'checked'
		});
	return {
		ref: n.ref,
		sku,
		dist,
		phase: n.phase,
		stop: STOP[n.phase] || 'Detect',
		flagged: n.flagged,
		units: n.units,
		lines,
		todo,
		waiting,
		from: n.from
	};
}
/** the batch asking most of him first, then by the batch */
export const byAsk = (a: DistJourney, z: DistJourney) => z.todo.length - a.todo.length || (a.ref < z.ref ? -1 : 1);

/* ---------- what each batch sold, what left his godown, the label photos ---------- */

/** what a batch in a journey has sold so far: the buyer's lot, the kiranas' orders, the staff sale, the food bank */
export function ordersNow(n: DistNow, shopName: (id: string) => string, w: DistWorld): DistOrder[] {
	const sku = w.skus[n.sku];
	const dist = w.distributors[n.dist];
	const out: DistOrder[] = [];
	const o = n.offer;
	const shops = n.shops.map((k) => ({ name: shopName(k.kirana), units: k.units, at: k.at ?? null }));
	const line = (id: string) => n.lines.find((l) => l.id === id) ?? null;
	const kl = line('kirana');
	const es = line('expiresoon');
	const st = line('staff');
	const fb = line('foodbank');
	if (es && n.award)
		out.push({
			id: 'expiresoon',
			units: es.units,
			who: `${w.buyer.name}, ${w.buyer.city}`,
			what: `lot ${n.listing ? n.listing.id : ''} · ${num(es.units)} × ${rate(n.award.price)}`,
			sub: `token ${inr(n.award.token)} · balance ${inr(r2(es.units * n.award.price - n.award.token))} · ${n.truck ? "collected by the buyer's truck" : "the buyer's truck collects"}`,
			amount: r2(es.units * n.award.price),
			at: n.awardAt || null,
			paper: n.invoice
				? {
						no: n.invoice.no,
						label: n.invoice.issued ? 'issued from Tally' : 'drafted by the Paperwork agent',
						issue: !n.invoice.issued
					}
				: null
		});
	if (kl && o && o.shops)
		out.push({
			id: 'kirana',
			units: o.units,
			who: `${o.shops} ${o.shops === 1 ? 'kirana' : 'kiranas'}`,
			what: `${num(o.units)} packets at ${rate(kl.packPrice ?? 0)}, ${w.scheme.free} free with every ${w.scheme.buy}`,
			sub: n.van
				? `delivered on ${n.round ? `the ${n.round.day} round` : 'the van round'}`
				: n.round
					? `on the ${n.round.day} round, ${n.round.date}`
					: 'on the van round once the papers are drafted',
			amount: r2(shops.reduce((t, k) => t + schemeOf(k.units, kl.packPrice ?? 0, sku.mrp).pay, 0)),
			at: shops.reduce<string | null>((t, k) => (k.at && (!t || k.at > t) ? k.at : t), null),
			shops
		});
	if (st && n.staff && n.staff.status === 'recorded' && n.staff.sold)
		out.push({
			id: 'staff',
			units: n.staff.sold,
			who: 'Your staff sale',
			what: `${num(n.staff.sold)} packs at ${rate(st.price)}`,
			sub: `at ${dist.godown}`,
			amount: r2(n.staff.sold * st.price),
			at: null
		});
	if (fb && n.donation && n.donation.status === 'collected')
		out.push({
			id: 'foodbank',
			units: fb.units,
			who: n.donation.partner,
			what: `${num(fb.units)} packs given`,
			sub: "the receipt is in the batch's papers",
			amount: 0,
			at: null
		});
	return out;
}
const took = (c: PartnerCase, id: string) => c.realised?.lines.find((l) => l.id === id && l.units > 0) ?? null;
const planned = (c: PartnerCase, id: string) => c.plan.lines.find((l) => l.id === id && l.units > 0) ?? null;
/** a cleared batch's orders: the lot the buyer took, the kiranas' scheme, the staff sale, what went to the food bank */
export function ordersPast(c: PartnerCase, shopName: (id: string) => string, w: DistWorld): DistOrder[] {
	const out: DistOrder[] = [];
	const es = took(c, 'expiresoon');
	const kl = took(c, 'kirana');
	const st = took(c, 'staff');
	const fb = took(c, 'foodbank');
	const inv = c.docs.find((d) => d.id === 'invoice' && d.status !== 'not required');
	const issued = !!stepAt(c, 'invoice');
	if (es && c.award)
		out.push({
			id: 'expiresoon',
			units: es.units,
			who: `${w.buyer.name}, ${w.buyer.city}`,
			what: `lot ${c.listing ? c.listing.id : ''} · ${num(es.units)} × ${rate(c.award.price)}`,
			sub: `token ${inr(c.award.token)} · balance ${inr(r2(es.units * c.award.price - c.award.token))} · collected by the buyer's truck`,
			amount: r2(es.units * c.award.price),
			at: stepAt(c, 'accept'),
			paper: inv ? { no: inv.no, label: issued ? 'issued from Tally' : 'drafted' } : null
		});
	if (kl) {
		const van = stepAt(c, 'van');
		out.push({
			id: 'kirana',
			units: kl.units,
			who: `${c.kiranas.length} ${c.kiranas.length === 1 ? 'kirana' : 'kiranas'}`,
			what: `${num(kl.units)} packets at ${rate(planned(c, 'kirana')?.packPrice ?? 0)}, ${w.scheme.free} free with every ${w.scheme.buy}`,
			sub: `${c.kirana && c.kirana.ordered < c.kirana.planned ? `of ${num(c.kirana.planned)} offered · ` : ''}${van ? `delivered on the ${vanDay(c)} round` : 'delivered on the van round'}`,
			amount: kl.gross,
			at: stepAt(c, 'orders'),
			shops: c.kiranas.map((k) => ({ name: shopName(k.kirana), units: k.units, at: k.at || null }))
		});
	}
	if (st)
		out.push({
			id: 'staff',
			units: st.units,
			who: 'Your staff sale',
			what: `${num(st.units)} packs at ${rate(st.price)}`,
			sub: `at ${w.distributors[c.dist].godown}`,
			amount: st.gross,
			at: stepAt(c, 'staff')
		});
	if (fb)
		out.push({
			id: 'foodbank',
			units: fb.units,
			who: c.partner ? c.partner.name : 'The food bank',
			what: `${num(fb.units)} packs given`,
			sub: c.receipt ? `receipt ${c.receipt.no} · a copy in the batch's papers` : '',
			amount: 0,
			at: stepAt(c, 'collect')
		});
	return out;
}
/** what left a cleared batch's godown, each with its day: the van round, the buyer's truck, the staff sale, the pickup */
export function deliveriesPast(c: PartnerCase, w: DistWorld): DistDelivery[] {
	const out: DistDelivery[] = [];
	const es = took(c, 'expiresoon');
	const kl = took(c, 'kirana');
	const st = took(c, 'staff');
	const fb = took(c, 'foodbank');
	const at = (k: string) => stepAt(c, k);
	const van = at('van');
	const truck = at('truck');
	const staff = at('staff');
	const collect = at('collect');
	if (kl && van)
		out.push({
			id: 'kirana',
			at: van,
			title: `${vanDay(c)} van round`,
			sub: `${c.kiranas.length} ${c.kiranas.length === 1 ? 'shop' : 'shops'} · ${num(kl.units)} packets`
		});
	if (es && truck)
		out.push({
			id: 'expiresoon',
			at: truck,
			title: `${w.buyer.name}'s truck`,
			sub: `lot ${c.listing ? c.listing.id : ''} · ${num(es.units)} packs to ${w.buyer.city}`
		});
	if (st && staff)
		out.push({
			id: 'staff',
			at: staff,
			title: 'Staff sale recorded',
			sub: `${num(st.units)} packs sold at ${rate(st.price)}`
		});
	if (fb && collect)
		out.push({
			id: 'foodbank',
			at: collect,
			title: `${c.partner ? c.partner.name : 'The food bank'} collected`,
			sub: `${num(fb.units)} packs${c.receipt ? ` · receipt ${c.receipt.no}` : ''}`
		});
	return out.sort((a, z) => (a.at < z.at ? 1 : -1));
}
/** a label photo he sent, and what Vision read from it: the batch, the dates and the MRP */
export function photoOf(
	c: Pick<PartnerCase, 'ref' | 'sku' | 'steps' | 'batch'>,
	w: Pick<DistWorld, 'skus'>
): DistPhoto | null {
	const sent = stepAt(c, 'photo');
	if (!sent) return null;
	const sku = w.skus[c.sku];
	const bb = c.batch.bestBefore;
	return {
		ref: c.ref,
		sku,
		sent,
		read: stepAt(c, 'read'),
		bestBefore: bb,
		// the day it was made, as its label reads; else worked out from its shelf life
		mfg: c.batch.mfg ?? (sku.lifeDays ? addDays(bb, -sku.lifeDays) : null),
		mrp: sku.mrp
	};
}
