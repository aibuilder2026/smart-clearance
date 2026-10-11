import { afterAll, describe, expect, it } from 'vitest';
import { D, SHOPS_ALL, storyOf } from '../src/lib/workspace/data';
import { distNows, journeyOf, ordersNow, type DistWorld } from '../src/lib/workspace/dist';
import { act, Agents, fastForward, SCRIPTS, useScenario } from '../src/lib/workspace/flow';
import { stubLedger, stubPage } from '../src/lib/workspace/ledger';
import { heroModel } from '../src/lib/workspace/model';
import { offersFor, storyMoments, storySum, storyWhole } from '../src/lib/workspace/partners';
import { storyPhotos, storyRecord } from '../src/lib/workspace/record';
import { seedState, store } from '../src/lib/workspace/store.svelte';
import { caseOf, HISTORY_CASES, STUB_WORLD, stubSource } from '../src/lib/workspace/stub.svelte';
import type { StoryKey } from '../src/lib/workspace/types';
import { run } from './design3';

// The stub's other two journeys (SC-168): the Mango Drink at Lakshmi Agencies as the hero of its own, and the slow chips,
// whose scheme closes short and whose packs left at the godown are destroyed there on expiry day. Their money is
// money.js's to the paisa, their papers are numbered as the live journey numbers them, and every view of them (the case,
// the ledger, the record, a partner's moments and money, his batches in a journey, a shop's offer) is design3's.
const W = run(
	'core/money.js',
	'core/papers.js',
	'core/data.js',
	'core/store.js',
	'core/flow.js',
	'core/world.js',
	'core/ledger.js'
);
const L = W.SC3_LEDGER,
	P = L.partners;
const plain = (o: unknown) => JSON.parse(JSON.stringify(o));
// core's carry where each batch was read from, which ledger.js has no need of
const bare = <T extends { from?: string }>(o: T) => {
	const { from: _f, ...rest } = o;
	return rest;
};
const journey = (key: StoryKey) => {
	W.SC3_FLOW.useScenario(key);
	useScenario(key);
};
const both = (n: number) => {
	W.SC3_FLOW.fastForward(n);
	fastForward(n);
};
afterAll(() => journey('chips'));
const WORLD: DistWorld = {
	skus: D.skus,
	distributors: D.distributors,
	buyer: D.buyer,
	scheme: D.rules.scheme,
	short: D.workspace.short
};
const shopName = (id: string) =>
	SHOPS_ALL.find((k) => k.id === id)?.name ?? D.kiranas.find((k) => k.id === id)?.name ?? id;

describe("the Mango Drink's own journey", () => {
	const S = storyOf('mango');
	it("is the Router's plan: 1,372 to the Hyderabad kiranas at ₹12, 150 to the staff sale at ₹8, 58 to Feeding India", () => {
		expect(S.plan.lines.map((l) => [l.id, l.units, l.price])).toEqual([
			['kirana', 1372, 12],
			['staff', 150, 8],
			['foodbank', 58, 0]
		]);
		expect(S.ES).toBeNull();
		expect([S.kiranas.length, S.kiranas.reduce((t, k) => t + k.units, 0), S.offered]).toEqual([52, 1372, 58]);
	});
	it("comes to money.js's figures: net ₹16,917.10, swing ₹22,194.30, ₹5,932 of price support and 58 meals", () => {
		expect([S.actual.net, S.actual.swing, S.support.total]).toEqual([16917.1, 22194.3, 5932]);
		expect(S.end.row.figures).toMatchObject({ net: 16917.1, swing: 22194.3, meals: 58, donated: 58, godown: 0 });
		expect(S.end.row.outcome).toBe('donation');
	});
	it('issues the papers the live journey issues: CN/0117, the ITC memo, the FSSAI checklist and FI/HYD/26-27/0417', () => {
		expect(S.docs.map((d) => [d.id, d.no, d.status])).toEqual([
			['support', 'CN/0117', 'generated'],
			['itc', 's.17(5)(h)', 'generated'],
			['fssai', '58 units', 'generated'],
			['receipt', 'FI/HYD/26-27/0417', 'generated'],
			['destruction', '0 units left', 'not required']
		]);
	});
	it("numbers its kiranas' invoices in Lakshmi Agencies' own series, from LA/26-27/0972", () => {
		journey('mango');
		both(7);
		const n = distNows(
			{ state: store.get(), c: caseOf(store.get()), day0: D.day0, shops: SHOPS_ALL, cases: [], phaseOf: () => null },
			'lakshmi'
		)[0];
		expect(n.shops[0].invoice?.no).toBe('LA/26-27/0972');
		expect(n.shops[n.shops.length - 1].invoice?.no).toBe('LA/26-27/1023');
	});
	it('runs on its own: the chips are watched, not in a journey, and the Mango Drink donates as the hero', () => {
		journey('mango');
		both(9);
		const s = store.get();
		expect(s.hero.id).toBe('MF-2410-118');
		expect(s.mango).toMatchObject({ id: 'MF-2410-118', phase: 'cleared', donation: 'collected' });
		expect(s.hero.staff).toMatchObject({ status: 'recorded', sold: 150, left: 0 });
		expect(stubSource.data.batches.filter((b) => b.hero).map((b) => b.id)).toEqual(['MF-2410-118']);
		expect(stubSource.data.batches.some((b) => b.second)).toBe(false);
		expect(heroModel(s, stubSource.data, caseOf(s)).eta).toBe('Cleared · 0 cartons destroyed');
	});
});

