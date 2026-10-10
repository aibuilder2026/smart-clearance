// The ledger (SC-121, design3/core/ledger.js): every batch cleared, by quarter and by year. The rows are what Impact
// posted for each batch: on the live workspace backend-api answers the whole ledger (SC-124); the stub reads the
// history's rows and the story's from the seed, written by design3's ledger.js, and adds them up here as ledger.js
// does (core/tests/ledger.test.ts holds the two together). The history's batches each have their page: their case,
// as the papers read it, from the seed.
import history from './seed/history.json';
import { D } from './data';
import { stageOf } from './flow';
import type {
	Assess,
	BrsrRow,
	Batch,
	CaseData,
	Doc,
	Hero,
	Ledger,
	LedgerBatch,
	LedgerOpen,
	LedgerPage,
	LedgerPeriod,
	LedgerTotals,
	Partner,
	Plan,
	PlanLine,
	State,
	WorkspaceData
} from './types';

const r2 = (n: number) => Math.round(n * 100) / 100;

const FIGURES = [
	'net',
	'swing',
	'pnl',
	'writeOff',
	'itcKept',
	'itcReversed',
	'kg',
	'co2',
	'meals',
	'units',
	'sold',
	'donated',
	'godown',
	'destroyed',
	'resoldKg',
	'donatedKg',
	'destroyedKg',
	'packResoldKg',
	'packDonatedKg',
	'packDestroyedKg',
	'credit',
	'support'
] as const;
const WHOLE = ['meals', 'units', 'sold', 'donated', 'godown', 'destroyed'] as const;
/** the mix's channels, by the packs each took; what none took and was destroyed is the write-off */
export const MIX: Record<string, string> = {
	kirana: 'Kirana scheme',
	expiresoon: 'ExpireSoon',
	staff: 'Staff sale',
	foodbank: 'Food bank',
	writeoff: 'Destroyed'
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];
const FOOD = 'Food waste: packaged food past quick-commerce gates';
const PLASTIC = 'Plastic packaging (EPR)';

/** BRSR Principle 6's waste rows, in kilos: what was diverted from disposal (resold or donated) and what was destroyed,
 *  of the food and of its plastic packaging (SC-125), which goes where its pack goes */
function brsrOf(rows: LedgerBatch[], t: LedgerTotals): BrsrRow[] {
	if (!rows.length) return [];
	const out: BrsrRow[] = [
		{
			cat: FOOD,
			diverted: t.kg,
			resold: t.resoldKg,
			donated: t.donatedKg,
			disposed: t.destroyedKg,
			evidence: evidence(rows, t)
		}
	];
	if (t.packResoldKg + t.packDonatedKg + t.packDestroyedKg > 0)
		out.push({
			cat: PLASTIC,
			diverted: r2(t.packResoldKg + t.packDonatedKg),
			resold: t.packResoldKg,
			donated: t.packDonatedKg,
			disposed: t.packDestroyedKg,
			evidence: `${new Set(rows.map((r) => r.sku)).size} SKUs' packaging weights (indicative), on the same papers`
		});
	return out;
}
const num = (n: number) => Math.round(n).toLocaleString('en-IN');
const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const fyOf = (d: string) => (+d.slice(5, 7) >= 4 ? +d.slice(0, 4) + 1 : +d.slice(0, 4));
const quarterOf = (d: string) => Math.floor(((+d.slice(5, 7) - 4 + 12) % 12) / 3) + 1;
function quarterSpan(fy: number, q: number): [string, string] {
	const month = [4, 7, 10, 1][q - 1];
	const year = q < 4 ? fy - 1 : fy;
	const end = new Date(Date.UTC(year, month - 1 + 3, 0));
	return [iso(year, month, 1), end.toISOString().slice(0, 10)];
}

