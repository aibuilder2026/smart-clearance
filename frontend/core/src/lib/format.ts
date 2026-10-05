// The design's number formats, ported from design3/core/money.js (fmt): Indian digit grouping, rupees and lakhs, and
// a true minus sign (U+2212) on negative amounts. A test runs money.js and checks these give the same strings.
const MINUS = '−';
const IN = 'en-IN';

export const fmt = {
	num: (n: number) => Math.round(n).toLocaleString(IN),
	inr: (n: number) => (n < 0 ? MINUS + '₹' : '₹') + Math.round(Math.abs(n)).toLocaleString(IN),
	inr2: (n: number) =>
		(n < 0 ? MINUS + '₹' : '₹') +
		Math.abs(n).toLocaleString(IN, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
	signed: (n: number) => (n < 0 ? MINUS + '₹' : '+₹') + Math.round(Math.abs(n)).toLocaleString(IN),
	rate: (n: number) => '₹' + n.toFixed(2),
	lakh: (n: number) => '₹' + (n / 100000).toLocaleString(IN, { maximumFractionDigits: 1 }) + ' L',
	kg: (n: number) =>
		n >= 1000
			? (n / 1000).toLocaleString(IN, { maximumFractionDigits: 2 }) + ' t'
			: n.toLocaleString(IN, { maximumFractionDigits: 1 }) + ' kg',
	pct: (n: number) => Math.round(n * 100) + '%',
	/** an ISO date (2026-10-29) as "29 Oct 2026", read as a local date so no time zone shifts it */
	date: (iso: string) =>
		new Date(iso + 'T00:00:00').toLocaleDateString(IN, { day: 'numeric', month: 'short', year: 'numeric' }),
	day: (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(IN, { day: 'numeric', month: 'short' })
};

/** "₹12" for a whole rupee amount, "₹14.20" otherwise (the landing page's per-pack prices) */
export const rate = (v: number) => (Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v));
