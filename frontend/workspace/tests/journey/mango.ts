import { expect } from '@playwright/test';
import type { WsLedgerTotals as LedgerTotals, WsPartner } from '@smart-clearance/api/workspace';
import { api } from './auth.ts';
import {
	AGENT_WAIT,
	as,
	caseAs,
	inr,
	kiranasOf,
	running,
	same,
	shows,
	sidebar,
	staff,
	story,
	until,
	WS,
	type Case,
	type Kirana,
	type Step
} from './flow.ts';

// The Mango Drink batch's journey, as Munchly Mango E2E takes it (SC-104): its steps, shared with Munchly Mango
// Leftover E2E (SC-135), which takes the same batch from a reset with kiranas that do not order.
//
// Munchly Mango E2E: the Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad) taken on from
// wherever its journey stands to Impact's report, on the happy path, every person acting in the real UI in turn:
// Lakshmi Agencies (the distributor), Priya (Supply Chain), each ordering Hyderabad kirana, Meera of Feeding India (the
// food bank), Neha in the console, and Priya again for the papers and the ledger (SC-127). The agents do the rest on live Gemini.
//
// It never resets the journey: each step reads the case first and is skipped when it is done, so the flow can be run
// on a journey at any stage, and again after a failure. Its plan has three lines and no ExpireSoon lot (22 days left is
// under ExpireSoon's 30): the kiranas' scheme, the staff sale at the godown, and the food-bank donation.

export const HERO = 'MF-2410-118';
export const DIST = 'lakshmi-owner';
export const KIRANAS = kiranasOf('lakshmi');
/** the people a Mango flow signs in */
export const PEOPLE = ['neha', 'priya', DIST, 'meera', ...KIRANAS.map((k) => k.member)];
export const STEP = 12; // the offer screen orders in twelves (buy 10, get 2), from a shop's own share down to 12
const DAY0_PLAN = 16917.1; // the story's plan, made on day 0 (money.js, reference/money.json)
/** the papers the Paperwork agent lays out as PDFs (agents/src/sc_agents/tools/pdf.py): the e-way bill check and the
 *  destruction certificate are records on the case, with no PDF */
export const PRINTED = ['invoice', 'support', 'itc', 'fssai', 'receipt', 'expiry'];
export const printed = (d: { id: string; status: string }) => d.status !== 'not required' && PRINTED.includes(d.id);

/** the van round's day, as Deliveries and its push name it */
let vanDay = '';
export const vanDayOf = () => vanDay;

/** what a phase has passed */
export const ORDER = ['watching', 'at-risk', 'verified', 'valued', 'planned', 'approved', 'executing', 'dispatched'];
export const past = (c: Case | null, phase: string) =>
	!!c &&
	(c.journey.phase === 'settled' ||
		c.journey.phase === 'cleared' ||
		ORDER.indexOf(c.journey.phase) > ORDER.indexOf(phase));

/** a step already done is said once in the report and the recording, and skipped */
export async function skip(what: string) {
	running().find('note', HERO, `skipped, already done: ${what}`);
}

/** a shop's share, the most the offer screen offers it: 4 × its 14-day sales */
const capOf = (k: Kirana) => 4 * k.sales14;
/** what the offer screen can order for a shop: its share, and each "Fewer" 12 off it, down to 12 */
const reach = (cap: number) => {
	const out = [cap];
	for (let v = cap - STEP; v >= STEP; v -= STEP) out.push(v);
	if (cap > STEP && !out.includes(STEP)) out.push(STEP);
	return out;
};
/** what a shop orders of its own: its story order where the offer screen can place it, else the nearest above it */
export function shareOf(k: Kirana) {
	const r = reach(capOf(k));
	const above = r.filter((v) => v >= k.orders).sort((a, b) => a - b);
	return { cap: capOf(k), units: r.includes(k.orders) ? k.orders : (above[0] ?? capOf(k)) };
}