/** a period's batches added up; CO₂e is the kilos kept out of landfill × the factor */
export function totals(rows: LedgerBatch[], co2PerKg = D.rules.co2PerKg): LedgerTotals {
	const t = Object.fromEntries(FIGURES.map((k) => [k, r2(rows.reduce((s, r) => s + r.figures[k], 0))])) as Record<
		(typeof FIGURES)[number],
		number
	>;
	for (const k of WHOLE) t[k] = Math.trunc(t[k]);
	t.co2 = r2(t.kg * co2PerKg);
	const papers = rows.flatMap((r) => r.papers).filter((p) => p.status !== 'not required');
	const count = (id: string) => papers.filter((p) => p.id === id).length;
	return {
		...t,
		batches: rows.length,
		outcomes: {
			sold: rows.filter((r) => r.outcome === 'sold').length,
			leftover: rows.filter((r) => r.outcome === 'leftover').length,
			donation: rows.filter((r) => r.outcome === 'donation').length
		},
		invoices: count('invoice'),
		creditNotes: count('support') + count('expiry'),
		receipts: count('receipt'),
		reviewed: rows.filter((r) => r.reviewed).length
	};
}

/** the share of the packs each channel took, in whole percent that add up to 100 (the largest remainders) */
function mixOf(rows: LedgerBatch[]): [string, number][] {
	const took: Record<string, number> = {};
	for (const r of rows) {
		for (const l of r.lines) took[l.id] = (took[l.id] ?? 0) + (l.units || 0);
		took.writeoff = (took.writeoff ?? 0) + r.figures.destroyed;
	}
	const whole = Object.values(took).reduce((a, b) => a + b, 0);
	if (!whole) return [];
	const ids = Object.keys(MIX).filter((k) => took[k]);
	const exact = Object.fromEntries(ids.map((k) => [k, (took[k] * 100) / whole]));
	const pct = Object.fromEntries(ids.map((k) => [k, Math.floor(exact[k])]));
	const short = 100 - ids.reduce((s, k) => s + pct[k], 0);
	[...ids]
		.sort((a, b) => exact[b] - pct[b] - (exact[a] - pct[a]))
		.slice(0, short)
		.forEach((k) => (pct[k] += 1));
	return ids.map((k) => [k, pct[k]]);
}

function evidence(rows: LedgerBatch[], t: LedgerTotals) {
	const orders = rows.reduce(
		(s, r) => s + r.lines.filter((l) => l.id === 'kirana').reduce((a, l) => a + l.units, 0),
		0
	);
	const listings = rows.filter((r) => r.lines.some((l) => l.id === 'expiresoon')).length;
	const destroyed = rows.filter((r) => r.figures.destroyed).length;
	return [
		t.invoices && `${t.invoices} tax invoices`,
		listings && `${listings} ExpireSoon listings`,
		orders && `kirana order logs for ${num(orders)} packs`,
		t.receipts && `${t.receipts} food-bank receipts`,
		destroyed && `${destroyed} destruction certificates`
	]
		.filter(Boolean)
		.join(', ');
}

/** the quarter's 13 weeks (the last takes its odd day or two): recovered, and what the batches would have cost */
function weeksOf(rows: LedgerBatch[], start: string): [string, number, number][] {
	const out = Array.from({ length: 13 }, (_, i): [string, number, number] => [`W${i + 1}`, 0, 0]);
	for (const r of rows) {
		const i = Math.min(Math.floor((Date.parse(r.cleared) - Date.parse(start)) / 864e5 / 7), 12);
		out[i][1] = r2(out[i][1] + r.figures.net);
		out[i][2] = r2(out[i][2] + r.figures.writeOff);
	}
	return out;
}

function monthsOf(rows: LedgerBatch[], co2PerKg: number) {
	const by: Record<string, LedgerBatch[]> = {};
	for (const r of rows) (by[r.cleared.slice(0, 7)] ??= []).push(r);
	return Object.keys(by)
		.sort()
		.map((k) => ({
			month: k,
			label: `${MONTH_NAMES[+k.slice(5) - 1]} ${k.slice(0, 4)}`,
			totals: totals(by[k], co2PerKg)
		}));
}

