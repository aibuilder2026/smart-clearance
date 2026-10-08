import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { api, mint, openAs, person } from './auth.ts';
import { Run } from './record.ts';

// Munchly Chips E2E (SC-95): the Masala Chips 150 g batch (MF-2409-117, Rakesh Traders, Nagpur) from a fresh journey to
// Impact's report, on the happy path, every person acting in the real UI in turn: Neha in the console, Priya (Supply
// Chain), Rakesh (the distributor), each of his kiranas, Agrawal Wholesale on ExpireSoon, Anita (Finance) and Vikram
// (ESG). The agents do the rest on live Gemini, through the local pull worker. The steps follow backend-api's walk
// (src/sc_api/cli/walk.py), which takes the same journey over HTTP. The Mango Drink is flagged too and is left where
// the agents take it: this flow is the chips'.
//
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts; a 48-hour offer is open 2 hours of real time.
// E2E_FROM=<step id> resumes on the journey as it stands; E2E_UNTIL=<step id> stops after that step.

const HERO = 'MF-2409-117';
const WS = '/v1/workspaces/munchly';
const DAY_MINUTES = Number(process.env.E2E_DAY_MINUTES ?? 60);
const PRESETS: Record<number, RegExp> = { 1440: /Real time/, 60: /Rehearsal/, 5: /Demo/, 1: /Fast/ };
const AGENT_WAIT = 6 * 60_000; // what the agents take on live Gemini, with room for a retry or two

// the people, and the story's kiranas for Rakesh's cluster (their own orders fill the scheme to the packet)
type Kirana = { id: string; name: string; member: string; orders: number; distributor: string };
type Member = { id: string; name: string; role: string };
type Case = {
	journey: {
		phase: string;
		photo: { status: string };
		listing: { id: string; status: string; units: number; price: number } | null;
		offer: { status: string; shops: number } | null;
		orders: { units: number }[];
		bids: { id: string; status: string; price: number; counter?: number }[];
		award: { units: number; price: number; token: number } | null;
		truck: { status: string };
		van: { status: string };
		invoiceIssued: boolean;
		reviewed: boolean;
		posted: boolean;
	};
	plan: { net: number; lines: { id: string; units: number }[] } | null;
	actual: { net: number } | null;
	docs: { id: string; type: string; no: string; status: string }[];
	kiranas: { id: string; name: string }[];
	realised: { lines: { id: string; units: number }[]; godown: number } | null;
};

const STORY = JSON.parse(
	readFileSync(new URL('../../../../backend-api/src/sc_api/reference/journey.json', import.meta.url), 'utf8')
) as { kiranas: Kirana[]; members: Member[] };
const KIRANAS = STORY.kiranas.filter((k) => k.distributor === 'rakesh' && k.orders > 0);

const ROLES: Record<string, string> = {
	neha: 'Smart-Clearance staff · console',
	priya: 'Supply Chain',
	rakesh: 'Distributor',
	agrawal: 'Bidder on ExpireSoon',
	anita: 'Finance',
	vikram: 'ESG'
};

let run: Run;

/** the case as someone sees it, or null before the Watcher has flagged it */
async function caseAs(who: string): Promise<Case | null> {
	try {
		return await api<Case>('workspace', who, `${WS}/cases/${HERO}`);
	} catch {
		return null;
	}
}

/** waits for the agents: polls the case as someone until the check holds, then returns it */
async function until(what: string, who: string, check: (c: Case) => boolean, timeout = AGENT_WAIT): Promise<Case> {
	let got: Case | null = null;
	const holds = async () => {
		got = await caseAs(who);
		return got ? check(got) : false;
	};
	await expect.poll(holds, { message: what, timeout, intervals: [2000] }).toBe(true);
	return got!;
}

/** the splash (design3/console/splash.js) has lifted off the page */
async function settled(page: Page) {
	await expect(page.locator('html')).not.toHaveClass(/cs-covered/, { timeout: 60_000 });
	await expect(page.locator('.cs-splash')).toHaveCount(0, { timeout: 15_000 });
}

/** someone opens the workspace app at a path, with the caption naming them and what they are about to do */
async function as(page: Page, who: string, path: string, did: string) {
	const p = person(who);
	await openAs(page, 'workspace', who, path);
	await run.act(p.name, ROLES[who] ?? `Kirana · ${p.org}`, did);
	await settled(page);
	await expect(page.locator('#main')).toBeVisible();
}

