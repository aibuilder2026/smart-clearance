import { expect, test, type Page } from '@playwright/test';
import { api, mint } from './auth.ts';
import {
	AGENT_WAIT,
	as,
	begin,
	caseAs,
	inr,
	kiranasOf,
	sidebar,
	staff,
	story,
	until,
	WS,
	type Case,
	type Kirana
} from './flow.ts';
import { Run } from './record.ts';

// Munchly Mango E2E (SC-104): the Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad) taken on from
// wherever its journey stands to Impact's report, on the happy path, every person acting in the real UI in turn:
// Lakshmi Agencies (the distributor), Priya (Supply Chain), each ordering Hyderabad kirana, Meera of Feeding India (the
// food bank), Anita (Finance), Neha in the console and Vikram (ESG). The agents do the rest on live Gemini.
//
// It never resets the journey: each step reads the case first and is skipped when it is done, so the flow can be run
// on a journey at any stage, and again after a failure. Its plan has three lines and no ExpireSoon lot (22 days left is
// under ExpireSoon's 30): the kiranas' scheme, the staff sale at the godown, and the food-bank donation.
//
// E2E_FROM=<step id> and E2E_UNTIL=<step id> run part of it.

const HERO = 'MF-2410-118';
const DIST = 'lakshmi-owner';
const STEP = 12; // the offer screen orders in twelves (buy 10, get 2), from a shop's own share down to 12
const DAY0_PLAN = 16917.1; // the story's plan, made on day 0 (money.js, reference/money.json)

let run: Run;
let vanDay = '';

/** what a phase has passed */
const ORDER = ['watching', 'at-risk', 'verified', 'valued', 'planned', 'approved', 'executing', 'dispatched'];
const past = (c: Case | null, phase: string) =>
	!!c &&
	(c.journey.phase === 'settled' ||
		c.journey.phase === 'cleared' ||
		ORDER.indexOf(c.journey.phase) > ORDER.indexOf(phase));

/** a step already done is said once in the report and the recording, and skipped */
async function skip(what: string) {
	run.find('note', HERO, `skipped, already done: ${what}`);
}

/**
 * What each ordering kirana orders, filling the scheme's line exactly. Each orders its story share where the offer
 * screen can place it: a shop's default is its share (4 × its 14-day sales), and each "Fewer" takes 12 off, down to
 * 12. A story order the screen cannot place is ordered at the nearest it can above it, and as many twelves are taken
 * off the last shops that can spare them, so the line still fills to the packet.
 */
