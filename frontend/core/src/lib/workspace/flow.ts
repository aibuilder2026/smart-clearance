// The journey as deterministic actions, and the agents that chain them (design3/core/flow.js). The app lets the
// agents run live: after every change the reconciler works out the next thing an agent would do (or a partner the
// person is not playing) and schedules it once.
import { fmt } from '../format';
import { D, EV, PLAN, SHOPS_ALL } from './data';
import { stageAt } from './model';
import { store } from './store.svelte';
import type { State } from './types';

let nid = 0;
const id = (p: string) => p + '-' + Date.now().toString(36) + '-' + ++nid;
const feed = (s: State, ev: State['feed'][number]) => void s.feed.push({ id: id('ev'), ...ev });
const notify = (s: State, to: string, n: Omit<State['notifications'][number], 'id' | 'to' | 'read'>) =>
	void s.notifications.unshift({ id: id('n'), to, read: false, ...n });
const audit = (s: State, who: string, what: string, target: string, at?: string) =>
	void s.audit.unshift({ id: id('a'), who, what, target, at: at || 'now' });
const all = (s: State) => s.hero.orders.length >= D.kiranas.length;
const P = D.push;

// each action changes a draft of the store; names follow the journey map
export const A = {
	connect: (s: State) => {
		s.setup.confirmed = true;
		s.setup.mapped = 8;
		feed(s, D.connectEvent);
		audit(s, 'priya', 'confirmed DMS mapping and guardrails', 'Setup', 'Thu 16:41');
	},
	// Rakesh Traders lets the agent act in his name, inside Munchly's floors; he can pause it at any time
	permit: (s: State) => {
		if (s.setup.permission) return;
		s.setup.permission = { by: 'rakesh', at: 'Thu 16:52', paused: false };
		feed(s, EV('permit'));
		audit(
			s,
			'rakesh',
			'gave the one-time permission to act in his name',
			"Rakesh Traders · inside Munchly's floors",
			'Thu 16:52'
		);
		notify(s, 'priya', {
			title: 'Rakesh Traders is set up',
			body: 'Rakesh bhai signed in and allowed listings, scheme offers, invoice drafts and dispatch slots in his name, inside your floors.',
			at: 'Thu 16:52',
			link: 'setup'
		});
	},
	pause: (s: State, on?: boolean) => {
		const p = s.setup.permission;
		if (!p) return;
		p.paused = !!on;
		audit(s, 'rakesh', on ? 'paused the agent' : 'resumed the agent', 'Rakesh Traders · one-time permission');
		notify(
			s,
			'priya',
			on
				? {
						title: 'Rakesh Traders paused the agent',
						body: 'Nothing more is listed, offered or invoiced in his name until he resumes.',
						at: 'now',
						link: 'command'
					}
				: {
						title: 'Rakesh Traders resumed the agent',
						body: 'The agents pick up where they stopped.',
						at: 'now',
						link: 'command'
					}
		);
	},
	join: (s: State, uid?: string) => {
		const u = s.users.find((x) => x.id === uid);
		if (!u || u.status !== 'invited') return;
		u.status = 'active';
		audit(s, u.id, "joined Munchly Foods' workspace", u.invitedBy ? 'invited by ' + u.invitedBy : D.workspace.domain);
	},
	detect: (s: State) => {
		s.hero.phase = 'at-risk';
		feed(s, EV('watch'));
		notify(s, 'priya', { link: 'command', ...P.detect });
	},
	requestPhoto: (s: State) => {
		s.hero.photo = { status: 'requested', at: '09:05' };
		feed(s, EV('ask'));
		notify(s, 'rakesh', { link: 'photo', ...P.verify, hindi: false });
	},
	sendPhoto: (s: State) => {
		s.hero.photo = { status: 'reading', at: '09:19' };
		feed(s, EV('photo'));
		audit(s, 'rakesh', 'sent the label photo', 'MF-2409-117', '09:19');
	},
	verify: (s: State) => {
		s.hero.photo = { status: 'verified', at: '09:20', confidence: 0.97 };
		s.hero.phase = 'verified';
		feed(s, EV('read'));
	},
	value: (s: State) => {
		s.hero.phase = 'valued';
		feed(s, EV('value'));
	},
	decide: (s: State) => {
		s.hero.phase = 'planned';
		s.hero.plan = { status: 'proposed', at: '09:22' };
		feed(s, EV('route'));
		feed(s, EV('notify'));
		notify(s, 'priya', { link: 'route', ...P.plan });
	},
	approve: (s: State, by?: string) => {
		s.hero.phase = 'approved';
		s.hero.plan = { status: 'approved', at: '09:40', by: by || 'priya', device: 'phone' };
		feed(s, EV('approved'));
		audit(s, by || 'priya', 'approved the plan', 'MF-2409-117 · net ' + fmt.inr(PLAN.net), '09:40');
		notify(s, 'rakesh', { link: 'home', ...P.approved });
	},
	list: (s: State) => {
		s.hero.phase = 'executing';
		s.hero.listing = { id: 'ES-24117', status: 'live', units: 772, price: 15, reserve: 13.5, at: '09:41' };
		feed(s, EV('list'));
	},
	outreach: (s: State) => {
		s.hero.offer = { status: 'sent', at: '09:41', shops: D.offered };
		feed(s, EV('outreach'));
		notify(s, 'ganesh', { link: 'offer', ...P.offer });
	},
	// a shop's order: one of the story's 31, else another shop the scheme went to (world.js, SC-130), its share, while
	// the scheme has room; an order after Not this time takes the shop off the declined
	order: (s: State, kid?: string) => {
		const w = !D.kiranas.some((x) => x.id === kid) && SHOPS_ALL.find((x) => x.id === kid);
		const k =
			D.kiranas.find((x) => x.id === kid) ||
			(w ? { id: w.id, units: w.sales14 * D.rules.shopCapTimes, at: '10:15' } : null) ||
			D.kiranas[s.hero.orders.length];
		if (!k || s.hero.orders.some((o) => o.id === k.id)) return;
		const room = PLAN.lines.find((l) => l.id === 'kirana')!.units - s.hero.orders.reduce((t, o) => t + o.units, 0);
		if (k.units > room) return;
		if (s.hero.declined) delete s.hero.declined[k.id];
		s.hero.orders.push({ id: k.id, units: k.units, at: k.at });
		if (k.id === 'k0') audit(s, 'ganesh', 'ordered ' + k.units + ' packets', 'Masala Chips scheme', k.at);
		if (all(s)) feed(s, EV('orders'));
	},
	// Not this time (SC-130): a shop declines the open scheme; it stays open for its 48 hours if the shop changes its mind
	decline: (s: State, kid?: string) => {
		const w = SHOPS_ALL.find((x) => x.id === kid);
		if (!w || s.hero.orders.some((o) => o.id === kid)) return;
		s.hero.declined = { ...s.hero.declined, [w.id]: { at: '10:12' } };
		audit(s, w.member ?? w.id, 'declined the scheme', 'Masala Chips scheme', '10:12');
	},
	allOrders: (s: State) => {
		D.kiranas.forEach((k) => A.order(s, k.id));
	},
	bid: (s: State, price?: number) => {
		const p = price || 13;
		if (s.hero.bids.some((b) => b.status === 'placed' || b.status === 'countered')) return;
		s.hero.bids.push({ id: 'b' + (s.hero.bids.length + 1), price: p, at: '11:02', by: 'agrawal', status: 'placed' });
		s.hero.chat.push({ ...D.chat[0], text: `Can you do ₹${p % 1 ? p.toFixed(2) : p} for all 772?` });
		audit(s, 'agrawal', 'bid ₹' + p.toFixed(2), 'ES-24117', '11:02');
	},
	counter: (s: State) => {
		const b = s.hero.bids[s.hero.bids.length - 1];
		if (b) {
			b.status = 'countered';
			b.counter = D.counter.price;
		}
		s.hero.chat.push(D.chat[1]);
		feed(s, EV('counter'));
	},
	accept: (s: State) => {
		const b = s.hero.bids[s.hero.bids.length - 1];
		if (b) b.status = 'accepted';
		s.hero.chat.push(D.chat[2]);
		s.hero.award = { at: '11:09', buyer: D.buyer.name, status: 'token paid', ...D.award };
		if (s.hero.listing) s.hero.listing.status = 'awarded';
		feed(s, EV('accepted'));
		notify(s, 'priya', { link: 'execution', ...P.award });
		notify(s, 'rakesh', { link: 'orders', ...P.won });
	},
	donate: (s: State) => {
		s.mango.donation = 'booked';
		feed(s, EV('donate'));
		notify(s, 'meera', {
			title: 'Pickup request · Mango Drink',
			body: `${D.mangoFb} packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup from Begum Bazaar?`,
			at: 'Day 0',
			link: 'pickups'
		});
	},
	confirmPickup: (s: State) => {
		if (s.mango.donation !== 'booked') return;
		s.mango.donation = 'confirmed';
		audit(s, 'meera', 'confirmed the pickup, Tuesday 10:00', `MF-2410-118 · ${D.mangoFb} packs`, 'Day 1');
		notify(s, 'priya', {
			title: 'Feeding India confirmed',
			body: `${D.mangoFb} packs of Mango Drink, pickup Tuesday 10:00 from Begum Bazaar. Served at the Charminar hunger spot.`,
			at: 'Day 1',
			link: 'execution'
		});
	},
	// the staff sale, recorded once by the distributor (SC-87): the chips' plan opens none, the Mango Drink's has one at
	// Lakshmi Agencies (SC-133)
	recordStaffSale: (s: State, sold?: Arg) => {
		if (typeof sold !== 'number') return;
		const st = s.hero.staff;
		if (st && st.status === 'open') {
			Object.assign(st, { status: 'recorded', sold, left: st.units - sold });
			return;
		}
		const line = D.mangoPlan.lines.find((l) => l.id === 'staff');
		const m = s.mango;
		if (!line || !m.phase || m.phase === 'watching' || m.staff?.status === 'recorded') return;
		m.staff = { status: 'recorded', units: line.units, sold, left: line.units - sold };
		audit(
			s,
			'lakshmi-owner',
			`recorded the staff sale: ${sold} of ${line.units} packs`,
			`${m.id} · ${D.distributors.lakshmi.godown}`,
			'Day 1'
		);
	},
	collect: (s: State) => {
		s.mango.donation = 'collected';
		audit(
			s,
			'meera',
			`collected ${D.mangoFb} packs and issued ${D.mangoReceipt.type.toLowerCase()} ${D.mangoReceipt.no}`,
			'MF-2410-118',
			'Day 4'
		);
	},
	// Monday: the buyer's balance lands and his own transporter collects the lot from the godown
	dispatch: (s: State) => {
		s.hero.truck = { status: 'dispatched', at: 'Mon 5 Oct' };
		if (s.hero.award) s.hero.award.status = 'paid';
		s.hero.phase = 'dispatched';
		feed(s, EV('dispatch'));
		audit(s, 'rakesh', `loaded ${D.buyer.name}'s truck`, `ES-24117 · ${D.buyer.city}`, 'Mon 5 Oct');
	},
	settle: (s: State) => {
		s.hero.phase = 'settled';
		s.hero.docs = D.docs.map((d) => ({ id: d.id, status: d.status }));
		feed(s, EV('papers'));
		notify(s, 'priya', { link: 'paperwork', ...P.papers });
		notify(s, 'rakesh', { link: 'orders', ...P.invoice });
		notify(s, 'rakesh', { link: 'van', ...P.van });
	},
	issueInvoice: (s: State) => {
		s.hero.invoiceIssued = true;
		const inv = D.docs.find((d) => d.id === 'invoice')!;
		audit(s, 'rakesh', 'issued the invoice from Tally', inv.no + ' · ' + D.buyer.name, 'Mon 5 Oct');
	},
	review: (s: State) => {
		s.hero.reviewed = true;
		audit(s, 'priya', "reviewed Munchly's credit note and GST memo", 'MF-2409-117', 'Mon 5 Oct');
	},
	vanRound: (s: State) => {
		s.hero.van = { status: 'done', done: D.kiranas.length };
		feed(s, EV('van'));
		audit(s, 'rakesh', `ran the Tuesday round: ${D.kiranas.length} drops`, 'Nagpur cluster', 'Tue 6 Oct');
	},
	report: (s: State) => {
		s.hero.phase = 'cleared';
		s.hero.posted = true;
		feed(s, EV('ledger'));
		notify(s, 'priya', { link: 'command', ...P.closed });
		audit(s, 'priya', 'signed off the BRSR row', 'MF-2409-117', '30 Oct');
	}
};

