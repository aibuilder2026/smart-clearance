// The platform's rules, ported from design3/core/platform.js (the console prototype's mock backend): what a supply-chain
// profile switches on, how far each preset lets the agents go, the one line under each agent, how a setting reads in
// the audit log, and what the setup flow and the invitations accept. The mock applies them as the server would; the
// console uses the same functions to preview a choice before it is saved. A test runs platform.js and checks these give
// the same answers.
import { isEmail } from '@smart-clearance/core/identity';
import type { Agent } from '../types/shared';
import type {
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

/** what an invitation to a client's workspace must carry, or the problem with it */
export function inviteError(input: InviteInput, client: Pick<Client, 'name' | 'emailDomain'>): string | null {
	const contact = input.contact.trim();
	const phone = /^[+\d\s]{10,}$/.test(contact);
	const email = isEmail(contact);
	if (!input.name.trim()) return 'Enter a name.';
	if (!phone && !email) return 'Enter a work email address or a mobile number.';
	if (email && input.access !== 'Partner' && !contact.toLowerCase().endsWith('@' + client.emailDomain))
		return `${client.name} staff need a ${client.emailDomain} address. Partners can use any address or a phone number.`;
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
