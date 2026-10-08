// The platform's rules, ported from design3/core/platform.js (the console prototype's mock backend): what a supply-chain
// profile switches on, how far each preset lets the agents go, the one line under each agent, how a setting reads in
// the audit log, and what the setup flow and the invitations accept. The mock applies them as the server would; the
// console uses the same functions to preview a choice before it is saved. A test runs platform.js and checks these give
// the same answers.
import { isEmail } from '@smart-clearance/core/identity';
import type { Agent } from '../types/shared';
import type {
	Journey,
	JourneyTrigger,
	AgentConfig,
	BatchOverride,
	BatchPage,
	BatchQuery,
	BatchRow,
	BatchMark,
	Dashboard,
	GateCheck,
	Gates,
	OverrideInput,
	SkuGates,
	AgentSettings,
	Client,
	ConsoleConfig,
	ConsoleDefaults,
	ExitDef,
	ExportColumn,
	FirstExport,
	Exits,
	InviteInput,
	PresetId,
	Profile,
	ProfileQuestion,
	Run,
	SettingField,
	SettingValue,
	StaffInviteInput
} from '../types/console';

/** the one message for any wrong sign-in (SC-46): Firebase's email enumeration protection never says which part was
 *  wrong, and nothing is mailed, so a Super admin puts an account back on its first password */
export const SIGN_IN_FAILED =
	"That email and password don't match. Check both, or ask a Super admin to put your account back on its first password.";

/** quick-commerce gates per SKU, with a per-batch override (SC-47). An SKU's own gates keep the profile's bounds; a
 *  batch's override records a deal a warehouse agreed to, so it may go lower */
export const GATE_BOUNDS = {
	sku: { blinkitDays: [30, 180], qcomPct: [30, 90] },
	override: { blinkitDays: [7, 180], qcomPct: [5, 90] }
} as const;
const DAY = 86_400_000;
const daysBetween = (from: string, to: string) =>
	Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / DAY);

/** a batch's gates as the agents read them: its override, else its SKU's own, else the client's default, value by
 *  value. Blinkit wants days left; Zepto and Instamart a share of the SKU's life left: a batch passes when
 *  days x 100 >= share x life */
export function batchGates(
	client: { gates: Gates },
	sku: { lifeDays: number; gates?: SkuGates },
	batch: { bestBefore: string; override?: Partial<BatchOverride> | null },
	today: string
): { blinkitDays: number; qcomPct: number; daysLeft: number; lifeDays: number; checks: GateCheck[] } {
	const own = sku.gates ?? {},
		o = batch.override ?? {};
	const pick = (k: 'blinkitDays' | 'qcomPct'): [number, GateCheck['source']] =>
		o[k] != null ? [o[k], 'override'] : own[k] != null ? [own[k], 'sku'] : [client.gates[k], 'default'];
	const [bl, blFrom] = pick('blinkitDays'),
		[qc, qcFrom] = pick('qcomPct');
	const life = sku.lifeDays,
		days = daysBetween(today, batch.bestBefore),
		pct = Math.floor((days * 100) / life),
		qcPass = days * 100 >= qc * life;
	return {
		blinkitDays: bl,
		qcomPct: qc,
		daysLeft: days,
		lifeDays: life,
		checks: [
			{ app: 'blinkit', need: bl, has: days, pass: days >= bl, source: blFrom },
			{ app: 'zepto', need: qc, has: pct, pass: qcPass, source: qcFrom },
			{ app: 'instamart', need: qc, has: pct, pass: qcPass, source: qcFrom }
		]
	};
}
export const gateText = (g: { blinkitDays?: number | null; qcomPct?: number | null }) =>
	[
		g.blinkitDays != null && `Blinkit ${g.blinkitDays}+ days`,
		g.qcomPct != null && `Zepto and Instamart ${g.qcomPct}% of life`
	]
		.filter(Boolean)
		.join(', ');
const bad = (v: unknown, [lo, hi]: readonly [number, number]) =>
	typeof v !== 'number' || !Number.isInteger(v) || v < lo || v > hi;
