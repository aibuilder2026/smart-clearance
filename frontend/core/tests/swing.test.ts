import { describe, expect, it } from 'vitest';
import { fastForward, useScenario } from '../src/lib/workspace/flow';
import { store } from '../src/lib/workspace/store.svelte';
import { caseOf } from '../src/lib/workspace/stub.svelte';
import { swingOf } from '../src/lib/workspace/swing';
import type { StoryKey } from '../src/lib/workspace/types';

// How a batch's swing adds up (SC-195, option A): the working gives the card's own figures (money.js's), its exits'
// lines add up to the net recovered, and its bridge lands on the P&L with the plan, for each of the stub's journeys, on
// the plan and once Impact has posted.
const at = (key: StoryKey, stage: number) => {
	useScenario(key);
	fastForward(stage);
	const s = store.state;
	return { s, c: caseOf(s) };
};
const r2 = (n: number) => Math.round(n * 100) / 100;

describe('how the swing adds up', () => {
	it("works the Mango Drink's out as money.js does", () => {
		const { s, c } = at('mango', 9);
		const w = swingOf(c, !!s.hero.posted);
		expect([w.wo.total, w.net, w.pnl, w.swing, w.book, w.notPaid]).toEqual([
			22657.2, 16917.1, -462.9, 22194.3, 17380, 5277.2
		]);
		expect(w.exits.map((e) => [e.id, e.units, e.net])).toEqual([
			['kirana', 1372, 15778],
			['staff', 150, 1200],
			['foodbank', 58, -60.9]
		]);
		expect([w.sold, w.given, w.itcLost, w.left, w.leftCost]).toEqual([1522, 58, 31.9, 0, 0]);
		expect(w.out.map((r) => r.id)).toContain('expiresoon');
	});

	it("takes the chips' lot at the counter once the deal is done", () => {
		const planned = at('chips', 5);
		expect(swingOf(planned.c, false).swing).toBe(planned.c.plan.swing);
		const { s, c } = at('chips', 9);
		const w = swingOf(c, !!s.hero.posted);
		expect([w.net, w.pnl, w.swing]).toEqual([21152.4, -607.6, 25722]);
		expect(w.exits.find((e) => e.id === 'expiresoon')).toMatchObject({ units: 772, price: 14.2, net: 10862.4 });
	});

	for (const key of ['chips', 'mango', 'slow'] as StoryKey[])
		for (const stage of [5, 9])
			it(`adds up for the ${key} journey at stage ${stage}`, () => {
				const { s, c } = at(key, stage);
				const posted = !!s.hero.posted;
				const w = swingOf(c, posted);
				// the card's figures
				expect(w.net).toBe(posted ? c.actual.net : c.plan.net);
				expect(w.swing).toBe(posted ? c.actual.swing : c.plan.swing);
				// the exits add up to what was recovered, and the bridge lands on the P&L with the plan
				expect(r2(w.exits.reduce((t, e) => t + e.net, 0))).toBeCloseTo(w.net, 1);
				expect(r2(-w.wo.total + w.net + w.notPaid)).toBeCloseTo(w.pnl, 2);
				expect(r2(w.pnl - -w.wo.total)).toBeCloseTo(w.swing, 2);
				expect(r2(w.net - w.book + w.leftCost)).toBeCloseTo(w.pnl, 2);
			});
});
