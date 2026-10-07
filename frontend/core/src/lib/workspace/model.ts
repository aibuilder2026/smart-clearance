// What the screens work out from the journey's state and the workspace's data (design3/screens: common.jsx, roles.jsx,
// admin.jsx, trade.jsx): the batch in focus's live model, each role's navigation, and the small rules the screens
// share. Everything here takes its data as arguments: the screens read it from their source (source.ts), never from
// the stub's seed, so this module works the same over the stub and over backend-api.
import type { NavItem } from '../components/Shell.svelte';
import { fmt } from '../format';
import type {
	Batch,
	BatchView,
	CaseData,
	Distributor,
	Kirana,
	Phase,
	RoleId,
	Sku,
	Stage,
	State,
	User,
	Workspace,
	WorkspaceData
} from './types';

/* ---------- the batch in focus, read from the state ---------- */

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

/** a batch with its SKU and distributor */
export const viewOf = (b: Batch, data: Pick<WorkspaceData, 'skus' | 'distributors'>): BatchView => ({
	...b,
	skuObj: data.skus[b.sku],
	dist: data.distributors[b.distributor]
});

/** which stage is active (0–8), or 9 when the batch is cleared; shops: how many kiranas the scheme waits for */
export function stageAt(state: State, shops: number) {
	const h = state.hero;
	const all = h.orders.length === shops;
	if (!state.setup.confirmed || !state.setup.permission) return 0;
	if (h.phase === 'watching') return 1;
	if (h.photo.status !== 'verified') return 2;
	if (h.phase === 'verified') return 3;
	if (h.phase === 'valued') return 4;
	if (h.phase === 'planned') return 5;
	if (h.phase === 'approved') return 6;
	if (h.phase === 'executing') return h.award && all ? 7 : 6;
	if (h.phase === 'dispatched') return 7;
	if (h.phase === 'settled') return h.van.status === 'done' && h.shelf ? 8 : 7;
	return 9;
}

/** the batch in focus: phase, tracker position, ETA, which agent is working */
export function heroModel(s: State, data: Pick<WorkspaceData, 'skus' | 'distributors'>, c: CaseData) {
	const h = s.hero;
	const view: BatchView = viewOf(c.batch, data);
	const idx = stageAt(s, c.kiranas.length);
	view.phase = PHASE_STATUS[h.phase];
	const ordered = h.orders.length;
	const orderedUnits = h.orders.reduce((t, o) => t + o.units, 0);
	let eta = '';
	let etaTone: 'green' | 'amber' | undefined = 'green';
	let agentLive = '';
	if (h.phase === 'watching') {
		eta = `Watcher runs daily at ${s.rules.watchTime}`;
		etaTone = undefined;
	} else if (h.phase === 'at-risk') {
		eta = h.photo.status === 'reading' ? 'Reading the label' : `Plan ready in about ${c.planMinutes} min`;
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
			? `Awarded at ${fmt.rate(c.counter.price)} · ${ordered} of ${c.kiranas.length} kiranas ordered`
			: `Listing live · ${ordered} of ${c.kiranas.length} kiranas ordered`;
		agentLive = h.award && ordered === c.kiranas.length ? '' : 'Lister, Outreach and Negotiator at work';
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
		plan: c.plan
	};
}

/** every batch the Watcher sees, the one in focus at its phase and the one being donated in motion */
export const batchViews = (s: State, data: Pick<WorkspaceData, 'skus' | 'distributors' | 'batches'>) => {
	const phase = PHASE_STATUS[s.hero.phase];
	return data.batches.map((b) => {
		const v = viewOf(b, data);
		if (b.hero) v.phase = phase;
		if (b.second) v.phase = 'executing';
		return v;
	});
};

export const unreadFor = (s: State, me: { id: string } | null | undefined) =>
	s.notifications.filter((n) => n.to === me?.id && !n.read).length;

/** someone in the story, or an account in the state */
export const personById = (
	id: string,
	data: Pick<WorkspaceData, 'people'>,
	s: State
): { id?: string; name: string; short?: string; img?: string } =>
	data.people[id] || s.users.find((u) => u.id === id) || { name: id };

/** a distributor's one-time permission: the one in focus as the state holds it, the others as the workspace's setup */
export function permissionOf(
	s: State,
	id: string,
	data: Pick<WorkspaceData, 'setup'>,
	c: Pick<CaseData, 'dist'>
): { tone?: 'green' | 'amber'; label: string } {
	if (id === c.dist.id) {
		const p = s.setup.permission;
		return p
			? p.paused
				? { tone: 'amber', label: 'paused' }
				: { tone: 'green', label: 'granted · ' + p.at }
			: { label: 'requested' };
	}
	return data.setup.permissions[id]
		? { tone: 'green', label: 'granted · ' + data.setup.permissions[id] }
		: { label: 'requested' };
}