/** what an SKU's own gates must be, or the problem with them (null puts it back on the client's default) */
export function skuGatesError(g: SkuGates | null): string | null {
	if (g == null) return null;
	const { blinkitDays: b, qcomPct: q } = GATE_BOUNDS.sku;
	if (g.blinkitDays == null && g.qcomPct == null)
		return 'Give the SKU at least one gate of its own, or put it back on the default.';
	if (g.blinkitDays != null && bad(g.blinkitDays, b)) return `Blinkit takes ${b[0]} to ${b[1]} days.`;
	if (g.qcomPct != null && bad(g.qcomPct, q)) return `Zepto and Instamart take ${q[0]}% to ${q[1]}% of life.`;
	return null;
}
/** what a batch's override must carry, or the problem with it */
export function overrideError(o: OverrideInput): string | null {
	const { blinkitDays: b, qcomPct: q } = GATE_BOUNDS.override;
	if (o.blinkitDays == null && o.qcomPct == null) return 'Override at least one gate.';
	if (o.blinkitDays != null && bad(o.blinkitDays, b)) return `A batch's Blinkit gate is ${b[0]} to ${b[1]} days.`;
	if (o.qcomPct != null && bad(o.qcomPct, q))
		return `A batch's Zepto and Instamart gate is ${q[0]}% to ${q[1]}% of life.`;
	const why = (o.reason || '').trim();
	if (!why) return 'Say why this batch is different.';
	if (why.length > 200) return 'Keep the reason to 200 characters.';
	return null;
}
/** "Munchly Foods'", "Kesari's" */
export const possessive = (name: string) => name + (/s$/i.test(name) ? "'" : "'s");
export const skuGatesLine = (client: { name: string }, sku: { name: string }, g: SkuGates | null) =>
	g
		? `Set ${sku.name}'s quick-commerce gates: ${gateText(g)}`
		: `Put ${sku.name} back on ${possessive(client.name)} default quick-commerce gates`;
export const overrideLine = (ref: string, o: OverrideInput) =>
	`Overrode ${ref}'s quick-commerce gates: ${gateText(o)} (${o.reason.trim()})`;
export const clearOverrideLine = (ref: string) => `Removed ${ref}'s quick-commerce gate override`;

/** the length of a journey day (SC-68): how many minutes of real time one day of a client's journey lasts, from 1 to
 *  1440. 1440 is real time, where every client starts */
export const DAY_MINUTES = 1440;
/** the sheet's presets: real time, a rehearsal, a demo and fast */
export const DAY_PRESETS: { id: number; label: string; sub: string }[] = [
	{ id: 1440, label: 'Real time', sub: 'A journey day is a day' },
	{ id: 60, label: 'Rehearsal', sub: 'An hour a day' },
	{ id: 5, label: 'Demo', sub: 'Five minutes a day' },
	{ id: 1, label: 'Fast', sub: 'A minute a day' }
];
/** a length of day in words: 5 → "5 minutes", 90 → "1 h 30 min", 120 → "2 hours", 1440 → "a day" */
export const dayWords = (m: number) =>
	m >= DAY_MINUTES
		? 'a day'
		: m >= 60
			? m % 60
				? `${Math.floor(m / 60)} h ${m % 60} min`
				: `${m / 60} hour${m === 60 ? '' : 's'}`
			: `${m} minute${m === 1 ? '' : 's'}`;
/** a stretch of real time, roughly: 10 → "10 minutes", 235 → "3.9 hours", 2880 → "2 days" */
export const spanWords = (min: number) =>
	min < 90
		? `${Math.round(min)} minutes`
		: min < 60 * 36
			? `${Math.round(min / 6) / 10} hours`
			: `${Math.round(min / 144) / 10} days`;
/** the badge in the client's head: "Real time", "1 day = 5 min", "1 day = 2 hours" */
export const dayBadge = (m: number) =>
	m >= DAY_MINUTES ? 'Real time' : `1 day = ${m >= 60 ? dayWords(m) : m + ' min'}`;
/** what a length of day does to the agents, in their own terms */
export const dayReadouts = (m: number): { icon: 'radar' | 'send' | 'route'; title: string; value: string }[] => [
	{
		icon: 'radar',
		title: "The Watcher's 09:00 check",
		value: m >= DAY_MINUTES ? 'once a day' : `every ${dayWords(m)}`
	},
	{ icon: 'send', title: 'A 48-hour kirana offer', value: `open ${spanWords(2 * m)}` },
	{ icon: 'route', title: 'A 47-day batch journey', value: `about ${spanWords(47 * m)}` }
];
/** the readouts' head: "In real time", "At 5 minutes a day" */
export const dayHead = (m: number) => (m >= DAY_MINUTES ? 'In real time' : `At ${dayWords(m)} a day`);
/** what a length of day must be, or the problem with it */
export const dayMinutesError = (v: unknown): string | null =>
	bad(v, [1, DAY_MINUTES]) ? 'Enter a whole number of minutes, from 1 to 1,440.' : null;
