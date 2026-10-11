import { afterAll, describe, expect, it } from 'vitest';
import { D, SCENARIOS } from '../src/lib/workspace/data';
import { A, act, fastForward, SCRIPT, SCRIPTS, stageOf, useScenario } from '../src/lib/workspace/flow';
import { heroModel, routesFor, SCREENS } from '../src/lib/workspace/model';
import { seedState, store } from '../src/lib/workspace/store.svelte';
import { data, kase } from '../src/lib/workspace/stub.svelte';
import type { RoleId, StoryKey } from '../src/lib/workspace/types';
import { run } from './design3';

// The workspace app's stub (SC-62) is design3/core run in Svelte: the seed is what data.js and store.js hold, and each
// step of the journey leaves the store exactly as flow.js does, stage by stage, in each of the stub's three journeys
// (SC-168): the story's chips, the Mango Drink's own and the slow chips. Ids are made from the clock, so they are left
// out of the comparison.
const W = run('core/money.js', 'core/papers.js', 'core/data.js', 'core/store.js', 'core/flow.js', 'core/world.js');
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
		// each journey's own: the Mango Drink's starts with Setup confirmed and Lakshmi Agencies' permission
		for (const key of SCENARIOS) expect(seedState(key)).toEqual(plain(W.SC3_STORE.seed(key)));
		expect(seedState('chips')).toEqual(seedState());
		expect(seedState('mango').setup.permission).toMatchObject({ by: 'lakshmi-owner', paused: false });
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
		for (const key of SCENARIOS)
			expect(SCRIPTS[key].map(([st, name, o]) => [st, name, o?.arg, o?.human])).toEqual(
				W.SC3_FLOW.SCRIPTS[key].map(([st, name, o]: [string, string, { arg?: unknown; human?: string }?]) => [
					st,
					name,
					o?.arg,
					o?.human
				])
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
	// each journey, at the start of every stage and after every step
	const same = () => {
		const theirs = plain(W.SC3_STORE.get());
		expect(strip({ ...store.get(), seq: 0 })).toEqual(strip({ ...theirs, seq: 0 }));
		expect(stageOf(store.get())).toBe(W.SC3_FLOW.stageOf(theirs));
	};
	const journey = (key: StoryKey) => {
		W.SC3_FLOW.useScenario(key);
		useScenario(key);
	};
	afterAll(() => journey('chips'));
	for (const key of ['mango', 'slow'] as StoryKey[]) {
		for (let n = 0; n <= 9; n++)
			it(`${key}: stage ${n} begins with the same state`, () => {
				journey(key);
				W.SC3_FLOW.fastForward(n);
				fastForward(n);
				same();
			});
		it(`${key}: every step leaves the same state, and the stage never goes back`, () => {
			journey(key);
			let last = 0;
			for (const [, name, o] of SCRIPTS[key]) {
				W.SC3_FLOW.act(name, o?.arg);
				act(name, o?.arg);
				same();
				expect(stageOf(store.get())).toBeGreaterThanOrEqual(last);
				last = stageOf(store.get());
			}
			expect(last).toBe(9);
		});
	}
	it('ends with the batch cleared and nothing destroyed', () => {
		journey('chips');
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