export type ActionName = keyof typeof A;
type Arg = string | number | boolean | undefined;

// the order in which the journey happens, grouped by the stage each step belongs to; a step a person takes names them
export const SCRIPT: [string, ActionName, { arg?: Arg; human?: string }?][] = [
	['connect', 'connect'],
	['connect', 'permit', { human: 'rakesh' }],
	['detect', 'detect'],
	['verify', 'requestPhoto'],
	['verify', 'sendPhoto', { human: 'rakesh' }],
	['verify', 'verify'],
	['value', 'value'],
	['decide', 'decide'],
	['approve', 'approve', { human: 'priya' }],
	['execute', 'list'],
	['execute', 'outreach'],
	['execute', 'donate'],
	['execute', 'order', { arg: 'k0', human: 'ganesh' }],
	['execute', 'allOrders'],
	['execute', 'bid', { arg: 13, human: 'agrawal' }],
	['execute', 'counter'],
	['execute', 'accept', { human: 'agrawal' }],
	['execute', 'confirmPickup', { human: 'meera' }],
	['settle', 'dispatch', { human: 'rakesh' }],
	['settle', 'settle'],
	['settle', 'review', { human: 'priya' }],
	['settle', 'vanRound', { human: 'rakesh' }],
	['report', 'report']
];
const STAGE_IDS = D.stages.map((s) => s.id);