/** the audit line for a change of a client's length of day */
export const dayMinutesLine = (client: { name: string }, to: number, was: number) =>
	`Set the length of a journey day for ${client.name} to ${dayWords(to)} (was ${dayWords(was)})`;

/** a batch as the mock keeps it (design3/core/platform.js): when the Watcher flagged it, where it stands, what it
 *  recovered, and any gate override (with when it was set) */
export type BatchRecord = {
	client: string;
	ref: string;
	sku: string;
	distributor: string;
	units: number;
	bestBefore: string;
	done: number;
	current: number;
	openedAt: string;
	/** when it reached the stop it is at (SC-49) */
	stageAt?: string;
	closedAt?: string;
	recovered: number;
	outcome?: string;
	override?: BatchOverride & { setAt?: string };
};

/** the Overview's dashboard (SC-48). A batch's recovery counts on the day it closed, or, while it is still open past
 *  Settle, the day it was flagged. It is in flight from being flagged until it closes, and waits for a yes at Approve
 *  (the sixth stop). Days are India's */
export const APPROVE = 5;
export const RANGES = [7, 30, 90] as const;
export const SIZES = [8, 16, 32] as const;
const IST_MS = 19_800_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const addDays = (iso: string, n: number) => {
	const d = new Date(iso + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
};
const istDay = (at: string) => new Date(Date.parse(at) + IST_MS).toISOString().slice(0, 10);
/** "2 Oct" */
export const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const dayEnd = (iso: string) => Date.parse(addDays(iso, 1) + 'T00:00:00+05:30');
const pad2 = (n: number) => String(n).padStart(2, '0');
const r2 = (v: number) => Math.round(v * 100) / 100;
type Platform = {
	clients: Pick<Client, 'id' | 'name' | 'skus' | 'distributors'>[];
	batches: BatchRecord[];
	runs: Run[];
};

/** the figures over the last `days` days, ending `today`; `now` is when they are read */
export function dashboard(
	s: Platform,
	{
		days = 30,
		client = null,
		today,
		now = Date.now()
	}: { days?: number; client?: string | null; today: string; now?: number }
): Dashboard {
	if (!(RANGES as readonly number[]).includes(days)) throw new Error('Show 7, 30 or 90 days.');
	const bs = s.batches.filter((b) => !client || b.client === client);
	const first = addDays(today, -(days - 1)),
		before = addDays(first, -days);
	const range = Array.from({ length: days }, (_, i) => addDays(first, i));
	const rec: Record<string, number> = {},
		closed: Record<string, [number, number]> = {};
	let recoveredBefore = 0;
	for (const b of bs) {
		const d = istDay(b.closedAt || b.openedAt);
		if (b.recovered > 0) {
			if (d >= first && d <= today) rec[d] = (rec[d] || 0) + b.recovered;
			else if (d >= before && d < first) recoveredBefore += b.recovered;
		}
		if (b.closedAt) {
			const c = istDay(b.closedAt);
			closed[c] ??= [0, 0];
			closed[c][0] += 1;
			closed[c][1] += b.units;
		}
	}
	// the runs the mock keeps are today's
	const runsToday = s.runs.filter((r) => !client || r.client === client).length;
	const open = bs.filter((b) => !b.closedAt);
	const byStop = Array<number>(9).fill(0);
	for (const b of open) byStop[Math.min(b.current, 8)] += 1;
	// the batches at each stop, the latest to arrive first (three a stop), and the ones closed today (SC-49)
	const seqOf = new Map(bs.map((b, i) => [b, i]));
	const mark = (b: BatchRecord): BatchMark => ({
		client: b.client,
		ref: b.ref,
		at: b.closedAt || b.stageAt || b.openedAt
	});
	const latest = (at: (b: BatchRecord) => string) => (x: BatchRecord, y: BatchRecord) =>
		Date.parse(at(y)) - Date.parse(at(x)) || seqOf.get(x)! - seqOf.get(y)!;
	const atStop = byStop.map((_, i) =>
		open
			.filter((b) => Math.min(b.current, 8) === i)
			.sort(latest((b) => b.stageAt || b.openedAt))
			.slice(0, 3)
			.map(mark)
	);
	const shut = bs.filter((b) => b.closedAt && istDay(b.closedAt) === today).sort(latest((b) => b.closedAt!));
	const waiting = open
		.filter((b) => b.current === APPROVE)
		.sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt));
	const t = new Date(now + IST_MS);
	const out: Dashboard = {
		readAt: `${pad2(t.getUTCHours())}:${pad2(t.getUTCMinutes())}:${pad2(t.getUTCSeconds())}`,
		days,
		recovered: r2(range.reduce((sum, d) => sum + (rec[d] || 0), 0)),
		recoveredBefore: r2(recoveredBefore),
		byDay: range.map((d) => ({
			date: d,
			label: dayLabel(d),
			recovered: r2(rec[d] || 0),
			closed: (closed[d] || [0])[0],
			units: (closed[d] || [0, 0])[1],
			runs: d === today ? runsToday : 0
		})),
		inFlight: open.length,
		inFlightClients: new Set(open.map((b) => b.client)).size,
		inFlightSeries: range.map((d) => {
			const cut = d < today ? dayEnd(d) : Math.min(now, dayEnd(d));
			return bs.filter((b) => Date.parse(b.openedAt) <= cut && (!b.closedAt || Date.parse(b.closedAt) > cut)).length;
		}),
		waiting: waiting.length,
		runsToday,
		byStop,
		atStop,
		closedToday: {
			count: shut.length,
			recovered: r2(shut.reduce((t, b) => t + b.recovered, 0)),
			batches: shut.slice(0, 3).map(mark)
		}
	};
	if (waiting.length) {
		const w = waiting[0],
			c = s.clients.find((x) => x.id === w.client);
		out.oldestWaiting = {
			hours: Math.floor((now - Date.parse(w.openedAt)) / 3_600_000),
			client: c ? c.name : w.client
		};
	}
	return out;
}