/** the stages as the trackers draw them, with their times, and with who acts (the compact tracker's sheet) */
export const track = (stages: Stage[]) => stages.map((s) => ({ id: s.id, title: s.title, human: s.human }));
export const stageTimes = (stages: Stage[]): Record<string, string> =>
	Object.fromEntries(stages.map((s) => [s.id, s.time]));
export const trackTimed = (stages: Stage[]) =>
	stages.map((s) => ({ id: s.id, title: s.title, human: s.human, time: s.time, text: s.who }));

/** an ISO date n days on (or back) */
export const addDays = (iso: string, n: number) => {
	const d = new Date(iso + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
};

/* ---------- the people and the products of the story ---------- */

/** who plays each part in the batch's story, from the workspace's members: the operator who approves, the batch's
 *  distributor, the first kirana that orders, the buyer, the food bank that takes the donation, finance and
 *  sustainability */
export function castOf(s: State, c: Pick<CaseData, 'dist' | 'kiranas' | 'buyer' | 'donation'>) {
	const by = (r: RoleId, org?: string) => s.users.find((u) => u.role === r && (!org || u.org === org))!;
	return {
		operator: by('operator'),
		distributor: by('distributor', c.dist.name),
		kirana: by('retailer', c.kiranas[0].name),
		buyer: by('buyer', c.buyer.name),
		foodbank: by('foodbank', c.donation.partner.name),
		finance: by('finance'),
		sustainability: by('sustainability')
	};
}
/** the first word of a name, as people say it: Rakesh, of Rakesh bhai; Lakshmi, of Lakshmi Agencies */
export const first = (name: string) => name.split(' ')[0];
const SIZE = /\s+(\d[\d.]*\s?(?:g|ml|kg|L))$/;
/** a product's name without its pack size (Masala Chips), and the size (150 g) */
export const productName = (sku: Pick<Sku, 'name'>) => sku.name.replace(SIZE, '');
export const packSize = (sku: Pick<Sku, 'name'>) => SIZE.exec(sku.name)?.[1] ?? '';

/* ---------- the trade ---------- */

/** the distributor a person works for; the batch's own unless they work for another */
export const distOf = (
	me: { org?: string } | null | undefined,
	data: Pick<WorkspaceData, 'distributors'>,
	c: Pick<CaseData, 'dist'>
): Distributor => Object.values(data.distributors).find((d) => d.name === me?.org) || c.dist;
/** the kirana a person runs; the first that ordered unless they run another */
export const kOf = (me: { org?: string } | null | undefined, c: Pick<CaseData, 'kiranas'>): Kirana =>
	c.kiranas.find((k) => k.name === me?.org) || c.kiranas[0];
/** packets as cartons of `per` */
export const cartons = (u: number, per: number) => {
	const c = Math.floor(u / per);
	const r = u % per;
	return r * 2 === per ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? '' : 's'}`;
};
/** the scheme: pay the pack price for `buy` of every `buy + free`, sell them all at MRP */
export const offerMath = (n: number, c: Pick<CaseData, 'lines' | 'sku' | 'scheme'>) => {
	const lot = c.scheme.buy + c.scheme.free;
	const free = Math.floor(n / lot) * c.scheme.free;
	const paid = n - free;
	const pack = c.lines.kirana.packPrice!;
	return { n, free, paid, pack, pay: paid * pack, sell: n * c.sku.mrp, margin: n * c.sku.mrp - paid * pack };
};

/* ---------- people and their access ---------- */

export const PROVIDERS: Record<User['provider'], string> = {
	google: 'Google',
	phone: 'Phone code',
	expiresoon: 'ExpireSoon sign-in'
};
/** how each kind of member is described, in the workspace's own name */
export const kinds = (ws: Pick<Workspace, 'short'>): Record<User['kind'], string> => ({
	staff: `${ws.short} staff`,
	partner: 'Invited partner',
	external: 'Outside the workspace'
});
export const STATUS_TONE: Record<User['status'], 'green' | 'blue' | undefined> = {
	active: 'green',
	invited: 'blue',
	deactivated: undefined
};
export const providerOf = (u: Pick<User, 'provider' | 'kind'>) =>
	u.provider === 'google' ? (u.kind === 'staff' ? 'Google Workspace' : 'Google, invited') : PROVIDERS[u.provider];
/** a role's name, in lower case, as a sentence says it */
export const role = (r: RoleId, roles: Record<RoleId, string>) => (roles[r] || r).toLowerCase();

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
