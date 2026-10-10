import { expect, type Page } from '@playwright/test';
import type { WsLedger } from '@smart-clearance/api/workspace';
import { readFileSync } from 'node:fs';
import { api } from './auth.ts';
import { as, hero, inr, running, same, shows, story, WS, type Step } from './flow.ts';

// Priya's tax and ESG checks once Impact has posted (SC-128), for whichever batch the run takes: the ledger's GST and
// Impact readings for the quarter the batch cleared in, the GST summary and the BRSR table she exports, and the
// batch's own papers and BRSR line, each held to the ledger row backend-api posted. Munchly Chips E2E, Munchly Chips
// Leftover E2E and Munchly Mango Leftover E2E share them.

/** a batch's tax and ESG figures in the story: what a flow holds Priya's checks to, beside the ledger row (SC-128) */
export type TaxEsg = {
	itcKept: number;
	itcReversed: number;
	invoice: string;
	invoiceTotal: number;
	creditNote: string;
	support: number;
	kg: number;
	co2: number;
	meals: number;
	destroyedKg: number;
	packResoldKg: number;
};

export const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const r2 = (n: number) => Math.round(n * 100) / 100;
/** kilos as the screens write them (money.js fmt.kg) */
export const kgOf = (n: number) =>
	n >= 1000
		? `${(r2(n) / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} t`
		: `${r2(n).toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg`;

/** the batch's ledger row as backend-api posted it, and the quarter it cleared in */
export async function posted() {
	const HERO = hero();
	const l = await api<WsLedger>('workspace', 'priya', `${WS}/ledger`);
	const row = l.batches.find((b) => b.ref === HERO);
	if (!row) throw new Error(`${HERO} is not in the ledger`);
	const q = l.periods.find((p) => p.kind === 'quarter' && row.cleared >= p.from && row.cleared <= p.to);
	if (!q) throw new Error(`no quarter holds ${row.cleared}`);
	const paper = (id: string) => row.papers.find((x) => x.id === id && x.status !== 'not required');
	return { l, row, q, paper };
}

/** the ledger on a period and a reading, as Priya picks them */
async function ledgerOn(page: Page, period: string, reading: 'Money' | 'GST' | 'Impact') {
	await page.getByRole('group', { name: 'Period' }).getByRole('button', { name: period, exact: true }).click();
	await page.getByRole('group', { name: 'Reading' }).getByRole('button', { name: reading, exact: true }).click();
	await page.waitForTimeout(700);
}

/** RFC 4180 as core's csv() writes it */
function rows(text: string): string[][] {
	return text
		.split('\n')
		.filter(Boolean)
		.map((line) => {
			const out: string[] = [];
			let cur = '';
			let quoted = false;
			for (let i = 0; i < line.length; i++) {
				const ch = line[i];
				if (quoted && ch === '"' && line[i + 1] === '"') {
					cur += '"';
					i++;
				} else if (ch === '"') quoted = !quoted;
				else if (ch === ',' && !quoted) {
					out.push(cur);
					cur = '';
				} else cur += ch;
			}
			out.push(cur);
			return out;
		});
}

/** one of the period's exports, as Priya downloads it from the ledger: kept beside the run's report, read back as rows */
async function exported(page: Page, item: string) {
	await page.getByRole('button', { name: 'Export', exact: true }).click();
	const [file] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('menuitem', { name: new RegExp(item) }).click()
	]);
	const path = running().keep(file.suggestedFilename());
	await file.saveAs(path);
	const table = rows(readFileSync(path, 'utf8'));
	const head = table[0];
	/** a row's cell by its column's heading */
	const cell = (row: string[] | undefined, column: string) => row?.[head.indexOf(column)];
	return { name: file.suggestedFilename(), table, cell };
}

/** Priya verifies the tax once Impact has posted: the ledger's GST reading for the quarter the batch cleared in, the
 *  GST summary she exports, and the batch's papers (the GST ITC memo with its PDF, the tax invoice, the credit note),
 *  each held to the ledger row backend-api posted, and with `story`, to the story's figures (SC-128) */
