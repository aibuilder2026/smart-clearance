import { describe, expect, it } from 'vitest';
import {
	FLIGHT,
	H,
	NS,
	ORDER,
	PACE,
	POST,
	ROUTES,
	TAB_AR,
	W,
	at,
	camera,
	cover,
	curve,
	dotsOf,
	holds,
	on
} from '#lib/landing/scene.ts';

// the table the agents work the batch on, as design3/site/site.jsx lays it out (SC-60)
describe('the table', () => {
	it("is drawn at the plate's own aspect", () => {
		expect(TAB_AR).toBeCloseTo(2752 / 1536);
		expect(W).toBe(1000);
		expect(H).toBe(558);
		expect(NS).toBe(11);
		expect(ORDER[5]).toBe('you');
	});
	it('covers the stage with the plate, showing more of its left part on narrow screens', () => {
		const desk = cover(1440, 900);
		expect(desk.pw).toBeCloseTo(1612.5, 0);
		expect(desk.ph).toBe(900);
		expect(desk.x).toBeCloseTo(-86.25, 0);
		expect(desk.y).toBe(0);
		const phone = cover(390, 844, TAB_AR, 0.42);
		expect(phone.pw).toBeCloseTo(1512.2, 0);
		expect(phone.x).toBeCloseTo(-471.3, 0);
		// what stands on the plate is placed from the plate's own corner; the camera reads the same point in the stage
		expect(on(desk, POST.watcher).left).toBeCloseTo(0.25 * desk.pw);
		expect(at(desk, POST.watcher).left).toBeCloseTo(desk.x + 0.25 * desk.pw);
	});
	it("takes the camera toward a post, no further than the plate's own edges", () => {
		const desk = cover(1440, 900);
		const watcher = camera(desk, POST.watcher, 1.6);
		expect(watcher.sc).toBe(1.6);
		expect(watcher.tx, "held at the plate's left edge").toBeCloseTo(-desk.x * 1.6, 5);
		expect(watcher.ty).toBeCloseTo(900 * 0.42 - 0.47 * 900 * 1.6, 5);
		const impact = camera(desk, POST.impact, 1.6);
		expect(impact.tx, "held at the plate's right edge").toBeCloseTo(1440 - (desk.x + desk.pw) * 1.6, 5);
		const phone = cover(390, 844, TAB_AR, 0.42);
		const w = camera(phone, POST.watcher, 1.45);
		expect(w.tx, 'free to travel where the plate overhangs').toBeCloseTo(195 - (phone.x + 0.25 * phone.pw) * 1.45, 5);
	});
	it("sends about 50 packs a dot, the kiranas' first", () => {
		const d = dotsOf(588, 772);
		expect(d).toHaveLength(27);
		expect(d.filter((x) => x === 'kirana')).toHaveLength(12);
		expect(d.slice(0, 12).every((x) => x === 'kirana')).toBe(true);
	});
	it('has every pack out and in under five seconds, and the tour under twenty', () => {
		expect(FLIGHT.first + 14 * FLIGHT.every + FLIGHT.duration).toBeLessThan(5);
		expect(PACE).toEqual({ agent: 1400, you: 1800 });
		expect(ORDER.reduce((t, id) => t + holds(id), 0)).toBe(15800);
	});
	it("draws the packs' ways from the phone's screen", () => {
		expect(curve({ x: 0, y: 0 }, { x: 100, y: 50 }, 10)).toBe('M0 0 Q50 -10 100 50');
		expect(ROUTES.kirana).toMatch(/^M681\.5 195\.8/);
		expect(ROUTES.expiresoon).toMatch(/^M681\.5 195\.8/);
	});
});
