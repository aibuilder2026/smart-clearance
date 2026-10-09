import { expect, type Page } from '@playwright/test';
import type { WsLedger, WsPartner } from '@smart-clearance/api/workspace';
import { readFileSync } from 'node:fs';
import { api } from './auth.ts';
import {
	AGENT_WAIT,
	as,
	caseAs,
	inr,
	kiranasOf,
	running,
	sidebar,
	staff,
	story,
	until,
	WS,
	type Step
} from './flow.ts';

// The Masala Chips batch's journey (MF-2409-117, Rakesh Traders, Nagpur), as Munchly Chips E2E takes it (SC-95): its
// steps, shared with Munchly Chips Leftover E2E (SC-116), which takes the same batch on with kiranas that do not order.
//
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts; a 48-hour offer is open 2 hours of real time.

export const HERO = 'MF-2409-117';
const DAY_MINUTES = Number(process.env.E2E_DAY_MINUTES ?? 60);
const PRESETS: Record<number, RegExp> = { 1440: /Real time/, 60: /Rehearsal/, 5: /Demo/, 1: /Fast/ };
// the story's kiranas for Rakesh's cluster: their own orders fill the scheme to the packet
export const KIRANAS = kiranasOf('rakesh');
/** the people a chips flow signs in */
export const PEOPLE = ['neha', 'priya', 'rakesh', 'agrawal', ...KIRANAS.map((k) => k.member)];

/** the van round's day, as Deliveries and its push name it */
let vanDay = '';

/** the chips' tax and ESG figures in the story (design3 ledger.js STORY_CLEARED): what Munchly Chips E2E holds Priya's
 *  checks to. Munchly Chips Leftover E2E holds them to the ledger row backend-api posted only (SC-128) */
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
export const CHIPS_TAX_ESG: TaxEsg = {
	itcKept: 1224,
	itcReversed: 0,
	invoice: 'INV/26-27/0931',
	invoiceTotal: 11510,
	creditNote: 'CN/0117',
	support: 8768,
	kg: 217.6,
	co2: 544,
	meals: 0,
	destroyedKg: 0,
	packResoldKg: 8.16
};

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const r2 = (n: number) => Math.round(n * 100) / 100;
/** kilos as the screens write them (money.js fmt.kg) */
const kgOf = (n: number) =>
	n >= 1000
		? `${(r2(n) / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} t`
		: `${r2(n).toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg`;

/** what a screen or an export shows, held to the ledger: each part (or one of its spellings) must be in the text */
function shows(name: string, text: string, parts: (string | string[])[]) {
	// a screen's text breaks its lines where its layout does: compared with and without its spaces
	const flat = (x: string) => x.replace(/\s+/g, '');
	const missing = parts.filter(
		(p) => !(Array.isArray(p) ? p : [p]).some((x) => text.includes(x) || flat(text).includes(flat(x)))
	);
	running().figure(name, missing.length ? `missing ${missing.map((p) => [p].flat()[0]).join('; ')}` : 'as posted');
	if (missing.length)
		running().find('warning', HERO, `${name} does not read ${missing.map((p) => `"${[p].flat()[0]}"`).join(', ')}`);
	expect.soft(missing, name).toEqual([]);
}

/** a value an export or a screen carries, against the ledger's */
function same(name: string, actual: string | number | undefined, posted: string | number | undefined) {
	running().figure(name, actual ?? '(missing)');
	if (String(actual) !== String(posted))
		running().find('warning', HERO, `${name}: ${actual} where the ledger has ${posted}`);
	expect.soft(String(actual), name).toBe(String(posted));
}

