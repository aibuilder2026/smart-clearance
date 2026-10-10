import { describe, expect, it } from 'vitest';
import { fastForward } from '../src/lib/workspace/flow';
import { dashboard, impactPeriod } from '../src/lib/workspace/impact';
import { HISTORY_ROWS, periods, stubLedger, stubPage } from '../src/lib/workspace/ledger';
import { store } from '../src/lib/workspace/store.svelte';
import { data, kase } from '../src/lib/workspace/stub.svelte';
import { run } from './design3';

// The stub's ledger (SC-121) is design3/core/ledger.js: the history's rows and the story's come from the seed it writes,
// and adding them up into quarters and years, the months, the weeks, the mix and BRSR's row gives what ledger.js gives,
// before the story's batch is posted and after. Each batch of the history has its own page, cleared and reviewed.
const W = run('core/money.js', 'core/data.js', 'core/store.js', 'core/flow.js', 'core/world.js', 'core/ledger.js');
const plain = (o: unknown) => JSON.parse(JSON.stringify(o));

describe("the ledger is ledger.js's", () => {
	for (const n of [0, 6, 9])
		it(`at stage ${n}`, () => {
			W.SC3_FLOW.fastForward(n);
			fastForward(n);
			expect(plain(stubLedger(store.get()))).toEqual(plain(W.SC3_LEDGER.ledger(W.SC3_STORE.get())));
		});
	it('adds up the history by quarter and year', () => {
		const ps = periods(HISTORY_ROWS, '2026-10-02');
		expect(ps.map((p) => [p.id, p.label, p.totals.batches])).toEqual([
			['fy27-q2', 'Q2 FY27', 12],
			['fy27-q3', 'Q3 FY27', 0],
			['fy27', 'This year', 12]
		]);
		expect(ps[0].totals.outcomes).toEqual({ sold: 7, leftover: 3, donation: 2 });
	});
	it('gives each batch of the history its page, cleared, with its papers as ledger.js draws them', () => {
		for (const x of W.SC3_LEDGER.HISTORY) {
			const page = stubPage(x.ref, data, kase, store.get())!;
			expect(page.h.phase).toBe('cleared');
			expect(page.h.reviewed).toBe(true);
			expect(plain(page.c.docs)).toEqual(plain(x.docs));
			expect(page.row?.ref).toBe(x.ref);
		}
		expect(stubPage('MF-0000-000', data, kase, store.get())).toBeNull();
	});
});

describe("the Impact dashboard is ledger.js's (SC-157)", () => {
	for (const n of [0, 9])
		it(`at stage ${n}, for every period, and the Command Center's period`, () => {
			W.SC3_FLOW.fastForward(n);
			fastForward(n);
			const ours = stubLedger(store.get());
			const theirs = W.SC3_LEDGER.ledger(W.SC3_STORE.get());
			for (const p of ours.periods)
				expect(plain(dashboard(ours, p.id))).toEqual(plain(W.SC3_LEDGER.dashboard(theirs, p.id)));
			expect(impactPeriod(ours).id).toBe(W.SC3_LEDGER.impactPeriod(theirs).id);
		});
	it('draws the pilot quarter: its weeks, the two distributors, the channels, the share saved', () => {
		W.SC3_FLOW.fastForward(0);
		fastForward(0);
		const book = stubLedger(store.get());
		const d = dashboard(book, 'fy27-q2');
		// the weeks run from the first batch cleared (mid-August), not the quarter's first day
		expect(d.weeks.length).toBeGreaterThan(6);
		expect(d.weeks.length).toBeLessThanOrEqual(13);
		expect(d.weeks[0].from >= book.batches[0].cleared.slice(0, 7)).toBe(true);
		expect(d.weeks.reduce((t, w) => t + w.closed, 0)).toBe(12);
		expect(d.byDist.map((x) => x.label).sort()).toEqual(['Lakshmi Agencies', 'Rakesh Traders']);
		expect(d.byDist[0].kept).toBeGreaterThanOrEqual(d.byDist[1].kept);
		expect(d.mixKg.map(([id]) => id)).toEqual(['kirana', 'expiresoon', 'staff', 'foodbank', 'writeoff']);
		expect(d.share).toBeGreaterThan(90);
		expect(impactPeriod(book).id).toBe('fy27-q2'); // nothing cleared in Q3 yet
	});
});
