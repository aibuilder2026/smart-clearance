// The live workspace onto the screens' shapes (SC-73). backend-api answers the contract (@smart-clearance/api's
// WorkspaceSnapshot and CaseDetail); the screens were built on the prototype's (core's State, WorkspaceData and
// CaseData), so the live source projects one onto the other here, purely. Times become the strings the screens were
// designed on (when.ts); a value the member's role may not see, or a step not reached yet, becomes an empty one of the
// right shape, never a figure from the story.
import type { IconName } from '@smart-clearance/core';
import type {
	Assess,
	AuditRow,
	Batch,
	Buyer,
	CaseData,
	ChannelRow,
	Distributor,
	Doc,
	FeedEvent,
	Hero,
	Integration,
	Kirana,
	Notification,
	Partner,
	Plan,
	PlanLine,
	Push,
	Sku,
	Stage,
	State,
	StoryPerson,
	Support,
	User,
	Workspace,
	WorkspaceData,
	WorkspacePublic
} from '@smart-clearance/core/workspace/app';
import type {
	CaseDetail,
	Member,
	WorkspacePublic as ApiPublic,
	WorkspaceSnapshot,
	WsAuditRow,
	WsBatch,
	WsDistributor,
	WsDoc,
	WsFeedEvent,
	WsPlan,
	WsPlanLine,
	WsSplitLine,
	WsSku,
	WsSupport,
	WsWorkspace
} from '@smart-clearance/api/workspace';
import { dateOf, dayLabel, dayMonth, dayN, dayTime, hhmm, hourWord, minutes, weekday, when } from './when';

/** the store's version the screens' State follows (core's store.svelte.ts) */
export const STATE_VERSION = 5;

const icon = (s: string | null | undefined) => (s ?? undefined) as IconName | undefined;
const opt = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

/* ---------- the workspace before sign-in ---------- */

function workspaceOf(w: WsWorkspace | ApiPublic): Workspace {
	const full = 'profile' in w ? w : null;
	return {
		id: w.id,
		name: w.name,
		short: w.short,
		domain: w.domain,
		emailDomain: w.emailDomain,
		mark: w.mark,
		since: full?.since ?? '',
		plan: full?.plan ?? '',
		region: full?.region ?? '',
		signIn: w.signIn,
		outside: full?.outside ?? '',
		hint: w.hint,
		invite: full?.invite ?? { name: '', contact: '' },
		profile: (full?.profile ?? []).map((p) => ({ ...p, icon: p.icon as IconName }))
	};
}

export const publicOf = (p: ApiPublic): WorkspacePublic => ({
	workspace: workspaceOf(p),
	platform: p.platform,
	// the people a synthetic workspace offers on its sign-in, by address only (SC-68: a chip fills the email)
	accounts: (p.accounts ?? []).map((g) => ({
		group: g.group,
		note: g.note,
		people: g.people.map((x) => ({ ...x, img: opt(x.img) }))
	}))
});

/* ---------- people ---------- */

export function userOf(m: Member, today: string): User {
	return {
		id: m.id,
		name: m.name,
		short: m.short,
		org: m.org,
		role: m.role,
		provider: 'password',
		status: m.status,
		kind: m.kind,
		img: opt(m.img),
		city: opt(m.city),
		email: m.email || undefined,
		lang: opt(m.lang),
		invitedBy: opt(m.invitedBy),
		lastSeen: m.lastSeen ? when(m.lastSeen, today) : null
	};
}

const personOf = (m: Member): StoryPerson => ({
	id: m.id,
	name: m.name,
	short: m.short,
	role: m.title,
	org: m.org,
	city: m.city ?? '',
	img: m.img ?? '',
	email: m.email || undefined,
	sign: 'Email and password',
	lang: opt(m.lang),
	kind: m.kind
});

/* ---------- the world ---------- */

const skuOf = (x: WsSku): Sku => ({ ...x, dp: opt(x.dp), itcPerUnit: opt(x.itcPerUnit) });

function distOf(d: WsDistributor): Distributor {
	const { permission: _p, address, gstin, staffCap, ...rest } = d;
	return { ...rest, address: opt(address), gstin: opt(gstin), staffCap: opt(staffCap) };
}