function period(
	id: string,
	label: string,
	long: string,
	from: string,
	to: string,
	rows: LedgerBatch[],
	current: boolean,
	kind: 'quarter' | 'year',
	co2PerKg: number
): LedgerPeriod {
	const inside = rows.filter((r) => r.cleared >= from && r.cleared <= to);
	const t = totals(inside, co2PerKg);
	return {
		id,
		kind,
		label,
		long,
		from,
		to,
		current,
		totals: t,
		months: monthsOf(inside, co2PerKg),
		weeks: kind === 'quarter' ? weeksOf(inside, from) : [],
		mix: mixOf(inside),
		mixNames: MIX,
		brsr: brsrOf(inside, t)
	};
}

/** every quarter from the first batch cleared to today's, then each financial year so far */
export function periods(rows: LedgerBatch[], today: string, co2PerKg = D.rules.co2PerKg): LedgerPeriod[] {
	const first = rows.reduce((a, r) => (r.cleared < a ? r.cleared : a), today);
	let fy = fyOf(first);
	let q = quarterOf(first);
	const now = [fyOf(today), quarterOf(today)];
	const out: LedgerPeriod[] = [];
	const years: number[] = [];
	while (fy < now[0] || (fy === now[0] && q <= now[1])) {
		const [from, to] = quarterSpan(fy, q);
		const current = fy === now[0] && q === now[1];
		const span = `${MONTHS[+from.slice(5, 7) - 1]} to ${MONTHS[+to.slice(5, 7) - 1]} ${to.slice(0, 4)}`;
		out.push(
			period(
				`fy${pad(fy % 100)}-q${q}`,
				`Q${q} FY${pad(fy % 100)}`,
				span + (current ? ' · so far' : ''),
				from,
				to,
				rows,
				current,
				'quarter',
				co2PerKg
			)
		);
		if (!years.includes(fy)) years.push(fy);
		if (q < 4) q += 1;
		else {
			fy += 1;
			q = 1;
		}
	}
	for (const y of years) {
		const current = y === now[0];
		const name = `FY ${y - 1}-${pad(y % 100)}`;
		out.push(
			period(
				`fy${pad(y % 100)}`,
				current ? 'This year' : name,
				current ? `${name} so far` : name,
				iso(y - 1, 4, 1),
				iso(y, 3, 31),
				rows,
				current,
				'year',
				co2PerKg
			)
		);
	}
	return out;
}

/* ---------- the stub: the history and the story's own batches ---------- */

/** a batch of the history, as design3's ledger.js writes it to the seed: its case, with the SKU and distributor by id */
type HistoryCase = {
	ref: string;
	history: true;
	outcome: string;
	flagged: string;
	cleared: string;
	batch: Omit<Batch, 'assess'> & { assess: Assess };
	sku: string;
	dist: string;
	plan: Plan;
	realised: Plan & { godown: number };
	actual: CaseData['actual'];
	lines: { kirana: PlanLine; expiresoon: PlanLine };
	award: (CaseData['award'] & { bid: number }) | null;
	support: CaseData['support'];
	supportPlan: CaseData['supportPlan'];
	claim: CaseData['claim'];
	docs: Doc[];
	receipt: Doc | null;
	returnBy: string;
	expiry: CaseData['expiry'];
	/** destroyed at his godown (SC-139): the evidence he sent and the operator's yes */
	destruction?: CaseData['destruction'];
	listing: { id: string; units: number } | null;
	kiranas: { kirana: string; name: string; area: string; units: number }[];
	offered: number;
	scheme: CaseData['scheme'];
	partner: Partner | null;
	donation: { partner: Partner; units: number; from: string; spot: string } | null;
	reviewed: { by: string; at: string | null };
};
const H = history as unknown as {
	cases: HistoryCase[];
	rows: LedgerBatch[];
	story: { row: LedgerBatch; cleared: string };
};
export const HISTORY_ROWS = H.rows;
const HERO = D.batches.find((b) => b.hero)!;
const SECOND = D.batches.find((b) => b.second)!;

/** the stub's ledger, from the journey's state: the history, the chips batch once Impact has posted it, and the story's
 *  batches still out (ledger.js ledger) */