export function taxStep(story_?: TaxEsg): Step {
	return {
		id: 'tax',
		title: 'Priya verifies the tax: the GST reading, the GST summary, the ITC memo and its PDF',
		async run(page) {
			const HERO = hero();
			const { row, q, paper } = await posted();
			const F = row.figures;
			const T = q.totals;
			await as(page, 'priya', '/report', `checks the GST for ${q.label} on the ledger`);
			await ledgerOn(page, q.label, 'GST');
			const head = page.locator('.lg-head');
			await expect(head).toContainText('of input credit kept');
			const rupees = (n: number) => [
				`₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
				`₹${Math.round(n).toLocaleString('en-IN')}`
			];
			shows('Ledger GST reading', norm(await head.innerText()), [
				rupees(T.itcKept),
				`${T.invoices} distributors' invoices`,
				`${T.creditNotes} credit notes`,
				T.reviewed === T.batches ? 'every pack reviewed' : `${T.reviewed} of ${T.batches} packs reviewed`
			]);
			await running().done(`Tax: ${q.label} in the GST reading`);

			// the GST summary, as her CA would receive it
			const gst = await exported(page, 'GST summary');
			const mine = gst.table.find((r) => r[0] === HERO);
			same('GST summary: tax invoice', gst.cell(mine, 'Tax invoice'), paper('invoice')?.no ?? '');
			same('GST summary: invoice total', gst.cell(mine, 'Invoice total (₹)'), paper('invoice')?.amount ?? '');
			same('GST summary: credit note', gst.cell(mine, 'Price-support credit note'), paper('support')?.no ?? '');
			same('GST summary: price support', gst.cell(mine, 'Credit (₹)'), F.support);
			same('GST summary: expiry credit note', gst.cell(mine, 'Expiry credit note'), paper('expiry')?.no ?? '');
			same('GST summary: expiry credit', gst.cell(mine, 'Expiry credit (₹)'), F.credit || '');
			same('GST summary: input GST kept', gst.cell(mine, 'Input GST kept (₹)'), F.itcKept);
			same('GST summary: reversed, s.17(5)(h)', gst.cell(mine, 'Reversed, s.17(5)(h) (₹)'), F.itcReversed);
			await running().done(`Tax: the GST summary exported (${gst.name})`);

			// the batch's own papers, from its page in the ledger
			await as(page, 'priya', `/report/${HERO}`, "checks the batch's GST ITC memo, tax invoice and credit note");
			await page.locator('.bh-tabs').getByRole('button', { name: 'Papers' }).click();
			await page
				.getByRole('button', { name: /GST ITC memo/ })
				.first()
				.click();
			await page.waitForTimeout(600);
			const stamp = norm(await page.locator('#main .pp-stamp').first().innerText());
			same('ITC memo stamp', stamp, F.itcReversed > 0 ? 'ITC PART REVERSED' : 'ITC KEPT');
			await expect(page.getByRole('button', { name: 'Download GST ITC memo as a PDF' })).toBeVisible();
			// the memo's PDF, as the Paperwork agent laid it out, from the link the button opens
			const { url } = await api<{ url: string }>('workspace', 'priya', `${WS}/documents/${HERO}/itc`);
			const pdf = await fetch(url);
			const bytes = new Uint8Array(await pdf.arrayBuffer());
			same('ITC memo PDF', `${pdf.status} ${pdf.headers.get('content-type')}`, '200 application/pdf');
			same('ITC memo PDF starts', new TextDecoder().decode(bytes.slice(0, 4)), '%PDF');
			await running().done('Tax: the GST ITC memo, with its PDF');
			for (const [id, label] of [
				['invoice', 'Tax invoice'],
				['support', 'Price-support credit note'],
				['expiry', paper('expiry')?.type ?? 'Expiry credit note']
			] as const) {
				const p = paper(id);
				if (!p) continue;
				await page
					.getByRole('button', { name: new RegExp(label) })
					.first()
					.click();
				await page.waitForTimeout(600);
				shows(`${label} on paper`, norm(await page.locator('#main').innerText()), [p.no]);
				await running().done(`Tax: the ${label.toLowerCase()} ${p.no}`);
			}

			running().figure('Input GST kept', inr(F.itcKept));
			running().figure('Input GST reversed', inr(F.itcReversed));
			running().figure('Reviewed by', row.reviewed?.by ?? '(nobody)');
			story('Reviewed by', row.reviewed?.by, 'priya');
			if (story_) {
				story('Input GST kept', F.itcKept, story_.itcKept);
				story('Input GST reversed', F.itcReversed, story_.itcReversed);
				story('Tax invoice', paper('invoice')?.no, story_.invoice);
				story('Tax invoice total', paper('invoice')?.amount ?? undefined, story_.invoiceTotal);
				story('Price-support credit note', paper('support')?.no, story_.creditNote);
				story('Price support', F.support, story_.support);
			}
		}
	};
}

/** Priya verifies the ESG: the ledger's Impact reading for the quarter, the BRSR table she exports, and the batch's
 *  BRSR line with its evidence, each held to the ledger row; with `story`, to the story's figures (SC-128) */
