// What the screens work out from the store and the seed (design3/screens: common.jsx, roles.jsx, admin.jsx,
// trade.jsx): the hero batch's live model, each role's navigation, and the small rules the screens share.
import type { NavItem } from '../components/Shell.svelte';
import { fmt } from '../format';
import { CHIPS, D, KL, batchView } from './data';
import { stageOf } from './flow';
import { store } from './store.svelte';
import type { BatchView, Phase, RoleId, State, User } from './types';

/* ---------- the hero batch, read from the store ---------- */

export const PHASE_STATUS: Record<Phase, string> = {
	watching: 'watching',
	'at-risk': 'at-risk',
	verified: 'routing',
	valued: 'routing',
	planned: 'awaiting',
	approved: 'executing',
	executing: 'executing',
	dispatched: 'dispatched',
	settled: 'settled',
	cleared: 'cleared'
};

/** the phases from the approval on, and from the papers on */
export const ROUTED: Phase[] = ['approved', 'executing', 'dispatched', 'settled', 'cleared'];
export const isRouted = (p: Phase) => ROUTED.includes(p);

/** the hero batch: phase, tracker position, ETA, which agent is working */
export function heroModel(s: State) {
	const h = s.hero;
	const view: BatchView = batchView(D.batches[0]);
	const idx = stageOf(s);
	view.phase = PHASE_STATUS[h.phase];
	const ordered = h.orders.length;
	const orderedUnits = h.orders.reduce((t, o) => t + o.units, 0);
	let eta = '';
	let etaTone: 'green' | 'amber' | undefined = 'green';
	let agentLive = '';
	if (h.phase === 'watching') {
		eta = 'Watcher runs daily at 09:00';
		etaTone = undefined;
	} else if (h.phase === 'at-risk') {
		eta = h.photo.status === 'reading' ? 'Reading the label' : 'Plan ready in about 20 min';
		agentLive =
			h.photo.status === 'reading'
				? 'Vision is reading the label'
				: h.photo.status === 'requested'
					? 'Vision is waiting for the label photo'
					: 'Vision is asking for a label photo';
	} else if (h.phase === 'verified') {
		eta = 'Pricing five channels';
		agentLive = 'Valuer is pricing five channels';
	} else if (h.phase === 'valued') {
		eta = 'Splitting the batch';
		agentLive = 'Router is splitting the batch';
	} else if (h.phase === 'planned') {
		eta = 'Waiting for your approval';
		etaTone = 'amber';
	} else if (h.phase === 'approved' || h.phase === 'executing') {
		eta = h.award
			? `Awarded at ₹${D.counter.price.toFixed(2)} · ${ordered} of ${D.kiranas.length} kiranas ordered`
			: `Listing live · ${ordered} of ${D.kiranas.length} kiranas ordered`;
		agentLive = h.award && ordered === D.kiranas.length ? '' : 'Lister, Outreach and Negotiator at work';
	} else if (h.phase === 'dispatched') {
		eta = 'Paperwork in progress';
		agentLive = 'Paperwork is drafting the pack';
	} else if (h.phase === 'settled') {
		eta = 'Papers ready · ledger next';
		agentLive = 'Impact is posting the ledger';
	} else if (h.phase === 'cleared') eta = 'Cleared · 0 cartons destroyed';
	return {
		h,
		view,
		idx,
		done: Math.min(idx, 9),
		current: idx < 9 ? idx : -1,
		eta,
		etaTone,
		agentLive,
		ordered,
		orderedUnits,
		plan: D.plan
	};
}

/** every batch the Watcher sees, the hero at its phase and the Mango Drink batch in motion */
export const batchViews = (s: State) => {
	const phase = PHASE_STATUS[s.hero.phase];
	return D.batches.map((b) => {
		const v = batchView(b);
		if (b.hero) v.phase = phase;
		if (b.second) v.phase = 'executing';
		return v;
	});
};

export const unreadFor = (s: State, me: { id: string } | null | undefined) =>
	s.notifications.filter((n) => n.to === me?.id && !n.read).length;

/** someone in the story, or an account in the store */
export const personById = (id: string): { id?: string; name: string; short?: string; img?: string } =>
	D.people[id] || store.get().users.find((u) => u.id === id) || { name: id };

/** a distributor's one-time permission, as the store holds it */
export function permissionOf(s: State, id: string): { tone?: 'green' | 'amber'; label: string } {
	if (id === 'rakesh') {
		const p = s.setup.permission;
		return p
			? p.paused
				? { tone: 'amber', label: 'paused' }
				: { tone: 'green', label: 'granted · ' + p.at }
			: { label: 'requested' };
	}
	return D.setup.permissions[id]
		? { tone: 'green', label: 'granted · ' + D.setup.permissions[id] }
		: { label: 'requested' };
}

/* ---------- the trade ---------- */

/** the distributor a person works for; Rakesh Traders unless they work for another */
export const distOf = (me: { org?: string } | null | undefined) =>
	Object.values(D.distributors).find((d) => d.name === me?.org) || D.distributors.rakesh;
/** the kirana a person runs; Shree Ganesh Kirana unless they run another */
export const kOf = (me: { org?: string } | null | undefined) =>
	D.kiranas.find((k) => k.name === me?.org) || D.kiranas[0];