/** every client's batches, a page at a time: in flight (the ones waiting for a yes first, then the fewest days left),
 *  waiting for a yes, or closed; by client, stop and a search over the batch, its product and its distributor */
export function batchPage(s: Platform, q: BatchQuery, today: string): BatchPage {
	const { status = 'in-flight', client = null, stop = null, sort = 'priority', dir = 'asc', page = 1, size = 8 } = q;
	if (!(SIZES as readonly number[]).includes(size)) throw new Error('Show 8, 16 or 32 rows a page.');
	const text = (q.q || '').trim().toLowerCase();
	const rows = s.batches
		.map((b, seq) => {
			const c = s.clients.find((x) => x.id === b.client);
			const sku = c?.skus.find((x) => x.id === b.sku) ?? { name: b.sku, mrp: 0 };
			const d = c?.distributors.find((x) => x.id === b.distributor) ?? { name: b.distributor, city: '' };
			const at = Math.max(
				...[b.openedAt, b.override?.setAt, b.closedAt].filter((x): x is string => !!x).map(Date.parse)
			);
			const local = istDay(new Date(at).toISOString());
			const t = new Date(at + IST_MS);
			const row: BatchRow = {
				client: b.client,
				ref: b.ref,
				product: sku.name,
				distributor: d.name,
				city: d.city,
				stage: b.closedAt ? 9 : b.current,
				done: b.closedAt ? 9 : b.done,
				units: b.units,
				value: r2(b.recovered > 0 ? b.recovered : b.units * sku.mrp),
				valueKind: b.recovered > 0 || b.closedAt ? 'recovered' : 'mrp',
				updated: local === today ? `${pad2(t.getUTCHours())}:${pad2(t.getUTCMinutes())}` : dayLabel(local),
				closed: !!b.closedAt
			};
			if (b.bestBefore) row.daysLeft = daysBetween(today, b.bestBefore);
			if (b.outcome) row.outcome = b.outcome;
			return { row, seq, b, at };
		})
		.filter(
			(x) =>
				(!client || x.b.client === client) &&
				(!text || [x.b.ref, x.row.product, x.row.distributor, x.row.city].some((v) => v.toLowerCase().includes(text)))
		);
	type X = (typeof rows)[number];
	const is: Record<string, (x: X) => boolean> = {
		'in-flight': (x) => !x.b.closedAt,
		waiting: (x) => !x.b.closedAt && x.b.current === APPROVE,
		closed: (x) => !!x.b.closedAt
	};
	const counts = {
		inFlight: rows.filter(is['in-flight']).length,
		waiting: rows.filter(is.waiting).length,
		closed: rows.filter(is.closed).length
	};
	const picked = rows.filter(is[status]).filter((x) => stop == null || status === 'closed' || x.b.current === stop);
	const nullsLast = (a: unknown, b: unknown) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : 0);
	const KEY: Record<string, (x: X) => number | undefined> = {
		stop: (x) => x.b.current,
		days: (x) => x.row.daysLeft,
		units: (x) => x.row.units,
		value: (x) => x.row.value,
		updated: (x) => x.at
	};
	picked.sort((x, y) => {
		if (sort === 'priority' || !KEY[sort])
			return (
				Number(y.b.current === APPROVE) - Number(x.b.current === APPROVE) ||
				nullsLast(x.row.daysLeft, y.row.daysLeft) ||
				(x.row.daysLeft || 0) - (y.row.daysLeft || 0) ||
				x.seq - y.seq
			);
		const a = KEY[sort](x),
			b = KEY[sort](y);
		return nullsLast(a, b) || (a! > b! ? 1 : a! < b! ? -1 : 0) * (dir === 'desc' ? -1 : 1) || x.seq - y.seq;
	});
	const p = Math.max(1, page);
	return {
		rows: picked.slice((p - 1) * size, p * size).map((x) => x.row),
		total: picked.length,
		page: p,
		size,
		counts
	};
}

