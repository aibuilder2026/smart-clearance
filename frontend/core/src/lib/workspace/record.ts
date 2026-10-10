// A batch's record (SC-142, option A): the photos sent for it, the human yeses and the audit trail, as design3's
// core/ledger.js record draws them for the stub. backend-api writes the trail from the case's feed (each agent's run)
// and the audit log (each person's decision, in their name, the kiranas' orders folded into one row); the stub writes
// the same rows from the history's steps, or from the story's feed and audit (core/tests/record.test.ts holds them to
// ledger.js)
import { D, SHOPS_ALL } from './data';
import history from './seed/history.json';
import { fmt } from '../format';
import type { BatchRecord, RecordPhoto, RecordStep, RecordWho, State, StoryPerson } from './types';

export const YES = ['plan.approve', 'docs.review', 'destruction.approve'];

/** a batch of the history, as the seed has it: the fields its record reads */
type Case = {
	ref: string;
	cleared: string;
	sku: string;
	dist: string;
	steps: { step: string; at: string }[];
	numbers: { listing?: string };
	batch: { units: number; daysLeft: number; bestBefore: string; mfg?: string };
	plan: { units: number; net: number; lines: { id: string; units: number }[] };
	realised: { lines: { id: string; units: number }[] };
	actual: { net: number };
	award: { price: number; token: number; bid: number } | null;
	docs: { id: string; type: string; no: string; status: string }[];
	kiranas: { kirana: string; name: string; units: number }[];
	offered: number;
	kirana: { planned: number; ordered: number } | null;
	partner: { name: string } | null;
	destruction?: {
		units: number;
		agency: { name: string };
		photos?: Record<string, { name: string; at: string }>;
		checks: { id: string; label: string; ok: boolean }[];
		checkedAt?: string | null;
		approvedAt?: string | null;
	} | null;
};
const CASES = (history as unknown as { cases: Case[] }).cases;

const rate = (n: number) => '₹' + n.toFixed(2);
const num = fmt.num;
const weekday = (iso: string) =>
	new Date(iso.slice(0, 10) + 'T00:00:00+05:30').toLocaleDateString('en-IN', {
		weekday: 'long',
		timeZone: 'Asia/Kolkata'
	});
const addDays = (iso: string, n: number) => {
	const t = new Date(iso.slice(0, 10) + 'T00:00:00Z');
	t.setUTCDate(t.getUTCDate() + n);
	return t.toISOString().slice(0, 10);
};
const agentOf = (name: string): RecordWho => ({
	kind: 'agent',
	id: name.toLowerCase().replace(/ agent$/, ''),
	name,
	org: null
});
const personOf = (p: { id?: string | null; name: string; org?: string | null }): RecordWho => ({
	kind: 'person',
	id: p.id ?? null,
	name: p.name,
	org: p.org ?? null
});
const people = () => D.people as Record<string, StoryPerson>;
const byOrg = (org: string, name?: string) =>
	Object.values(people()).find((p) => p.org === org) ?? { id: null, name: name ?? org, org };
const sortAt = (rows: RecordStep[]) =>
	rows
		.map((r, i) => [r, i] as const)
		.sort((a, z) => (a[0].at < z[0].at ? -1 : a[0].at > z[0].at ? 1 : a[1] - z[1]))
		.map((x) => x[0]);
const LINE: Record<string, string> = {
	kirana: 'to the kiranas',
	expiresoon: 'on ExpireSoon',
	staff: 'to the staff sale',
	foodbank: 'to the food bank'
};

export const historyCase = (ref: string) => CASES.find((c) => c.ref === ref) ?? null;

