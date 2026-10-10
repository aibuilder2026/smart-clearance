import { expect, test, type Page } from '@playwright/test';
import type { WsLedger, WsPartner } from '@smart-clearance/api/workspace';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { api, mint } from './auth.ts';
import { chips } from './chips.ts';
import {
	as,
	begin,
	caseAs,
	inr,
	running,
	same,
	shows,
	staff,
	story,
	until,
	WS,
	type Case,
	type Kirana,
	type Step
} from './flow.ts';
import { esgStep, norm, taxStep } from './ledger.ts';
import { DIST, HERO, KIRANAS, mango, PEOPLE, printed, shareOf, vanDayOf } from './mango.ts';
import { Run } from './record.ts';

// Munchly Mango Leftover E2E (SC-135): the Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad) from a
// fresh journey, as Munchly Mango E2E takes it, except that some of Lakshmi Agencies' kiranas do not buy: a few press
// Not this time, the rest read the scheme and let it go. The staff sale is recorded and Feeding India collects its
// packs. Neha closes the scheme's window from the console, short of its packets, so they stay at the godown; the
// Paperwork agent drafts the pack, and the van round takes the orders placed. Then Neha fires expiry day (Report now):
// the packs left at the godown settle by Munchly's expiry policy, full credit, so Lakshmi Agencies is credited the
// dealer price for them and Munchly destroys them, reversing their input GST (SC-94, SC-122).
//
// Then every screen and paper is read back and held to the ledger row backend-api posted: Priya's pack (the price-support
// and expiry credit notes, the GST ITC memo, the FSSAI checklist, the donation receipt and the destruction certificate),
// each paper's PDF read back, Execution's Left at the godown and Expiry settlement, the ledger's GST and Impact readings
// with the GST summary and the BRSR table, the kiranas' offers (ordered, declined, expired), Meera's pickup and receipt,
// and Lakshmi Agencies' portal with her copies. The Mango's plan has no ExpireSoon lot (22 days left is under
// ExpireSoon's 30), so it has no tax invoice: its GST papers are the two credit notes and the ITC memo.
//
// E2E_LEFTOVER (10): how many of the 52 ordering kiranas do not buy, the last in the story's order.
// E2E_DECLINE (2): how many of those press Not this time; the others read the scheme and do not order.
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts (chips.ts).
// E2E_FROM=<step id> resumes on the journey as it stands; E2E_UNTIL=<step id> stops after that step.

const SKIP = Number(process.env.E2E_LEFTOVER ?? 10);
const DECLINE = Number(process.env.E2E_DECLINE ?? 2);
if (!(SKIP >= 1 && SKIP < KIRANAS.length))
	throw new Error(`E2E_LEFTOVER must be 1 to ${KIRANAS.length - 1}: some kiranas order and some do not`);
if (!(DECLINE >= 0 && DECLINE <= SKIP)) throw new Error(`E2E_DECLINE must be 0 to E2E_LEFTOVER (${SKIP})`);
const BUYERS = KIRANAS.slice(0, KIRANAS.length - SKIP);
const DECLINERS = KIRANAS.slice(KIRANAS.length - SKIP, KIRANAS.length - SKIP + DECLINE);
const SILENT = KIRANAS.slice(KIRANAS.length - SKIP + DECLINE);
/** what each buyer orders: its story share where the offer screen can place it, else the nearest it can above it */
const ORDERS = BUYERS.map((k) => ({ k, ...shareOf(k) }));
const ORDERED = ORDERS.reduce((t, o) => t + o.units, 0);
/** the Mango Drink's dealer price and its input credit a pack (design3 data.js; SC-94, SC-105: estimated) */
const DP = 14.5;
const ITC_PER = 0.55;

let run: Run;
/** the packets the plan offers the kiranas, read from the case */
let planned = 0;
/** the packs no channel took: the kiranas' planned packets less those ordered */
const left = () => planned - ORDERED;
const plannedOf = (c: Case | null) => c?.plan?.lines.find((l) => l.id === 'kirana')?.units ?? 0;

