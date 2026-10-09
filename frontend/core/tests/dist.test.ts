import { describe, expect, it } from 'vitest';
import { D, SHOPS_ALL } from '../src/lib/workspace/data';
import {
	byAsk,
	deliveriesPast,
	distNows,
	journeyOf,
	nowOfFacts,
	ordersNow,
	ordersPast,
	photoOf,
	type DistWorld
} from '../src/lib/workspace/dist';
import { A, fastForward } from '../src/lib/workspace/flow';
import { store } from '../src/lib/workspace/store.svelte';
import { HISTORY_CASES, kase } from '../src/lib/workspace/stub.svelte';
import type { PartnerCase } from '../src/lib/workspace/types';
import { run } from './design3';

// A distributor's portal, batch by batch (SC-133), is design3/core/ledger.js's partners: from the journey's state and
// the history's cases, each batch in a journey stands where ledger.js has it (its lines, his steps, what it waits for),
// and its orders, a cleared batch's orders and deliveries, and his label photos come out as ledger.js draws them, for
// both distributors at every stage.
const W = run('core/money.js', 'core/data.js', 'core/store.js', 'core/flow.js', 'core/world.js', 'core/ledger.js');
const P = W.SC3_LEDGER.partners;
const plain = (o: unknown) => JSON.parse(JSON.stringify(o));
const WORLD: DistWorld = {
	skus: D.skus,
	distributors: D.distributors,
	buyer: D.buyer,
	scheme: D.rules.scheme,
	short: D.workspace.short
};
const shopName = (id: string) =>
	SHOPS_ALL.find((k) => k.id === id)?.name ?? D.kiranas.find((k) => k.id === id)?.name ?? id;
// core's carry where each batch was read from, which ledger.js has no need of
const bare = <T extends { from?: string }>(o: T) => {
	const { from: _f, ...rest } = o;
	return rest;
};
const nows = (dist: string) =>
	distNows({ state: store.get(), c: kase, day0: D.day0, shops: SHOPS_ALL, cases: [], phaseOf: () => null }, dist);
const byRef = (ref: string) => HISTORY_CASES.find((c) => c.ref === ref)!;

describe("a distributor's batches in a journey are ledger.js's", () => {
	for (const n of [0, 2, 3, 5, 6, 7, 8, 9])
		for (const dist of ['rakesh', 'lakshmi'])
			it(`${dist} at stage ${n}: each batch, its lines, his steps, its orders`, () => {
				W.SC3_FLOW.fastForward(n);
				fastForward(n);
				const mine = nows(dist);
				const theirs = P.distNow(dist, W.SC3_STORE.get());
				expect(plain(mine.map(bare))).toEqual(plain(theirs));
				expect(plain(mine.map((x) => bare(journeyOf(x, WORLD))).sort((a, z) => byAsk(a as never, z as never)))).toEqual(
					plain(P.journeys(dist, W.SC3_STORE.get()))
				);
				for (const x of mine)
					expect(plain(ordersNow(x, shopName, WORLD))).toEqual(
						plain(
							P.ordersNow(
								theirs.find((t: { ref: string }) => t.ref === x.ref),
								P.shopName
							)
						)
					);
			});
	it("the Mango Drink's staff sale, once Lakshmi Agencies records it", () => {
		W.SC3_FLOW.fastForward(7);
		fastForward(7);
		W.SC3_FLOW.act('recordStaffSale', 140);
		store.update((s) => A.recordStaffSale(s, 140));
		const [mine] = nows('lakshmi');
		const [theirs] = P.distNow('lakshmi', W.SC3_STORE.get());
		expect(plain(bare(mine))).toEqual(plain(theirs));
		expect(mine.staff).toEqual({ status: 'recorded', units: 150, price: theirs.staff.price, sold: 140 });
		expect(journeyOf(mine, WORLD).todo.map((t) => t.id)).not.toContain('staff');
	});
});

describe("a cleared batch's orders, deliveries and label photo are ledger.js's", () => {
	it('every batch of the history', () => {
		for (const x of W.SC3_LEDGER.HISTORY) {
			const c = byRef(x.ref);
			const f = P.historyFacts(x);
			expect(plain(ordersPast(c, shopName, WORLD))).toEqual(plain(P.ordersPast(f, P.shopName)));
			expect(plain(deliveriesPast(c, WORLD))).toEqual(plain(P.deliveriesPast(f)));
			expect(plain(photoOf(c, WORLD))).toEqual(plain(P.photoOf(f)));
		}
	});
});

describe('a batch read from its partner facts (the live workspace)', () => {
	// a history batch, as it stood before it cleared: its facts up to a step
	const until = (c: PartnerCase, step: string): PartnerCase => {
		const i = c.steps.findIndex((s) => s.step === step);
		return { ...c, cleared: null, realised: null, steps: c.steps.slice(0, i + 1) };
	};
	const withKiranas = HISTORY_CASES.find((c) => c.plan.lines.some((l) => l.id === 'kirana' && l.units > 0) && c.award)!;
	it('asks for the label photo before its plan', () => {
		const asked = { ...until(withKiranas, 'detect'), plan: { units: 0, lines: [] } };
		asked.steps = [...asked.steps, { step: 'ask', at: asked.steps[0].at }];
		const n = nowOfFacts(asked, 'at-risk', 'B4');
		const j = journeyOf(n, WORLD);
		expect(j.todo.map((t) => t.id)).toEqual(['photo']);
		expect(j.todo[0].sub).toContain('Shelf B4');
	});
	it('waits on the scheme, then loads the truck once the scheme is over', () => {
		const accepted = until(withKiranas, 'accept');
		const open = {
			...accepted,
			kiranas: accepted.kiranas.slice(0, 2),
			kirana: {
				planned: accepted.kirana!.planned,
				ordered: accepted.kiranas.slice(0, 2).reduce((t, k) => t + k.units, 0)
			},
			offer: { status: 'open' as const, closesAt: null }
		};
		expect(journeyOf(nowOfFacts(open, 'executing'), WORLD).todo.map((t) => t.id)).toEqual([]);
		const closed = { ...open, offer: { status: 'closed' as const, closesAt: null } };
		expect(journeyOf(nowOfFacts(closed, 'executing'), WORLD).todo.map((t) => t.id)).toEqual(['truck']);
	});
	it('issues the invoice and runs the van round once the papers are drafted', () => {
		const pc = { ...until(withKiranas, 'papers'), offer: { status: 'closed' as const, closesAt: null } };
		const j = journeyOf(nowOfFacts(pc, 'settled'), WORLD);
		expect(j.todo.map((t) => t.id)).toEqual(['invoice', 'van']);
		expect(j.todo[0].act).toBe('issueInvoice');
	});
	it('is left out of his journeys while the snapshot has it watching, and once cleared', () => {
		const pc = until(withKiranas, 'approve');
		const at = (phase: string | null) =>
			distNows(
				{ state: store.get(), c: null, day0: D.day0, shops: SHOPS_ALL, cases: [pc], phaseOf: () => phase },
				pc.dist
			).map((n) => n.ref);
		expect(at('executing')).toEqual([pc.ref]);
		expect(at('watching')).toEqual([]);
		expect(
			distNows(
				{ state: store.get(), c: null, day0: D.day0, shops: SHOPS_ALL, cases: [withKiranas], phaseOf: () => null },
				pc.dist
			)
		).toEqual([]);
	});
});