function batchOf(b: WsBatch, flags: { hero?: boolean; second?: boolean } = {}): Batch {
	const { phase, staffCap, shelf, ...rest } = b;
	// the batch's own journey, so a list shows a cleared batch as cleared, whichever batch is in focus (SC-102)
	return { ...rest, staffCap: opt(staffCap), shelf: opt(shelf), ...(phase ? { journey: phase } : {}), ...flags };
}

const EMPTY_ASSESS: Assess = {
	gates: [],
	life: 0,
	usableDays: 0,
	willSell: 0,
	atRisk: 0,
	atRiskMRP: 0,
	blocked: false,
	status: 'safe',
	lifeUsedPct: 0,
	urgency: 0
};

/** the workspace's own data, from the snapshot */
export function dataOf(snap: WorkspaceSnapshot, focus: { ref: string | null; second: string | null }): WorkspaceData {
	const today = snap.clock.now;
	// the distributors that have given the one-time permission, and when, as the setup states it
	const permissions = Object.fromEntries(
		Object.values(snap.distributors)
			.filter((d) => d.permission && !d.permission.paused)
			.map((d) => [d.id, dayMonth(d.permission!.at)])
	);
	return {
		day0: snap.clock.day0 ?? dateOf(today),
		platform: snap.platform,
		workspace: workspaceOf(snap.workspace),
		client: { ...snap.client },
		skus: Object.fromEntries(Object.entries(snap.skus).map(([k, x]) => [k, skuOf(x)])),
		distributors: Object.fromEntries(Object.entries(snap.distributors).map(([k, d]) => [k, distOf(d)])),
		people: Object.fromEntries(snap.members.map((m) => [m.id, personOf(m)])),
		roles: snap.roles,
		rules: snap.moneyRules,
		setup: {
			minutes: snap.setup.minutes,
			dms: {
				source: snap.setup.dms.source,
				file: snap.setup.lastImport?.file ?? snap.setup.dms.file,
				rows: snap.setup.lastImport?.rows ?? snap.setup.dms.rows,
				columns: snap.setup.dms.columns,
				salesDays: snap.setup.dms.salesDays
			},
			channels: snap.setup.channels,
			channelNames: snap.setup.channelNames,
			allowList: snap.setup.allowList,
			brandSafety: snap.setup.brandSafety,
			partners: snap.setup.partners.map(({ id: _id, ...p }) => p),
			approval: snap.setup.approval,
			permissions,
			acts: snap.setup.acts
		},
		stages: snap.stages as Stage[],
		// each batch in a journey is its own (SC-85): none is the story's second batch, shown beside the one in focus
		batches: snap.batches.map((b) => batchOf(b, { hero: b.id === focus.ref, second: false })),
		market: { ...snap.market, lots: snap.market.lots.map((l) => ({ ...l, icon: icon(l.icon) })) }
	};
}

/* ---------- a batch's money ---------- */

const EMPTY_WRITE_OFF = { units: 0, stock: 0, itc: 0, itcPerUnit: 0, disposal: 0, kg: 0, epr: 0, total: 0, perUnit: 0 };

function emptyPlan(units: number): Plan {
	return {
		units,
		rows: [],
		lines: [],
		gross: 0,
		costs: 0,
		itcLoss: 0,
		net: 0,
		pctMRP: 0,
		writeOff: { ...EMPTY_WRITE_OFF },
		bookCost: 0,
		pnl: 0,
		swing: 0,
		cashAvoided: 0,
		itcRetained: 0,
		itcReversed: 0,
		disposalAvoided: 0,
		alt: null,
		kg: 0,
		co2: 0,
		meals: 0,
		soldUnits: 0,
		donated: 0,
		leftover: 0
	};
}

function planOf(p: WsPlan | null, units: number): Plan {
	if (!p) return emptyPlan(units);
	const { explanation: _e, alt, rows, ...rest } = p;
	return {
		...rest,
		rows: rows.map(({ note: _n, ...r }): ChannelRow => ({ ...r, icon: r.icon as IconName })),
		alt: alt ?? null
	};
}