/**
 * What each ordering kirana orders, filling the scheme's line exactly. Each orders its story share where the offer
 * screen can place it: a shop's default is its share (4 × its 14-day sales), and each "Fewer" takes 12 off, down to
 * 12. A story order the screen cannot place is ordered at the nearest it can above it, and as many twelves are taken
 * off the last shops that can spare them, so the line still fills to the packet.
 */
export function orderPlan(kiranas: Kirana[], line: number) {
	const plan = kiranas.map((k) => {
		const r = reach(capOf(k));
		const above = r.filter((v) => v >= k.orders).sort((a, b) => a - b);
		const units = r.includes(k.orders) ? k.orders : above[0];
		return { k, cap: capOf(k), units, story: k.orders, above };
	});
	let over = plan.reduce((t, p) => t + p.units, 0) - line;
	// an overshoot other shops can give back only in twelves: a shop that cannot order its story share takes the
	// nearest placeable order above it that leaves the overshoot a whole number of twelves
	for (const p of plan.filter((p) => p.units !== p.story)) {
		const fits = p.above.find((v) => (over - p.units + v) % STEP === 0);
		if (fits !== undefined && over % STEP !== 0) {
			over += fits - p.units;
			p.units = fits;
		}
	}
	for (let i = plan.length - 1; i >= 0 && over > 0; i--) {
		const p = plan[i];
		while (over >= STEP && p.units - STEP >= STEP && p.units === p.story) {
			p.units -= STEP;
			over -= STEP;
		}
	}
	return { plan, over };
}