/** packets as cartons of 24 */
export const cartons = (u: number) => {
	const c = Math.floor(u / 24);
	const r = u % 24;
	return r === 12 ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? '' : 's'}`;
};
/** the scheme: pay the pack price for 10 of every 12, sell all 12 at MRP */
export const offerMath = (n: number) => {
	const free = Math.floor(n / 12) * 2;
	const paid = n - free;
	const pack = KL.packPrice!;
	return { n, free, paid, pack, pay: paid * pack, sell: n * CHIPS.mrp, margin: n * CHIPS.mrp - paid * pack };
};

/* ---------- people and their access ---------- */

export const ROLES = D.roles;
export const PROVIDERS: Record<User['provider'], string> = {
	google: 'Google',
	phone: 'Phone code',
	expiresoon: 'ExpireSoon sign-in'
};
export const KINDS: Record<User['kind'], string> = {
	staff: 'Munchly staff',
	partner: 'Invited partner',
	external: 'Outside the workspace'
};
export const STATUS_TONE: Record<User['status'], 'green' | 'blue' | undefined> = {
	active: 'green',
	invited: 'blue',
	deactivated: undefined
};
export const providerOf = (u: Pick<User, 'provider' | 'kind'>) =>
	u.provider === 'google' ? (u.kind === 'staff' ? 'Google Workspace' : 'Google, invited') : PROVIDERS[u.provider];
export const role = (r: RoleId) => (ROLES[r] || r).toLowerCase();

/* ---------- each role's navigation (screens/roles.jsx) ---------- */

export const NAV: Record<RoleId, NavItem[]> = {
	operator: [
		{ id: 'command', label: 'Command Center', short: 'Today', icon: 'layout-dashboard' },
		{ id: 'route', label: 'Route Room', short: 'Route', icon: 'route' },
		{ id: 'execution', label: 'Execution', short: 'Live', icon: 'activity' },
		{ id: 'batches', label: 'Batches', icon: 'boxes' },
		{ id: 'setup', label: 'Setup', icon: 'sliders-horizontal', phoneHidden: true },
		{
			id: 'report',
			label: 'Finance & ESG',
			short: 'Reports',
			icon: 'chart-line',
			section: 'Reports',
			phoneHidden: true
		}
	],
	distributor: [
		{ id: 'home', label: 'Today', icon: 'house' },
		{ id: 'photo', label: 'Label photo', short: 'Photo', icon: 'camera' },
		{ id: 'van', label: 'Van route', short: 'Van', icon: 'truck' },
		{ id: 'orders', label: 'Orders', icon: 'clipboard-list' }
	],
	retailer: [
		{ id: 'home', label: 'Offers', icon: 'tag' },
		{ id: 'orders', label: 'Orders', icon: 'shopping-basket' }
	],
	buyer: [
		{ id: 'market', label: 'Marketplace', short: 'Market', icon: 'store' },
		{ id: 'bids', label: 'My bids', short: 'Bids', icon: 'gavel' }
	],
	finance: [
		{ id: 'paperwork', label: 'Paperwork', icon: 'file-text' },
		{ id: 'report', label: 'Finance & ESG', short: 'Reports', icon: 'chart-line' },
		{ id: 'batches', label: 'Batches', icon: 'boxes' }
	],
	sustainability: [
		{ id: 'report', label: 'Finance & ESG', short: 'Reports', icon: 'chart-line' },
		{ id: 'paperwork', label: 'Evidence', icon: 'file-text' },
		{ id: 'batches', label: 'Batches', icon: 'boxes' }
	],
	foodbank: [{ id: 'pickups', label: 'Pickups', icon: 'heart-handshake' }],
	admin: [
		{ id: 'workspace', label: 'Workspace', icon: 'building-2' },
		{ id: 'users', label: 'Users', icon: 'users' },
		{ id: 'rules', label: 'Guardrails', icon: 'shield' },
		{ id: 'integrations', label: 'Integrations', short: 'Apps', icon: 'plug', phoneHidden: true },
		{ id: 'audit', label: 'Audit log', short: 'Audit', icon: 'scroll-text' }
	]
};
/** where each role starts */
export const HOME: Record<RoleId, string> = {
	operator: 'command',
	distributor: 'home',
	retailer: 'home',
	buyer: 'market',
	finance: 'paperwork',
	sustainability: 'report',
	foodbank: 'pickups',
	admin: 'workspace'
};
/** a screen that isn't in the navigation lights its parent */
export const PARENT: Record<string, string> = { listing: 'market', offer: 'home' };
const ALWAYS = ['inbox', 'profile'];
/** every screen a role may open */
export const routesFor = (r: RoleId) =>
	NAV[r]
		.map((n) => n.id)
		.concat(ALWAYS, r === 'buyer' ? ['listing'] : r === 'retailer' ? ['offer'] : r === 'operator' ? ['paperwork'] : []);
/** every screen name the app knows, across the roles */
export const SCREENS = Array.from(new Set((Object.keys(NAV) as RoleId[]).flatMap(routesFor)));

/* ---------- exports ---------- */

/** a file the reader saves, made in the browser */
export function download(name: string, text: string, type = 'text/csv') {
	const url = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const csv = (rows: (string | number | null | undefined)[][]) =>
	rows
		.map((r) =>
			r
				.map((c) => {
					const v = String(c == null ? '' : c);
					return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
				})
				.join(',')
		)
		.join('\n');

export { fmt };