/** a channel's line: the plan's, else the split a partner sees (its figures nought), else an empty one */
const lineOf = (lines: WsPlanLine[], split: WsSplitLine[], id: string, name: string): PlanLine =>
	lines.find((l) => l.id === id) ??
	((x) => (x ? { ...x, gross: 0, cost: 0, itcLoss: 0, net: 0 } : undefined))(split.find((l) => l.id === id)) ?? {
		id,
		name,
		short: name,
		units: 0,
		price: 0,
		packPrice: null,
		charged: 0,
		gross: 0,
		cost: 0,
		itcLoss: 0,
		net: 0,
		cartons: 0
	};

const EMPTY_SUPPORT: Support = { rows: [], gap: 0, van: 0, fee: 0, total: 0 };
const supportOf = (s: WsSupport | null): Support => (s ? { ...s } : { ...EMPTY_SUPPORT, rows: [] });

function docOf(d: WsDoc): Doc {
	return {
		id: d.id,
		type: d.type,
		owner: d.owner,
		no: d.no,
		status: d.status,
		amount: d.amount,
		note: opt(d.note),
		taxable: opt(d.taxable),
		igst: opt(d.igst),
		roundOff: opt(d.roundOff),
		total: opt(d.total),
		units: opt(d.units),
		price: opt(d.price),
		gstPct: opt(d.gstPct),
		exact: opt(d.exact),
		date: opt(d.date),
		policy: opt(d.policy),
		destroyedBy: d.destroyedBy,
		disposal: opt(d.disposal),
		epr: opt(d.epr),
		itc: opt(d.itc),
		reversed: opt(d.reversed),
		away: opt(d.away),
		// every paper the Paperwork agent laid out has its PDF to download (SC-100, SC-121)
		pdf: d.pdf,
		// the food bank's receipt (SC-110)
		...(d.id === 'receipt'
			? {
					paper: opt(d.paper),
					stamp: opt(d.stamp),
					kg: opt(d.kg),
					meals: opt(d.meals),
					mealsRule: opt(d.mealsRule),
					value: d.value ?? null,
					csr: d.csr ?? null,
					at: opt(d.at),
					by: opt(d.by),
					donor: opt(d.donor),
					fssai: opt(d.fssai),
					via: opt(d.via),
					from: opt(d.from),
					spot: d.spot ?? null
				}
			: {})
	};
}

/** the pushes of a case by moment; a moment not reached yet, or not the member's to see, reads as an empty push */
function pushesOf(detail: CaseDetail, today: string): Record<string, Push> {
	const sent = Object.fromEntries(
		Object.entries(detail.push).map(([k, p]): [string, Push] => [
			k,
			{ to: p.to, at: when(p.at, today), title: p.title, body: p.body, hindi: p.hindi, en: opt(p.en) }
		])
	);
	return new Proxy(sent, {
		get: (t, k) => (typeof k === 'string' ? (t[k] ?? { at: '', title: '', body: '' }) : undefined)
	});
}

/* ---------- the batch in focus ---------- */

const NO_BUYER: Buyer = {
	id: '',
	name: '',
	short: '',
	city: '',
	state: '',
	stateCode: '',
	address: '',
	gstin: '',
	kind: ''
};

