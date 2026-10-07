import { describe, expect, it } from 'vitest';
import { D } from '../src/lib/workspace/data';
import { A, fastForward, SCRIPT, stageOf } from '../src/lib/workspace/flow';
import { heroModel, routesFor, SCREENS } from '../src/lib/workspace/model';
import { seedState, store } from '../src/lib/workspace/store.svelte';
import { data, kase } from '../src/lib/workspace/stub.svelte';
import type { RoleId } from '../src/lib/workspace/types';
import { run } from './design3';

// The workspace app's stub (SC-62) is design3/core run in Svelte: the seed is what data.js and store.js hold, and each
// step of the journey leaves the store exactly as flow.js does, stage by stage. Ids are made from the clock, so they
// are left out of the comparison.
const W = run('core/money.js', 'core/data.js', 'core/store.js', 'core/flow.js');
const strip = (o: unknown): unknown =>
	Array.isArray(o)
		? o.map(strip)
		: o && typeof o === 'object'
			? Object.fromEntries(
					Object.entries(o)
						.filter(([k, v]) => k !== 'id' || !/^(ev|n|a)-[0-9a-z]+-\d+$/.test(String(v)))
						.map(([k, v]) => [k, strip(v)])
				)
			: o;
const plain = (o: unknown) => JSON.parse(JSON.stringify(o));

describe('the seed is design3/core', () => {
	it("the store's first state is store.js's", () => {
		expect(seedState()).toEqual(plain(W.SC3_STORE.seed()));
	});
	it("the plan, the award and the documents are money.js's", () => {
		expect(D.plan).toEqual(plain(W.SC3_DATA.PLAN));
		expect(D.actual).toEqual(plain(W.SC3_DATA.ACTUAL));
		expect(D.docs).toEqual(plain(W.SC3_DATA.DOCS));
		expect(D.support).toEqual(plain(W.SC3_DATA.SUPPORT));
	});
});

describe('the journey is flow.js', () => {
	it('names every action flow.js has, in the same order', () => {
		expect(Object.keys(A)).toEqual(Object.keys(W.SC3_FLOW.A));
		expect(SCRIPT.map(([st, name, o]) => [st, name, o?.arg])).toEqual(
			W.SC3_FLOW.SCRIPT.map(([st, name, o]: [string, string, { arg?: unknown }?]) => [st, name, o?.arg])
		);
	});
	for (let n = 0; n <= 9; n++)
		it(`stage ${n} begins with the same state`, () => {
			W.SC3_FLOW.fastForward(n);
			fastForward(n);
			const theirs = plain(W.SC3_STORE.get());
			expect(strip({ ...store.get(), seq: 0 })).toEqual(strip({ ...theirs, seq: 0 }));
			expect(stageOf(store.get())).toBe(W.SC3_FLOW.stageOf(theirs));
		});
	it('ends with the batch cleared and nothing destroyed', () => {
		fastForward(9);
		const s = store.get();
		expect(stageOf(s)).toBe(9);
		expect(heroModel(s, data, kase).eta).toBe('Cleared · 0 cartons destroyed');
		expect(s.hero.orders.reduce((t, o) => t + o.units, 0)).toBe(D.plan.lines.find((l) => l.id === 'kirana')!.units);
	});
});

describe("each role's screens", () => {
	it('every role can reach its inbox and profile, and only its own screens', () => {
		for (const r of Object.keys(D.roles) as RoleId[]) {
			expect(routesFor(r)).toContain('inbox');
			expect(routesFor(r)).toContain('profile');
		}
		expect(routesFor('buyer')).not.toContain('command');
		expect(SCREENS).toContain('listing');
	});
});
