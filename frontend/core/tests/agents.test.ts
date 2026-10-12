import { fireEvent, render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AgentStage from '../src/lib/components/AgentStage.svelte';
import { AG_CREW, AG_N, AG_T, agNext, agOrbit, agState, agThreads, agWait } from '../src/lib/components/agents/mesh';
import GoldenHost from './fixtures/GoldenHost.svelte';

// the agents at work behind the sign-ins (SC-195, round 2, option A): the walk, where the agents sit, and the stage's
// own controls (design3's AgentStage in system/product.jsx)
describe('the walk', () => {
	it('sets off, walks the nine stops, holds on the result, and goes round again', () => {
		let k = -1,
			t = 0;
		const seen: number[] = [];
		do {
			t += agWait(k);
			k = agNext(k);
			seen.push(k);
		} while (k !== -1);
		expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1]);
		// 600 ms before it sets off, 4.64 s along the stops, 2.8 s on the result
		expect(t).toBe(AG_T.start + 4640 + AG_T.hold);
	});
	it('lights the agents that have worked, the one at work, and holds on an agent picked', () => {
		const watcher = AG_CREW.find((c) => c.id === 'watcher')!,
			valuer = AG_CREW.find((c) => c.id === 'valuer')!,
			lister = AG_CREW.find((c) => c.id === 'lister')!,
			outreach = AG_CREW.find((c) => c.id === 'outreach')!;
		expect(agState(watcher, 3, null)).toBe('done');
		expect(agState(valuer, 3, null)).toBe('now');
		expect(agState(lister, 3, null)).toBe('later');
		expect(AG_CREW.every((c) => agState(c, AG_N, null) === 'done')).toBe(true);
		// picked: the Lister at work, those before its stop done, the other two exits waiting
		expect(agState(lister, 6, lister)).toBe('now');
		expect(agState(outreach, 6, lister)).toBe('later');
		expect(agState(valuer, 6, lister)).toBe('done');
	});
	it('draws each handoff once: the five before the yes, the yes to the three exits, the exits to Paperwork, and on', () => {
		const t = agThreads(agOrbit(600, 400, false));
		expect(t).toHaveLength(12);
		expect(t.filter((x) => x.fan).map((x) => x.b.c.id)).toEqual(['outreach', 'lister', 'negotiator']);
	});
	it('keeps every agent on its orbit, with room round the stage for its chip', () => {
		const stars = agOrbit(660, 520, false);
		expect(stars.map((s) => s.c.id)).toEqual(AG_CREW.map((c) => c.id));
		for (const s of stars) {
			expect(s.x).toBeGreaterThanOrEqual(124 - 1e-9);
			expect(s.x).toBeLessThanOrEqual(660 - 124 + 1e-9);
			expect(s.y).toBeGreaterThanOrEqual(44 - 1e-9);
			expect(s.y).toBeLessThanOrEqual(520 - 44 + 1e-9);
		}
		for (const s of agOrbit(360, 168, true)) {
			expect(s.x).toBeGreaterThan(0);
			expect(s.x).toBeLessThan(360);
			expect(s.y).toBeGreaterThan(0);
			expect(s.y).toBeLessThan(168);
		}
	});
});

describe('the stage', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		localStorage.clear();
	});
	afterEach(() => vi.useRealTimers());
	// the walk's timers, a frame at a time, so each stop's effect sets the next one off
	const walkFor = (ms: number) => {
		for (let t = 0; t < ms; t += 10) {
			vi.advanceTimersByTime(10);
			flushSync();
		}
	};
	const show = (width = 1440) => {
		const r = render(GoldenHost, { props: { component: AgentStage, props: {}, width } });
		flushSync();
		return r;
	};
	it('walks the stops in its caption, and says them all to a screen reader', () => {
		const { container } = show();
		const caption = () => container.querySelector('.ag-caption')!.textContent;
		expect(caption()).toContain('A batch the gates will refuse');
		walkFor(AG_T.start + 10);
		expect(caption()).toContain('1 of 9 · Connect');
		walkFor(420 * 5 + 800);
		expect(caption()).toContain('7 of 9 · Execute');
		expect(caption()).toContain('Outreach, Lister and Negotiator');
		expect(container.querySelector('.ag-caption')!.getAttribute('aria-hidden')).toBe('true');
		expect(container.querySelectorAll('ol.sr-only li')).toHaveLength(9);
	});
	it('pauses and plays, remembered in the browser (WCAG 2.2.2)', async () => {
		const { container, getByRole } = show();
		walkFor(AG_T.start + 430);
		const at = container.querySelector('.ag-caption')!.textContent;
		await fireEvent.click(getByRole('button', { name: 'Pause the agents' }));
		expect(localStorage.getItem('sc3-agents')).toBe('paused');
		walkFor(5000);
		expect(container.querySelector('.ag-caption')!.textContent).toBe(at);
		await fireEvent.click(getByRole('button', { name: 'Play the agents' }));
		expect(localStorage.getItem('sc3-agents')).toBe('playing');
		walkFor(430);
		expect(container.querySelector('.ag-caption')!.textContent).not.toBe(at);
	});
	it('starts paused when the visitor paused it before', () => {
		localStorage.setItem('sc3-agents', 'paused');
		const { getByRole } = show();
		flushSync();
		expect(getByRole('button', { name: 'Play the agents' })).toBeTruthy();
	});
	it('is a band over the card on a phone, its Pause a button of its own', () => {
		const { container, getByRole } = show(390);
		expect(container.querySelector('.ag-band')).toBeTruthy();
		expect(container.querySelector('.ag-stage')).toBeNull();
		expect(container.querySelector('.ag-orbit.band')!.getAttribute('aria-hidden')).toBe('true');
		expect(getByRole('button', { name: 'Pause the agents' })).toBeTruthy();
	});
});
