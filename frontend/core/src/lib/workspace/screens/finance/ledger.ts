// What Finance & ESG's ledger screens share (screens/finance.jsx, SC-121): the readings, a batch's figure in each, the
// exports of a period, and a page printed on its own (the stub's PDFs, the period's report)
import type { IconName } from '../../../icons/registry';
import { csv, download, fmt } from '../../model';
import type { LedgerBatch, LedgerOutcome, LedgerPeriod } from '../../types';

const r2 = (n: number) => Math.round(n * 100) / 100;
export const kg = (n: number) => fmt.kg(r2(n));
export const possessive = (name: string) => (/s$/.test(name) ? `${name}'` : `${name}'s`);
/** packets as cartons of `per` (model.ts cartons) */
export { cartons } from '../../model';

export type Reading = 'money' | 'gst' | 'impact';
export const READINGS: { id: Reading; label: string; icon: IconName }[] = [
	{ id: 'money', label: 'Money', icon: 'coins' },
	{ id: 'gst', label: 'GST', icon: 'badge-check' },
	{ id: 'impact', label: 'Impact', icon: 'leaf' }
];
export const OUTCOME: Record<LedgerOutcome, { label: string; tone?: 'green'; icon: IconName }> = {
	sold: { label: 'Sold through', tone: 'green', icon: 'check' },
	leftover: { label: 'Left at the godown', icon: 'warehouse' },
	donation: { label: 'Donated', icon: 'heart-handshake' }
};

export const valueOf = (r: LedgerBatch, reading: Reading) =>
	reading === 'money' ? r.figures.net : reading === 'gst' ? r.figures.itcKept : r.figures.kg;
export const figure = (r: LedgerBatch, reading: Reading) =>
	reading === 'money' ? fmt.inr(r.figures.net) : reading === 'gst' ? fmt.inr(r.figures.itcKept) : kg(r.figures.kg);
export function second(r: LedgerBatch, reading: Reading) {
	const F = r.figures;
	if (reading === 'money') return `of ${fmt.inr(F.writeOff)} if destroyed`;
	if (reading === 'gst') return F.itcReversed ? `${fmt.inr(F.itcReversed)} reversed` : 'nothing reversed';
	return F.meals ? `${fmt.num(F.meals)} meals` : F.destroyedKg ? `${kg(F.destroyedKg)} destroyed` : `${kg(F.co2)} CO₂e`;
}
/** the share of a batch's segment that went to the bin, drawn hatched: the packs destroyed, or the credit reversed */
export function binShare(r: LedgerBatch, reading: Reading) {
	const F = r.figures;
	if (reading === 'gst') return F.itcReversed / (F.itcKept + F.itcReversed || 1);
	if (reading === 'impact') return F.destroyedKg / (F.kg + F.destroyedKg || 1);
	return F.destroyed / (F.units || 1);
}
export const monthOf = (iso: string) =>
	new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, 1)).toLocaleDateString('en-IN', {
		month: 'short',
		timeZone: 'UTC'
	});
/** a period by its own name: a quarter's label, a year's span (FY 2026-27) */
export const periodName = (p: LedgerPeriod) => (p.kind === 'year' ? p.long : p.label);
const fileOf = (p: LedgerPeriod) => (p.kind === 'year' ? p.long.replace(/ so far$/, '') : p.label).replace(/\s+/g, '-');

const esc = (s: string | number) =>
	String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

/** a page printed on its own: a hidden frame holds it, the browser's print dialog saves it as a PDF. `styles` copies the
 *  app's stylesheets in, so a paper prints as it shows, on the light theme */