/** a per-pack price: "₹13.50" */
export const money = (v: SettingValue) => '₹' + Number(v).toFixed(2);

/** how a setting's value reads in the audit log */
export function showValue(f: SettingField, v: SettingValue): string {
	if (f.type === 'money') return money(v);
	if (f.type === 'switch') return v ? 'on' : 'off';
	if (f.type === 'number' && f.key === 'confidence') return Number(v).toFixed(2);
	return f.unit ? `${v} ${f.unit}` : String(v);
}

/** the one line under each agent's name */
export function summary(agentId: string, s: AgentSettings, client: Pick<Client, 'exits' | 'people'>): string {
	switch (agentId) {
		case 'data':
			return `daily ${s.time} · ${s.backfillDays} days of history`;
		case 'watcher':
			return `daily ${s.time} · Blinkit ${s.blinkitDays}+ days, Zepto and Instamart ${s.qcomPct}% of life, unless an SKU has its own`;
		case 'vision':
			return `asks again below ${Number(s.confidence).toFixed(2)} confidence`;
		case 'valuer':
			return `${Object.values(client.exits).filter((x) => x.on).length} exits on, and the bin`;
		case 'router':
			return String(s.objective).toLowerCase();
		case 'gate': {
			const p = client.people.find((x) => x.id === s.approver);
			return `${p ? p.name : 'no approver'} · one tap, always`;
		}
		case 'lister':
			return `reserve ${money(s.reserve)} · ${s.territoryGuard ? "hidden inside the client's territories" : 'visible everywhere'}`;
		case 'outreach':
			return `${s.language} · ${s.scheme}`;
		case 'negotiator':
			return `floor ${money(s.floor)} · up to ${s.counters} counter${s.counters === 1 ? '' : 's'} · ${s.tokenPct}% token`;
		case 'paperwork':
			return 'drafts only; people send them';
		case 'impact':
			return `after the ${s.returnWindowDays}-day return window`;
		default:
			return '';
	}
}

/** a profile answer's label: optLabel(config.profile, 'route', 'distributors') → "Through distributors" */
export function optLabel(profile: ConsoleConfig['profile'], q: ProfileQuestion, id: string): string {
	return profile[q].options.find((o) => o.id === id)?.label ?? id;
}

/** the exits a profile allows: D2C only for the manufacturer's own stock, kiranas unless it sells only to modern trade */
export function exitsFor(profile: Profile, staffCap: number): Exits {
	const own = profile.owner === 'manufacturer' || profile.route === 'own';
	return {
		expiresoon: { on: true },
		kirana: { on: profile.route !== 'modern-trade' },
		staff: { on: true, cap: staffCap },
		foodbank: { on: true },
		d2c: { on: own, locked: own ? null : "Only for the manufacturer's own stock" }
	};
}