const call = (s: State, name: ActionName, arg?: Arg) => (A[name] as (s: State, arg?: Arg) => void)(s, arg);
/** runs one step of the journey on the store */
export const act = (name: ActionName, arg?: Arg) => store.update((s) => call(s, name, arg));
/** flow.js's name for the same */
export const run = act;
/** puts the store in the state it has when stage n begins, every earlier stage done and read (the guided demo's jump) */
export function fastForward(n: number) {
	store.reset();
	store.update((s) => {
		SCRIPT.filter(([st]) => STAGE_IDS.indexOf(st) < n).forEach(([, name, o]) => call(s, name, o?.arg));
		s.notifications.forEach((x) => (x.read = true));
	});
}

/** which stage is active (0–8), or 9 when the batch is cleared */
export const stageOf = (state: State) => stageAt(state, D.kiranas.length);

/* ---------- the agents, as a reconciler ---------- */

type Step = { name: ActionName; arg?: Arg; delay: number; partner?: string };
const ACTION_STAGE: Partial<Record<ActionName, number>> = {};
SCRIPT.forEach(([st, name]) => {
	if (!(name in ACTION_STAGE)) ACTION_STAGE[name] = STAGE_IDS.indexOf(st);
});

export const Agents = {
	live: false,
	/** partners the person is not playing answer by themselves */
	auto: false,
	maxStage: Infinity,
	pending: null as null | { key: string; step: Step; due: number; t: ReturnType<typeof setTimeout> },
	/** whether the person using the app is playing this account */
	plays: (_id: string | undefined): boolean => false,
	setLive(v: boolean) {
		Agents.live = v;
		if (!v) Agents.cancel();
		reconcile();
	},
	cancel() {
		if (Agents.pending) {
			clearTimeout(Agents.pending.t);
			Agents.pending = null;
		}
	},
	reconcile: () => reconcile(),
	/** what an agent (or a partner nobody plays) would do next, if anything: the guided demo runs it on Skip ahead */
	nextStep: (s: State) => nextStep(s),
	/** whether a step belongs to a stage the agents may reach (maxStage) */
	allowed: (name: ActionName) => allowed(name)
};

