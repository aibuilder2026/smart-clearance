import { describe, expect, it } from 'vitest';
import { CROSS, EX_AR, TRUNK, dots, leaves, route, spur, travel } from '#lib/landing/street.ts';

// the street the packs take, in the plate's own pixels, as design3/site/site.jsx draws it
describe('the street', () => {
	it("is drawn in the plate's own coordinates", () => {
		expect(EX_AR).toBeCloseTo(4256 / 992);
		expect(TRUNK).toBe('M610 690 C640 772 730 812 870 812 L3848 812');
		expect(spur({ x: 0.35 })).toBe('M1380 812 Q1490 812 1490 712 L1490 646');
		expect(spur({ x: 0.93, bin: true })).toBe('M3848 812 Q3958 812 3958 712 L3958 742');
		expect(route({ x: 0.515 })).toBe('M610 690 C640 772 730 812 870 812 L2082 812 Q2192 812 2192 712 L2192 646');
		expect(CROSS).toBe('M3943 727 l30 30 m0 -30 l-30 30');
	});
	it('sends about 50 packs a dot, the two streams interleaved', () => {
		const d = dots({ id: 'a', packs: 588 }, { id: 'b', packs: 772 });
		expect(d.join('')).toBe('bababababbababababbabababab');
		expect(d.filter((x) => x === 'a')).toHaveLength(12);
		expect(d.filter((x) => x === 'b')).toHaveLength(15);
	});
	it('has every pack out and in under five seconds', () => {
		// the last of 27 dots leaves at 3.28 s; the longest way, to the buyer, is about 1,750 px of road
		expect(leaves(0)).toBe(0.55);
		expect(leaves(26)).toBeCloseTo(3.28);
		expect(leaves(26) + travel(2000)).toBeLessThan(5);
	});
});