/** a batch of the history: every step, from its own stamps */
export function recordOf(c: Case): BatchRecord {
	const at = (k: string) => c.steps.find((s) => s.step === k)?.at ?? null;
	const out: RecordStep[] = [];
	const add = (key: string, who: RecordWho, text: string, t: string | null | undefined, x?: Partial<RecordStep>) => {
		if (t) out.push({ key, at: t, who, text, yes: YES.includes(key), ...x });
	};
	const dist = D.distributors[c.dist],
		sku = D.skus[c.sku];
	const planned = (id: string) => c.plan.lines.find((l) => l.id === id && l.units > 0) ?? null;
	const took = (id: string) => c.realised.lines.find((l) => l.id === id && l.units > 0) ?? null;
	const doc = (id: string) => c.docs.find((d) => d.id === id && d.status !== 'not required');
	const who = personOf(byOrg(dist.name)),
		priya = personOf(people().priya),
		buyer = personOf(byOrg(D.buyer.name, D.buyer.name));
	const kl = planned('kirana'),
		es = planned('expiresoon'),
		fb = planned('foodbank'),
		xd = c.destruction;
	const mfg = c.batch.mfg ?? addDays(c.batch.bestBefore, -sku.lifeDays);
	const split = c.plan.lines
		.filter((l) => l.units > 0 && l.id !== 'writeoff')
		.map((l) => `${num(l.units)} ${LINE[l.id] ?? l.id}`)
		.join(', ');
	add(
		'watch',
		agentOf('Watcher'),
		`Flagged ${num(c.plan.units)} of ${num(c.batch.units)} packs at ${dist.godown}: ${c.batch.daysLeft} days left, failing every quick-commerce gate`,
		at('detect')
	);
	add('photo.send', who, 'sent the label photo', at('photo'));
	add(
		'read',
		agentOf('Vision'),
		`Read the label: batch ${c.ref}, made ${fmt.date(mfg)}, best before ${fmt.date(c.batch.bestBefore)}, MRP ${rate(sku.mrp)}. Matches the DMS record`,
		at('read')
	);
	add('value', agentOf('Valuer'), `Priced every exit against ${c.batch.daysLeft} days left`, at('value'));
	add('route', agentOf('Router'), `Split the batch: ${split}; ${fmt.inr(c.plan.net)} planned`, at('route'));
	add('plan.approve', priya, `approved the plan · net ${fmt.inr(c.plan.net)}`, at('approve'));
	if (es)
		add(
			'list',
			agentOf('Lister'),
			`Listed ${num(es.units)} on ExpireSoon in ${dist.name}' name (${c.numbers.listing})`,
			at('listing')
		);
	if (kl)
		add(
			'outreach',
			agentOf('Outreach'),
			`Sent the scheme to ${c.offered} kiranas: buy 10, get 2, for 48 hours`,
			at('offer')
		);
	if (fb && c.partner)
		add('donation', agentOf('Donation'), `Booked ${c.partner.name} for ${num(fb.units)} packs`, at('donation'));
	if (kl && c.kiranas.length)
		add(
			'offer.order',
			{ kind: 'person', id: null, name: `${c.kiranas.length} kiranas`, org: `${dist.name}' scheme` },
			`ordered ${num(c.kiranas.reduce((t, k) => t + k.units, 0))} packets`,
			at('orders'),
			{
				items: c.kiranas.map((k) => ({
					who: { kind: 'person', id: null, name: shopName(k.kirana), org: null },
					text: `ordered ${num(k.units)} packets`,
					at: at('orders')!
				}))
			}
		);
	if (c.award) {
		add('listing.bid', buyer, `bid ${rate(c.award.bid)} on ${c.numbers.listing}`, at('bid'));
		add('counter', agentOf('Negotiator'), `Countered at ${rate(c.award.price)}`, at('counter'));
		add(
			'listing.accept',
			buyer,
			`accepted ${rate(c.award.price)} and paid the ${fmt.inr(c.award.token)} token`,
			at('accept')
		);
	}
	const fbr = took('foodbank');
	if (fbr && c.partner)
		add(
			'donation.collect',
			personOf(byOrg(c.partner.name, c.partner.name)),
			`collected ${num(fbr.units)} packs`,
			at('collect')
		);
	if (kl && c.kirana)
		add(
			'closeOffer',
			agentOf('Outreach'),
			`The scheme closed: ${num(c.kirana.ordered)} of ${num(c.kirana.planned)} packets ordered`,
			at('closeOffer')
		);
	const st = took('staff');
	if (st) add('staff.record', who, `recorded the staff sale: ${num(st.units)} packs`, at('staff'));
	if (c.award) add('dispatch.truck', who, `loaded ${D.buyer.name}'s truck`, at('truck'));
	add(
		'papers',
		agentOf('Paperwork'),
		`Drafted the pack: ${['invoice', 'support', 'itc', 'fssai']
			.map(doc)
			.filter((d) => !!d)
			.map((d) => (/^s\./.test(d!.no) || !d!.no ? d!.type : d!.no))
			.join(', ')}`,
		at('papers')
	);
	const inv = doc('invoice');
	if (inv) add('invoice.issue', who, `issued ${inv.no} from Tally`, at('invoice'));
	if (kl)
		add('dispatch.van', who, `ran the ${weekday(at('van') ?? c.cleared)} round: ${c.kiranas.length} drops`, at('van'));
	add('docs.review', priya, `reviewed ${D.workspace.short}'s credit note and GST memo`, at('review'));
	if (xd) {
		add(
			'destroyAsk',
			agentOf('Impact'),
			`Asked ${dist.name} to destroy the ${num(xd.units)} packs left at ${dist.godown}`,
			at('destroyAsk')
		);
		add(
			'destruction.send',
			who,
			`sent the destruction's evidence: ${num(xd.units)} packs, ${xd.agency.name}`,
			at('destroySent')
		);
		add(
			'destroyChecked',
			agentOf('Vision'),
			`Checked the destruction's evidence: ${xd.checks.filter((x) => x.ok).length} of ${xd.checks.length} checks pass`,
			xd.checkedAt
		);
		add(
			'destruction.approve',
			priya,
			`approved the destruction of ${num(xd.units)} packs at ${dist.godown}`,
			xd.approvedAt
		);
	}
	add('ledger', agentOf('Impact'), `Posted the ledger: ${fmt.inr(c.actual.net)} recovered`, at('report'));
	return { ref: c.ref, steps: sortAt(out), photos: photosOf(c) };
}