/** the journey's steps, in order: each reads the case first and is skipped when it is done */
export const MANGO: Step[] = [
	{
		id: 'context',
		title: 'Priya reads where the Mango Drink stands',
		async run(page) {
			const c = await caseAs('priya');
			if (!c) throw new Error(`${HERO} is in no journey: the Watcher has not flagged it, and this flow never resets`);
			running().figure('Phase at the start', c.journey.phase);
			running().figure('Label photo at the start', c.journey.photo.status);
			running().figure('Write-off', inr(c.writeOff?.total));
			await as(page, 'priya', `/command/${HERO}`, 'reads where the Mango Drink stands');
			await expect(page.locator('#main')).toContainText('Mango Drink 200 ml');
			await running().done(`Command Center: the Mango Drink at ${c.journey.phase}`);
		}
	},
	{
		id: 'photo',
		title: "Lakshmi Agencies sends the Mango Drink's label photo",
		async run(page) {
			const c = await caseAs(DIST);
			if (c && ['reading', 'verified'].includes(c.journey.photo.status)) return skip('the label photo was sent');
			await until(
				'Vision asks Lakshmi Agencies for the label photo',
				DIST,
				(c) => c.journey.photo.status === 'requested'
			);
			// her Today asks for it on the batch's card, and its button opens the camera on the batch (SC-133)
			await as(page, DIST, '/home', 'uploads the label photo from the Begum Bazaar godown');
			const card = page.locator(`#batch-${HERO}`);
			await expect(card).toContainText('Send one photo of the carton label');
			await running().done("Today: the Mango Drink's card asks for the label photo");
			await card.getByRole('button', { name: 'Open camera', exact: true }).click();
			await expect(page).toHaveURL(new RegExp(`/photo/${HERO}`));
			await expect(page.getByRole('button', { name: 'Upload a photo' })).toBeVisible();
			await page
				.locator('input[type=file]:not([capture])')
				.setInputFiles(new URL('../../../../agents/evals/vision/images/mango.webp', import.meta.url).pathname);
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
			const c = await until('the Valuer and the Router plan the Mango Drink', 'priya', (c) => past(c, 'valued'));
			// the plan is the batch's own, made on the day it is made: each journey day after day 0 puts another day's
			// sales (28 packs) at risk, which the Router sends to the food bank once the kiranas and the staff sale are full
			running().figure('Plan net', inr(c.plan?.net));
			for (const l of c.plan?.lines ?? []) running().figure(`Plan line ${l.id}`, `${l.units} packs`);
			if (c.plan && c.plan.net !== DAY0_PLAN)
				running().find(
					'note',
					HERO,
					`planned after day 0, so ${inr(c.plan.net)} where the story's day-0 plan nets ${inr(DAY0_PLAN)}: ${c.plan.lines.map((l) => `${l.id} ${l.units}`).join(', ')}`
				);
			if (past(c, 'planned')) return skip('the plan was approved');
			await as(page, 'priya', `/route/${HERO}`, "reviews the Mango Drink's plan and approves it");
			const review = page.getByRole('button', { name: 'Review and approve' });
			await expect(review).toBeVisible();
			await running().done('Route Room: the plan, waiting for a yes');
			await review.click();
			const sheet = page.getByRole('dialog', { name: 'Approve the plan' });
			await expect(sheet).toBeVisible();
			await running().done('The approve sheet: the scheme, the staff sale and the donation');
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
		title: 'Outreach sends the Hyderabad kiranas their scheme and Donation books a food bank',
		async run(page) {
			const c = await until('Outreach sends the scheme and Donation books the food bank', 'priya', (c) =>
				Boolean(c.journey.offer && c.donation)
			);
			story('Kiranas offered the scheme', c.journey.offer?.shops, 58);
			const gift = c.plan!.lines.find((l) => l.id === 'foodbank')?.units;
			story(
				'Donation booked',
				`${c.donation?.units} packs to ${c.donation?.partner}`,
				`${gift} packs to Feeding India`
			);
			await as(page, 'priya', `/execution/${HERO}`, 'watches the agents carry out the plan');
			await running().done('Execution: the scheme sent, the staff sale open, the donation booked');
		}
	},
	{
		id: 'orders',
		title: "Each of Lakshmi Agencies' ordering kiranas orders its share of the scheme",
		async run(page) {
			const before = (await caseAs('priya'))!;
			const line = before.plan!.lines.find((l) => l.id === 'kirana')!.units;
			const { plan, over } = orderPlan(KIRANAS, line);
			if (over)
				running().find(
					'warning',
					HERO,
					`the scheme cannot be filled to the packet from the offer screen: ${over} over`
				);
			for (const p of plan.filter((p) => p.units !== p.story))
				running().find(
					'warning',
					`/offer/${HERO}`,
					p.units > p.story
						? `${p.k.name}'s story order of ${p.story} packets cannot be placed: the offer screen orders in twelves from its share of ${p.cap}, so it ordered ${p.units}`
						: `${p.k.name} ordered ${p.units} of its ${p.story}, so the scheme fills to ${line} exactly`
				);
			if (before.journey.offer?.status === 'closed') return skip('the scheme closed');
			for (const [i, p] of plan.entries()) {
				await as(page, p.k.member, `/offer/${HERO}`, `orders ${p.units} packets (${i + 1} of ${plan.length})`);
				const done = page.getByText(/ऑर्डर हो गया|Ordered/).first();
				const order = page.getByRole('button', { name: /· \d+ packets/ });
				await expect(order.or(done)).toBeVisible();
				if (!(await order.isVisible())) {
					running().find('note', `/offer/${HERO}`, `${p.k.name} had already ordered`);
					continue;
				}
				for (let n = p.cap; n > p.units; n -= STEP) await page.getByRole('button', { name: 'Fewer Packets' }).click();
				await expect(page.getByRole('button', { name: new RegExp(`· ${p.units} packets`) })).toBeVisible();
				await page.getByRole('button', { name: new RegExp(`· ${p.units} packets`) }).click();
				await expect(page.getByText(/ऑर्डर हो गया/).first()).toBeVisible();
				await running().done(`${p.k.name} ordered ${p.units} packets`);
			}
			const c = await until(
				'the scheme fills and closes',
				'priya',
				(c) => c.journey.offer?.status === 'closed',
				60_000
			);
			const units = c.journey.orders.reduce((t, o) => t + o.units, 0);
			story(
				'Kirana orders',
				`${c.journey.orders.length} shops, ${units} packets`,
				`${plan.length} shops, ${line} packets`
			);
		}
	},
	{
		id: 'staff',
		title: 'Lakshmi Agencies records the staff sale at its godown',
		async run(page) {
			const c = await until('the staff sale is open', DIST, (c) => Boolean(c.journey.staff));
			if (c.journey.staff?.status === 'recorded') return skip('the staff sale was recorded');
			// her Today asks for it, and its button opens the batch's Deliveries, where the staff sale is (SC-133)
			await as(page, DIST, '/home', `records the staff sale: ${c.journey.staff?.units} packs at the godown`);
			const card = page.locator(`#batch-${HERO}`);
			await expect(card).toContainText('Record the staff sale');
			await running().done('Today: the staff sale asked for on the batch');
			await card.getByRole('button', { name: 'Record what sold', exact: true }).click();
			await expect(page).toHaveURL(new RegExp(`/van/${HERO}`));
			const record = page.getByRole('button', { name: 'Record the sale' });
			await record.scrollIntoViewIfNeeded();
			await running().done('The staff sale card, every pack to start');
			await record.click();
			const r = await until('the staff sale is recorded', DIST, (c) => c.journey.staff?.status === 'recorded', 60_000);
			story('Staff sale', r.journey.staff?.sold ?? undefined, 150);
			await running().done('Staff sale recorded');
		}
	},
	{
		id: 'donation',
		title: 'Meera of Feeding India confirms the pickup and collects the donation',
		async run(page) {
			const c = await until('the donation is booked', 'meera', (c) => Boolean(c.donation));
			if (['collected', 'declined'].includes(c.donation!.status)) return skip(`the donation was ${c.donation!.status}`);
			await as(page, 'meera', '/pickups', 'confirms the pickup at the Begum Bazaar godown');
			if (c.donation!.status === 'booked') {
				await page.getByRole('button', { name: /^Confirm / }).click();
				await until('the pickup is confirmed', 'meera', (c) => c.donation?.status === 'confirmed', 60_000);
				await running().done('Pickup confirmed');
			}
			await page.getByRole('button', { name: 'Mark collected' }).click();
			const r = await until('the donation is collected', 'meera', (c) => c.donation?.status === 'collected', 60_000);
			// a food bank is not shown Munchly's plan, so the packs it was planned are read as Priya (SC-113)
			const plan = (await caseAs('priya'))?.plan;
			const gift = plan?.lines.find((l) => l.id === 'foodbank')?.units;
			story('Donation', `${r.donation?.units} packs ${r.donation?.status}`, `${gift} packs collected`);
			await running().done('Donation collected');
		}
	},
	{
		id: 'papers',
		title: 'Paperwork drafts the pack, with its PDFs; Lakshmi Agencies runs the van round',
		async run(page) {
			const c = await until('Paperwork drafts the papers', DIST, (c) => past(c, 'dispatched') && c.docs.length > 0);
			// every paper the pack needs carries its PDF; the donation receipt's is asked for at the collection, so it lands
			// before the others' (SC-115)
			const pdfs = await until(
				'Paperwork renders the PDFs',
				'priya',
				(c) => c.docs.length > 0 && c.docs.filter((d) => printed(d)).every((d) => d.pdf)
			);
			for (const d of pdfs.docs)
				running().figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status}${d.pdf ? ', PDF' : ''})`);
			story(
				'Papers with their PDF',
				pdfs.docs
					.filter((d) => d.pdf)
					.map((d) => d.id)
					.join(', '),
				'support, itc, fssai, receipt'
			);
			const leaves = c.moments.van.leavesAt ?? '';
			vanDay = leaves
				? new Date(leaves).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' })
				: '';
			story('Van round push', c.push.van?.title, `Van route for ${vanDay}`);
			if (c.journey.van.status === 'done') return skip('the van round ran');
			await as(page, DIST, '/home', "runs the van round to Hyderabad's kiranas");
			const card = page.locator(`#batch-${HERO}`);
			await expect(card).toContainText(`Run the ${vanDay} van round`);
			await running().done('Today: the van round asked for on the batch');
			await card.getByRole('button', { name: 'Start the round', exact: true }).click();
			await expect(page).toHaveURL(new RegExp(`/van/${HERO}`));
			await expect(page.locator('#main')).toContainText(`${vanDay} van round`);
			const round = page.getByRole('button', { name: 'Start the round' });
			await expect(round).toBeEnabled();
			await running().done(`The ${vanDay} round, every shop's order on it`);
			await round.click();
			const ran = await until('the van round is done', 'priya', (c) => c.journey.van.status === 'done', 60_000);
			story(
				'Van round in the timeline',
				ran.feed.find((f) => f.key === 'van')?.text.split(':')[0],
				`Ran the ${vanDay} round`
			);
			await running().done('The van round run');
		}
	},
	{
		id: 'review',
		title: 'Priya reviews the pack: the credit note, the GST ITC memo and the FSSAI checklist',
		async run(page) {
			const c = (await caseAs('priya'))!;
			await as(page, 'priya', `/paperwork/${HERO}`, 'reads each paper, then marks the pack reviewed');
			for (const d of c.docs) {
				const card = page.getByRole('button', { name: new RegExp(d.type) }).first();
				if (!(await card.count())) {
					running().find('warning', `/paperwork/${HERO}`, `no card for the paper "${d.type}"`);
					continue;
				}
				await card.click();
				await page.waitForTimeout(600);
				await running().done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}`);
			}
			if (c.journey.reviewed) return skip('the pack was reviewed');
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
			if (!before.journey.posted) {
				running().figure('Phase before the report', before.journey.phase);
				await staff(page, '/clients/munchly/agents', "fires Impact's report for the Mango Drink now");
				const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
				await expect(fire).toBeEnabled();
				await fire.click();
				const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
				await expect(alert).toBeVisible();
				await running().done('Report now: Expire it and report now?');
				await alert.getByRole('button', { name: 'Report now' }).click();
				await expect(alert).toBeHidden();
			} else await skip('Impact posted the ledger');
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			// every line done as planned: the actual is the plan's own net
			story('Actual net', c.actual?.net, c.plan?.net ?? 0);
			story('Left at the godown', c.realised?.godown, 0);
			for (const l of c.realised?.lines ?? []) running().figure(`Realised ${l.id}`, `${l.units} packs`);
			running().figure('Phase after the report', c.journey.phase);
			for (const d of c.docs)
				running().figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status}${d.pdf ? ', PDF' : ''})`);
			await running().done('Impact posted the ledger');
		}
	},
	{
		id: 'esg',
		title: "Priya reads the Mango Drink's page in the ledger, and the year so far",
		async run(page) {
			// the batch's own page in the ledger (SC-121), on its impact
			await as(page, 'priya', `/report/${HERO}`, "reads the Mango Drink's page in the ledger: its BRSR line");
			// a batch's page opens on Money for her (SC-127): its BRSR line is on Impact; read within the page, since the
			// recording's caption names the BRSR line too
			await page.locator('.bh-tabs').getByRole('button', { name: 'Impact' }).click();
			const main = page.locator('#main');
			await expect(main.getByText('BRSR line', { exact: true })).toBeVisible();
			await expect(main.getByText(/^posted · /)).toBeVisible();
			await running().done('ESG: the batch posted to the ledger');
			await page.mouse.wheel(0, 900);
			await page.waitForTimeout(500);
			await running().done('ESG: the BRSR line, the meals and the evidence');
			await as(page, 'priya', '/report', 'reads the ledger, the year so far');
			// the ledger opens on its Money reading for her (SC-127): the kilos are in its Impact reading
			await page.getByRole('group', { name: 'Reading' }).getByRole('button', { name: 'Impact', exact: true }).click();
			await expect(page.locator('#main').getByText('kept out of landfill').first()).toBeVisible();
			await running().done('ESG: the ledger, the year in its Impact reading');
			const l = await api<{ periods: { kind: string; current: boolean; totals: LedgerTotals }[] }>(
				'workspace',
				'priya',
				`${WS}/ledger`
			);
			const y = l.periods.find((p) => p.kind === 'year' && p.current)!.totals;
			running().figure('The year: recovered', inr(y.net));
			running().figure('The year: input GST kept', inr(y.itcKept));
			running().figure('The year: kept out of landfill', `${y.kg} kg`);
			running().figure('The year: meals', y.meals);
			running().figure('The year: batches', y.batches);
		}
	},
	{
		id: 'distributor',
		title: "Lakshmi Agencies reads her portal: Today, the batch's page and papers, Orders, Deliveries and her photos",
		async run(page) {
			// Munchly's view of the batch (its plan, its papers), and hers: her partner facts
			const c = (await caseAs('priya'))!;
			const view = await api<WsPartner>('workspace', DIST, `${WS}/partner`);
			const facts = view.cases.find((x) => x.ref === HERO);
			if (!facts) throw new Error(`${HERO} is not in Lakshmi Agencies' partner view`);
			const main = page.locator('#main');
			const text = async () => (await main.innerText()).replace(/\s+/g, ' ').trim();
			const num = (n: number) => n.toLocaleString('en-IN');
			const date = (iso: string) =>
				new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-IN', {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
					timeZone: 'UTC'
				});
			const paper = (id: string) => c.docs.find((d) => d.id === id && d.status !== 'not required');
			const support = paper('support');
			const receipt = paper('receipt');
			const shops = c.journey.orders.length;
			const packets = c.journey.orders.reduce((t, o) => t + o.units, 0);
			const gift = c.plan?.lines.find((l) => l.id === 'foodbank')?.units ?? 0;
			const sold = c.journey.staff?.sold ?? 0;
			const leaves = c.moments.van.leavesAt ?? '';
			const day =
				vanDay ||
				(leaves ? new Date(leaves).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' }) : '');

			// Today: the batch cleared, nothing left for her on it
			await as(page, DIST, '/home', 'opens Today once the Mango Drink has cleared');
			await expect(main).toContainText('Your other stock and the batches you cleared are on');
			const card = await page.locator(`#batch-${HERO}`).count();
			story(
				'Today: the Mango Drink',
				card ? 'a card still asks for something' : 'nothing left for her',
				'nothing left for her'
			);
			await running().done('Today: nothing left for her on the Mango Drink');

			// the batch's page: what happened, how she ended whole, her papers and her copies
			await as(page, DIST, `/batches/${HERO}`, "reads the Mango Drink's page: what happened, her money, her papers");
			await expect(main).toContainText('You sent the label photo');
			shows('Her batch: what happened', await text(), [
				`The Watcher flagged ${num(c.batch.assess?.atRisk ?? 0)} packs at risk`,
				'You sent the label photo',
				`The scheme went to ${c.journey.offer?.shops} of your kiranas`,
				`${shops} kiranas ordered ${num(packets)} packets`,
				'The Paperwork agent drafted your papers',
				`Your ${day} van round delivered the scheme`,
				'Settled: you ended whole'
			]);
			await running().done('Her batch: what happened');
			await page.locator('.bh-tabs').getByRole('button', { name: 'Money' }).click();
			await expect(main).toContainText('You end whole');
			const money = await text();
			// a cleared batch reads her partner facts, as every batch she cleared before does (SC-135)
			shows('Her batch: money', money, [
				`From ${shops} kiranas`,
				'Your staff sale',
				'Price-support credit note',
				'Your gain or loss ₹0'
			]);
			story(
				'Her gain or loss',
				/Your gain or loss ?₹0\b/.test(money) ? 0 : money.match(/Your gain or loss ?(\S+)/)?.[1],
				0
			);
			await running().done('Her batch: she ends whole');
			await page.locator('.bh-tabs').getByRole('button', { name: 'Papers' }).click();
			await expect(main).toContainText('Your papers');
			shows(
				'Her batch: papers and copies',
				await text(),
				[support?.no, ...(receipt ? ['Copies for your records', receipt.no] : [])].filter((x): x is string => !!x)
			);
			if (receipt) {
				await page
					.getByRole('button', { name: new RegExp(receipt.type) })
					.first()
					.click();
				await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
				await running().done(`Her copy of the food bank's receipt ${receipt.no}, with Download PDF`);
				await page.keyboard.press('Escape');
			}
			// her papers' PDFs, from the links her Download PDF opens: the credit note, and her copy of the receipt
			for (const d of [support, receipt].filter((x) => !!x)) {
				const { url } = await api<{ url: string }>('workspace', DIST, `${WS}/documents/${HERO}/${d!.id}`);
				const pdf = await fetch(url);
				const head = new TextDecoder().decode(new Uint8Array(await pdf.arrayBuffer()).slice(0, 4));
				same(
					`Her ${d!.no} PDF`,
					`${pdf.status} ${pdf.headers.get('content-type')} ${head}`,
					'200 application/pdf %PDF'
				);
			}
			// her credit, as the ledger posted it: the price support, to the rupee as her credit note has it
			const posted = await api<{ batches: { ref: string; figures: { support: number } }[] }>(
				'workspace',
				'priya',
				`${WS}/ledger`
			);
			same(
				'Her credit: the price support, to the rupee',
				Math.round(facts.support?.total ?? 0),
				posted.batches.find((b) => b.ref === HERO)?.figures.support
			);

			// Orders: the kiranas' scheme, her staff sale, the food bank's packs
			await as(page, DIST, '/orders', 'reads her orders, batch by batch');
			await expect(main).toContainText('sold from Munchly');
			shows('Her orders', await text(), [
				`${shops} kiranas · ${num(packets)} packets`,
				...(sold ? [`Your staff sale · ${num(sold)} packs`] : []),
				...(gift ? [`${num(gift)} packs given`] : [])
			]);
			await running().done('Orders: the scheme, the staff sale and the food bank, under the batch');

			// Deliveries: the round delivered, the staff sale recorded, the food bank's pickup collected
			await as(page, DIST, `/van/${HERO}`, "reads the Mango Drink's deliveries, then the earlier ones");
			await expect(main).toContainText('van round');
			shows('Her deliveries', await text(), [
				`${day} van round`,
				'delivered',
				'Staff sale ·',
				`${num(sold)} of ${num(c.journey.staff?.units ?? 0)} sold to staff`,
				'collects',
				'collected'
			]);
			await running().done('Deliveries: the round delivered, the staff sale recorded, the pickup collected');

			// the label photos she sent, and what Vision read
			await as(page, DIST, '/photo', 'reads her label photos and what Vision read from each');
			await expect(main).toContainText('Earlier label photos');
			shows('Her label photos', await text(), [
				'No label photo asked for now',
				`Vision read batch ${HERO}${facts.batch.mfg ? `, made ${date(facts.batch.mfg)}` : ''}, best before ${date(facts.batch.bestBefore)}`
			]);
			await running().done('Label photo: every photo she sent');
		}
	},
	{
		id: 'close',
		title: 'Priya finds the cleared batch on Batches, opens its papers, and sees it through',
		async run(page) {
			await as(page, 'priya', '/batches', 'finds the Mango Drink cleared and opens its papers');
			const row = page.locator('tbody tr', { hasText: HERO });
			await expect(row).toContainText('Cleared');
			await running().done('Batches: the Mango Drink cleared');
			// its page opens on its Journey, its papers a tab away (SC-112)
			await row.click();
			await expect(page).toHaveURL(new RegExp(`/journey/${HERO}`));
			await page
				.locator('.bh-tabs')
				.getByRole('button', { name: /Paperwork|Papers/ })
				.click();
			await expect(page).toHaveURL(new RegExp(`/paperwork/${HERO}`));
			await expect(page.getByText('reviewed', { exact: true })).toBeVisible();
			await running().done("The Mango Drink's papers, processed");
			await as(page, 'priya', `/execution/${HERO}`, 'sees the Mango Drink through on Execution');
			await running().done('Execution: every line done');
			await sidebar(page, 'Command Center').click();
			await page.waitForTimeout(800);
			await running().done('Command Center at the end');
		}
	}
];

/** one of the Mango's steps, by its id */
export const mango = (id: string): Step => {
	const s = MANGO.find((s) => s.id === id);
	if (!s) throw new Error(`no Mango step "${id}"`);
	return s;
};