/** the chips' ledger row as backend-api posted it, and the quarter it cleared in */
async function posted() {
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
				['support', 'Price-support credit note']
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
				[paper('invoice')?.no, paper('support')?.no].filter((x): x is string => !!x)
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
				[paper('invoice')?.no, paper('support')?.no, paper('expiry')?.no].filter((x): x is string => !!x)
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

/** Rakesh reads his portal back once Impact has posted (SC-133): Today with nothing left for him on the chips; the
 *  batch's page (what happened, how he ended whole, his papers and their PDFs); Orders, with the paper each sold on;
 *  Deliveries, the round and the truck; his label photos. Each held to the ledger row, his partner facts and the story */
export function distributorStep(): Step {
	return {
		id: 'distributor',
		title: "Rakesh reads his portal: Today, the batch's page and papers, Orders, Deliveries and his label photos",
		async run(page) {
			const { row, paper } = await posted();
			const F = row.figures;
			const view = await api<WsPartner>('workspace', 'rakesh', `${WS}/partner`);
			const mine = view.cases.find((c) => c.ref === HERO);
			if (!mine) throw new Error(`${HERO} is not in Rakesh's partner view`);
			const c = (await caseAs('rakesh'))!;
			const leaves = c.moments.van.leavesAt ?? '';
			const day =
				vanDay ||
				(leaves ? new Date(leaves).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' }) : '');
			const main = page.locator('#main');
			const text = async () => norm(await main.innerText());
			const invoice = paper('invoice');
			const support = paper('support');
			const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

			// Today: the chips cleared and his invoice issued, so nothing on them is left for him
			await as(page, 'rakesh', '/home', 'opens Today once the chips have cleared');
			await expect(main).toContainText('Your other stock and the batches you cleared are on');
			const card = await page.locator(`#batch-${HERO}`).count();
			story(
				'Today: the chips',
				card ? 'a card still asks for something' : 'nothing left for him',
				'nothing left for him'
			);
			await running().done('Today: nothing left for him on the chips');

			// the batch's page: what happened, how he ended whole, his papers
			await as(page, 'rakesh', `/batches/${HERO}`, "reads the chips' page: what happened, his money, his papers");
			await expect(main).toContainText('You sent the label photo');
			shows('His batch: what happened', await text(), [
				'The Watcher flagged 1,360 packs at risk',
				'You sent the label photo',
				'772 listed on ExpireSoon in your name',
				'The scheme went to 38 of your kiranas',
				'Agrawal Wholesale took the counter at ₹14.20',
				'31 kiranas ordered 588 packets',
				"You loaded Agrawal Wholesale's truck",
				'The Paperwork agent drafted your papers',
				`Your ${day} van round delivered the scheme`,
				'Settled: you ended whole'
			]);
			await running().done('His batch: what happened');
			await page.locator('.bh-tabs').getByRole('button', { name: 'Money' }).click();
			await expect(main).toContainText('You end whole');
			const money = await text();
			shows('His batch: money', money, [
				'From your kiranas',
				'From Agrawal Wholesale',
				'Price-support credit note',
				[rupees(F.support), rupees(Math.round(F.support))],
				'Your gain or loss ₹0'
			]);
			story(
				'His gain or loss',
				/Your gain or loss ?₹0\b/.test(money) ? 0 : money.match(/Your gain or loss ?(\S+)/)?.[1],
				0
			);
			await running().done('His batch: he ends whole');
			await page.locator('.bh-tabs').getByRole('button', { name: 'Papers' }).click();
			await expect(main).toContainText('Your papers');
			shows(
				'His batch: papers',
				await text(),
				[invoice?.no, support?.no, 'You issue it'].filter((x): x is string => !!x)
			);
			if (support) {
				await page
					.getByRole('button', { name: /Price-support credit note/ })
					.first()
					.click();
				await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
				await running().done(`His papers: ${support.no}, with Download PDF`);
				await page.keyboard.press('Escape');
			}
			// his papers' PDFs, from the links his Download PDF opens
			for (const d of [invoice, support].filter((x) => !!x)) {
				const { url } = await api<{ url: string }>('workspace', 'rakesh', `${WS}/documents/${HERO}/${d!.id}`);
				const pdf = await fetch(url);
				const head = new TextDecoder().decode(new Uint8Array(await pdf.arrayBuffer()).slice(0, 4));
				same(
					`His ${d!.no} PDF`,
					`${pdf.status} ${pdf.headers.get('content-type')} ${head}`,
					'200 application/pdf %PDF'
				);
			}
			// the price support exactly (₹8,767.60), which his credit note rounds to the rupee (₹8,768) as the ledger does
			same('His credit: the price support, to the rupee', Math.round(mine.support?.total ?? 0), F.support);
			story('His credit note', support?.no, 'CN/0117');

			// Orders: who bought what, for how much, on which paper
			await as(page, 'rakesh', '/orders', 'reads his orders, batch by batch, with the paper each sold on');
			await expect(main).toContainText('sold from Munchly');
			shows('His orders', await text(), [
				`lot ${c.journey.listing?.id} · 772 × ₹14.20`,
				...(invoice ? [`${invoice.no} issued from Tally`] : []),
				'31 kiranas · 588 packets at ₹21.60, 2 free with every 10',
				'₹10,962',
				'₹10,584'
			]);
			await running().done('Orders: the lot and the scheme, each on its paper');

			// Deliveries: the round delivered, the truck collected, then the earlier ones
			await as(page, 'rakesh', `/van/${HERO}`, "reads the chips' deliveries, then the earlier ones");
			await expect(main).toContainText('van round');
			shows('His deliveries', await text(), [
				`${day} van round`,
				'delivered',
				"The buyer's truck · ExpireSoon",
				'collected',
				'Stops',
				'Earlier deliveries'
			]);
			await running().done('Deliveries: the round delivered, the truck collected');

			// the label photos he sent, and what Vision read
			await as(page, 'rakesh', '/photo', 'reads his label photos and what Vision read from each');
			await expect(main).toContainText('Earlier label photos');
			shows('His label photos', await text(), [
				'No label photo asked for now',
				`Vision read batch ${HERO}, made 18 May 2026, best before 18 Nov 2026, MRP ₹30.00`
			]);
			await running().done('Label photo: every photo he sent');
		}
	};
}

/** the journey's steps, in order: each acts in the UI, then waits for what follows from it */
export const CHIPS: Step[] = [
	{
		id: 'reset',
		title: "Neha starts Munchly's journey again from the console",
		async run(page) {
			await staff(page, '/clients/munchly/agents', `Reset journey, at ${DAY_MINUTES} min a journey day`);
			await page.getByRole('button', { name: 'Actions for Munchly Foods' }).click();
			await page.getByRole('menuitem', { name: /Reset journey/ }).click();
			const sheet = page.getByRole('dialog', { name: /journey again/ });
			await sheet.getByRole('radio', { name: PRESETS[DAY_MINUTES] ?? /Rehearsal/ }).check();
			await sheet.getByRole('button', { name: 'Reset journey' }).click();
			await expect(sheet).toBeHidden();
			await expect(page.getByRole('group', { name: 'Watcher: scheduled runs and timers' })).toContainText(
				'After Setup is confirmed'
			);
			await running().done('Journey reset to day 0, 08:00');
		}
	},
	{
		id: 'setup',
		title: "Priya confirms Setup: the stock export's mapping and the guardrails",
		async run(page) {
			await as(page, 'priya', '/', 'opens Setup and confirms the mapping and the guardrails');
			await sidebar(page, 'Setup').click();
			await expect(page).toHaveURL(/\/setup/);
			await expect(page.getByText('Mapped · confirm below')).toBeVisible({ timeout: AGENT_WAIT });
			await running().done('Setup: the export mapped, 8 of 8 columns');
			const confirm = page.getByRole('button', { name: 'Confirm and start watching' });
			await confirm.scrollIntoViewIfNeeded();
			await confirm.click();
			await expect(page.getByRole('button', { name: 'Open Command Center' })).toBeVisible();
			await running().done('Setup confirmed: the Watcher starts at 09:00');
		}
	},
	{
		id: 'permission',
		title: 'Rakesh gives Smart-Clearance the one-time permission',
		async run(page) {
			await as(page, 'rakesh', '/home', 'allows the agents to act for Rakesh Traders');
			await expect(page.getByText('Let Smart-Clearance act for Rakesh Traders')).toBeVisible();
			await page.getByRole('button', { name: 'Allow', exact: true }).click();
			await expect(page.getByText('Smart-Clearance acts for you')).toBeVisible();
			await running().done('Permission given');
		}
	},
	{
		id: 'detect',
		title: 'The Watcher flags the chips: Neha runs it from the console unless the 09:00 check already has',
		async run(page) {
			if (!(await caseAs('priya'))) {
				await staff(page, '/clients/munchly/agents', "runs the Watcher's daily check now");
				const run_ = page.getByRole('button', { name: 'Run now: Watcher, daily check' });
				await expect(run_).toBeEnabled();
				await run_.click();
				await running().done('Watcher run from the console');
			}
			const c = await until('the Watcher flags MF-2409-117 and Vision asks for its label photo', 'priya', (c) =>
				['requested', 'reading', 'verified'].includes(c.journey.photo.status)
			);
			running().figure('Flagged phase', c.journey.phase);
			await as(page, 'priya', `/command/${HERO}`, 'sees the chips flagged on the Command Center');
			await expect(page.getByText('Masala Chips 150 g').first()).toBeVisible();
			// what destroying it would cost, from Detect on, never ₹0 (SC-99)
			story('Write-off at Detect', c.writeOff?.total, 26329.6);
			await expect(page.locator('#main')).toContainText('if destroyed · 1,360 units at risk');
			const card = await page.locator('#main').innerText();
			story(
				'Command Center card at Detect',
				card.includes('26,330') ? '−₹26,330 if destroyed' : card,
				'−₹26,330 if destroyed'
			);
			await running().done('Command Center: the chips at risk, Vision waiting for the label photo');
		}
	},
	{
		id: 'photo',
		title: "Rakesh sends the chips' label photo",
		async run(page) {
			await as(page, 'rakesh', `/photo/${HERO}`, 'uploads the label photo from the godown');
			await expect(page.getByRole('button', { name: 'Upload a photo' })).toBeVisible();
			await page
				.locator('input[type=file]:not([capture])')
				.setInputFiles(new URL('../../../../agents/evals/vision/images/story-clean.webp', import.meta.url).pathname);
			await running().done('The label photo chosen');
			await page.getByRole('button', { name: 'Send photo' }).click();
			await expect(page.getByText(/Dhanyavaad/)).toBeVisible({ timeout: AGENT_WAIT });
			await running().done('Vision read the label');
		}
	},
	{
		id: 'approve',
		title: 'The Valuer prices it, the Router plans it, Priya approves',
		async run(page) {
			const c = await until(
				'the Valuer and the Router plan MF-2409-117',
				'priya',
				(c) => c.journey.phase === 'planned'
			);
			story('Plan net', c.plan?.net, 21770);
			for (const l of c.plan?.lines ?? []) running().figure(`Plan line ${l.id}`, `${l.units} packs`);
			await as(page, 'priya', `/route/${HERO}`, 'reviews the plan in the Route Room and approves it');
			const review = page.getByRole('button', { name: 'Review and approve' });
			await expect(review).toBeVisible();
			await running().done('Route Room: the plan, waiting for a yes');
			await review.click();
			const sheet = page.getByRole('dialog', { name: 'Approve the plan' });
			await expect(sheet).toBeVisible();
			await running().done('The approve sheet');
			await sheet.getByRole('button', { name: 'Approve · release the agents' }).click();
			const placed = page.getByRole('dialog', { name: 'Plan placed' });
			await expect(placed.getByRole('button', { name: 'Watch execution' })).toBeVisible();
			await running().done('Plan placed');
			await placed.getByRole('button', { name: 'Watch execution' }).click();
			await expect(page).toHaveURL(new RegExp(`/execution/${HERO}`));
		}
	},
	{
		id: 'execute',
		title: 'The Lister lists the lot on ExpireSoon and Outreach sends the kiranas their scheme',
		async run(page) {
			const c = await until('the Lister lists the lot and Outreach sends the scheme', 'priya', (c) =>
				Boolean(c.journey.listing && c.journey.offer)
			);
			story('Kiranas offered the scheme', c.journey.offer?.shops, 38);
			story('ExpireSoon lot', `${c.journey.listing?.units} packs at ₹${c.journey.listing?.price}`, '772 packs at ₹15');
			await as(page, 'priya', `/execution/${HERO}`, 'watches the agents carry out the plan');
			await running().done('Execution: the lot listed, the scheme sent');
		}
	},
	{
		id: 'orders',
		title: "Each of Rakesh's kiranas orders its share of the scheme",
		async run(page) {
			for (const [i, k] of KIRANAS.entries()) {
				await as(page, k.member, `/offer/${HERO}`, `orders ${k.orders} packets (${i + 1} of ${KIRANAS.length})`);
				const order = page.getByRole('button', { name: new RegExp(`· ${k.orders} packets`) });
				if (!(await order.isVisible().catch(() => false)) && (await page.getByText(/ऑर्डर हो गया|Ordered/).count())) {
					running().find('note', `/offer/${HERO}`, `${k.name} had already ordered`);
					continue;
				}
				await order.click();
				await expect(page.getByText(/ऑर्डर हो गया/).first()).toBeVisible();
				await running().done(`${k.name} ordered ${k.orders} packets`);
			}
			const c = await until(
				'the scheme fills and closes',
				'priya',
				(c) => c.journey.offer?.status === 'closed',
				60_000
			);
			story(
				'Kirana orders',
				`${c.journey.orders.length} shops, ${c.journey.orders.reduce((t, o) => t + o.units, 0)} packets`,
				'31 shops, 588 packets'
			);
		}
	},
	{
		id: 'deal',
		title: 'Agrawal Wholesale bids on ExpireSoon, the Negotiator counters, Agrawal takes it',
		async run(page) {
			await as(page, 'agrawal', '/market', 'finds the chips lot on ExpireSoon and bids ₹13');
			await page.getByRole('button', { name: 'View lot' }).first().click();
			await expect(page).toHaveURL(/\/listing/);
			const bid = page.getByRole('button', { name: /^Bid ₹13\.00 for 772/ });
			await expect(bid).toBeVisible();
			await running().done('The lot on ExpireSoon');
			await bid.click();
			await running().done('Bid ₹13 a packet');
			const accept = page.getByRole('button', { name: /^Accept ₹/ });
			await expect(accept).toBeVisible({ timeout: AGENT_WAIT });
			running().figure('Counter', (await accept.innerText()).replace(/\s+/g, ' '));
			await running().done('The Negotiator countered');
			await accept.click();
			const c = await until('the lot is awarded', 'priya', (c) => Boolean(c.journey.award));
			story(
				'Award',
				`${c.journey.award?.units} packs at ₹${c.journey.award?.price}, token ₹${c.journey.award?.token}`,
				'772 packs at ₹14.2, token ₹1644'
			);
			await expect(page.getByText(/won|Lot won/i).first()).toBeVisible();
			// the bill reads the award's own invoice from the win, before the papers (SC-96)
			await expect(page.locator('#main')).toContainText('Invoice total');
			const bill = (await page.locator('#main').innerText()).replace(/\s+/g, ' ');
			story(
				'Lot won bill',
				bill.match(/Invoice total ₹[\d,.]+/)?.[0] ?? bill.slice(0, 120),
				'Invoice total ₹11,510.00'
			);
			await running().done('Agrawal took the counter and paid the token');
		}
	},
	{
		id: 'truck',
		title: "Rakesh loads the buyer's truck",
		async run(page) {
			await as(page, 'rakesh', `/van/${HERO}`, "loads Agrawal Wholesale's truck at the godown");
			const load = page.getByRole('button', { name: "Load the buyer's truck" });
			await expect(load).toBeEnabled();
			await load.click();
			await until('the truck is dispatched', 'rakesh', (c) => c.journey.truck.status === 'dispatched', 60_000);
			await running().done('The truck loaded');
		}
	},
	{
		id: 'papers',
		title: 'Paperwork drafts the pack; Rakesh issues his invoice and runs his van round',
		async run(page) {
			const c = await until(
				'Paperwork drafts the papers',
				'rakesh',
				(c) => c.journey.phase === 'settled' && c.docs.length > 0
			);
			for (const d of c.docs) running().figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status})`);
			// every paper a person signs carries the PDF Paperwork rendered into the docs bucket (SC-100)
			const pdfs = await until('Paperwork renders the PDFs', 'priya', (c) => c.docs.filter((d) => d.pdf).length >= 3);
			story(
				'Papers with their PDF',
				pdfs.docs
					.filter((d) => d.pdf)
					.map((d) => d.id)
					.join(', '),
				'invoice, support, itc'
			);
			// one day for the van round: Deliveries' and the push's (SC-97)
			const leaves = c.moments.van.leavesAt ?? '';
			vanDay = leaves
				? new Date(leaves).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' })
				: '';
			story('Van round push', c.push.van?.title, `Van route for ${vanDay}`);
			await as(page, 'rakesh', `/orders/${HERO}`, 'issues his invoice from Tally');
			// the chips' order on the ExpireSoon lot, on its invoice; Orders lists his cleared batches' too (SC-133)
			const invoiceNo = c.docs.find((d) => d.id === 'invoice')?.no ?? '';
			const sold = page.locator('.dist-order').filter({ hasText: invoiceNo });
			await sold.getByRole('button', { name: 'Issue from Tally' }).click();
			await expect(sold.getByText('issued from Tally', { exact: true })).toBeVisible();
			await running().done('Invoice issued from Tally');
			await sidebar(page, 'Deliveries').click();
			await expect(page.locator('#main')).toContainText(`${vanDay} van round`);
			const round = page.getByRole('button', { name: 'Start the round' });
			await expect(round).toBeEnabled();
			await round.click();
			const ran = await until('the van round is done', 'priya', (c) => c.journey.van.status === 'done', 60_000);
			story(
				'Van round in the timeline',
				ran.feed.find((f) => f.key === 'van')?.text.split(':')[0],
				`Ran the ${vanDay} round`
			);
			await running().done('The van round run: 31 kiranas delivered');
		}
	},
	{
		id: 'review',
		title: 'Priya reviews the pack: the tax invoice, the credit note and the GST ITC memo',
		async run(page) {
			await as(page, 'priya', `/paperwork/${HERO}`, 'reads each paper, then marks the pack reviewed');
			await expect(page.getByRole('button', { name: 'Mark reviewed' })).toBeVisible();
			const c = (await caseAs('priya'))!;
			for (const d of c.docs) {
				const card = page.getByRole('button', { name: new RegExp(d.type) }).first();
				if (!(await card.count())) {
					running().find('warning', `/paperwork/${HERO}`, `no card for the paper "${d.type}"`);
					continue;
				}
				await card.click();
				await page.waitForTimeout(600);
				if (d.id === 'fssai' && d.status === 'not required') {
					// a batch with no donation names no batch as donated (SC-98)
					const paper = (await page.locator('#main').innerText()).replace(/\s+/g, ' ');
					story(
						'FSSAI paper',
						/has its own checklist/.test(paper) ? 'names a batch as donated' : 'Nothing from this batch was donated.',
						'Nothing from this batch was donated.'
					);
				}
				await running().done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}`);
			}
			// what Rakesh issued from Tally, as Priya reads it
			if (c.journey.invoiceIssued && c.docs.some((d) => d.id === 'invoice' && d.status === 'drafted'))
				running().find(
					'note',
					`/paperwork/${HERO}`,
					`the tax invoice still reads "drafted" in Priya's pack after Rakesh issued it from Tally (as in the prototype)`
				);
			await page.getByRole('button', { name: 'Mark reviewed' }).click();
			await expect(page.getByText('reviewed', { exact: true })).toBeVisible();
			await until('the review is recorded', 'priya', (c) => c.journey.reviewed, 30_000);
			await running().done('Pack reviewed');
		}
	},
	{
		id: 'report',
		title: "Neha fires expiry day's report from the console; Impact posts the ledger",
		async run(page) {
			const before = (await caseAs('priya'))!;
			running().figure('Phase before the report', before.journey.phase);
			running().figure('Actual net', inr(before.actual?.net));
			await staff(page, '/clients/munchly/agents', "fires Impact's report for the chips now");
			const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
			await expect(fire).toBeEnabled();
			await fire.click();
			const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
			await expect(alert).toBeVisible();
			await running().done('Report now: Expire it and report now?');
			await alert.getByRole('button', { name: 'Report now' }).click();
			await expect(alert).toBeHidden();
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			story('Actual net', c.actual?.net, 21152.4);
			story('Left at the godown', c.realised?.godown, 0);
			running().figure('Phase after the report', c.journey.phase);
			for (const d of c.docs) running().figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status})`);
			await running().done('Impact posted the ledger');
		}
	},
	taxStep(CHIPS_TAX_ESG),
	esgStep(CHIPS_TAX_ESG),
	distributorStep(),
	{
		id: 'close',
		title: "Priya reads the batch's money in the ledger, and sees the batch through",
		async run(page) {
			await as(page, 'priya', `/report/${HERO}`, "reads the batch's money in the ledger");
			await running().done("The ledger: the batch's money");
			await as(page, 'priya', `/execution/${HERO}`, 'sees the batch through on Execution');
			await running().done('Execution: every line done');
			await sidebar(page, 'Command Center').click();
			await page.waitForTimeout(800);
			await running().done('Command Center at the end');
		}
	}
];

/** one of the chips' steps, by its id */
export const chips = (id: string): Step => {
	const s = CHIPS.find((s) => s.id === id);
	if (!s) throw new Error(`no chips step "${id}"`);
	return s;
};