const num = (n: number) => n.toLocaleString('en-IN');
const r2 = (n: number) => Math.round(n * 100) / 100;
/** rupees as the papers write them (money.js fmt.inr2) */
const inr2 = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** rupees as the screens may write them, to the paisa or to the rupee */
const rupees = (n: number) => [
	`₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
	inr2(n),
	`₹${Math.round(n).toLocaleString('en-IN')}`
];
const mainText = async (page: Page) => norm(await page.locator('#main').innerText());

/** a paper's PDF, from the link its Download PDF opens, kept beside the run's report and read back as text (pypdf,
 *  when this machine's python3 has it) */
async function pdfOf(who: string, id: string, no: string) {
	const { url } = await api<{ url: string }>('workspace', who, `${WS}/documents/${HERO}/${id}`);
	const res = await fetch(url);
	const bytes = new Uint8Array(await res.arrayBuffer());
	const head = new TextDecoder().decode(bytes.slice(0, 4));
	const path = running().keep(`${HERO}-${id}${no ? `-${no.replace(/[^\w-]+/g, '-')}` : ''}.pdf`);
	writeFileSync(path, bytes);
	let text: string | null = null;
	try {
		text = norm(
			execFileSync(
				'python3',
				[
					'-I',
					'-c',
					'import sys, pypdf; print(" ".join(p.extract_text() or "" for p in pypdf.PdfReader(sys.argv[1]).pages))',
					path
				],
				{ encoding: 'utf8' }
			)
		);
	} catch {
		running().find('note', HERO, `the ${id} PDF was kept but not read as text: python3 with pypdf is not available`);
	}
	return { status: `${res.status} ${res.headers.get('content-type')} ${head}`, text };
}

/** the ledger row backend-api posted for the Mango Drink */
async function row() {
	const l = await api<WsLedger>('workspace', 'priya', `${WS}/ledger`);
	const r = l.batches.find((b) => b.ref === HERO);
	if (!r) throw new Error(`${HERO} is not in the ledger`);
	return r;
}

const STEPS: Step[] = [
	chips('reset'),
	chips('setup'),
	{
		id: 'permission',
		title: 'Lakshmi Agencies gives Smart-Clearance the one-time permission',
		async run(page) {
			await as(page, DIST, '/home', 'allows the agents to act for Lakshmi Agencies');
			const ask = page.getByText('Let Smart-Clearance act for Lakshmi Agencies');
			const given = page.getByText('Smart-Clearance acts for you');
			await expect(ask.or(given).first()).toBeVisible();
			// the story's Lakshmi Agencies gave hers at 08:30 on day 0, so a reset leaves it given
			if (await given.isVisible()) {
				running().find(
					'note',
					'/home',
					'Lakshmi Agencies had already given her permission (the story gives it at 08:30)'
				);
				await running().done('Permission already given');
				return;
			}
			await page.getByRole('button', { name: 'Allow', exact: true }).click();
			await expect(given).toBeVisible();
			await running().done('Permission given');
		}
	},
	{
		id: 'detect',
		title: 'The Watcher flags the Mango Drink: Neha runs it from the console unless the 09:00 check already has',
		async run(page) {
			if (!(await caseAs('priya'))) {
				await staff(page, '/clients/munchly/agents', "runs the Watcher's daily check now");
				const watch = page.getByRole('button', { name: 'Run now: Watcher, daily check' });
				await expect(watch).toBeEnabled();
				await watch.click();
				await running().done('Watcher run from the console');
			}
			const c = await until('the Watcher flags MF-2410-118 and Vision asks for its label photo', 'priya', (c) =>
				['requested', 'reading', 'verified'].includes(c.journey.photo.status)
			);
			running().figure('Flagged phase', c.journey.phase);
			running().figure('Packs at risk', c.batch.assess?.atRisk ?? '(none)');
			await as(page, 'priya', `/command/${HERO}`, 'sees the Mango Drink flagged on the Command Center');
			await expect(page.getByText('Mango Drink 200 ml').first()).toBeVisible();
			// what destroying it would cost, from Detect on (SC-99): the story's day-0 figure
			story('Write-off at Detect', c.writeOff?.total, 22657.2);
			await expect(page.locator('#main')).toContainText('if destroyed');
			await running().done('Command Center: the Mango Drink at risk, Vision waiting for the label photo');
		}
	},
	mango('photo'),
	mango('approve'),
	mango('execute'),
	{
		id: 'orders',
		title: `${BUYERS.length} of Lakshmi Agencies' kiranas order; ${DECLINERS.length} say Not this time; ${SILENT.length} let the scheme go`,
		async run(page) {
			const before = (await caseAs('priya'))!;
			planned = plannedOf(before);
			running().figure('Plan line kirana', `${planned} packs`);
			if (ORDERED >= planned)
				throw new Error(`the buyers' ${ORDERED} packets would fill the scheme's ${planned}: raise E2E_LEFTOVER`);
			for (const o of ORDERS.filter((o) => o.units !== o.k.orders))
				running().find(
					'warning',
					`/offer/${HERO}`,
					`${o.k.name}'s story order of ${o.k.orders} packets cannot be placed: the offer screen orders in twelves from its share of ${o.cap}, so it ordered ${o.units}`
				);
			const all = KIRANAS.length;
			for (const [i, o] of ORDERS.entries()) {
				await as(page, o.k.member, `/offer/${HERO}`, `orders ${o.units} packets (${i + 1} of ${all})`);
				const done = page.getByText(/ऑर्डर हो गया|Ordered/).first();
				const order = page.getByRole('button', { name: /· \d+ packets/ });
				await expect(order.or(done)).toBeVisible();
				if (!(await order.isVisible())) {
					running().find('note', `/offer/${HERO}`, `${o.k.name} had already ordered`);
					continue;
				}
				for (let n = o.cap; n > o.units; n -= 12) await page.getByRole('button', { name: 'Fewer Packets' }).click();
				await page.getByRole('button', { name: new RegExp(`· ${o.units} packets`) }).click();
				await expect(page.getByText(/ऑर्डर हो गया/).first()).toBeVisible();
				await running().done(`${o.k.name} ordered ${o.units} packets`);
			}
			// Not this time, on the shop's Offers (SC-130): the offer stays open to it for its 48 hours
			for (const [i, k] of DECLINERS.entries()) {
				const n = `${BUYERS.length + i + 1} of ${all}`;
				await as(page, k.member, '/home', `reads the scheme and says not this time (${n})`);
				const no = page.getByRole('button', { name: 'Not this time' });
				await expect(no).toBeVisible();
				await no.click();
				await expect(page.getByText('You said not this time')).toBeVisible();
				running().find('note', `/home`, `${k.name} declined its ${k.orders} packets`);
				await running().done(`${k.name}: Not this time`);
			}
			for (const [i, k] of SILENT.entries()) {
				const n = `${BUYERS.length + DECLINERS.length + i + 1} of ${all}`;
				await as(page, k.member, `/offer/${HERO}`, `reads the scheme and does not order (${n})`);
				await expect(page.getByRole('button', { name: /· \d+ packets/ })).toBeVisible();
				await page.waitForTimeout(500);
				running().find('note', `/offer/${HERO}`, `${k.name} did not order its ${k.orders} packets`);
				await running().done(`${k.name} did not order`);
			}
			const c = await until(
				`the ${BUYERS.length} orders are in`,
				'priya',
				(c) => c.journey.orders.length === BUYERS.length,
				60_000
			);
			story(
				'Kirana orders',
				`${c.journey.orders.length} shops, ${c.journey.orders.reduce((t, o) => t + o.units, 0)} packets`,
				`${BUYERS.length} shops, ${ORDERED} packets`
			);
			story('Scheme after the orders', c.journey.offer?.status, 'sent');
			running().figure('Packets the kiranas did not take', left());
			await as(page, 'priya', `/execution/${HERO}`, 'watches the scheme stay open, short of its packets');
			await running().done(`Execution: ${ORDERED} of ${planned} packets ordered, the scheme still open`);
		}
	},
	mango('staff'),
	mango('donation'),
	{
		id: 'window',
		title: "Neha closes the kiranas' offer window from the console, short of its packets",
		async run(page) {
			planned ||= plannedOf(await caseAs('priya'));
			await staff(page, '/clients/munchly/agents', "closes the kiranas' offer window now, short of its packets");
			const close = page.getByRole('button', { name: `Close now: Outreach, offer window closes, ${HERO}` });
			await expect(close).toBeEnabled();
			await close.click();
			const alert = page.getByRole('alertdialog', { name: /Close the offer window now/ });
			await expect(alert).toBeVisible();
			await running().done('Close the offer window now?');
			await alert.getByRole('button', { name: 'Close now' }).click();
			await expect(alert).toBeHidden();
			const c = await until('the scheme closes', 'priya', (c) => c.journey.offer?.status === 'closed', 60_000);
			story(
				'Scheme closed with',
				`${c.journey.orders.length} shops, ${c.journey.orders.reduce((t, o) => t + o.units, 0)} packets`,
				`${BUYERS.length} shops, ${ORDERED} packets`
			);
			running().figure('Packets left at the godown', left());
			await as(page, 'priya', `/execution/${HERO}`, 'reads Execution once the scheme has closed short');
			await running().done('Execution: the scheme closed short');
		}
	},
	// the pack drafted once every line is done, with its PDFs, and the van round to the shops that ordered
	mango('papers'),
	{
		id: 'report',
		title: "Neha fires expiry day's report from the console: the packs left at the godown settle by Munchly's policy",
		async run(page) {
			const before = (await caseAs('priya'))!;
			planned ||= plannedOf(before);
			running().figure('Phase before the report', before.journey.phase);
			running().figure('Actual net before expiry day', inr(before.actual?.net));
			await staff(page, '/clients/munchly/agents', "fires expiry day's report for the Mango Drink, with packs left");
			const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
			await expect(fire).toBeEnabled();
			await fire.click();
			const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
			await expect(alert).toBeVisible();
			await running().done('Report now: Expire it and report now?');
			await alert.getByRole('button', { name: 'Report now' }).click();
			await expect(alert).toBeHidden();
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			running().figure('Phase after the report', c.journey.phase);
			running().figure('Plan net', inr(c.plan?.net));
			running().figure('Actual net', inr(c.actual?.net));
			story('Left at the godown', c.realised?.godown, left());
			for (const l of c.realised?.lines ?? []) running().figure(`Realised ${l.id}`, `${l.units} packs`);
			story(
				'Expiry settlement',
				c.expiry ? `${c.expiry.units} packs, ${c.expiry.policy}, destroyed by ${c.expiry.destroyedBy}` : '(none)',
				`${left()} packs, full-credit, destroyed by client`
			);
			story('Expiry credit', c.expiry?.credit ?? undefined, r2(left() * DP));
			const paper = (id: string) => c.docs.find((d) => d.id === id);
			story(
				'Expiry paper',
				paper('expiry') ? `${paper('expiry')!.type}, ${paper('expiry')!.units} packs` : '(none)',
				`Expiry credit note, ${left()} packs`
			);
			story(
				'Destruction certificate',
				paper('destruction') ? `${paper('destruction')!.status}, ${paper('destruction')!.units} units` : '(none)',
				`generated, ${left()} units`
			);
			for (const d of c.docs)
				running().figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status}${d.pdf ? ', PDF' : ''})`);
			await running().done('Impact posted the ledger, with the packs left settled');
		}
	},
	mango('review'),
	{
		id: 'godown',
		title: 'Priya reads what was left at the godown and how it settled, then opens the paper',
		async run(page) {
			planned ||= plannedOf(await caseAs('priya'));
			await as(page, 'priya', `/execution/${HERO}`, 'reads what was left at the godown and how it settled');
			const leftCard = page.getByText('Left at the godown', { exact: true });
			await leftCard.scrollIntoViewIfNeeded();
			await expect(leftCard).toBeVisible();
			await running().done(`Execution: ${left()} packs left at the godown`);
			const settleCard = page.getByText('Expiry settlement', { exact: true });
			await settleCard.scrollIntoViewIfNeeded();
			await expect(settleCard).toBeVisible();
			const text = await mainText(page);
			running().figure('Settlement sentence', text.match(/The [\d,]+ packs come back[^.]*\./)?.[0] ?? '(none)');
			shows('Execution: left and settled', text, [
				`${num(left())} packs`,
				rupees(r2(left() * DP)),
				'Expiry settlement'
			]);
			await running().done('Execution: the Expiry settlement, full credit');
			await page.getByRole('button', { name: 'Open the paper' }).click();
			await expect(page).toHaveURL(new RegExp(`/paperwork/${HERO}`));
			await expect(page.locator('#main')).toContainText(/packs expired at the godown/i);
			await running().done('The Expiry credit note, from Execution');
		}
	},
	{
		id: 'pack',
		title: "Priya reads every paper in the pack on its page, and each paper's PDF",
		async run(page) {
			planned ||= plannedOf(await caseAs('priya'));
			const c = (await caseAs('priya'))!;
			const r = await row();
			const F = r.figures;
			const doc = (id: string) => c.docs.find((d) => d.id === id);
			const donated = c.realised?.lines.find((l) => l.id === 'foodbank')?.units ?? 0;
			await as(page, 'priya', `/paperwork/${HERO}`, 'reads each paper of the pack on its page');
			// the batch's head counts the packs destroyed (SC-135: it read 0 for every batch)
			shows('The batch head', await mainText(page), [`Cleared · ${num(left())} packs destroyed`]);
			const paper = page.locator('#main .paper').first();
			const open = async (label: RegExp) => {
				await page.getByRole('button', { name: label }).first().click();
				await page.waitForTimeout(600);
				return norm(await paper.innerText());
			};
			// the expiry credit note: the packs left, at the dealer price, to Lakshmi Agencies; Munchly's own costs
			const ex = doc('expiry');
			if (ex) {
				shows('Paper: expiry credit note', await open(/Expiry credit note/), [
					ex.no,
					`${num(left())} packs expired at the godown`,
					'Credit to Lakshmi Agencies',
					inr2(r2(left() * DP)),
					'Disposal',
					'EPR on the packaging',
					'Input GST reversed'
				]);
				await running().done(`Paper: the Expiry credit note ${ex.no}`);
			}
			// the destruction certificate: the packs Munchly destroys, with their input GST reversed
			const de = doc('destruction');
			shows('Paper: destruction certificate', await open(/Destruction certificate/), [
				'GENERATED',
				'Units destroyed',
				num(left()),
				'Input GST reversed',
				inr2(r2(left() * ITC_PER))
			]);
			same('Destruction certificate: units', de?.units ?? undefined, F.destroyed);
			same('Destruction certificate: GST reversed', de?.reversed ?? undefined, r2(F.destroyed * ITC_PER));
			const pdfButton = await page.getByRole('button', { name: /Download Destruction certificate as a PDF/ }).count();
			running().figure('Destruction certificate PDF', pdfButton ? 'Download PDF' : 'none: a record on the case');
			await running().done(`Paper: the destruction certificate, ${num(left())} units`);
			// the GST ITC memo: credit kept on the packs sold, reversed on the packs donated and destroyed
			const itc = doc('itc');
			shows('Paper: GST ITC memo', await open(/GST ITC memo/), [
				'ITC PART REVERSED',
				'Destroyed, gifted or lost',
				num(F.donated + F.destroyed),
				rupees(F.itcKept),
				rupees(F.itcReversed)
			]);
			same('ITC memo: kept', itc?.amount ?? undefined, F.itcKept);
			same('ITC memo: reversed', itc?.reversed ?? undefined, F.itcReversed);
			same('ITC reversed: donated and destroyed × ₹0.55', F.itcReversed, r2((F.donated + F.destroyed) * ITC_PER));
			await running().done('Paper: the GST ITC memo, part reversed');
			// the price-support credit note, the FSSAI checklist and the food bank's receipt
			const sp = doc('support');
			if (sp) {
				shows('Paper: price-support credit note', await open(/Price-support credit note/), [sp.no, 'NO GST ADJ.']);
				await running().done(`Paper: the price-support credit note ${sp.no}`);
			}
			shows('Paper: FSSAI checklist', await open(/FSSAI surplus-food checklist/), [
				'GENERATED',
				'Packs donated',
				num(donated),
				'Feeding India'
			]);
			await running().done('Paper: the FSSAI checklist');
			const rc = doc('receipt');
			if (rc) {
				shows('Paper: donation receipt', await open(/Donation receipt/), [rc.no, num(donated), 'Feeding India']);
				await running().done(`Paper: the donation receipt ${rc.no}`);
			}
			story('Donated packs', F.donated, donated);
			story('Meals from the donation', F.meals, donated);

			// every paper the Paperwork agent lays out, as its PDF: kept beside the report and read back
			for (const d of c.docs.filter(printed)) {
				const pdf = await pdfOf('priya', d.id, d.no);
				same(`PDF: ${d.type}`, pdf.status, '200 application/pdf %PDF');
				if (pdf.text === null) continue;
				const want: (string | string[])[] = [d.no].filter(Boolean);
				if (d.id === 'itc') want.push(rupees(F.itcKept));
				if (d.id === 'expiry') want.push(rupees(r2(left() * DP)), num(left()));
				if (d.id === 'receipt' || d.id === 'fssai') want.push(num(donated));
				if (d.id === 'support' && d.amount != null) want.push(rupees(d.amount));
				shows(`PDF text: ${d.type}`, pdf.text, want);
			}
			await running().done('The pack, every paper read');
		}
	},
	taxStep(),
	esgStep(),
	{
		id: 'kiranas',
		title: 'The kiranas read their offers: one that ordered, one that said Not this time, one that let it go',
		async run(page) {
			const main = page.locator('#main');
			// a shop that ordered: its Offers, its order on the offer's page, and its Orders with the margin
			const buyer = ORDERS[0];
			await as(page, buyer.k.member, '/home', 'reads its Offers once the scheme has closed');
			await running().done(`${buyer.k.name}: its Offers`);
			await as(page, buyer.k.member, `/offer/${HERO}`, "reads the Mango Drink's offer: its order and its margin");
			shows(`${buyer.k.name}: the offer`, await mainText(page), ['Ordered', `${buyer.units} packets`]);
			await running().done(`${buyer.k.name}: the offer, ordered`);
			await as(page, buyer.k.member, '/orders', 'reads its orders and the margin at MRP');
			shows(`${buyer.k.name}: orders`, await mainText(page), [`Mango Drink 200 ml · ${buyer.units} packets`]);
			await running().done(`${buyer.k.name}: Orders`);
			// a shop that said Not this time
			const decliner = DECLINERS[0] as Kirana | undefined;
			if (decliner) {
				await as(page, decliner.member, `/offer/${HERO}`, 'reads the offer it declined');
				shows(`${decliner.name}: the offer`, await mainText(page), ['Declined', 'You declined on']);
				await running().done(`${decliner.name}: the offer, declined`);
			}
			// a shop that let it go: the offer expired when the window closed
			const silent = SILENT[0] as Kirana | undefined;
			if (silent) {
				await as(page, silent.member, `/offer/${HERO}`, 'reads the offer it let go');
				const text = await mainText(page);
				shows(`${silent.name}: the offer`, text, ['Expired', 'hours ended on']);
				await running().done(`${silent.name}: the offer, expired`);
				if (/48 hours ended/.test(text))
					running().find(
						'note',
						`/offer/${HERO}`,
						`${silent.name}'s expired offer reads "Its 48 hours ended", though Neha closed the window early from the console`
					);
			}
			await expect(main).toBeVisible();
		}
	},
	{
		id: 'foodbank',
		title: "Meera reads Feeding India's pickups: the Mango Drink collected, its receipt and its PDF",
		async run(page) {
			const c = (await caseAs('meera'))!;
			const rc = c.docs.find((d) => d.id === 'receipt');
			await as(page, 'meera', '/pickups', "reads Feeding India's pickups and the meals made");
			const text = await mainText(page);
			shows('Her pickups', text, ['meals from', 'Collected', ...(rc ? [rc.no] : [])]);
			await running().done('Pickups: the Mango Drink collected, with its receipt');
			await as(page, 'meera', `/pickups/${HERO}`, "opens the Mango Drink's pickup: its tracker and its receipt");
			shows('Her pickup', await mainText(page), [
				'Collected from',
				'FSSAI surplus-food checklist',
				...(rc ? [rc.no] : [])
			]);
			await running().done("The pickup's page: its tracker, its receipt and the FSSAI checklist");
			await page.locator('.receipt-row').first().click();
			// the pickup in a journey's sheet says "Download the PDF", a pickup's page "Download PDF"
			await expect(page.getByRole('button', { name: /^Download (the )?PDF$/ })).toBeVisible();
			await running().done(`Her receipt ${rc?.no ?? ''}, with Download PDF`);
			await page.keyboard.press('Escape');
			if (rc) {
				const pdf = await pdfOf('meera', 'receipt', rc.no);
				same(`Her ${rc.no} PDF`, pdf.status, '200 application/pdf %PDF');
			}
		}
	},
	{
		id: 'distributor',
		title: 'Lakshmi Agencies reads her portal: the packs that expired at her godown, her credit notes and her copies',
		async run(page) {
			planned ||= plannedOf(await caseAs('priya'));
			const c = (await caseAs('priya'))!;
			const r = await row();
			const view = await api<WsPartner>('workspace', DIST, `${WS}/partner`);
			const facts = view.cases.find((x) => x.ref === HERO);
			if (!facts) throw new Error(`${HERO} is not in Lakshmi Agencies' partner view`);
			const doc = (id: string) => c.docs.find((d) => d.id === id && d.status !== 'not required');
			const support = doc('support');
			const expiry = doc('expiry');
			const receipt = doc('receipt');
			const main = page.locator('#main');

			await as(page, DIST, '/home', 'opens Today once the Mango Drink has cleared');
			await expect(main).toContainText('Your other stock and the batches you cleared are on');
			story(
				'Today: the Mango Drink',
				(await page.locator(`#batch-${HERO}`).count()) ? 'a card still asks for something' : 'nothing left for her',
				'nothing left for her'
			);
			await running().done('Today: nothing left for her on the Mango Drink');

			await as(page, DIST, `/batches/${HERO}`, "reads the Mango Drink's page: what happened, her money, her papers");
			await expect(main).toContainText('You sent the label photo');
			// the journey's own batch, once cleared, reads her partner facts: every moment (SC-135)
			const what = await mainText(page);
			shows('Her batch: what happened', what, [
				`${c.journey.orders.length} kiranas ordered ${num(ORDERED)} packets`,
				`${num(left())} packets were not ordered`,
				'Your staff sale sold',
				'Feeding India collected',
				`${num(left())} packs expired at your godown`,
				...(expiry ? [`on ${expiry.no}`] : [])
			]);
			if (/The scheme closed after 48 hours/.test(what))
				running().find(
					'note',
					`/batches/${HERO}`,
					'Her batch reads "The scheme closed after 48 hours", though Neha closed the window early from the console'
				);
			await running().done('Her batch: what happened, the packs that expired at her godown');
			await page.locator('.bh-tabs').getByRole('button', { name: 'Money' }).click();
			await expect(main).toContainText('You end whole');
			const money = await mainText(page);
			shows('Her batch: money', money, [
				'From',
				'Your staff sale',
				'Price-support credit note',
				`Expiry credit note for ${num(left())} packs`,
				rupees(r2(left() * DP)),
				'Your gain or loss ₹0'
			]);
			story(
				'Her gain or loss',
				/Your gain or loss ?₹0\b/.test(money) ? 0 : money.match(/Your gain or loss ?(\S+)/)?.[1],
				0
			);
			await running().done('Her batch: she ends whole, with the expiry credit');
			await page.locator('.bh-tabs').getByRole('button', { name: 'Papers' }).click();
			await expect(main).toContainText('Your papers');
			shows(
				'Her batch: papers and copies',
				await mainText(page),
				[support?.no, expiry?.no, 'Copies for your records', receipt?.no, 'Destruction certificate'].filter(
					(x): x is string => !!x
				)
			);
			if (expiry) {
				await page
					.getByRole('button', { name: /Expiry credit note/ })
					.first()
					.click();
				await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
				await running().done(`Her ${expiry.no}, with Download PDF`);
				await page.keyboard.press('Escape');
			}
			await page
				.getByRole('button', { name: /Destruction certificate/ })
				.first()
				.click();
			await page.waitForTimeout(600);
			const cert = norm(await page.getByRole('dialog').last().innerText());
			shows('Her copy of the destruction certificate', cert, ['Units destroyed', num(left())]);
			const certPdf = await page.getByRole('dialog').last().getByRole('button', { name: 'Download PDF' }).count();
			running().figure('Her destruction certificate PDF', certPdf ? 'Download PDF' : 'none: a record on the case');
			await running().done('Her copy of the destruction certificate');
			await page.keyboard.press('Escape');
			for (const d of [support, expiry, receipt].filter((x) => !!x)) {
				const pdf = await pdfOf(DIST, d!.id, d!.no);
				same(`Her ${d!.no} PDF`, pdf.status, '200 application/pdf %PDF');
			}
			same('Her expiry credit, as the ledger has it', facts.expiry?.credit ?? undefined, r.figures.credit);
			same('Her price support, to the rupee', Math.round(facts.support?.total ?? 0), r.figures.support);

			await as(page, DIST, '/orders', 'reads her orders, batch by batch');
			await expect(main).toContainText('sold from Munchly');
			shows('Her orders', await mainText(page), [
				`${c.journey.orders.length} kiranas · ${num(ORDERED)} packets`,
				...(c.journey.staff?.sold ? [`Your staff sale · ${num(c.journey.staff.sold)} packs`] : [])
			]);
			await running().done('Orders: the scheme short, the staff sale and the food bank');

			const day = vanDayOf();
			await as(page, DIST, `/van/${HERO}`, "reads the Mango Drink's deliveries");
			await expect(main).toContainText('van round');
			shows('Her deliveries', await mainText(page), [
				...(day ? [`${day} van round`] : []),
				'delivered',
				'Staff sale ·',
				'collected'
			]);
			await running().done('Deliveries: the round to the shops that ordered, the staff sale, the pickup');
		}
	},
	mango('close')
];

test.describe.configure({ mode: 'serial' });

test('Munchly Mango Leftover E2E: the Mango Drink batch, kiranas that do not buy, closed on expiry day', async ({
	page
}, info) => {
	run = new Run(page, info, {
		flow: 'Munchly Mango Leftover E2E',
		batch: 'MF-2410-118, Mango Drink 200 ml, Lakshmi Agencies, Hyderabad'
	});
	begin(run, HERO);
	mint(PEOPLE);
	const from = process.env.E2E_FROM ? STEPS.findIndex((s) => s.id === process.env.E2E_FROM) : 0;
	const to = process.env.E2E_UNTIL ? STEPS.findIndex((s) => s.id === process.env.E2E_UNTIL) : STEPS.length - 1;
	let error: string | undefined;
	try {
		for (const s of STEPS.slice(from, to + 1)) {
			run.stage = `${STEPS.indexOf(s) + 1}/${STEPS.length}`;
			await test.step(s.title, () => s.run(page));
		}
	} catch (e) {
		error = (e as Error).message;
		throw e;
	} finally {
		const md = run.write(error ? 'failed' : 'passed', error);
		await info.attach('report.md', { body: md, contentType: 'text/markdown' });
	}
});