/** the batch in focus, and the one the same agents donate, as the screens read them */
export function caseOf(
	snap: WorkspaceSnapshot,
	detail: CaseDetail,
	donation: CaseDetail | null,
	data: WorkspaceData
): CaseData {
	const today = snap.clock.now;
	const j = detail.journey;
	const day0 = detail.moments.day0;
	// before the Valuer prices the batch, its write-off is still known: the Watcher's assessment (SC-99)
	const plan = detail.plan
		? planOf(detail.plan, detail.batch.units)
		: { ...emptyPlan(detail.batch.units), writeOff: detail.writeOff ?? { ...EMPTY_WRITE_OFF } };
	const names = Object.fromEntries(snap.channels.map((c) => [c.id, c.name]));
	const lines = detail.plan?.lines ?? [];
	const returnBy = detail.returnBy ?? '';
	const docs = detail.docs.map(docOf);
	// the shops the scheme went to while it is open; once it closes, the ones that ordered
	const closed = j.offer?.status === 'closed';
	const kiranas: Kirana[] = detail.kiranas
		.filter((k) => !closed || k.units > 0)
		.map((k) => ({ id: k.id, name: k.name, area: k.area, units: k.units || k.cap, at: when(k.at, today) }));
	const sku = skuOf(detail.sku);
	const dist = distOf(detail.distributor);
	const vanAt = detail.moments.van.leavesAt;

	const d = donation?.donation ?? null;
	const partner: Partner = (d && data.setup.partners.find((p) => p.name === d.partner)) ||
		data.setup.partners[0] || { name: d?.partner ?? '', minDays: 0, minUnits: 0, logistics: '', paper: '' };
	const pickup = d?.pickupAt ?? null;
	// the donation's moments count from the journey's day 0, as the batch in focus's do
	const dday0 = snap.clock.day0 ?? day0;

	return {
		batch: batchOf(detail.batch, { hero: true }),
		sku,
		dist,
		buyer: snap.buyer ?? NO_BUYER,
		kiranas,
		offered: detail.offered,
		scheme: snap.moneyRules.scheme,
		risk: (detail.batch.assess as Assess) ?? EMPTY_ASSESS,
		plan,
		lines: {
			kirana: lineOf(lines, detail.split ?? [], 'kirana', names.kirana ?? ''),
			expiresoon: lineOf(lines, detail.split ?? [], 'expiresoon', names.expiresoon ?? '')
		},
		counter: detail.counter ?? { action: 'counter', price: j.listing?.price ?? 0, below: false },
		award: detail.award ?? { units: 0, price: 0, gross: 0, token: 0, balance: 0 },
		actual: detail.actual
			? {
					net: detail.actual.net,
					delta: detail.actual.delta,
					swing: detail.actual.swing,
					pnl: detail.actual.pnl ?? plan.pnl,
					esPlanned: detail.actual.esPlanned ?? 0,
					esActual: detail.actual.esActual ?? 0
				}
			: { net: plan.net, delta: 0, swing: plan.swing, pnl: plan.pnl, esPlanned: 0, esActual: 0 },
		support: supportOf(detail.support),
		supportPlan: supportOf(detail.supportPlan),
		claim: detail.claim ?? { units: 0, credit: 0, disposal: 0, epr: 0, itc: 0, total: 0 },
		docs,
		// before Paperwork drafts the paper, the award's own invoice figures, so the buyer's bill reads from the win (SC-96)
		invoice: docs.find((x) => x.id === 'invoice') ?? {
			id: 'invoice',
			type: '',
			owner: dist.name,
			no: '',
			status: 'drafted',
			amount: detail.award?.invoice.total ?? 0,
			...detail.award?.invoice
		},
		realised: detail.realised,
		expiry: detail.expiry ?? null,
		returnBy,
		push: pushesOf(detail, today),
		today: dayLabel(day0),
		planMinutes: detail.moments.planMinutes,
		permissionAsked: detail.moments.permissionAskedAt ? dayTime(detail.moments.permissionAskedAt) : '',
		listing: { id: j.listing?.id ?? '', url: detail.moments.listingUrl ?? '' },
		van: {
			day: vanAt ? weekday(vanAt) : '',
			date: vanAt ? dayLabel(vanAt) : '',
			leaves: vanAt ? hhmm(vanAt) : '',
			depot: detail.moments.van.depot,
			// the prototype's distributor answered the Outreach agent in words; the live one runs the round instead
			reply: '',
			replyAt: ''
		},
		donation: {
			batch: donation ? batchOf(donation.batch, { second: true }) : batchOf(detail.batch),
			sku: donation ? skuOf(donation.sku) : sku,
			dist: donation ? distOf(donation.distributor) : dist,
			plan: donation ? planOf(donation.plan, donation.batch.units) : emptyPlan(0),
			units: d?.units ?? 0,
			partner,
			from: d?.from ?? '',
			spot: d?.spot ?? '',
			day: pickup ? weekday(pickup) : '',
			date: pickup ? dayLabel(pickup) : '',
			time: pickup ? hhmm(pickup) : '',
			hour: pickup ? hourWord(pickup) : '',
			asked: d ? dayN(d.at, dday0) : '',
			confirmed: d?.confirmedAt ? dayN(d.confirmedAt, dday0) : '',
			collected: d?.collectedAt ? dayN(d.collectedAt, dday0) : '',
			slots: (d?.slots ?? []).map((s) => `${weekday(s)} ${hhmm(s)}`),
			reply: d?.reply ?? '',
			receipt: d?.receipt ? docOf(d.receipt) : null
		}
	};
}