export function stubLedger(state: State): Ledger {
	const h = state.hero;
	const rows = h.posted ? [...H.rows, H.story.row] : H.rows;
	const today = h.posted ? H.story.cleared : D.day0;
	const open = (b: Batch): Omit<LedgerOpen, 'phase' | 'stage'> => ({
		ref: b.id,
		sku: b.sku,
		name: D.skus[b.sku].name,
		img: D.skus[b.sku].img,
		distributor: b.distributor,
		distributorName: D.distributors[b.distributor].name,
		city: D.distributors[b.distributor].city,
		flagged: D.day0
	});
	const inFlight: LedgerOpen[] = [];
	if (!h.posted && h.phase !== 'watching')
		inFlight.push({ ...open(HERO), phase: h.phase, stage: D.stages[stageOf(state)].id });
	inFlight.push({ ...open(SECOND), phase: state.mango.phase, stage: 'execute' });
	return {
		since: D.workspace.since,
		today,
		co2PerKg: D.rules.co2PerKg,
		periods: periods(rows, today),
		batches: rows,
		inFlight
	};
}

/** a cleared batch's state, as its pack reads it: drafted, reviewed, posted */
export const clearedHero = (c: CaseData): Hero => ({
	id: c.batch.id,
	phase: 'cleared',
	photo: { status: 'verified' },
	plan: null,
	listing: null,
	offer: null,
	orders: [],
	bids: [],
	chat: [],
	award: null,
	van: { status: 'done', done: c.kiranas.length },
	truck: { status: c.award.units ? 'dispatched' : 'idle' },
	docs: c.docs.map((d) => ({ id: d.id, status: d.status })),
	invoiceIssued: true,
	posted: true,
	reviewed: true
});

/** a batch of the history as the screens read a batch: its case (core's CaseData), with what the story's stub has for
 *  what a cleared batch's papers never read (its pushes, its moments) */
function caseOf(x: HistoryCase, data: WorkspaceData): CaseData {
	const sku = data.skus[x.sku];
	const dist = data.distributors[x.dist];
	const batch = x.batch as Batch;
	const story = D.journey.donation;
	return {
		batch,
		sku,
		dist,
		buyer: D.buyer,
		kiranas: x.kiranas.map((k) => ({ id: k.kirana, name: k.name, area: k.area, units: k.units, at: '' })),
		offered: x.offered,
		scheme: x.scheme,
		risk: x.batch.assess,
		plan: x.plan,
		lines: x.lines,
		counter: D.counter,
		award: x.award ?? { units: 0, price: 0, gross: 0, token: 0, balance: 0 },
		actual: x.actual,
		support: x.support,
		supportPlan: x.supportPlan,
		claim: x.claim,
		docs: x.docs,
		invoice: x.docs.find((d) => d.id === 'invoice') ?? {
			id: 'invoice',
			type: '',
			owner: '',
			no: '',
			status: 'not required',
			amount: 0
		},
		returnBy: x.returnBy,
		push: {},
		today: x.flagged,
		planMinutes: 0,
		permissionAsked: '',
		listing: { id: x.listing?.id ?? '', url: '' },
		van: D.journey.van,
		realised: { lines: x.realised.lines.map((l) => ({ id: l.id, units: l.units })), godown: x.realised.godown },
		expiry: x.expiry,
		destruction: x.destruction ?? null,
		donation: {
			...story,
			batch,
			sku,
			dist,
			plan: x.plan,
			units: x.donation?.units ?? 0,
			partner: x.donation?.partner ?? D.setup.partners[0],
			from: x.donation?.from ?? dist.godown ?? '',
			spot: x.donation?.spot ?? '',
			receipt: x.receipt
		}
	};
}

/** a batch's page in the stub's ledger: a batch of the history, or the story's chips batch (`kase`, its state) */
export function stubPage(ref: string, data: WorkspaceData, kase: CaseData, state: State): LedgerPage | null {
	const x = H.cases.find((c) => c.ref === ref);
	if (x) {
		const c = caseOf(x, data);
		return { c, h: clearedHero(c), row: H.rows.find((r) => r.ref === ref) ?? null };
	}
	if (ref !== HERO.id) return null;
	return { c: kase, h: state.hero, row: state.hero.posted ? H.story.row : null };
}
