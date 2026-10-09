import { describe, expect, it } from 'vitest';
import { D, SHOPS_ALL } from '../src/lib/workspace/data';
import { A, fastForward } from '../src/lib/workspace/flow';
import {
	distPapers,
	distPast,
	fssaiItems,
	moments,
	offersFor,
	pickupsFor,
	storyMoments,
	storyWhole,
	whole
} from '../src/lib/workspace/partners';
import { store } from '../src/lib/workspace/store.svelte';
import { HISTORY_CASES, kase, STUB_WORLD } from '../src/lib/workspace/stub.svelte';
import { run } from './design3';

// The partners' own history (SC-130) is design3/core/ledger.js's partners: from the history's cases in the seed and the
// journey's state, a distributor's batches, their moments, money and papers, every offer a shop was sent and what came
// of it, and a food bank's pickups come out as ledger.js draws them, for every shop and both distributors.
const W = run('core/money.js', 'core/data.js', 'core/store.js', 'core/flow.js', 'core/world.js', 'core/ledger.js');
const P = W.SC3_LEDGER.partners;
const plain = (o: unknown) => JSON.parse(JSON.stringify(o));
const byRef = (ref: string) => HISTORY_CASES.find((c) => c.ref === ref)!;

describe("a distributor's batches are ledger.js's", () => {
	for (const dist of ['rakesh', 'lakshmi'])
		it(`${dist}'s cleared batches, newest first`, () => {
			expect(distPast(HISTORY_CASES, dist).map((c) => c.ref)).toEqual(
				P.distBatches(dist, W.SC3_STORE.get()).past.map((c: { ref: string }) => c.ref)
			);
		});
	it("each batch's moments, money and papers", () => {
		for (const x of W.SC3_LEDGER.HISTORY) {
			const c = byRef(x.ref);
			expect(plain(moments(c, STUB_WORLD))).toEqual(plain(P.moments(x)));
			expect(plain(whole(c, STUB_WORLD))).toEqual(plain(P.whole(x)));
			const mine = distPapers(c),
				theirs = P.distPapers(x);
			expect(plain(mine)).toEqual(plain(theirs));
		}
	});
	it('every batch ends whole', () => {
		for (const c of HISTORY_CASES) expect(whole(c, STUB_WORLD).gain).toBe(0);
	});
	for (const n of [3, 6, 7, 8, 9])
		it(`the batch in a journey at stage ${n}: its moments and its money`, () => {
			W.SC3_FLOW.fastForward(n);
			fastForward(n);
			const s = store.get();
			expect(plain(storyMoments(s.feed, kase, s.hero, STUB_WORLD, true))).toEqual(
				plain(P.storyMoments(W.SC3_STORE.get()))
			);
			expect(plain(storyWhole(kase, s.hero, D.workspace.short))).toEqual(plain(P.storyWhole(W.SC3_STORE.get())));
		});
});

describe("a kirana's offers are ledger.js's", () => {
	const shops = SHOPS_ALL;
	const theirShop = (id: string) => W.SC3_WORLD.KIRANAS.find((k: { id: string }) => k.id === id);
	const compare = () => {
		const s = store.get();
		for (const shop of shops)
			expect(plain(offersFor(shop, HISTORY_CASES, STUB_WORLD, { c: kase, h: s.hero, day0: D.day0 }))).toEqual(
				plain(P.offersFor(theirShop(shop.id), W.SC3_STORE.get()))
			);
	};
	for (const n of [0, 7, 9])
		it(`for every shop at stage ${n}`, () => {
			W.SC3_FLOW.fastForward(n);
			fastForward(n);
			compare();
		});
	it('while the scheme is open, and after Not this time', () => {
		W.SC3_FLOW.fastForward(6);
		fastForward(6);
		for (const a of ['list', 'outreach']) {
			W.SC3_FLOW.act(a);
			store.update((s) => (A as Record<string, (s: unknown) => void>)[a](s));
		}
		compare();
		W.SC3_FLOW.act('decline', 'k31');
		store.update((s) => A.decline(s, 'k31'));
		compare();
		W.SC3_FLOW.act('order', 'k31');
		store.update((s) => A.order(s, 'k31'));
		compare();
		expect(store.get().hero.declined).toEqual({});
	});
});

describe("a food bank's pickups are ledger.js's", () => {
	it("Feeding India's collected donations, each with its receipt", () => {
		W.SC3_FLOW.fastForward(9);
		fastForward(9);
		const keys = [
			'ref',
			'sku',
			'dist',
			'units',
			'kg',
			'meals',
			'receipt',
			'spot',
			'from',
			'asked',
			'confirmed',
			'collected',
			'bestBefore',
			'daysLeft'
		];
		const pick = (p: Record<string, unknown>) => Object.fromEntries(keys.map((k) => [k, p[k]]));
		const theirs = P.pickupsFor('Feeding India', W.SC3_STORE.get()).filter((p: { story?: boolean }) => !p.story);
		const mine = pickupsFor('Feeding India', HISTORY_CASES, STUB_WORLD);
		expect(mine.length).toBe(2);
		expect(plain(mine.map(pick))).toEqual(plain(theirs.map(pick)));
		for (const p of mine)
			expect(fssaiItems(p, D.client.name)).toEqual(P.fssaiItems(theirs.find((x: { ref: string }) => x.ref === p.ref)));
		expect(pickupsFor('India FoodBanking Network', HISTORY_CASES, STUB_WORLD).map((p) => p.ref)).toEqual(
			P.pickupsFor('India FoodBanking Network', W.SC3_STORE.get()).map((p: { ref: string }) => p.ref)
		);
	});
});