const SHORT: Record<string, string> = {
	expiresoon: 'ExpireSoon',
	kirana: 'kiranas',
	staff: 'staff sale',
	foodbank: 'food bank',
	d2c: 'discount D2C'
};
/** what a profile sets up, line by line */
export function profileLines(profile: Profile, exits: ExitDef[], staffCap: number): { icon: string; text: string }[] {
	const lines: { icon: string; text: string }[] = [];
	if (profile.owner === 'distributor')
		lines.push({
			icon: 'handshake',
			text: "Agents list, offer and invoice in the distributor's name, after his one-time permission"
		});
	else lines.push({ icon: 'warehouse', text: "Agents list, offer and invoice in the manufacturer's own name" });
	if (profile.expiry === 'full-credit')
		lines.push({
			icon: 'hand-coins',
			text: 'Price support is offered before stock expires, so it never comes back for full credit'
		});
	else if (profile.expiry === 'price-support')
		lines.push({ icon: 'hand-coins', text: 'Price support is the only lever; nothing comes back' });
	else
		lines.push({ icon: 'ban', text: "No returns: every unsold pack is the distributor's loss, so speed matters most" });
	const ex = exitsFor(profile, staffCap);
	lines.push({
		icon: 'route',
		text:
			'Exits: ' +
			exits
				.filter((e) => ex[e.id].on)
				.map((e) => SHORT[e.id])
				.join(', ')
	});
	if (!ex.d2c.on) lines.push({ icon: 'globe', text: "D2C stays off: it is only for the manufacturer's own stock" });
	return lines;
}

/** a workspace address from a company's name: "Kesari Foods Pvt" → "kesari" */
export const slug = (name: string) =>
	(name || '')
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-(foods?|ltd|limited|pvt|private|india)$/g, '')
		.slice(0, 24) || 'client';

const PRESET_AUTONOMY: Record<PresetId, Record<string, 'suggest' | 'ask' | 'act'>> = {
	cautious: { data: 'act', watcher: 'act' },
	standard: { vision: 'ask', negotiator: 'ask', paperwork: 'ask' },
	trusted: { negotiator: 'ask', paperwork: 'ask' }
};

/** each agent as a new client starts with it: the preset decides autonomy; the approval gate is always on */
export function agentDefaults(
	preset: PresetId,
	agents: Agent[],
	d: ConsoleDefaults,
	approver: string | null = null
): Record<string, AgentConfig> {
	const auto = PRESET_AUTONOMY[preset] ?? {};
	const base = preset === 'cautious' ? 'suggest' : 'act';
	const settings: Record<string, AgentSettings> = {
		data: { time: '08:30', backfillDays: 90 },
		watcher: { time: '09:00', blinkitDays: d.gates.blinkitDays, qcomPct: d.gates.qcomPct },
		vision: { confidence: 0.9 },
		valuer: { indicative: true },
		router: { objective: 'Most money recovered' },
		gate: { approver },
		lister: { reserve: d.reserve, territoryGuard: true },
		outreach: { language: 'Hindi first', scheme: '2 free with every 10' },
		negotiator: { floor: d.reserve, counters: 2, tokenPct: d.tokenPct },
		paperwork: { draftsOnly: true },
		impact: { returnWindowDays: d.returnWindowDays }
	};
	const out: Record<string, AgentConfig> = {};
	for (const a of agents)
		out[a.id] = {
			on: true,
			autonomy: a.gate ? 'gate' : (auto[a.id] ?? base),
			settings: settings[a.id],
			last: null,
			next: null
		};
	return out;
}

/** what an invitation to a client's workspace must carry, or the problem with it: an email address only (SC-68), at the
 *  client's own domain for its staff and any address for a partner */
export function inviteError(input: InviteInput, client: Pick<Client, 'name' | 'emailDomain'>): string | null {
	const contact = input.contact.trim().toLowerCase();
	if (!input.name.trim()) return 'Enter a name.';
	if (!isEmail(contact)) return `Enter an email address, such as name@${client.emailDomain}.`;
	if (input.access !== 'Partner' && !contact.endsWith('@' + client.emailDomain))
		return `${client.name} staff need a ${client.emailDomain} address. Partners can use any address.`;
	return null;
}