/** the story's batch, in a journey: its feed in order (the agents' runs and each person's step), without the
 *  workspace's setup or another batch's rows, and the decisions only its audit keeps (the papers' review after the
 *  pack, the BRSR sign-off after the ledger). The stub's times are its own (09:19, Mon 5 Oct): kept as they are */
export function storyRecord(s: State): BatchRecord {
	const hero = D.batches.find((b) => b.hero)!,
		others = D.batches.filter((b) => !b.hero).map((b) => b.id);
	const KEY: Record<string, string> = { approved: 'plan.approve', destroyApproved: 'destruction.approve' };
	const person = (id: string) => personOf(people()[id] ?? { id, name: id });
	const rows: RecordStep[] = s.feed
		.filter(
			(e) =>
				e.stage !== 'connect' &&
				!/^Mango Drink batch/.test(e.text ?? '') &&
				!others.some((id) => (e.text ?? '').includes(id))
		)
		.map((e) => {
			const key = KEY[e.key ?? ''] ?? e.key ?? 'step';
			return {
				key,
				at: e.at,
				who: e.agent ? agentOf(e.agent) : person(e.person ?? ''),
				text: e.text,
				yes: YES.includes(key)
			};
		});
	const after = (key: string, row: RecordStep) => {
		const i = rows.map((r) => r.key).lastIndexOf(key);
		if (i >= 0) rows.splice(i + 1, 0, row);
		else rows.push(row);
	};
	s.audit
		.filter((a) => a.target === hero.id && /reviewed|signed off/.test(a.what))
		.slice()
		.reverse()
		.forEach((a) => {
			const key = /reviewed/.test(a.what) ? 'docs.review' : 'report.signoff';
			after(key === 'docs.review' ? 'papers' : 'ledger', {
				key,
				at: a.at,
				who: person(a.who),
				text: a.what,
				yes: YES.includes(key)
			});
		});
	return { ref: hero.id, steps: rows, photos: storyPhotos(s) };
}

/** the photos sent for a history batch: its label photo, with what Vision read, and the destruction's two, with Vision's
 *  checks (img: the file under design3's system/img/) */
export function photosOf(c: Case): RecordPhoto[] {
	const out: RecordPhoto[] = [];
	const dp = byOrg(D.distributors[c.dist].name),
		sku = D.skus[c.sku],
		xd = c.destruction;
	const at = (k: string) => c.steps.find((s) => s.step === k)?.at ?? null;
	const sent = at('photo');
	const mfg = c.batch.mfg ?? addDays(c.batch.bestBefore, -sku.lifeDays);
	if (sent)
		out.push({
			id: 'label',
			img: `labels/${c.ref}.webp`,
			at: sent,
			by: dp.name,
			read: { at: at('read'), batch: c.ref, mfg, bestBefore: c.batch.bestBefore, mrp: sku.mrp, matches: true }
		});
	if (xd?.photos)
		for (const w of ['before', 'after'] as const)
			if (xd.photos[w])
				out.push({
					id: w,
					img: `evidence/${xd.photos[w].name}`,
					at: xd.photos[w].at,
					by: dp.name,
					checks: xd.checks.filter((x) => (w === 'before' ? ['batch', 'count'] : ['slate', 'when']).includes(x.id))
				});
	return out;
}

/** the story's batch: its label photo once Rakesh has sent it, and the destruction's two once he has sent them */
export function storyPhotos(s: State): RecordPhoto[] {
	const hero = D.batches.find((b) => b.hero)!,
		sku = D.skus[hero.sku],
		h = s.hero,
		out: RecordPhoto[] = [];
	const at = (t: string | null | undefined) => (/^\d\d:\d\d$/.test(t ?? '') ? `${D.day0}T${t}` : D.day0);
	const rakesh = people().rakesh.name;
	const photo = h.photo as { status?: string; at?: string } | null;
	if (photo && photo.status && photo.status !== 'requested' && photo.status !== 'none')
		out.push({
			id: 'label',
			img: `labels/${hero.id}.webp`,
			at: at(photo.at),
			by: rakesh,
			read:
				photo.status === 'verified'
					? {
							at: at(photo.at),
							batch: hero.id,
							mfg: hero.mfg ?? addDays(hero.bestBefore, -sku.lifeDays),
							bestBefore: hero.bestBefore,
							mrp: sku.mrp,
							matches: true
						}
					: null
		});
	const xd = h.destruction;
	if (xd?.photos)
		for (const w of ['before', 'after'] as const)
			if (xd.photos[w])
				out.push({
					id: w,
					img: `evidence/${hero.id}-${w}.webp`,
					at: at(xd.photos[w].at),
					by: rakesh,
					checks: (xd.checks ?? []).filter((x) =>
						(w === 'before' ? ['batch', 'count'] : ['slate', 'when']).includes(x.id)
					)
				});
	return out;
}

/** a shop by its id: one of the story's 31, else another of the distributors' shops */
function shopName(id: string) {
	return SHOPS_ALL.find((k) => k.id === id)?.name ?? D.kiranas.find((k) => k.id === id)?.name ?? id;
}