function orderPlan(kiranas: Kirana[], line: number) {
	const capOf = (k: Kirana) => 4 * k.sales14;
	const reach = (cap: number) => {
		const out = [cap];
		for (let v = cap - STEP; v >= STEP; v -= STEP) out.push(v);
		if (cap > STEP && !out.includes(STEP)) out.push(STEP);
		return out;
	};
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

const STEPS: { id: string; title: string; run: (page: Page) => Promise<void> }[] = [
	{
		id: 'context',
		title: 'Priya reads where the Mango Drink stands',
		async run(page) {
			const c = await caseAs('priya');
			if (!c) throw new Error(`${HERO} is in no journey: the Watcher has not flagged it, and this flow never resets`);
			run.figure('Phase at the start', c.journey.phase);
			run.figure('Label photo at the start', c.journey.photo.status);
			run.figure('Write-off', inr(c.writeOff?.total));
			await as(page, 'priya', `/command/${HERO}`, 'reads where the Mango Drink stands');
			await expect(page.locator('#main')).toContainText('Mango Drink 200 ml');
			await run.done(`Command Center: the Mango Drink at ${c.journey.phase}`);
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
			await as(page, DIST, `/photo/${HERO}`, 'uploads the label photo from the Begum Bazaar godown');
			await expect(page.getByRole('button', { name: 'Upload a photo' })).toBeVisible();
			await page
				.locator('input[type=file]:not([capture])')
				.setInputFiles(new URL('../../../../agents/evals/vision/images/mango.webp', import.meta.url).pathname);
			await run.done('The label photo chosen');
			await page.getByRole('button', { name: 'Send photo' }).click();
			await expect(page.getByText(/Dhanyavaad/)).toBeVisible({ timeout: AGENT_WAIT });
			await run.done('Vision read the label');
		}
	},
	{
		id: 'approve',
		title: 'The Valuer prices it, the Router plans it, Priya approves',
		async run(page) {
			const c = await until('the Valuer and the Router plan the Mango Drink', 'priya', (c) => past(c, 'valued'));
			// the plan is the batch's own, made on the day it is made: each journey day after day 0 puts another day's
			// sales (28 packs) at risk, which the Router sends to the food bank once the kiranas and the staff sale are full
			run.figure('Plan net', inr(c.plan?.net));
			for (const l of c.plan?.lines ?? []) run.figure(`Plan line ${l.id}`, `${l.units} packs`);
			if (c.plan && c.plan.net !== DAY0_PLAN)
				run.find(
					'note',
					HERO,
					`planned after day 0, so ${inr(c.plan.net)} where the story's day-0 plan nets ${inr(DAY0_PLAN)}: ${c.plan.lines.map((l) => `${l.id} ${l.units}`).join(', ')}`
				);
			if (past(c, 'planned')) return skip('the plan was approved');
			await as(page, 'priya', `/route/${HERO}`, "reviews the Mango Drink's plan and approves it");
			const review = page.getByRole('button', { name: 'Review and approve' });
			await expect(review).toBeVisible();
			await run.done('Route Room: the plan, waiting for a yes');
			await review.click();
			const sheet = page.getByRole('dialog', { name: 'Approve the plan' });
			await expect(sheet).toBeVisible();
			await run.done('The approve sheet: the scheme, the staff sale and the donation');
			await sheet.getByRole('button', { name: 'Approve · release the agents' }).click();
			const placed = page.getByRole('dialog', { name: 'Plan placed' });
			await expect(placed.getByRole('button', { name: 'Watch execution' })).toBeVisible();
			await run.done('Plan placed');
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
			await run.done('Execution: the scheme sent, the staff sale open, the donation booked');
		}
	},
	{
		id: 'orders',
		title: "Each of Lakshmi Agencies' ordering kiranas orders its share of the scheme",
		async run(page) {
			const before = (await caseAs('priya'))!;
			const line = before.plan!.lines.find((l) => l.id === 'kirana')!.units;
			const { plan, over } = orderPlan(kiranasOf('lakshmi'), line);
			if (over)
				run.find('warning', HERO, `the scheme cannot be filled to the packet from the offer screen: ${over} over`);
			for (const p of plan.filter((p) => p.units !== p.story))
				run.find(
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
					run.find('note', `/offer/${HERO}`, `${p.k.name} had already ordered`);
					continue;
				}
				for (let n = p.cap; n > p.units; n -= STEP) await page.getByRole('button', { name: 'Fewer Packets' }).click();
				await expect(page.getByRole('button', { name: new RegExp(`· ${p.units} packets`) })).toBeVisible();
				await page.getByRole('button', { name: new RegExp(`· ${p.units} packets`) }).click();
				await expect(page.getByText(/ऑर्डर हो गया/).first()).toBeVisible();
				await run.done(`${p.k.name} ordered ${p.units} packets`);
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
			await as(page, DIST, '/home', `records the staff sale: ${c.journey.staff?.units} packs at the godown`);
			const record = page.getByRole('button', { name: 'Record the sale' });
			await record.scrollIntoViewIfNeeded();
			await run.done('The staff sale card, every pack to start');
			await record.click();
			const r = await until('the staff sale is recorded', DIST, (c) => c.journey.staff?.status === 'recorded', 60_000);
			story('Staff sale', r.journey.staff?.sold ?? undefined, 150);
			await run.done('Staff sale recorded');
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
				await run.done('Pickup confirmed');
			}
			await page.getByRole('button', { name: 'Mark collected' }).click();
			const r = await until('the donation is collected', 'meera', (c) => c.donation?.status === 'collected', 60_000);
			// a food bank is not shown Munchly's plan, so the packs it was planned are read as Priya (SC-113)
			const plan = (await caseAs('priya'))?.plan;
			const gift = plan?.lines.find((l) => l.id === 'foodbank')?.units;
			story('Donation', `${r.donation?.units} packs ${r.donation?.status}`, `${gift} packs collected`);
			await run.done('Donation collected');
		}
	},
	{
		id: 'papers',
		title: 'Paperwork drafts the pack, with its PDFs; Lakshmi Agencies runs the van round',
		async run(page) {
			const c = await until('Paperwork drafts the papers', DIST, (c) => past(c, 'dispatched') && c.docs.length > 0);
			const pdfs = await until('Paperwork renders the PDFs', 'anita', (c) => c.docs.filter((d) => d.pdf).length >= 3);
			for (const d of pdfs.docs) run.figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status}${d.pdf ? ', PDF' : ''})`);
			story(
				'Papers with their PDF',
				pdfs.docs
					.filter((d) => d.pdf)
					.map((d) => d.id)
					.join(', '),
				'support, itc, fssai'
			);
			const leaves = c.moments.van.leavesAt ?? '';
			vanDay = leaves
				? new Date(leaves).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' })
				: '';
			story('Van round push', c.push.van?.title, `Van route for ${vanDay}`);
			if (c.journey.van.status === 'done') return skip('the van round ran');
			await as(page, DIST, `/van/${HERO}`, "runs the van round to Hyderabad's kiranas");
			await expect(page.locator('#main')).toContainText(`${vanDay} round`);
			const round = page.getByRole('button', { name: 'Start the round' });
			await expect(round).toBeEnabled();
			await run.done(`The ${vanDay} round, every shop's order on it`);
			await round.click();
			const ran = await until('the van round is done', 'priya', (c) => c.journey.van.status === 'done', 60_000);
			story(
				'Van round in the timeline',
				ran.feed.find((f) => f.key === 'van')?.text.split(':')[0],
				`Ran the ${vanDay} round`
			);
			await run.done('The van round run');
		}
	},
	{
		id: 'review',
		title: 'Anita reviews the pack: the credit note, the GST ITC memo and the FSSAI checklist',
		async run(page) {
			const c = (await caseAs('anita'))!;
			await as(page, 'anita', `/paperwork/${HERO}`, 'reads each paper, then marks the pack reviewed');
			for (const d of c.docs) {
				const card = page.getByRole('button', { name: new RegExp(d.type) }).first();
				if (!(await card.count())) {
					run.find('warning', `/paperwork/${HERO}`, `no card for the paper "${d.type}"`);
					continue;
				}
				await card.click();
				await page.waitForTimeout(600);
				await run.done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}`);
			}
			if (c.journey.reviewed) return skip('the pack was reviewed');
			await page.getByRole('button', { name: 'Mark reviewed' }).click();
			await expect(page.getByText('reviewed', { exact: true })).toBeVisible();
			await until('the review is recorded', 'anita', (c) => c.journey.reviewed, 30_000);
			await run.done('Pack reviewed');
		}
	},
	{
		id: 'report',
		title: "Neha fires expiry day's report from the console; Impact posts the ledger",
		async run(page) {
			const before = (await caseAs('priya'))!;
			if (!before.journey.posted) {
				run.figure('Phase before the report', before.journey.phase);
				await staff(page, '/clients/munchly/agents', "fires Impact's report for the Mango Drink now");
				const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
				await expect(fire).toBeEnabled();
				await fire.click();
				const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
				await expect(alert).toBeVisible();
				await run.done('Report now: Expire it and report now?');
				await alert.getByRole('button', { name: 'Report now' }).click();
				await expect(alert).toBeHidden();
			} else await skip('Impact posted the ledger');
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			// every line done as planned: the actual is the plan's own net
			story('Actual net', c.actual?.net, c.plan?.net ?? 0);
			story('Left at the godown', c.realised?.godown, 0);
			for (const l of c.realised?.lines ?? []) run.figure(`Realised ${l.id}`, `${l.units} packs`);
			run.figure('Phase after the report', c.journey.phase);
			for (const d of c.docs) run.figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status}${d.pdf ? ', PDF' : ''})`);
			await run.done('Impact posted the ledger');
		}
	},
	{
		id: 'esg',
		title: "Vikram reads the Mango Drink's ESG report and the quarter's BRSR",
		async run(page) {
			await as(page, 'vikram', `/report/${HERO}`, "reads the Mango Drink's ESG report and the quarter's BRSR");
			await page
				.getByRole('radio', { name: 'This batch' })
				.or(page.getByRole('button', { name: 'This batch' }))
				.first()
				.click();
			await expect(page.getByText('posted to the ledger')).toBeVisible();
			await run.done('ESG: the batch posted to the ledger');
			await page.mouse.wheel(0, 900);
			await page.waitForTimeout(500);
			await run.done('ESG: the BRSR line, the meals and the evidence');
			await page
				.getByRole('radio', { name: 'Quarter' })
				.or(page.getByRole('button', { name: 'Quarter' }))
				.first()
				.click();
			await expect(page.getByText('BRSR Core')).toBeVisible();
			await run.done('ESG: the quarter, BRSR Core');
			const q = await api<{ recovered: number; itc: number; kg: number; co2: number; meals: number; batches: number }>(
				'workspace',
				'vikram',
				`${WS}/quarter`
			);
			run.figure('Quarter: recovered', inr(q.recovered));
			run.figure('Quarter: GST credit protected', inr(q.itc));
			run.figure('Quarter: kept out of landfill', `${q.kg} kg`);
			run.figure('Quarter: meals', q.meals);
			run.figure('Quarter: batches', q.batches);
		}
	},
	{
		id: 'close',
		title: 'Anita finds the cleared batch on Batches and opens its papers; Priya sees it through',
		async run(page) {
			await as(page, 'anita', '/batches', 'finds the Mango Drink cleared and opens its papers');
			const row = page.locator('tbody tr', { hasText: HERO });
			await expect(row).toContainText('Cleared');
			await run.done('Batches: the Mango Drink cleared');
			await row.click();
			await expect(page).toHaveURL(new RegExp(`/paperwork/${HERO}`));
			await expect(page.getByText('reviewed', { exact: true })).toBeVisible();
			await run.done("The Mango Drink's papers, processed");
			await as(page, 'priya', `/execution/${HERO}`, 'sees the Mango Drink through on Execution');
			await run.done('Execution: every line done');
			await sidebar(page, 'Command Center').click();
			await page.waitForTimeout(800);
			await run.done('Command Center at the end');
		}
	}
];

test.describe.configure({ mode: 'serial' });

test('Munchly Mango E2E: the Mango Drink batch, from where it stands, every person in the real UI', async ({
	page
}, info) => {
	run = new Run(page, info, {
		flow: 'Munchly Mango E2E',
		batch: 'MF-2410-118, Mango Drink 200 ml, Lakshmi Agencies, Hyderabad'
	});
	begin(run, HERO);
	mint(['neha', 'priya', DIST, 'meera', 'anita', 'vikram', ...kiranasOf('lakshmi').map((k) => k.member)]);
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