/* ---------- the journey's state ---------- */

const EMPTY_HERO: Hero = {
	id: '',
	phase: 'watching',
	photo: { status: 'none' },
	plan: null,
	listing: null,
	offer: null,
	orders: [],
	bids: [],
	chat: [],
	award: null,
	van: { status: 'idle', done: 0 },
	truck: { status: 'idle' },
	docs: null,
	invoiceIssued: false,
	posted: false,
	reviewed: false,
	staff: null
};

function heroOf(detail: CaseDetail | null, today: string): Hero {
	if (!detail) return { ...EMPTY_HERO, orders: [], bids: [], chat: [] };
	const j = detail.journey;
	const at = (iso: string | null | undefined) => when(iso, today);
	return {
		id: j.id,
		phase: j.phase,
		photo: { status: j.photo.status, at: opt(at(j.photo.at) || null), confidence: opt(j.photo.confidence) },
		plan: j.plan ? { status: j.plan.status, at: at(j.plan.at), by: opt(j.plan.by), device: opt(j.plan.device) } : null,
		listing: j.listing
			? {
					id: j.listing.id,
					status: j.listing.status,
					units: j.listing.units,
					price: j.listing.price,
					reserve: j.listing.reserve ?? 0,
					at: at(j.listing.at)
				}
			: null,
		offer: j.offer ? { status: j.offer.status, at: at(j.offer.at), shops: j.offer.shops } : null,
		orders: j.orders.map((o) => ({ id: o.id, units: o.units, at: at(o.at) })),
		bids: j.bids.map((b) => ({
			id: b.id,
			price: b.price,
			at: at(b.at),
			by: b.by,
			status: b.status,
			counter: opt(b.counter)
		})),
		chat: j.chat.map((m) => ({ from: m.from, text: m.text, at: at(m.at) })),
		award: j.award ? { ...j.award, at: at(j.award.at) } : null,
		van: { status: j.van.status, done: j.van.done },
		truck: { status: j.truck.status, at: opt(at(j.truck.at) || null) },
		docs: j.docs,
		invoiceIssued: j.invoiceIssued,
		posted: j.posted,
		reviewed: j.reviewed,
		staff: j.staff
			? {
					status: j.staff.status,
					units: j.staff.units,
					price: j.staff.price,
					godown: j.staff.godown,
					at: at(j.staff.at),
					sold: j.staff.sold,
					left: j.staff.left
				}
			: null
	};
}

function feedOf(entries: WsFeedEvent[], today: string): FeedEvent[] {
	const seen = new Set<string>();
	const sorted = entries
		.filter((e) => !seen.has(e.id) && seen.add(e.id))
		.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || Number(a.id) - Number(b.id));
	return sorted.map((e, i) => ({
		id: e.id,
		key: e.key,
		stage: e.stage,
		agent: opt(e.agent),
		person: opt(e.person),
		icon: icon(e.icon),
		at: when(e.at, today),
		min: i === 0 ? 0 : minutes(e.at, sorted[i - 1].at),
		text: e.text,
		calls: e.calls.length ? e.calls : undefined,
		human: e.human || undefined
	}));
}

const auditOf = (rows: WsAuditRow[], today: string): AuditRow[] => rows.map((r) => ({ ...r, at: when(r.at, today) }));

