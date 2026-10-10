import { describe, expect, it } from 'vitest';
import { fastForward } from '../src/lib/workspace/flow';
import { factsPhotos, factsYes } from '../src/lib/workspace/photos';
import { historyCase, photosOf, recordOf, storyPhotos, storyRecord } from '../src/lib/workspace/record';
import { store } from '../src/lib/workspace/store.svelte';
import { HISTORY_CASES } from '../src/lib/workspace/stub.svelte';
import type { PartnerCase } from '../src/lib/workspace/types';
import { run } from './design3';

// A batch's record (SC-142) is design3/core/ledger.js's record: for every batch of the history and for the story's batch
// as the journey moves on, the same steps, oldest first, by the same agents and people, the same yeses and the same
// photos with what Vision read and checked.
const W = run('core/money.js', 'core/data.js', 'core/store.js', 'core/flow.js', 'core/world.js', 'core/ledger.js');
const R = W.SC3_LEDGER.record;
const plain = (o: unknown) => JSON.parse(JSON.stringify(o));

describe("a batch's record is ledger.js's", () => {
	it("every history batch's steps and photos", () => {
		for (const x of W.SC3_LEDGER.HISTORY) {
			const c = historyCase(x.ref)!;
			const full = W.SC3_LEDGER.caseOf(x.ref);
			expect(plain(recordOf(c).steps)).toEqual(plain(R.recordOf(full).steps));
			expect(plain(photosOf(c))).toEqual(plain(R.photosOf(full)));
		}
	});
	it('the yeses are the plan, the review and, destroyed at the godown, the destruction', () => {
		for (const x of W.SC3_LEDGER.HISTORY) {
			const c = historyCase(x.ref)!;
			const yes = recordOf(c)
				.steps.filter((s) => s.yes)
				.map((s) => s.key);
			expect(yes).toEqual(
				c.destruction ? ['plan.approve', 'docs.review', 'destruction.approve'] : ['plan.approve', 'docs.review']
			);
			expect(photosOf(c).length).toBe(c.destruction ? 3 : 1);
		}
	});
	for (const n of [0, 2, 3, 6, 9])
		it(`the story's batch at stage ${n}`, () => {
			W.SC3_FLOW.fastForward(n);
			fastForward(n);
			expect(plain(storyRecord(store.get()).steps)).toEqual(plain(R.storyRecord(W.SC3_STORE.get()).steps));
			expect(plain(storyPhotos(store.get()))).toEqual(plain(R.storyPhotos(W.SC3_STORE.get())));
		});
});

describe("a distributor's photos from his facts, on the live workspace", () => {
	const people = { priya: { name: 'Priya Deshmukh', short: 'Priya' } } as never;
	const facts = (over: Partial<PartnerCase>) => ({ ref: 'MF-2407-116', docs: [], ...over }) as PartnerCase;
	it('the label photo with what Vision read, and the destruction before and after with their checks', () => {
		const pc = facts({
			photo: {
				url: 'https://storage.test/label',
				at: '2026-08-27T10:05:11',
				status: 'verified',
				read: { batch: 'MF-2407-116', mfg: '2026-04-01', bestBefore: '2026-09-27', mrp: 20, matches: true }
			},
			destruction: {
				status: 'approved',
				units: 132,
				photos: {
					before: { at: '2026-09-27T10:00', url: 'https://storage.test/before' },
					after: { at: '2026-09-27T12:00', url: 'https://storage.test/after' }
				},
				checks: [
					{ id: 'batch', label: 'Batch on the cartons', ok: true },
					{ id: 'count', label: 'Count', ok: true },
					{ id: 'slate', label: 'Slate', ok: true },
					{ id: 'when', label: 'Taken after', ok: true }
				],
				approvedAt: '2026-09-27T14:30:00',
				approvedBy: 'priya'
			}
		});
		const ph = factsPhotos(pc, 'Rakesh bhai')!;
		expect(ph.map((p) => [p.id, p.src, p.at, p.by])).toEqual([
			['label', 'https://storage.test/label', '2026-08-27T10:05', 'Rakesh bhai'],
			['before', 'https://storage.test/before', '2026-09-27T10:00', 'Rakesh bhai'],
			['after', 'https://storage.test/after', '2026-09-27T12:00', 'Rakesh bhai']
		]);
		expect(ph[0].read).toEqual({
			at: '2026-08-27T10:05',
			batch: 'MF-2407-116',
			mfg: '2026-04-01',
			bestBefore: '2026-09-27',
			mrp: 20,
			matches: true
		});
		expect(ph[1].checks!.map((x) => x.id)).toEqual(['batch', 'count']);
		expect(ph[2].checks!.map((x) => x.id)).toEqual(['slate', 'when']);
		const yes = factsYes(pc, 'Kalamna Market godown', people)!;
		expect([yes.who.name, yes.at, yes.text]).toEqual([
			'Priya Deshmukh',
			'2026-09-27T14:30',
			'approved the destruction of 132 packs at Kalamna Market godown'
		]);
	});
	it("none where his facts carry none (the stub's), so the screen reads the stub's record", () => {
		expect(factsPhotos(facts({}), 'Rakesh bhai')).toBeNull();
		expect(factsPhotos(facts({ photo: null }), 'Rakesh bhai')).toEqual([]);
	});
	it('the stub has a record for every history batch, with its photos', () => {
		for (const c of HISTORY_CASES) expect(historyCase(c.ref)).not.toBeNull();
	});
});