/** what an invitation to the console must carry, or the problem with it */
export function staffInviteError(input: StaffInviteInput): string | null {
	if (!input.name.trim()) return 'Enter a name.';
	if (!/^[^\s@]+@smartclearance\.com$/i.test(input.email.trim())) return 'Staff use a smartclearance.com address.';
	return null;
}

/** the setup flow's answers, as far as they need checking */
export type SetupAnswers = {
	name: string;
	city: string;
	slug: string;
	emailDomain: string;
	signGoogle: boolean;
	signPhone: boolean;
	exits: Exits;
	adminName: string;
	adminEmail: string;
};
/** the setup flow's seven steps, and the problem with each one's answers (null when it is fine) */
export function setupErrors(f: SetupAnswers, taken: (slug: string) => boolean): (string | null)[] {
	const domain = f.emailDomain.trim().toLowerCase();
	const domainOk = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain);
	const adminOk =
		f.adminName.trim() &&
		isEmail(f.adminEmail) &&
		f.adminEmail
			.trim()
			.toLowerCase()
			.endsWith('@' + domain);
	return [
		!f.name.trim() ? "Enter the company's name." : !f.city.trim() ? 'Enter its home city.' : null,
		!/^[a-z0-9-]{2,24}$/.test(f.slug)
			? 'Use 2 to 24 lowercase letters, digits or hyphens.'
			: taken(f.slug)
				? `${f.slug}.smartclearance.com is taken.`
				: !domainOk
					? 'Enter the domain its staff email from, such as kesari.in.'
					: !(f.signGoogle || f.signPhone)
						? 'Keep at least one way to sign in.'
						: null,
		null,
		Object.values(f.exits).some((x) => x.on) ? null : 'Keep at least one exit on.',
		null,
		!adminOk ? `Enter the admin's name and a ${f.emailDomain ? '@' + f.emailDomain : 'company'} address.` : null,
		null
	];
}

/* ---------- a client's journey, driven from the console (SC-79) ---------- */
// design3/core/platform.js's journey, as backend-api answers GET …/journey: the Data agent's daily load and the
// Watcher's daily check, and the timers an offer leaves, each with when it falls due in journey time and the wall time
// it fires. A daily run fired now is that day's; a timer fired goes; a reset puts the journey back at day 0, 08:00.

/** a live client's journey, as the mock keeps it */
export type MockJourney = {
	day0: string;
	now: string;
	setupConfirmed: boolean;
	daily: Record<string, string>;
	timers: { id: string; agent: string; key: JourneyTrigger['key']; ref: string; due: string; blocked?: string }[];
};
const DAILY = [
	{ id: 'data', name: 'Data agent', time: '08:30', what: 'daily load' },
	{ id: 'watcher', name: 'Watcher', time: '09:00', what: 'daily check' }
] as const;
const TIMER_WORDS: Record<string, string> = {
	'offer.close': 'closed the offer window',
	'listing.close': 'closed the unsold lot',
	'report.due': 'wrote the report'
};
const DAY_MS = 864e5;
const addDay = (iso: string) => new Date(Date.parse(iso + 'T00:00:00Z') + DAY_MS).toISOString().slice(0, 10);