describe('the slow chips', () => {
	const S = storyOf('slow');
	it('23 of the 31 shops order 444 of 588 packets; Shubham Provision says Not this time; 144 stay at the godown', () => {
		expect([S.kiranas.length, S.kiranas.reduce((t, k) => t + k.units, 0), S.decliner]).toEqual([23, 444, 'k23']);
		expect(S.realised).toEqual({
			lines: [
				{ id: 'kirana', units: 444 },
				{ id: 'expiresoon', units: 772 }
			],
			godown: 144
		});
	});
	it("comes to money.js's figures: net ₹18,632.40, swing ₹22,827.60, price support ₹8,119.60 (CN/0117 ₹8,120)", () => {
		expect([S.actual.net, S.actual.swing, S.support.total]).toEqual([18632.4, 22827.6, 8119.6]);
		expect(S.docs.find((d) => d.id === 'support')).toMatchObject({ no: 'CN/0117', amount: 8120 });
	});
	it('settles the 144 packs at the godown: the expiry credit note CN/0118 ₹3,542.40 (₹3,168 + ₹158.40 + ₹216) against OCE/DC/26-27/0219', () => {
		expect(S.expiry).toMatchObject({
			policy: 'godown',
			units: 144,
			credit: 3168,
			gst: 158.4,
			charges: 216,
			amount: 3542.4
		});
		const end = S.end.docs;
		expect(end.find((d) => d.id === 'expiry')).toMatchObject({
			no: 'CN/0118',
			amount: 3542.4,
			certificate: 'OCE/DC/26-27/0219'
		});
		expect(end.find((d) => d.id === 'destruction')).toMatchObject({
			no: 'OCE/DC/26-27/0219',
			units: 144,
			status: 'generated'
		});
		expect(end.find((d) => d.id === 'itc')).toMatchObject({ atGodown: 144 });
		expect(S.end.row.figures).toMatchObject({ net: 18632.4, swing: 22827.6, godown: 144, credit: 3542.4 });
		expect(S.end.row.outcome).toBe('leftover');
	});
	it("on expiry day asks Rakesh to destroy the 144 packs, and closes only on Priya's second yes", () => {
		journey('slow');
		both(8);
		act('vanRound');
		act('expire');
		expect(store.get().hero.destruction).toEqual({ status: 'requested', units: 144 });
		expect(store.get().notifications[0]).toMatchObject({
			to: 'rakesh',
			link: 'destroy',
			title: 'Expired packs destroy karein'
		});
		act('sendDestruction');
		const d = store.get().hero.destruction!;
		expect(d.photos).toMatchObject({
			before: { name: 'MF-2409-117-before.webp' },
			after: { name: 'MF-2409-117-after-expiry.webp' }
		});
		expect(d.checks?.find((c) => c.id === 'slate')?.label).toBe('The slate reads MF-2409-117 · 144 packets · 18-11-26');
		// the agents wait for her yes: nothing is due until she approves, then Impact reports
		expect(Agents.nextStep(store.get())).toBeNull();
		act('approveDestruction');
		expect(Agents.nextStep(store.get())).toMatchObject({ name: 'report' });
		act('report');
		expect(store.get().hero.phase).toBe('cleared');
		expect(store.get().notifications[0].title).toBe('Batch closed · 144 packs destroyed at the godown');
	});
});

