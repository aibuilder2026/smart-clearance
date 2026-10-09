import { expect } from '@playwright/test';
import type { WsLedgerTotals as LedgerTotals } from '@smart-clearance/api/workspace';
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
export const PEOPLE = ['neha', 'priya', 'rakesh', 'agrawal', 'anita', 'vikram', ...KIRANAS.map((k) => k.member)];

/** the van round's day, as the Van route and its push name it */
let vanDay = '';

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
			const pdfs = await until('Paperwork renders the PDFs', 'anita', (c) => c.docs.filter((d) => d.pdf).length >= 3);
			story(
				'Papers with their PDF',
				pdfs.docs
					.filter((d) => d.pdf)
					.map((d) => d.id)
					.join(', '),
				'invoice, support, itc'
			);
			// one day for the van round: the Van route's and the push's (SC-97)
			const leaves = c.moments.van.leavesAt ?? '';
			vanDay = leaves
				? new Date(leaves).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' })
				: '';
			story('Van round push', c.push.van?.title, `Van route for ${vanDay}`);
			await as(page, 'rakesh', `/orders/${HERO}`, 'issues his invoice from Tally');
			await page.getByRole('button', { name: 'Issue from Tally' }).click();
			await expect(page.getByText('issued from Tally', { exact: true })).toBeVisible();
			await running().done('Invoice issued from Tally');
			await sidebar(page, 'Van route').click();
			await expect(page.locator('#main')).toContainText(`${vanDay} round`);
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
		title: 'Anita reviews the pack: the tax invoice, the credit note and the GST ITC memo',
		async run(page) {
			await as(page, 'anita', `/paperwork/${HERO}`, 'reads each paper, then marks the pack reviewed');
			await expect(page.getByRole('button', { name: 'Mark reviewed' })).toBeVisible();
			const c = (await caseAs('anita'))!;
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
			// what Rakesh issued from Tally, as Finance reads it
			if (c.journey.invoiceIssued && c.docs.some((d) => d.id === 'invoice' && d.status === 'drafted'))
				running().find(
					'note',
					`/paperwork/${HERO}`,
					`the tax invoice still reads "drafted" in Finance's pack after Rakesh issued it from Tally (as in the prototype)`
				);
			await page.getByRole('button', { name: 'Mark reviewed' }).click();
			await expect(page.getByText('reviewed', { exact: true })).toBeVisible();
			await until('the review is recorded', 'anita', (c) => c.journey.reviewed, 30_000);
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
	{
		id: 'esg',
		title: "Vikram reads the batch's page in the ledger, and the year so far",
		async run(page) {
			// the batch's own page in the ledger, which Vikram opens on its impact (SC-121)
			await as(page, 'vikram', `/report/${HERO}`, "reads the batch's page in the ledger: its BRSR line and evidence");
			await expect(page.getByText('BRSR line')).toBeVisible();
			await expect(page.getByText(/^posted · /)).toBeVisible();
			await running().done('ESG: the batch posted to the ledger');
			await page.mouse.wheel(0, 900);
			await page.waitForTimeout(500);
			await running().done('ESG: the BRSR line and its evidence');
			// the ledger: the year so far in its Impact reading, Munchly's history and this batch
			await as(page, 'vikram', '/report', 'reads the ledger, the year so far');
			await expect(page.getByText('kept out of landfill')).toBeVisible();
			await running().done('ESG: the ledger, the year in its Impact reading');
			const l = await api<{ periods: { kind: string; current: boolean; totals: LedgerTotals }[] }>(
				'workspace',
				'vikram',
				`${WS}/ledger`
			);
			const y = l.periods.find((p) => p.kind === 'year' && p.current)!.totals;
			running().figure('The year: recovered', inr(y.net));
			running().figure('The year: input GST kept', inr(y.itcKept));
			running().figure('The year: kept out of landfill', `${y.kg} kg`);
			running().figure('The year: CO₂e avoided', `${y.co2} kg`);
			running().figure('The year: batches', y.batches);
		}
	},
	{
		id: 'close',
		title: 'Anita reads the finance report, and Priya sees the batch through',
		async run(page) {
			await as(page, 'anita', `/report/${HERO}`, 'reads the finance side of the report');
			await running().done('Finance & ESG report, as Anita');
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
