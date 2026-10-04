import { describe, expect, it } from 'vitest';
import { fmt, rate } from '../src/lib/format';
import { run } from './design3';

// core's fmt must say every figure exactly as design3/core/money.js does
const M = run('core/money.js').SC3_MONEY;
const numbers = [
	0, 1, -1, 12, 14.2, 21152, -21152, 10290.4, 10861.6, -31884.08, 99999.5, 100000, 1234567.891, 588, 0.5, -0.5
];

describe('fmt matches money.js', () => {
	for (const key of ['num', 'inr', 'inr2', 'signed', 'rate', 'lakh', 'kg', 'pct'] as const) {
		it(key, () => {
			for (const n of numbers) expect((fmt[key] as (n: number) => string)(n)).toBe(M.fmt[key](n));
		});
	}
	it('date and day', () => {
		for (const iso of ['2026-10-02', '2026-10-29', '2026-11-18', '2027-01-01']) {
			expect(fmt.date(iso)).toBe(M.fmt.date(iso));
			expect(fmt.day(iso)).toBe(M.fmt.day(iso));
		}
	});
	it('uses a true minus sign', () => {
		expect(fmt.inr(-31884)).toBe('−₹31,884');
		expect(fmt.inr(21152)).toBe('₹21,152');
	});
	it('rate: whole rupees without paise, otherwise two places', () => {
		expect(rate(12)).toBe('₹12');
		expect(rate(14.2)).toBe('₹14.20');
		expect(rate(-12.4)).toBe('−₹12.40');
	});
});