describe("every view of the other journeys is design3's", () => {
	for (const key of ['mango', 'slow'] as StoryKey[])
		for (const n of [2, 5, 6, 7, 8, 9])
			it(`${key} at stage ${n}`, () => {
				journey(key);
				both(n);
				const s = store.get(),
					theirs = W.SC3_STORE.get(),
					c = caseOf(s),
					S = storyOf(key);
				// the case's papers, the ledger and the batch's page
				expect(plain(c.docs)).toEqual(plain(L.storyCase(theirs).docs));
				expect(plain(stubLedger(s))).toEqual(plain(L.ledger(theirs)));
				expect(stubPage(S.batch.id, stubSource.data, c, s)?.row ?? null).toEqual(
					s.hero.posted ? plain(L.rowOf(L.storyCase(theirs))) : null
				);
				// the record and its photos
				expect(plain(storyRecord(s).steps)).toEqual(plain(L.record.storyRecord(theirs).steps));
				expect(plain(storyPhotos(s))).toEqual(plain(L.record.storyPhotos(theirs)));
				// the distributor's batch: its moments and money, his batches in a journey and their orders
				expect(plain(storyMoments(s.feed, c, s.hero, STUB_WORLD, true))).toEqual(plain(P.storyMoments(theirs)));
				expect(plain(storyWhole(c, s.hero, D.workspace.short))).toEqual(plain(P.storyWhole(theirs)));
				expect(plain(storySum(c, s.hero, D.workspace.short))).toEqual(plain(P.storySum(theirs)));
				const mine = distNows(
					{ state: s, c, day0: D.day0, shops: SHOPS_ALL, cases: [], phaseOf: () => null },
					S.dist.id
				);
				expect(plain(mine.map(bare))).toEqual(plain(P.distNow(S.dist.id, theirs)));
				expect(plain(mine.map((x) => bare(journeyOf(x, WORLD))))).toEqual(plain(P.journeys(S.dist.id, theirs)));
				for (const x of mine)
					expect(plain(ordersNow(x, shopName, WORLD))).toEqual(
						plain(
							P.ordersNow(
								P.distNow(S.dist.id, theirs).find((t: { ref: string }) => t.ref === x.ref),
								P.shopName
							)
						)
					);
				// every shop's offers
				for (const shop of SHOPS_ALL.filter((k) => k.distributor === S.dist.id))
					expect(plain(offersFor(shop, HISTORY_CASES, STUB_WORLD, { c, h: s.hero, day0: D.day0 }, SHOPS_ALL))).toEqual(
						plain(
							P.offersFor(
								W.SC3_WORLD.KIRANAS.find((k: { id: string }) => k.id === shop.id),
								theirs
							)
						)
					);
			});
	it("the slow chips' destruction approved: the expiry credit note and the agency's certificate in the case and the money", () => {
		journey('slow');
		both(8);
		for (const name of ['vanRound', 'expire', 'sendDestruction', 'approveDestruction'] as const) {
			W.SC3_FLOW.act(name);
			act(name);
		}
		const s = store.get(),
			theirs = W.SC3_STORE.get(),
			c = caseOf(s);
		expect(plain(c.docs)).toEqual(plain(L.storyCase(theirs).docs));
		expect(plain(storyWhole(c, s.hero, D.workspace.short))).toEqual(plain(P.storyWhole(theirs)));
		expect(storyWhole(c, s.hero, D.workspace.short).gain).toBe(0);
		expect(c.expiry).toMatchObject({ amount: 3542.4 });
	});
	it('each journey names every step a person takes for an account in its workspace', () => {
		for (const key of ['mango', 'slow'] as StoryKey[]) {
			const users = seedState(key).users;
			for (const [, name, o] of SCRIPTS[key])
				if (o?.human)
					expect(
						users.some((u) => u.id === o.human),
						name
					).toBe(true);
		}
	});
});