export function esgStep(story_?: TaxEsg): Step {
	return {
		id: 'esg',
		title: "Priya verifies the ESG: the Impact reading, the BRSR table, and the batch's BRSR line",
		async run(page) {
			const HERO = hero();
			const { l, row, q, paper } = await posted();
			const F = row.figures;
			const T = q.totals;
			await as(page, 'priya', '/report', `checks the ESG for ${q.label} on the ledger`);
			await ledgerOn(page, q.label, 'Impact');
			const head = page.locator('.lg-head');
			await expect(head).toContainText('kept out of landfill');
			shows('Ledger Impact reading', norm(await head.innerText()), [
				`${kgOf(T.resoldKg)} resold`,
				`${kgOf(T.donatedKg)} donated`,
				`${T.meals.toLocaleString('en-IN')} meals`,
				`${kgOf(T.destroyedKg)} destroyed`,
				`${kgOf(T.co2)} CO₂e avoided`
			]);
			await running().done(`ESG: ${q.label} in the Impact reading`);

			// BRSR Principle 6's waste table, as it goes into the report
			const brsr = await exported(page, 'BRSR table');
			const mine = brsr.table.find((r) => r[0].startsWith(`Batch ${HERO}`));
			same('BRSR table: diverted (kg)', Number(brsr.cell(mine, 'Diverted (kg)')), F.kg);
			same('BRSR table: resold (kg)', Number(brsr.cell(mine, 'Resold (kg)')), F.resoldKg);
			same('BRSR table: donated (kg)', Number(brsr.cell(mine, 'Donated (kg)')), F.donatedKg);
			same('BRSR table: disposed (kg)', Number(brsr.cell(mine, 'Disposed (kg)')), F.destroyedKg);
			shows(
				'BRSR table: evidence',
				brsr.cell(mine, 'Evidence') ?? '',
				['invoice', 'support', 'expiry', 'receipt'].map((id) => paper(id)?.no).filter((x): x is string => !!x)
			);
			for (const r of q.brsr) {
				const got = brsr.table.find((x) => x[0] === r.cat);
				same(`BRSR table: ${r.cat}, diverted (kg)`, Number(brsr.cell(got, 'Diverted (kg)')), r.diverted);
			}
			await running().done(`ESG: the BRSR table exported (${brsr.name})`);

			// the batch's own BRSR line, on its page in the ledger
			await as(page, 'priya', `/report/${HERO}`, "checks the batch's BRSR line and the evidence it rests on");
			await page.locator('.bh-tabs').getByRole('button', { name: 'Impact' }).click();
			// within the page: the recording's caption names the BRSR line too
			const main = page.locator('#main');
			await expect(main.getByText('BRSR line', { exact: true })).toBeVisible();
			await expect(main.getByText(/^posted · /)).toBeVisible();
			shows('BRSR line', norm(await page.locator('.lg-brsr').innerText()), [
				`${kgOf(F.kg)} diverted from disposal`,
				`${kgOf(F.destroyedKg)} destroyed`,
				`${kgOf(F.co2)} CO₂e avoided`,
				F.meals ? `${F.meals.toLocaleString('en-IN')} meals` : '0 meals (nothing donated)'
			]);
			shows(
				'BRSR evidence',
				norm(await main.getByText(/^Evidence:/).innerText()),
				['invoice', 'support', 'expiry', 'receipt'].map((id) => paper(id)?.no).filter((x): x is string => !!x)
			);
			await running().done("ESG: the batch's BRSR line and its evidence");

			running().figure('Kept out of landfill', kgOf(F.kg));
			running().figure('CO₂e avoided', kgOf(F.co2));
			running().figure('Plastic packaging resold', kgOf(F.packResoldKg));
			if (story_) {
				story('Kept out of landfill (kg)', F.kg, story_.kg);
				story('CO₂e avoided (kg)', F.co2, story_.co2);
				story('Meals', F.meals, story_.meals);
				story('Destroyed (kg)', F.destroyedKg, story_.destroyedKg);
				story('Plastic packaging resold (kg)', F.packResoldKg, story_.packResoldKg);
			}
			// the year so far, Munchly's history and this batch together
			const y = l.periods.find((p) => p.kind === 'year' && p.current)!.totals;
			running().figure('The year: recovered', inr(y.net));
			running().figure('The year: input GST kept', inr(y.itcKept));
			running().figure('The year: kept out of landfill', kgOf(y.kg));
			running().figure('The year: CO₂e avoided', kgOf(y.co2));
			running().figure('The year: batches', y.batches);
		}
	};
}
