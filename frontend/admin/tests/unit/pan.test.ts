import { describe, expect, it } from 'vitest';
import { EX_P, EX_X, activeExit, holdScroll, holdShift, panX, stickTop } from '#lib/landing/pan.ts';

describe('the street pan', () => {
	it('holds on each exit, two keyframes apiece', () => {
		expect(EX_P).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => i / 9));
		expect(EX_X).toEqual([0, 0, -23.72, -23.72, -37.22, -37.22, -44.44, -44.44, -44.44, -44.44]);
	});
	it('never pans past the street end', () => {
		expect(holdShift(0.93)).toBeCloseTo(1 / 1.8 - 1);
		expect(holdShift(0.1)).toBe(0);
	});
	it('interpolates between the holds', () => {
		expect(panX(0)).toBe(0);
		expect(panX(1.5 / 9)).toBeCloseTo(-11.86);
		expect(panX(2.5 / 9)).toBe(-23.72);
		expect(panX(1)).toBe(-44.44);
	});
	it('marks the exit at the middle of each hold', () => {
		expect([0, 1, 2, 3, 4].map((i) => activeExit((2 * i + 0.5) / 9))).toEqual([0, 1, 2, 3, 4]);
		expect(activeExit(1)).toBe(4);
	});
	it('pins under the bar', () => {
		expect(stickTop(900)).toBe(170);
		expect(stickTop(600)).toBe(68);
		expect(holdScroll(0, 1000, 1900)).toBe(1050);
	});
});
