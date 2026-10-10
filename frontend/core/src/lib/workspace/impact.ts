// The Impact dashboard (SC-157, design3/core/ledger.js dashboard): a period's figures drawn from the ledger's rows, the
// kilos by the week each batch cleared, by distributor, by product and by channel, and the period before. It reads the
// ledger whichever source made it (the stub's, or backend-api's), so it carries none of the stub (core/tests/source.test.ts)
import type { Ledger, LedgerPeriod } from './types';

const r2 = (n: number) => Math.round(n * 100) / 100;
/* ---------- the Impact dashboard (SC-157): a period's figures drawn from its rows (design3/core/ledger.js dashboard) ---------- */
export type DashWeek = {
	from: string;
	kept: number;
	resold: number;
	donated: number;
	destroyed: number;
	closed: number;
	net: number;
	meals: number;
};
export type DashGroup = {
	label: string;
	img: string;
	resold: number;
	donated: number;
	destroyed: number;
	batches: number;
	kept: number;
};
export type Dashboard = {
	pid: string;
	/** the quarter before, when the period is a quarter that has one */
	prev: string | null;
	rows: string[];
	/** the kilos by the week each batch cleared, from the period's start (or the first batch ever cleared) */
	weeks: DashWeek[];
	byDist: DashGroup[];
	bySku: DashGroup[];
	/** the kilos each channel took, in the channels' fixed order, destroyed last */
	mixKg: [string, number][];
	/** the share of the food saved, in whole tenths of a percent */
	share: number | null;
	end: string;
};
const MS = 864e5;
const CHANNELS = ['kirana', 'expiresoon', 'staff', 'd2c', 'foodbank', 'writeoff'];
const r1 = (n: number) => Math.round(n * 10) / 10;
export function dashboard(book: Ledger, pid: string): Dashboard {
	const periods = book.periods;
	const p = periods.find((x) => x.id === pid) ?? periods[periods.length - 1];
	const rows = book.batches.filter((r) => r.cleared >= p.from && r.cleared <= p.to);
	const qs = periods.filter((x) => x.kind === 'quarter');
	const qi = qs.findIndex((x) => x.id === p.id);
	const prev = p.kind === 'quarter' && qi > 0 ? qs[qi - 1] : null;
	const end = p.current ? book.today : p.to;
	// the weeks run from the period's start, or from the first batch the workspace cleared when that came later (the
	// year starts in April; the workspace since July), in whole weeks
	const firstEver = book.batches.length ? Date.parse(book.batches[0].cleared) : Date.parse(p.from);
	const d0 = Math.max(Date.parse(p.from), firstEver - ((firstEver - Date.parse(p.from)) % (7 * MS)));
	const dEnd = Date.parse(end);
	const weeks: DashWeek[] = [];
	for (let t = d0; t <= dEnd; t += 7 * MS)
		weeks.push({
			from: new Date(t).toISOString().slice(0, 10),
			kept: 0,
			resold: 0,
			donated: 0,
			destroyed: 0,
			closed: 0,
			net: 0,
			meals: 0
		});
	for (const r of rows) {
		const i = Math.min(weeks.length - 1, Math.floor((Date.parse(r.cleared) - d0) / (7 * MS)));
		const w = weeks[i];
		const F = r.figures;
		w.kept = r2(w.kept + F.kg);
		w.resold = r2(w.resold + F.resoldKg);
		w.donated = r2(w.donated + F.donatedKg);
		w.destroyed = r2(w.destroyed + F.destroyedKg);
		w.closed += 1;
		w.net = r2(w.net + F.net);
		w.meals += F.meals;
	}
	const group = (key: 'distributorName' | 'name') => {
		const by: Record<string, DashGroup> = {};
		for (const r of rows) {
			const k = r[key];
			by[k] ??= { label: k, img: r.img, resold: 0, donated: 0, destroyed: 0, batches: 0, kept: 0 };
			by[k].resold = r2(by[k].resold + r.figures.resoldKg);
			by[k].donated = r2(by[k].donated + r.figures.donatedKg);
			by[k].destroyed = r2(by[k].destroyed + r.figures.destroyedKg);
			by[k].batches += 1;
		}
		return Object.values(by)
			.map((x) => ({ ...x, kept: r2(x.resold + x.donated) }))
			.sort((a, b) => b.kept - a.kept || (a.label < b.label ? -1 : 1));
	};
	const mix: Record<string, number> = {};
	for (const r of rows) {
		const per = (r.figures.kg + r.figures.destroyedKg) / (r.figures.units || 1);
		for (const l of r.lines) mix[l.id] = (mix[l.id] ?? 0) + l.units * per;
		mix.writeoff = (mix.writeoff ?? 0) + r.figures.destroyedKg;
	}
	const mixKg = CHANNELS.filter((id) => mix[id] > 0).map((id): [string, number] => [id, r1(mix[id])]);
	const t = p.totals;
	const share = t.kg + t.destroyedKg ? Math.round((t.kg / (t.kg + t.destroyedKg)) * 1000) / 10 : null;
	return {
		pid: p.id,
		prev: prev ? prev.id : null,
		rows: rows.map((r) => r.ref),
		weeks,
		byDist: group('distributorName'),
		bySku: group('name'),
		mixKg,
		share,
		end
	};
}
/** the period the Command Center's Impact card reads (SC-157): the current quarter once a batch has cleared in it, else
 *  the latest quarter that has one, else the year so far */
export function impactPeriod(book: Ledger): LedgerPeriod {
	const qs = book.periods.filter((x) => x.kind === 'quarter');
	const cur = qs.find((x) => x.current);
	if (cur && cur.totals.batches) return cur;
	const withBatches = qs.filter((x) => x.totals.batches);
	return withBatches[withBatches.length - 1] ?? book.periods[book.periods.length - 1];
}
/** a week's label from its first day, 12 Aug */
export const weekLabel = (iso: string) =>
	new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	});