const allowed = (name: ActionName) => !(name in ACTION_STAGE) || ACTION_STAGE[name]! <= Agents.maxStage;
const ordered = (s: State, kid: string) => s.hero.orders.some((o) => o.id === kid);
// the shop's account, if it has one: in the app a shop the user is playing orders by hand
const shopUser = (s: State, name: string) => s.users.find((u) => u.role === 'retailer' && u.org === name)?.id;
function nextKirana(s: State, auto: boolean) {
	const left = D.kiranas.filter((k) => !ordered(s, k.id));
	if (!left.length) return null;
	if (!auto) return ordered(s, 'k0') ? left.filter((k) => k.id !== 'k0')[0] || null : null; // the cluster follows Ganesh ji
	const free = left.filter((k) => k.id !== 'k0' && !Agents.plays(shopUser(s, k.name)));
	return free[0] || left[0];
}
function nextStep(s: State): Step | null {
	const h = s.hero;
	const auto = Agents.auto;
	const perm = s.setup.permission;
	if (!s.setup.confirmed) return null;
	if (perm && perm.paused) return null; // Rakesh bhai paused the agent: nothing more happens in his name
	switch (h.phase) {
		case 'watching':
			return !perm
				? auto
					? { name: 'permit', delay: 6000, partner: 'rakesh' }
					: null
				: { name: 'detect', delay: 2400 };
		case 'at-risk':
			return h.photo.status === 'none'
				? { name: 'requestPhoto', delay: 1800 }
				: h.photo.status === 'requested'
					? auto
						? { name: 'sendPhoto', delay: 20000, partner: 'rakesh' }
						: null
					: h.photo.status === 'reading'
						? { name: 'verify', delay: 1900 }
						: null;
		case 'verified':
			return { name: 'value', delay: 1500 };
		case 'valued':
			return { name: 'decide', delay: 1600 };
		case 'approved':
			return { name: 'list', delay: 1000 };
		case 'executing': {
			if (!h.offer) return { name: 'outreach', delay: 800 };
			if (!s.mango.donation) return { name: 'donate', delay: 2400 };
			const last = h.bids[h.bids.length - 1];
			if (last && last.status === 'placed') return { name: 'counter', delay: 1900 };
			const k = nextKirana(s, auto);
			if (k)
				return {
					name: 'order',
					arg: k.id,
					delay: !h.orders.length ? 6000 : k.id === 'k0' ? 12000 : 260 + Math.random() * 260,
					partner: shopUser(s, k.name)
				};
			if (auto && !h.bids.length) return { name: 'bid', arg: 13, delay: 10000, partner: 'agrawal' };
			if (auto && last && last.status === 'countered') return { name: 'accept', delay: 8000, partner: 'agrawal' };
			if (auto && s.mango.donation === 'booked') return { name: 'confirmPickup', delay: 10000, partner: 'meera' };
			if (auto && h.award && all(s) && h.truck.status !== 'dispatched')
				return { name: 'dispatch', delay: 10000, partner: 'rakesh' };
			return null;
		}
		case 'dispatched':
			return { name: 'settle', delay: 1800 };
		case 'settled':
			if (h.van.status !== 'done') return auto ? { name: 'vanRound', delay: 9000, partner: 'rakesh' } : null;
			return { name: 'report', delay: 3500 };
		default:
			return null;
	}
}
const keyOf = (st: Step | null) => (st ? st.name + ':' + (st.arg ?? '') : '');
function reconcile() {
	if (!Agents.live) return;
	const st = nextStep(store.get());
	const key = keyOf(st);
	if (Agents.pending && Agents.pending.key === key) return;
	Agents.cancel();
	if (!st || !allowed(st.name) || (st.partner && Agents.plays(st.partner))) return;
	Agents.pending = {
		key,
		step: st,
		due: Date.now() + st.delay,
		t: setTimeout(() => {
			Agents.pending = null;
			if (!Agents.live) return;
			const again = nextStep(store.get());
			if (keyOf(again) === key && allowed(st.name)) act(st.name, st.arg);
			else reconcile();
		}, st.delay)
	};
}
store.subscribe(reconcile);