/** Neha opens the console at a path */
async function staff(page: Page, path: string, did: string) {
	await openAs(page, 'console', 'neha', path);
	await run.act('Neha Kulkarni', ROLES.neha, did);
	await settled(page);
}

/** a figure the story fixes: kept in the report, checked softly so the run goes on to the end */
function story(name: string, actual: string | number | undefined, expected: string | number) {
	run.figure(name, actual ?? '(missing)');
	if (actual !== expected) run.find('warning', HERO, `${name}: ${actual} where the story has ${expected}`);
	expect.soft(actual, name).toBe(expected);
}

const sidebar = (page: Page, label: string) =>
	page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: label, exact: true });
const inr = (n: number | undefined) => (n == null ? '(none)' : `₹${n.toLocaleString('en-IN')}`);

/** the journey's steps, in order: each acts in the UI, then waits for what follows from it */
const STEPS: { id: string; title: string; run: (page: Page) => Promise<void> }[] = [
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
			await run.done('Journey reset to day 0, 08:00');
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
			await run.done('Setup: the export mapped, 8 of 8 columns');
			const confirm = page.getByRole('button', { name: 'Confirm and start watching' });
			await confirm.scrollIntoViewIfNeeded();
			await confirm.click();
			await expect(page.getByRole('button', { name: 'Open Command Center' })).toBeVisible();
			await run.done('Setup confirmed: the Watcher starts at 09:00');
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
			await run.done('Permission given');
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
				await run.done('Watcher run from the console');
			}
			const c = await until('the Watcher flags MF-2409-117 and Vision asks for its label photo', 'priya', (c) =>
				['requested', 'reading', 'verified'].includes(c.journey.photo.status)
			);
			run.figure('Flagged phase', c.journey.phase);
			await as(page, 'priya', `/command/${HERO}`, 'sees the chips flagged on the Command Center');
			await expect(page.getByText('Masala Chips 150 g').first()).toBeVisible();
			await run.done('Command Center: the chips at risk, Vision waiting for the label photo');
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
			const c = await until(
				'the Valuer and the Router plan MF-2409-117',
				'priya',
				(c) => c.journey.phase === 'planned'
			);
			story('Plan net', c.plan?.net, 21770);
			for (const l of c.plan?.lines ?? []) run.figure(`Plan line ${l.id}`, `${l.units} packs`);
			await as(page, 'priya', `/route/${HERO}`, 'reviews the plan in the Route Room and approves it');
			const review = page.getByRole('button', { name: 'Review and approve' });
			await expect(review).toBeVisible();
			await run.done('Route Room: the plan, waiting for a yes');
			await review.click();
			const sheet = page.getByRole('dialog', { name: 'Approve the plan' });
			await expect(sheet).toBeVisible();
			await run.done('The approve sheet');
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
		title: 'The Lister lists the lot on ExpireSoon and Outreach sends the kiranas their scheme',
		async run(page) {
			const c = await until('the Lister lists the lot and Outreach sends the scheme', 'priya', (c) =>
				Boolean(c.journey.listing && c.journey.offer)
			);
			story('Kiranas offered the scheme', c.journey.offer?.shops, 38);
			story('ExpireSoon lot', `${c.journey.listing?.units} packs at ₹${c.journey.listing?.price}`, '772 packs at ₹15');
			await as(page, 'priya', `/execution/${HERO}`, 'watches the agents carry out the plan');
			await run.done('Execution: the lot listed, the scheme sent');
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
					run.find('note', `/offer/${HERO}`, `${k.name} had already ordered`);
					continue;
				}
				await order.click();
				await expect(page.getByText(/ऑर्डर हो गया/).first()).toBeVisible();
				await run.done(`${k.name} ordered ${k.orders} packets`);
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
			await run.done('The lot on ExpireSoon');
			await bid.click();
			await run.done('Bid ₹13 a packet');
			const accept = page.getByRole('button', { name: /^Accept ₹/ });
			await expect(accept).toBeVisible({ timeout: AGENT_WAIT });
			run.figure('Counter', (await accept.innerText()).replace(/\s+/g, ' '));
			await run.done('The Negotiator countered');
			await accept.click();
			const c = await until('the lot is awarded', 'priya', (c) => Boolean(c.journey.award));
			story(
				'Award',
				`${c.journey.award?.units} packs at ₹${c.journey.award?.price}, token ₹${c.journey.award?.token}`,
				'772 packs at ₹14.2, token ₹1644'
			);
			await expect(page.getByText(/won|Lot won/i).first()).toBeVisible();
			await run.done('Agrawal took the counter and paid the token');
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
			await run.done('The truck loaded');
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
			for (const d of c.docs) run.figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status})`);
			await as(page, 'rakesh', `/orders/${HERO}`, 'issues his invoice from Tally');
			await page.getByRole('button', { name: 'Issue from Tally' }).click();
			await expect(page.getByText('issued from Tally', { exact: true })).toBeVisible();
			await run.done('Invoice issued from Tally');
			await sidebar(page, 'Van route').click();
			const round = page.getByRole('button', { name: 'Start the round' });
			await expect(round).toBeEnabled();
			await round.click();
			await until('the van round is done', 'rakesh', (c) => c.journey.van.status === 'done', 60_000);
			await run.done('The van round run: 31 kiranas delivered');
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
					run.find('warning', `/paperwork/${HERO}`, `no card for the paper "${d.type}"`);
					continue;
				}
				await card.click();
				await page.waitForTimeout(600);
				await run.done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}`);
			}
			// what Rakesh issued from Tally, as Finance reads it
			if (c.journey.invoiceIssued && c.docs.some((d) => d.id === 'invoice' && d.status === 'drafted'))
				run.find(
					'note',
					`/paperwork/${HERO}`,
					`the tax invoice still reads "drafted" in Finance's pack after Rakesh issued it from Tally (as in the prototype)`
				);
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
			run.figure('Phase before the report', before.journey.phase);
			run.figure('Actual net', inr(before.actual?.net));
			await staff(page, '/clients/munchly/agents', "fires Impact's report for the chips now");
			const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
			await expect(fire).toBeEnabled();
			await fire.click();
			const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
			await expect(alert).toBeVisible();
			await run.done('Report now: Expire it and report now?');
			await alert.getByRole('button', { name: 'Report now' }).click();
			await expect(alert).toBeHidden();
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			story('Actual net', c.actual?.net, 21152.4);
			story('Left at the godown', c.realised?.godown, 0);
			run.figure('Phase after the report', c.journey.phase);
			for (const d of c.docs) run.figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status})`);
			await run.done('Impact posted the ledger');
		}
	},
	{
		id: 'esg',
		title: "Vikram reads the ESG report: the batch's ledger row and the quarter's BRSR",
		async run(page) {
			await as(page, 'vikram', `/report/${HERO}`, "reads the batch's ESG report and the quarter's BRSR");
			const batch = page
				.getByRole('radio', { name: 'This batch' })
				.or(page.getByRole('button', { name: 'This batch' }));
			await batch.first().click();
			await expect(page.getByText('posted to the ledger')).toBeVisible();
			await run.done('ESG: the batch posted to the ledger');
			await page.mouse.wheel(0, 900);
			await page.waitForTimeout(500);
			await run.done('ESG: the BRSR line and its evidence');
			const quarter = page.getByRole('radio', { name: 'Quarter' }).or(page.getByRole('button', { name: 'Quarter' }));
			await quarter.first().click();
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
			run.figure('Quarter: CO₂e avoided', `${q.co2} kg`);
			run.figure('Quarter: batches', q.batches);
		}
	},
	{
		id: 'close',
		title: 'Anita reads the finance report, and Priya sees the batch through',
		async run(page) {
			await as(page, 'anita', `/report/${HERO}`, 'reads the finance side of the report');
			await run.done('Finance & ESG report, as Anita');
			await as(page, 'priya', `/execution/${HERO}`, 'sees the batch through on Execution');
			await run.done('Execution: every line done');
			await sidebar(page, 'Command Center').click();
			await page.waitForTimeout(800);
			await run.done('Command Center at the end');
		}
	}
];

test.describe.configure({ mode: 'serial' });

test('Munchly Chips E2E: the Masala Chips batch, end to end, every person in the real UI', async ({ page }, info) => {
	run = new Run(page, info);
	mint(['neha', 'priya', 'rakesh', 'agrawal', 'anita', 'vikram', ...KIRANAS.map((k) => k.member)]);
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