/** the journey's state, as the screens read the stub's store */
export function stateOf(
	snap: WorkspaceSnapshot,
	focus: CaseDetail | null,
	donation: CaseDetail | null,
	audit: WsAuditRow[]
): State {
	const today = snap.clock.now;
	// the permission the screens show: the member's own distributor's, else the batch in focus's
	const distId =
		(snap.me.role === 'distributor' ? snap.me.orgRef : null) ?? focus?.distributor.id ?? snap.cases[0]?.distributor;
	const permission = distId ? snap.distributors[distId]?.permission : null;
	const notifications: Notification[] = snap.notifications.map((n) => ({
		id: n.id,
		to: n.to,
		read: n.read,
		title: n.title,
		body: n.body,
		at: when(n.at, today),
		link: opt(n.link),
		hindi: n.hindi || undefined,
		en: opt(n.en)
	}));
	const integrations: Integration[] = snap.integrations.map((i) => ({
		...i,
		status: i.status === 'ok' ? 'ok' : 'mock'
	}));
	return {
		v: STATE_VERSION,
		workspace: snap.workspace.id,
		setup: {
			confirmed: snap.setup.confirmed,
			mapped: snap.setup.mapped,
			permission: permission ? { by: permission.by, at: dayTime(permission.at), paused: permission.paused } : null
		},
		hero: heroOf(focus, today),
		mango: donation
			? { id: donation.ref, phase: donation.journey.phase, donation: donation.donation?.status ?? null }
			: { id: '', phase: 'watching', donation: null },
		feed: feedOf([...(focus?.feed ?? []), ...(donation && donation !== focus ? donation.feed : [])], today),
		notifications,
		audit: auditOf(audit, today),
		users: snap.members.map((m) => userOf(m, today)),
		rules: snap.rules,
		integrations,
		seq: snap.seq
	};
}

/** the batch the workspace puts first: the one a screen asked for, else the most urgent open journey. Every batch in a
 *  journey is its own (SC-85): one going to a food bank is as much in focus as any other */
export function focusRef(snap: WorkspaceSnapshot, asked: string | null): string | null {
	if (asked && snap.cases.some((c) => c.ref === asked)) return asked;
	return snap.cases[0]?.ref ?? null;
}

/** the batch whose donation the screens show: the one in focus, when its plan has a food bank (SC-85) */
export const donationRef = (snap: WorkspaceSnapshot, focus: string | null): string | null =>
	snap.cases.some((c) => c.ref === focus && c.donation != null) ? focus : null;

/* ---------- before the workspace has loaded ---------- */

/** the workspace's data while it loads: its name and mark once the public page has answered, nothing else */
export function emptyData(pub: ApiPublic | null): WorkspaceData {
	const workspace = pub
		? workspaceOf(pub)
		: workspaceOf({
				accounts: [],
				id: '',
				name: '',
				short: '',
				domain: '',
				mark: { from: '', to: '', ink: '' },
				platform: { name: '', domain: '' },
				signIn: [],
				emailDomain: '',
				hint: '',
				manifest: { name: '', shortName: '', description: '', themeColor: '', backgroundColor: '' }
			});
	return {
		day0: '',
		platform: pub?.platform ?? { name: '', domain: '' },
		workspace,
		client: {
			name: '',
			short: workspace.short,
			city: '',
			listed: '',
			gstin: '',
			fssai: '',
			revenue: '',
			skus: 0,
			distributors: 0,
			kiranas: 0,
			shortDatedPerQuarter: 0,
			destroyedToday: 0
		},
		skus: {},
		distributors: {},
		people: {},
		roles: {} as WorkspaceData['roles'],
		rules: {} as WorkspaceData['rules'],
		setup: {
			minutes: 0,
			dms: { source: '', file: '', rows: 0, columns: [], salesDays: 0 },
			channels: [],
			channelNames: {},
			allowList: [],
			brandSafety: [],
			partners: [],
			approval: '',
			permissions: {},
			acts: []
		},
		stages: [],
		batches: [],
		market: { dispatchHours: 0, balanceHours: 0, minOrder: 0, lots: [] }
	};
}

/** the journey's state while the workspace loads */
export const emptyState = (): State => ({
	v: STATE_VERSION,
	workspace: '',
	setup: { confirmed: false, mapped: 0, permission: null },
	hero: heroOf(null, ''),
	mango: { id: '', phase: 'watching', donation: null },
	feed: [],
	notifications: [],
	audit: [],
	users: [],
	rules: {} as State['rules'],
	integrations: [],
	seq: 0
});