/** what is coming for a client, in time order: its daily runs, then its pending timers */
export function journeyOf(c: Client, j: MockJourney | undefined, wall = Date.now()): Journey {
	const off = (a: (typeof DAILY)[number]) => (c.agents[a.id] && !c.agents[a.id].on ? `The ${a.name} is off` : null);
	if (!j)
		return {
			live: false,
			clock: null,
			triggers: DAILY.map((a) => ({
				id: a.id,
				agent: a.id,
				kind: 'run' as const,
				key: `${a.id}.daily` as JourneyTrigger['key'],
				ref: null,
				due: null,
				dueWall: null,
				time: a.time,
				blocked: off(a)
			}))
		};
	const today = j.now.slice(0, 10);
	// a journey day lasts dayMinutes of wall time while a batch is at risk, as backend-api's clock runs
	const wallOf = (at: string) =>
		new Date(wall + ((Date.parse(at) - Date.parse(j.now)) * c.dayMinutes) / DAY_MINUTES).toISOString();
	const runs: JourneyTrigger[] = DAILY.map((a) => {
		const due = `${j.daily[a.id] === today ? addDay(today) : today}T${a.time}:00+05:30`;
		return {
			id: a.id,
			agent: a.id,
			kind: 'run',
			key: `${a.id}.daily` as JourneyTrigger['key'],
			ref: null,
			due,
			dueWall: wallOf(due),
			time: a.time,
			blocked: off(a) ?? (a.id === 'watcher' && !j.setupConfirmed ? 'After Setup is confirmed' : null)
		};
	});
	const timers: JourneyTrigger[] = j.timers.map((t) => ({
		id: t.id,
		agent: t.agent,
		kind: 'timer',
		key: t.key,
		ref: t.ref,
		due: t.due,
		dueWall: wallOf(t.due),
		time: null,
		blocked: t.blocked ?? null
	}));
	const day = Math.round((Date.parse(today + 'T00:00:00Z') - Date.parse(j.day0 + 'T00:00:00Z')) / DAY_MS);
	return {
		live: true,
		clock: { now: j.now, day, day0: j.day0, dayMinutes: c.dayMinutes, compressed: c.dayMinutes < DAY_MINUTES },
		triggers: [...runs, ...timers].sort((a, b) => Date.parse(a.due!) - Date.parse(b.due!))
	};
}

/** the audit line a fire writes, in backend-api's words */
export function fireLine(c: Client, t: JourneyTrigger, agents: Agent[]): string {
	if (t.kind === 'run') {
		const a = DAILY.find((x) => x.id === t.id)!;
		return t.due
			? `Ran the ${a.name}'s ${a.what} now for ${c.name}`
			: `Ran the ${a.id === 'data' ? 'Data' : a.name} agent now for ${c.name}`;
	}
	const agent = agents.find((a) => a.id === t.agent);
	return `Fired the ${agent?.name ?? t.agent} agent's timer now for ${c.name}: ${TIMER_WORDS[t.key]} for ${t.ref}`;
}

/** a fire, on the mock's journey: a daily run becomes that day's, a timer goes; and the line it adds to today's runs */
export function fireOn(j: MockJourney | undefined, t: JourneyTrigger): string {
	if (t.kind === 'run') {
		if (j) j.daily[t.id] = j.now.slice(0, 10);
		return j ? `ran the ${DAILY.find((x) => x.id === t.id)!.what} on request` : 'ran on request; nothing new';
	}
	if (j) j.timers = j.timers.filter((x) => x.id !== t.id);
	return `${TIMER_WORDS[t.key]} for ${t.ref}, on request`;
}

/** the journey from day 0 again: nothing pending but the day's two runs, Setup to confirm again */
export const journeyFromStart = (day0: string): MockJourney => ({
	day0,
	now: `${day0}T08:00:00+05:30`,
	setupConfirmed: false,
	daily: {},
	timers: []
});
export const resetLine = (day0: string) => `started the journey again from ${day0}`;

/* ---------- a client's stock export, uploaded by staff (SC-84; platform.js exportUploaded, exportMapped) ---------- */

/** the export uploaded: mapping until the Data agent has read it, each field still waiting for its column */
export function exportUploaded(
	c: Client,
	file: string,
	who: string,
	at: string,
	fields: readonly ExportColumn[] = []
): void {
	const columns = fields.map((x) => ({ field: x.field, column: null }));
	c.firstExport = {
		status: 'mapping',
		file,
		rows: 0,
		batches: 0,
		distributors: c.distributors.length,
		by: who,
		at,
		columns
	};
}
/** the Data agent has read it: mapped, with what the file brought and its columns (the mock's export is the story's) */
export function exportMapped(
	c: Client,
	sample: Pick<FirstExport, 'rows' | 'batches' | 'distributors' | 'columns'>
): void {
	if (!c.firstExport) return;
	c.firstExport = {
		...c.firstExport,
		status: 'mapped',
		rows: sample.rows,
		batches: sample.batches,
		distributors: Math.max(c.distributors.length, sample.distributors),
		columns: sample.columns.map((x) => ({ ...x }))
	};
}
export const exportLine = (c: Pick<Client, 'name'>, file: string) =>
	`Uploaded ${possessive(c.name)} stock export ${file}; the Data agent maps and loads it`;