export function printPage(title: string, body: string, { styles = false } = {}) {
	const f = document.createElement('iframe');
	f.setAttribute('aria-hidden', 'true');
	f.tabIndex = -1;
	f.title = title;
	f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
	document.body.appendChild(f);
	const head = styles
		? [...document.querySelectorAll('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join('')
		: '';
	const base =
		'<style>body{margin:0;padding:28px;background:#fff;color:#1d1d1b;font:14px/1.5 system-ui,sans-serif}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:22px 0 8px}p{margin:4px 0;color:#4a4a45}table{width:100%;border-collapse:collapse;margin:6px 0 14px;font-size:12.5px}th,td{text-align:left;padding:5px 6px;border-bottom:1px solid #e3e0d6;vertical-align:top}th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#5a5a55}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}tr.total td{font-weight:700;border-top:1.5px solid #1d1d1b}.paper{box-shadow:none!important;max-width:760px;margin:0 auto}@page{size:A4;margin:14mm}</style>';
	const d = f.contentDocument!;
	d.open();
	d.write(
		`<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><title>${esc(title)}</title><base href="${esc(document.baseURI)}">${head}${base}</head><body>${body}</body></html>`
	);
	d.close();
	let done = false;
	const go = () => {
		if (done) return;
		done = true;
		try {
			f.contentWindow?.focus();
			f.contentWindow?.print();
		} finally {
			setTimeout(() => f.remove(), 1500);
		}
	};
	f.addEventListener('load', go);
	setTimeout(go, 1200);
}

/* ---------- the exports, for the period chosen ---------- */
const paper = (r: LedgerBatch, id: string) => r.papers.find((x) => x.id === id && x.status !== 'not required');

export function exportBRSR(p: LedgerPeriod, list: LedgerBatch[]) {
	download(
		`BRSR-P6-waste-${fileOf(p)}.csv`,
		csv([
			['Category', 'Diverted (kg)', 'Resold (kg)', 'Donated (kg)', 'Disposed (kg)', 'Evidence'],
			...p.brsr.map((r) => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]),
			...list.map((r) => [
				`Batch ${r.ref} (${r.name})`,
				r.figures.kg,
				r.figures.resoldKg,
				r.figures.donatedKg,
				r.figures.destroyedKg,
				r.papers
					.filter((x) => x.status !== 'not required' && ['invoice', 'support', 'expiry', 'receipt'].includes(x.id))
					.map((x) => x.no)
					.join('; ')
			])
		])
	);
}

export function exportGST(p: LedgerPeriod, list: LedgerBatch[]) {
	const t = p.totals;
	download(
		`GST-summary-${fileOf(p)}.csv`,
		csv([
			[
				'Batch',
				'Product',
				'Distributor',
				'Cleared',
				'Tax invoice',
				'Invoice total (₹)',
				'Price-support credit note',
				'Credit (₹)',
				'Expiry credit note',
				'Expiry credit (₹)',
				'Input GST kept (₹)',
				'Reversed, s.17(5)(h) (₹)'
			],
			...list.map((r) => [
				r.ref,
				r.name,
				r.distributorName,
				r.cleared,
				paper(r, 'invoice')?.no ?? '',
				paper(r, 'invoice')?.amount ?? '',
				paper(r, 'support')?.no ?? '',
				r.figures.support,
				paper(r, 'expiry')?.no ?? '',
				r.figures.credit || '',
				r.figures.itcKept,
				r.figures.itcReversed
			]),
			[
				'Total',
				'',
				'',
				'',
				`${t.invoices} invoices`,
				r2(list.reduce((s, r) => s + (paper(r, 'invoice')?.amount ?? 0), 0)),
				`${t.creditNotes} credit notes`,
				t.support,
				'',
				t.credit,
				t.itcKept,
				t.itcReversed
			]
		])
	);
}

export function exportLedger(p: LedgerPeriod, list: LedgerBatch[]) {
	download(
		`Ledger-${fileOf(p)}.csv`,
		csv([
			[
				'Batch',
				'Product',
				'Distributor',
				'Flagged',
				'Cleared',
				'Outcome',
				'Recovered (₹)',
				'Would-be write-off (₹)',
				'Better than the bin (₹)',
				'P&L (₹)',
				'Input GST kept (₹)',
				'Reversed (₹)',
				'Resold (kg)',
				'Donated (kg)',
				'Destroyed (kg)',
				'CO₂e avoided (kg)',
				'Meals'
			],
			...list.map((r) => {
				const F = r.figures;
				return [
					r.ref,
					r.name,
					r.distributorName,
					r.flagged,
					r.cleared,
					OUTCOME[r.outcome].label,
					F.net,
					F.writeOff,
					F.swing,
					F.pnl,
					F.itcKept,
					F.itcReversed,
					F.resoldKg,
					F.donatedKg,
					F.destroyedKg,
					F.co2,
					F.meals
				];
			})
		])
	);
}

/** the period's report, printed: its three readings, BRSR's row and the batches */
export function printReport(p: LedgerPeriod, list: LedgerBatch[], since: string, ws: { name: string; short: string }) {
	const t = p.totals;
	const row = (cells: [string | number, boolean?][], cls?: string) =>
		`<tr${cls ? ` class="${cls}"` : ''}>${cells.map(([v, n]) => `<td${n ? ' class="n"' : ''}>${esc(v)}</td>`).join('')}</tr>`;
	const table = (rows: [string, string][]) =>
		`<table><tbody>${rows.map(([k, v]) => row([[k], [v, true]])).join('')}</tbody></table>`;
	const body = `<h1>${esc(ws.name)} · Finance &amp; ESG · ${esc(periodName(p))}</h1><p>${esc(p.long)}. Every batch cleared since ${esc(since)}, as its posted ledger. CO₂e, disposal and EPR are indicative.</p>
		<h2>Money</h2>${table([
			['Recovered', fmt.inr2(t.net)],
			['Would-be write-off', fmt.inr2(t.writeOff)],
			['Better than the bin', fmt.inr2(t.swing)],
			['Price support to the distributors', fmt.inr2(t.support)],
			['Expiry credit', fmt.inr2(t.credit)]
		])}
		<h2>GST</h2>${table([
			['Input GST kept', fmt.inr2(t.itcKept)],
			['Reversed under s.17(5)(h), GSTR-3B Table 4(B)(1)', fmt.inr2(t.itcReversed)],
			["Distributors' tax invoices", fmt.num(t.invoices)],
			['Credit notes', fmt.num(t.creditNotes)],
			['Packs reviewed', `${t.reviewed} of ${t.batches}`]
		])}
		<h2>Impact</h2>${table([
			['Kept out of landfill', kg(t.kg)],
			['Resold', kg(t.resoldKg)],
			['Donated', kg(t.donatedKg)],
			['Destroyed at the godown', kg(t.destroyedKg)],
			['CO₂e avoided, indicative', kg(t.co2)],
			['Meals', fmt.num(t.meals)]
		])}
		<h2>BRSR Principle 6 · waste</h2><table><thead><tr><th>Category</th><th class="n">Diverted, kg</th><th class="n">Resold</th><th class="n">Donated</th><th class="n">Disposed</th><th>Evidence</th></tr></thead><tbody>${p.brsr
			.map((r) =>
				row([
					[r.cat],
					[fmt.num(r.diverted), true],
					[fmt.num(r.resold), true],
					[fmt.num(r.donated), true],
					[fmt.num(r.disposed), true],
					[r.evidence]
				])
			)
			.join('')}</tbody></table>
		<h2>The batches</h2><table><thead><tr><th>Batch</th><th>Product</th><th>Cleared</th><th>Outcome</th><th class="n">Recovered</th><th class="n">GST kept</th><th class="n">Reversed</th><th class="n">Kept out</th></tr></thead><tbody>${list
			.map((r) =>
				row([
					[r.ref],
					[r.name],
					[fmt.date(r.cleared)],
					[OUTCOME[r.outcome].label],
					[fmt.inr(r.figures.net), true],
					[fmt.inr(r.figures.itcKept), true],
					[fmt.inr(r.figures.itcReversed), true],
					[kg(r.figures.kg), true]
				])
			)
			.join('')}${row(
			[
				['Total'],
				[''],
				[''],
				[`${t.batches} batches`],
				[fmt.inr(t.net), true],
				[fmt.inr(t.itcKept), true],
				[fmt.inr(t.itcReversed), true],
				[kg(t.kg), true]
			],
			'total'
		)}</tbody></table>
		<p>The companies and people are fictional.</p>`;
	printPage(`${ws.short} Finance and ESG ${periodName(p)}`, body);
}
