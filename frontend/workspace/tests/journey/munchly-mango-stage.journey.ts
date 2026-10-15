import { expect, test, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mint } from './auth.ts';
import { AGENT_WAIT, begin, caseAs, inr, running, story, until, type Case } from './flow.ts';
import { DIST, HERO, KIRANAS, orderPlan, past, printed, STEP } from './mango.ts';
import { closeSheet, readPaper, showSwing } from './read.ts';
import { loaded, Stage, type Note } from './stage.ts';

// Munchly Mango E2E on three screens (SC-190, SC-201): the Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies,
// Hyderabad) from a fresh journey to Impact's report, on the happy path, as Munchly Chips Sad Path E2E plays the chips
// (stage.ts): Priya, Munchly's supply chain operator, on a tablet in landscape, and Lakshmi Agencies, the distributor, on
// a tablet in portrait, each signing in on camera and online to the end; and a phone on which Neha in the console, the
// kiranas and Meera of Feeding India sign in as each is needed, on the app's own sign-in screen (no password typed).
//
// SC-201 tells it as the admin tour does (SC-199): green rings and clicks, and a green card beside only the major moments
// of the flow, with a chapter card as each part opens. Priya keeps Execution open while the kiranas order, the staff sale
// is recorded and the food bank collects, and sees each land live. Every paper is read top to bottom: Priya's pack (the
// credit note, the staff sale's UPI receipt, the food bank's receipt, the GST memo, the FSSAI checklist, the sales
// register and a kirana's invoice), Meera's receipt and Lakshmi Agencies' own papers. Then the ledger's Money, GST and
// Impact readings, Lakshmi Agencies ending whole, and last the swing, worked out line by line.
//
// The happy path: the Mango's plan has three lines and no ExpireSoon lot (22 days left is under ExpireSoon's 30): the
// kiranas' scheme, the staff sale at Lakshmi Agencies' godown, and the food bank's donation. The first E2E_SHOWN (2)
// ordering kiranas sign in on the phone and order; then Neha, in the console on the phone, stands in for the rest and
// fills the scheme as the story has it (SC-215), each shop ordering as itself with its own invoice, as a judge does
// (a sign-in on camera for each of 52 shops would take twenty minutes).
//
// E2E_SHOWN (2): how many of the ordering kiranas order on the phone before Neha fills the scheme.
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts.
// E2E_FROM=<step id> resumes on the journey as it stands (the sign-ins always run); E2E_UNTIL=<step id> stops after it.
// E2E_KEEP=<path> copies the recording there; `{stamp}` in it becomes the run's start, as 2026-10-13_09-15-42.
// E2E_LIVE=0 opens no monitor window (the stage is recorded all the same).

const SHOWN = Number(process.env.E2E_SHOWN ?? 2);
const DAY_MINUTES = Number(process.env.E2E_DAY_MINUTES ?? 60);
const PRESETS: Record<number, RegExp> = { 1440: /Real time/, 60: /Rehearsal/, 5: /Demo/, 1: /Fast/ };
const PEOPLE = ['neha', 'priya', DIST, 'meera', ...KIRANAS.map((k) => k.member)];
const REPO = (p: string) => fileURLToPath(new URL(`../../../../${p}`, import.meta.url));
/** the label photo Lakshmi Agencies sends, and the staff sale's consolidated receipt (SC-147, SC-174) */
const LABEL = REPO('agents/evals/vision/images/mango.webp');
const RECEIPT = REPO(`design3/system/img/receipts/${HERO}.webp`);
/** when the run started: in the recording's name, and on the stage's bar */
const STARTED = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const STAMP = `${STARTED.getFullYear()}-${pad(STARTED.getMonth() + 1)}-${pad(STARTED.getDate())}_${pad(STARTED.getHours())}-${pad(STARTED.getMinutes())}-${pad(STARTED.getSeconds())}`;
const WHEN = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	timeZoneName: 'short'
}).format(STARTED);

/** a step of the flow; `card` opens a chapter of the recording with a title card */
type Step = { id: string; title: string; card?: string; run: (s: Stage) => Promise<void> };
const main = (page: Page) => page.locator('#main');
const re = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
type Line = { id: string; units: number; price?: number };
const lineOf = (c: Case | null, id: string) => ((c?.plan?.lines ?? []) as Line[]).find((l) => l.id === id);
const num = (n: number | undefined) => (n ?? 0).toLocaleString('en-IN');
type Figures = { net: number; swing: number; pnl?: number; units: number; kg: number; meals: number };
const figuresOf = (c: Case | null) => (c as (Case & { ledger?: { figures?: Figures } | null }) | null)?.ledger?.figures;

/** the green cards: only the major moments of the flow, in business terms */
const WHY = {
	verified: {
		tag: 'Trust',
		title: 'Verified before any price',
		text: "Vision reads the carton label in Lakshmi Agencies' photo and matches its batch, dates and MRP to the DMS export. No match, no plan: nothing is priced or sold on a guess."
	},
	approve: {
		tag: 'Control',
		title: 'Nothing moves without a yes',
		text: "The agents have prepared the kirana scheme, the staff sale and the donation. Priya's one tap releases them, and every step after it is logged in her name."
	},
	live: {
		tag: 'Live',
		title: 'Every order, as it lands',
		text: "The kirana ordered on the phone a moment ago. It reaches Priya's Execution at once, with its GST invoice from Lakshmi Agencies already issued: no spreadsheet, no phone calls."
	},
	staff: {
		tag: 'Staff sale',
		title: 'Sold to staff, proven by UPI',
		text: 'Lakshmi Agencies sold packs to its own staff at the godown. Its consolidated receipt lists every payment by its UPI reference; Vision read it, and the sale recorded only because the payments came to the count.'
	},
	support: {
		tag: 'Distributor',
		title: 'The gap, made good',
		text: "Munchly's price-support credit note pays Lakshmi Agencies the gap between what she paid for the packs and what each channel fetched, plus her van, so clearing the batch costs her nothing."
	},
	invoices: {
		tag: 'GST',
		title: 'An invoice for every shop',
		text: "Every kirana's order carries its own GST invoice from Lakshmi Agencies, in her own series, issued as the shop ordered and kept in one sales register."
	},
	report: {
		tag: 'Close',
		title: 'The journey closes',
		text: "Every line is done and nothing is left at the godown. Report now posts the batch to Munchly's ledger today rather than on its best-before, 24 Oct on the story's calendar."
	},
	gst: {
		tag: 'Finance',
		title: 'GST, accounted for',
		text: 'Input credit is kept on every pack sold and reversed only on the packs given away, as section 17(5)(h) requires. Every invoice and credit note is counted from the papers themselves.'
	},
	impact: {
		tag: 'ESG',
		title: 'Impact, from the ledger',
		text: "Kilos kept out of landfill, the meals the donation made and the CO₂e avoided come from each batch's own ledger, not an estimate: ready for BRSR Principle 6 and Munchly's EPR reporting."
	},
	whole: {
		tag: 'Distributor',
		title: 'Lakshmi Agencies ends whole',
		text: "Every rupee Lakshmi Agencies paid for the batch comes back: from her kiranas, her staff and Munchly's credit note. Clearing it cost her nothing."
	}
} satisfies Record<string, Note>;
/** the cards whose figures are the case's own */
const NOTE = {
	risk: (c: Case): Note => ({
		tag: 'Risk',
		title: `${inr(Math.round(c.writeOff?.total ?? 0))} at stake`,
		text: `${num(c.batch.assess?.atRisk)} packs of Mango Drink will not sell before quick-commerce stops taking them. Destroying them would cost Munchly ${inr(Math.round(c.writeOff?.total ?? 0))}: the stock, the GST credit reversed, disposal and EPR.`
	}),
	split: (c: Case): Note => {
		const k = lineOf(c, 'kirana');
		const st = lineOf(c, 'staff');
		const fb = lineOf(c, 'foodbank');
		return {
			tag: 'Router',
			title: 'Every exit priced, one split',
			text: `With 22 days left the Mango Drink is too close to its date for ExpireSoon. The Router sends ${num(k?.units)} packets to Lakshmi Agencies' kiranas, ${num(st?.units)} to her staff and ${num(fb?.units)} to a food bank: ${inr(Math.round(c.plan?.net ?? 0))} net, where the bin would cost ${inr(Math.round(c.writeOff?.total ?? 0))}.`
		};
	},
	filled: (shops: number, packets: number): Note => ({
		tag: 'Live',
		title: 'The scheme fills',
		text: `${SHOWN} shops ordered on the phone, and Neha filled the rest from the console, each shop ordering as itself with its own GST invoice. The scheme closed the moment it filled: ${num(packets)} packets to ${shops} shops.`
	}),
	standIn: (left: number, shops: number): Note => ({
		tag: 'Demo',
		title: 'Standing in for the shops',
		text: `No one is on the other kiranas' phones in a demo. The console's stand-in has ${shops} more shops order as the story has them, ${num(left)} packets, each as itself with its own GST invoice, and writes every line in Neha's name.`
	}),
	donation: (units: number, partner: string): Note => ({
		tag: 'Food bank',
		title: 'Food, not landfill',
		text: `${partner} collected ${num(units)} packs and issued its receipt in its own series, counting the meals for Munchly's ESG report. Meera sees it here; Munchly and Lakshmi Agencies each keep a copy.`
	}),
	swing: (c: Case | null): Note => {
		const f = figuresOf(c);
		return {
			tag: 'Outcome',
			title: f ? `${inr(Math.round(f.swing))} better than destroying it` : 'Better than destroying it',
			text: f
				? `${inr(Math.round(f.net))} recovered and ${num(f.kg)} kg of food sold or given instead of sent to a landfill. Below, every figure behind the swing: what the bin would have cost, what each exit made, and the P&L with the plan.`
				: 'Below, every figure behind the swing: what the bin would have cost, what each exit made, and the P&L with the plan.'
		};
	}
};

const STEPS: Step[] = [
	{
		id: 'signin',
		title: 'Priya signs in on her tablet, Lakshmi Agencies on its, and Neha in the console on the phone',
		card: 'Everyone signs in',
		async run(s) {
			await s.open('priya', '/command', "signs in to Munchly's workspace on her tablet");
			await running().done('Priya signed in: her Command Center');
			await s.open(DIST, '/home', "signs in to Munchly's workspace on its tablet");
			await running().done('Lakshmi Agencies signed in: its Today');
			await s.open('neha', '/clients/munchly/agents', 'signs in to the Smart-Clearance console on the phone');
			await running().done('Neha signed in: Munchly in the console');
		}
	},
	{
		id: 'reset',
		title: "Neha starts Munchly's journey again from the console, a journey day an hour",
		card: 'A fresh journey',
		async run(s) {
			const page = await s.open(
				'neha',
				'/clients/munchly/agents',
				`resets Munchly's journey, at ${DAY_MINUTES} min a journey day`
			);
			await s.click(page.getByRole('button', { name: 'Actions for Munchly Foods' }));
			await s.click(page.getByRole('menuitem', { name: /Reset journey/ }));
			const sheet = page.getByRole('dialog', { name: /journey again/ });
			const preset = sheet.getByRole('radio', { name: PRESETS[DAY_MINUTES] ?? /Rehearsal/ });
			await s.point(preset, 600);
			await s.click(preset);
			await running().done('Reset journey: the day length');
			await s.click(sheet.getByRole('button', { name: 'Reset journey' }));
			await expect(sheet).toBeHidden();
			await running().done('Journey reset to day 0, 08:00');
			await s.refresh('priya');
			await s.refresh(DIST);
			await running().done("Priya's and Lakshmi Agencies' tablets on the fresh journey");
		}
	},
	{
		id: 'setup',
		title: "Priya confirms Setup: the stock export's mapping and the guardrails",
		async run(s) {
			const page = await s.open('priya', '/command', 'opens Setup from her sidebar');
			await s.click(page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Setup', exact: true }));
			await expect(main(page).getByText('Mapped · confirm below')).toBeVisible({ timeout: AGENT_WAIT });
			await running().done('Setup: the export mapped');
			const confirm = main(page).getByRole('button', { name: 'Confirm and start watching' });
			await s.point(confirm, 700);
			await s.click(confirm);
			await expect(main(page).getByRole('button', { name: 'Open Command Center' })).toBeVisible();
			await running().done('Setup confirmed: the Watcher starts at 09:00');
			await s.click(main(page).getByRole('button', { name: 'Open Command Center' }));
		}
	},
	{
		id: 'permission',
		title: 'Lakshmi Agencies gives Smart-Clearance the one-time permission on its tablet',
		async run(s) {
			const page = await s.open(DIST, '/home', 'allows the agents to act for Lakshmi Agencies');
			const ask = main(page).locator('.card', { hasText: 'Let Smart-Clearance act for Lakshmi Agencies' }).first();
			const given = main(page).getByText('Smart-Clearance acts for you').first();
			await expect(ask.or(given).first()).toBeVisible();
			if (await ask.isVisible()) {
				await s.point(ask, 900);
				await s.click(main(page).getByRole('button', { name: 'Allow', exact: true }));
				await expect(given).toBeVisible();
				await running().done('Permission given');
			} else {
				await s.point(given, 700);
				await running().done('Permission given before: Smart-Clearance acts for Lakshmi Agencies');
			}
		}
	},
	{
		id: 'detect',
		title: "The Watcher flags the Mango Drink: Neha runs this morning's check from the console",
		card: 'The Watcher finds the risk',
		async run(s) {
			if (!(await caseAs('priya'))) {
				const page = await s.open('neha', '/clients/munchly/agents', "runs the Watcher's daily check now");
				const go = page.getByRole('button', { name: 'Run now: Watcher, daily check' });
				await expect(go).toBeEnabled();
				await s.click(go);
				await running().done('Watcher run from the console');
			}
			const c = await until('the Watcher flags MF-2410-118 and Vision asks for its label photo', 'priya', (c) =>
				['requested', 'reading', 'verified'].includes(c.journey.photo.status)
			);
			running().figure('Write-off at Detect', inr(c.writeOff?.total));
			const page = await s.open('priya', `/command/${HERO}`, 'sees the Mango Drink flagged on the Command Center');
			await expect(main(page).getByText('Mango Drink 200 ml').first()).toBeVisible();
			await s.spot(
				main(page)
					.getByText(/if destroyed/)
					.first(),
				NOTE.risk(c)
			);
			await running().done(`Command Center: the Mango Drink at risk, ${inr(c.writeOff?.total)} if destroyed`);
		}
	},
	{
		id: 'photo',
		title: "Lakshmi Agencies sends the Mango Drink's label photo, and Vision validates it",
		card: 'Vision checks the label',
		async run(s) {
			await until('Vision asks Lakshmi Agencies for the label photo', DIST, (c) =>
				['requested', 'reading', 'verified'].includes(c.journey.photo.status)
			);
			const page = await s.open(DIST, '/home', 'opens the label photo Vision asks for on Today');
			const card = main(page).locator(`#batch-${HERO}`);
			await expect(card).toContainText('Send one photo of the carton label');
			await s.point(card, 900);
			await running().done("Today: the Mango Drink's card asks for the label photo");
			await s.click(card.getByRole('button', { name: 'Open camera', exact: true }));
			await expect(page).toHaveURL(new RegExp(`/photo/${HERO}`));
			await s.upload(main(page).getByRole('button', { name: 'Upload a photo', exact: true }), LABEL);
			await running().done('The label photo chosen');
			await s.click(main(page).getByRole('button', { name: 'Send photo', exact: true }), 150);
			await running().done('Vision is reading the label', 200);
			await expect(main(page).getByText(/Dhanyavaad/)).toBeVisible({ timeout: AGENT_WAIT });
			await s.spot(
				main(page)
					.getByText(/Verified|matches your records/)
					.first(),
				WHY.verified
			);
			await running().done('Vision validated the label: the batch, its dates and MRP match the export');
		}
	},
	{
		id: 'approve',
		title: 'The Valuer prices it, the Router plans it, and Priya approves the plan',
		card: 'The plan, and one yes',
		async run(s) {
			const c = await until('the Valuer and the Router plan the Mango Drink', 'priya', (c) => past(c, 'valued'));
			running().figure('Plan net', inr(c.plan?.net));
			for (const l of c.plan?.lines ?? []) running().figure(`Plan line ${l.id}`, `${l.units} packs`);
			// the plan reaches her Command Center first, and she opens the Route Room from it
			const cc = await s.open('priya', `/command/${HERO}`, 'sees the plan arrive on her Command Center');
			await expect(
				main(cc)
					.getByText(inr(Math.round(c.plan?.net ?? 0)))
					.first()
			).toBeAttached({ timeout: 60_000 });
			await s.point(main(cc).locator('.card', { hasText: 'Mango Drink' }).first(), 1100);
			await running().done(`Command Center: the plan ready, ${inr(Math.round(c.plan?.net ?? 0))}`);
			const opener = main(cc)
				.getByRole('button', { name: /Open Route Room/ })
				.or(main(cc).getByRole('link', { name: /Open Route Room/ }))
				.first();
			if (await opener.isVisible().catch(() => false)) await s.click(opener, 600);
			const page = await s.open('priya', `/route/${HERO}`, 'reads the Route Room down to its split, and approves it');
			const body = main(page);
			const review = body.getByRole('button', { name: 'Review and approve', exact: true });
			await expect(review).toBeVisible();
			await s.point(body.getByText('Label, read from the shelf').first(), 700);
			const bars = body.locator('.chart g');
			await s.point(body.locator('.chart').first(), 900);
			for (let i = 0, n = Math.min(await bars.count(), 5); i < n; i++) await s.point(bars.nth(i), 550);
			await running().done('Route Room: five channels priced, each bar read');
			await s.click(body.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Table' }), 500);
			const table = body.locator('.table-wrap').first();
			await s.point(table, 600);
			await s.pan(table.locator('table'));
			await running().done('Route Room: the channels as a table');
			await s.spot(body.locator('.card', { hasText: 'units at risk' }).first(), NOTE.split(c));
			await running().done('Route Room: the recommended split, waiting for a yes');
			await s.click(review);
			const sheet = page.getByRole('dialog', { name: 'Approve the plan' });
			await expect(sheet).toBeVisible();
			await running().done('The approve sheet: the scheme, the staff sale and the donation');
			const yes = sheet.getByRole('button', { name: 'Approve · release the agents' });
			await s.spot(yes, WHY.approve);
			await s.click(yes);
			const placed = page.getByRole('dialog', { name: 'Plan placed' });
			await expect(placed.getByRole('button', { name: 'Watch execution' })).toBeVisible();
			await running().done('Plan placed');
			await s.click(placed.getByRole('button', { name: 'Watch execution' }));
			await expect(page).toHaveURL(new RegExp(`/execution/${HERO}`));
		}
	},
	{
		id: 'execute',
		title: 'Outreach sends the Hyderabad kiranas their scheme, and Donation books a food bank',
		card: 'The kiranas order, live',
		async run(s) {
			const c = await until('Outreach sends the scheme and Donation books the food bank', 'priya', (c) =>
				Boolean(c.journey.offer && c.donation)
			);
			story('Kiranas offered the scheme', c.journey.offer?.shops, 58);
			await s.stat('offered', 'kiranas offered', String(c.journey.offer?.shops ?? 0));
			const ex = await s.open(
				'priya',
				`/execution/${HERO}`,
				'keeps Execution open to watch the agents carry out the plan'
			);
			await s.point(
				main(ex)
					.locator('.card', { hasText: /Outreach · \d+ kiranas/ })
					.first(),
				1400
			);
			await running().done('Execution: the scheme sent, the staff sale open, the donation booked');
			const page = await s.open(DIST, `/orders/${HERO}`, 'watches its kiranas answer the scheme on Orders');
			await expect(main(page)).toContainText(/scheme/i);
			await s.point(main(page).locator('.card').first(), 900);
			await running().done("Lakshmi Agencies' Orders: the scheme sent to its kiranas");
		}
	},
	{
		id: 'orders',
		title: `The first ${SHOWN} kiranas order on the phone, Neha fills the scheme from the console, and Priya watches it fill`,
		async run(s) {
			const before = (await caseAs('priya'))!;
			const line = lineOf(before, 'kirana')!.units;
			const { plan } = orderPlan(KIRANAS, line);
			for (const p of plan.slice(0, SHOWN).filter((p) => p.units !== p.story))
				running().find(
					'note',
					`/offer/${HERO}`,
					`${p.k.name} ordered ${p.units} packets where the story has ${p.story} (the offer screen orders in twelves)`
				);
			const priya = await s.open('priya', `/execution/${HERO}`, "watches the kiranas' scheme on Execution");
			const count = main(priya).getByText('kiranas ordered').first();
			// on the phone: the first few sign in and order, each seen arriving on Priya's tablet
			for (const [i, p] of plan.slice(0, SHOWN).entries()) {
				const page = await s.open(
					p.k.member,
					`/offer/${HERO}`,
					`orders ${p.units} packets (${i + 1} of ${plan.length})`
				);
				const placed = main(page)
					.getByText(/ऑर्डर हो गया|Ordered · \d+/)
					.first();
				const order = main(page).getByRole('button', { name: /· \d+ packets/ });
				await expect(order.or(placed).first()).toBeVisible();
				if (await order.isVisible()) {
					await s.point(main(page).getByText(/₹\d/).first(), 700);
					for (let n = p.cap; n > p.units; n -= STEP)
						await s.click(main(page).getByRole('button', { name: 'Fewer Packets' }), 150);
					await s.click(main(page).getByRole('button', { name: new RegExp(`· ${p.units} packets`) }));
					await expect(placed).toBeVisible();
				} else running().find('note', `/offer/${HERO}`, `${p.k.name} had already ordered`);
				await s.stat('ordered', 'shops ordered', String(i + 1));
				await running().done(`${p.k.name} ordered ${p.units} packets`);
				await s.run.act('Priya Deshmukh', 'Supply Chain', `sees ${p.k.name}'s order arrive live on Execution`);
				await s.active('operator');
				const row = main(priya).locator('.row.between', { hasText: p.k.name }).first();
				const live = await row
					.waitFor({ state: 'visible', timeout: 45_000 })
					.then(() => true)
					.catch(() => false);
				if (!live)
					running().find(
						'error',
						`/execution/${HERO}`,
						`${p.k.name}'s order did not reach Priya's Execution within 45 s`
					);
				if (i === 0) await s.spot(row, WHY.live);
				else await s.point(row, 1200);
				await running().done(`Live on Priya's tablet: ${p.k.name}, ${p.units} packets`);
			}
			// the rest: Neha stands in for them from the console, as a judge does (SC-215): each shop orders its share as
			// the story has it, as itself, with its own invoice; Priya's tablet counts them in
			const con = await s.open(
				'neha',
				'/clients/munchly/agents',
				"stands in for Lakshmi Agencies' other kiranas from the console"
			);
			const card = con.locator('.cs-standins');
			const fill = card.getByRole('button', { name: new RegExp(`^Fill the scheme: .*${HERO}`) });
			const done = card.getByRole('button', { name: new RegExp(`^Filled: .*${HERO}`) });
			await expect(fill.or(done).first()).toBeVisible({ timeout: 60_000 });
			if (await fill.isVisible()) {
				const row = card.locator('.cs-standin', { hasText: HERO });
				const left = (await caseAs('priya'))!;
				const placed = left.journey.orders.reduce((t, o) => t + o.units, 0);
				await s.spot(row, NOTE.standIn(line - placed, plan.length - left.journey.orders.length));
				await running().done(
					`Console: the stand-in for Lakshmi Agencies' kiranas, ${left.journey.orders.length} of 58 ordered`
				);
				await s.click(fill);
				const ask = con.getByRole('alertdialog', { name: new RegExp(`Fill ${HERO}'s scheme now`) });
				await expect(ask).toBeVisible();
				await s.read(ask, 1600);
				await running().done('The console asks first: the shops still to answer, each with its own invoice');
				await s.click(ask.getByRole('button', { name: 'Fill now', exact: true }));
				await expect(done).toBeVisible({ timeout: 60_000 });
				await s.point(row, 1200);
				await running().done('Filled from the console: the scheme is full');
			} else running().find('note', HERO, 'the scheme was filled from the console before');
			await s.run.act('Priya Deshmukh', 'Supply Chain', 'watches the stand-in orders arrive, and the scheme fill');
			await s.active('operator');
			await s.point(count, 300);
			const c = await until(
				'the scheme fills and closes',
				'priya',
				(c) => c.journey.offer?.status === 'closed',
				120_000
			);
			const packets = c.journey.orders.reduce((t, o) => t + o.units, 0);
			await s.stat('ordered', 'shops ordered', String(c.journey.orders.length));
			story(
				'Kirana orders',
				`${c.journey.orders.length} shops, ${packets} packets`,
				`${plan.length} shops, ${line} packets`
			);
			const filled = main(priya)
				.getByText(/^Filled at/)
				.first();
			await expect(filled).toBeVisible({ timeout: 45_000 });
			await s.spot(filled, NOTE.filled(c.journey.orders.length, packets));
			await running().done(`The scheme filled: ${c.journey.orders.length} shops, ${num(packets)} packets`);
		}
	},
	{
		id: 'staff',
		title: "Lakshmi Agencies records the staff sale on its UPI receipt; it lands on Priya's Execution",
		card: 'The staff sale, on UPI',
		async run(s) {
			const c = await until('the staff sale is open', DIST, (c) => Boolean(c.journey.staff));
			if (c.journey.staff?.status !== 'recorded') {
				const page = await s.open(
					DIST,
					'/home',
					`records the staff sale: ${c.journey.staff?.units} packs at the godown`
				);
				const card = main(page).locator(`#batch-${HERO}`);
				await expect(card).toContainText('Record the staff sale');
				await s.point(card, 900);
				await running().done('Today: the staff sale asked for on the batch');
				await s.click(card.getByRole('button', { name: 'Record what sold', exact: true }));
				await expect(page).toHaveURL(new RegExp(`/van/${HERO}`));
				const sale = main(page).locator('.card', { hasText: 'Staff sale ·' }).first();
				await s.point(sale, 900);
				const record = sale.getByRole('button', { name: 'Record the sale' });
				const match = sale.getByText(/matches your count/).first();
				// the consolidated receipt first, read by Vision on live Gemini (a receipt already read is not sent again)
				if (!(await match.isVisible().catch(() => false))) {
					await expect(record).toBeDisabled();
					await s.upload(sale.getByRole('button', { name: /Upload/ }).first(), RECEIPT);
					await expect(sale.getByText('Vision is reading the receipt').first()).toBeVisible();
					await running().done('The consolidated receipt sent: Vision is reading it');
				}
				await expect(match).toBeVisible({ timeout: AGENT_WAIT });
				await s.point(match, 1100);
				await running().done('Vision read the receipt: its UPI payments match the count');
				await s.click(record);
				const r = await until(
					'the staff sale is recorded',
					DIST,
					(c) => c.journey.staff?.status === 'recorded',
					60_000
				);
				story('Staff sale', r.journey.staff?.sold ?? undefined, 150);
				await running().done(`Staff sale recorded: ${r.journey.staff?.sold} packs, with its receipt`);
			} else running().find('note', HERO, 'the staff sale was recorded');
			// Priya's Execution, open all along: the sale arrives with what Vision read of its receipt
			const ex = await s.open('priya', `/execution/${HERO}`, 'sees the staff sale land on Execution, with its receipt');
			const card = main(ex).locator('.card', { hasText: 'Staff sale ·' }).first();
			const live = await expect(card)
				.toContainText('recorded', { timeout: 45_000 })
				.then(() => true)
				.catch(() => false);
			if (!live)
				running().find('error', `/execution/${HERO}`, "the staff sale did not reach Priya's Execution within 45 s");
			await s.spot(card, WHY.staff);
			const refs = card.getByRole('button', { name: /Show the \d+ UPI references/ });
			if (await refs.isVisible().catch(() => false)) {
				await s.click(refs, 500);
				await s.read(card.locator('.rcpt-refs'), 900);
				await running().done("Priya's Execution: the receipt's UPI references");
			}
			const thumb = card.locator('button.rcpt-thumb');
			if (await thumb.isVisible().catch(() => false)) {
				await s.click(thumb, 800);
				const big = ex.getByRole('dialog', { name: /^Receipt / });
				await expect(big).toBeVisible();
				await loaded(ex, 8000);
				await s.read(big.locator('img').first(), 1200);
				await running().done("Priya's Execution: the staff sale's receipt, whole");
				await closeSheet(s, ex);
			}
		}
	},
	{
		id: 'donation',
		title: "Meera of Feeding India confirms the pickup and collects on the phone; Priya's Execution follows it",
		card: 'The donation',
		async run(s) {
			const c = await until('the donation is booked', 'meera', (c) => Boolean(c.donation));
			const watch = async (status: RegExp, did: string, rest: number) => {
				const ex = await s.open('priya', `/execution/${HERO}`, did);
				const card = main(ex).locator('.card', { hasText: 'Donation ·' }).first();
				const live = await expect(card)
					.toContainText(status, { timeout: 45_000 })
					.then(() => true)
					.catch(() => false);
				if (!live)
					running().find('error', `/execution/${HERO}`, `the pickup did not reach Priya's Execution as ${status}`);
				await s.point(card, rest);
			};
			if (!['collected', 'declined'].includes(c.donation!.status)) {
				let page = await s.open('meera', '/pickups', 'confirms the pickup at the Begum Bazaar godown');
				await s.point(main(page).locator('.card', { hasText: 'Mango Drink' }).first(), 1100);
				if (c.donation!.status === 'booked') {
					await s.click(main(page).getByRole('button', { name: /^Confirm / }));
					await until('the pickup is confirmed', 'meera', (c) => c.donation?.status === 'confirmed', 60_000);
					await running().done('Pickup confirmed');
					await watch(/pickup confirmed/, 'sees the pickup confirmed on Execution', 1300);
					await running().done("Live on Priya's tablet: the pickup confirmed");
					page = await s.open('meera', '/pickups', 'collects the packs, and the receipt is issued');
				}
				await s.click(main(page).getByRole('button', { name: 'Mark collected' }));
				const r = await until('the donation is collected', 'meera', (c) => c.donation?.status === 'collected', 60_000);
				story(
					'Donation',
					`${r.donation?.units} packs ${r.donation?.status}`,
					`${lineOf(await caseAs('priya'), 'foodbank')?.units} packs collected`
				);
				await running().done(`Donation collected: ${r.donation?.units} packs`);
			} else running().find('note', HERO, `the donation was ${c.donation!.status}`);
			// Meera's receipt, issued as she collected
			const page = await s.open('meera', '/pickups', 'reads the receipt Feeding India issued for the packs');
			const row = main(page).locator('button.receipt-row').first();
			await expect(row).toBeVisible({ timeout: 60_000 });
			const d = (await caseAs('meera'))?.donation;
			await readPaper(s, page, row, NOTE.donation(d?.units ?? 0, d?.partner ?? 'The food bank'));
			await running().done("Meera's donation receipt, read top to bottom");
			await watch(/collected/, 'sees the donation collected on Execution', 1600);
			await running().done("Live on Priya's tablet: the donation collected");
		}
	},
	{
		id: 'papers',
		title: 'Paperwork drafts the pack, with its PDFs; Lakshmi Agencies runs the van round',
		card: 'The papers',
		async run(s) {
			const c = await until('Paperwork drafts the papers', DIST, (c) => past(c, 'dispatched') && c.docs.length > 0);
			const pdfs = await until(
				'Paperwork renders the PDFs',
				'priya',
				(c) => c.docs.length > 0 && c.docs.filter((d) => printed(d)).every((d) => d.pdf)
			);
			for (const d of pdfs.docs)
				running().figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status}${d.pdf ? ', PDF' : ''})`);
			if (c.journey.van.status === 'done') return void running().find('note', HERO, 'the van round ran');
			const page = await s.open(DIST, '/home', "runs the van round to Hyderabad's kiranas");
			const card = main(page).locator(`#batch-${HERO}`);
			await expect(card).toContainText(/van round/);
			await s.point(card, 900);
			await running().done('Today: the van round asked for on the batch');
			await s.click(card.getByRole('button', { name: 'Start the round', exact: true }));
			await expect(page).toHaveURL(new RegExp(`/van/${HERO}`));
			const round = main(page).getByRole('button', { name: 'Start the round' });
			await expect(round).toBeEnabled();
			await s.point(round, 600);
			await s.click(round);
			await until('the van round is done', 'priya', (c) => c.journey.van.status === 'done', 60_000);
			await running().done('The van round run: every shop delivered');
		}
	},
	{
		id: 'review',
		title:
			"Priya reads every paper in the pack (the credit note, the receipts, the GST memo, the FSSAI checklist, the kiranas' invoices) and marks it reviewed",
		async run(s) {
			const c = (await caseAs('priya'))!;
			const page = await s.open('priya', `/paperwork/${HERO}`, 'reads every paper in the pack, then marks it reviewed');
			const body = main(page);
			await expect(body.locator('.docgrid')).toBeVisible();
			await s.point(body.locator('.docgrid'), 1300);
			// the credit note first, then the receipts, then Munchly's own memos
			const rank = (id: string) => ['support', 'staff', 'receipt', 'itc', 'fssai'].indexOf(id) + 1 || 9;
			const docs = c.docs.filter((d) => d.status !== 'not required').sort((a, b) => rank(a.id) - rank(b.id));
			for (const d of docs) {
				const card = body.getByRole('button', { name: re(d.type) }).first();
				if (!(await card.count())) continue;
				await readPaper(s, page, card, d.id === 'support' ? WHY.support : undefined);
				await running().done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}, read in full`, 300);
			}
			// the sales register, and one kirana's tax invoice from it
			const register = body.getByRole('button', { name: /Tax invoices to kiranas/ }).first();
			if (await register.count()) {
				const { paper, inSheet } = await readPaper(s, page, register, WHY.invoices, true);
				await running().done('The sales register: a tax invoice for every kirana order');
				const first = paper.locator('button.tl-link').first();
				if (await first.isVisible().catch(() => false)) {
					await readPaper(s, page, first, undefined, true);
					await running().done("A kirana's tax invoice, read in full");
				}
				if (inSheet) await closeSheet(s, page);
			}
			const mark = body.getByRole('button', { name: 'Mark reviewed', exact: true });
			if (await mark.isVisible().catch(() => false)) {
				await s.click(mark);
				await until('the review is recorded', 'priya', (c) => c.journey.reviewed, 30_000);
				await running().done('Pack reviewed');
			}
		}
	},
	{
		id: 'report',
		title: 'Neha fires the report from the console; Impact posts the ledger',
		card: 'Impact posts the ledger',
		async run(s) {
			const before = (await caseAs('priya'))!;
			if (!before.journey.posted) {
				const page = await s.open('neha', '/clients/munchly/agents', "fires Impact's report for the Mango Drink now");
				const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
				await expect(fire).toBeEnabled();
				await s.spot(fire, WHY.report);
				await s.click(fire);
				const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
				await expect(alert).toBeVisible();
				await running().done('Report now: Expire it and report now?');
				await s.click(alert.getByRole('button', { name: 'Report now' }));
				await expect(alert).toBeHidden();
			}
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			story('Actual net', c.actual?.net, c.plan?.net ?? 0);
			story('Left at the godown', c.realised?.godown, 0);
			running().figure('Actual net', inr(c.actual?.net));
			const ex = await s.open('priya', `/execution/${HERO}`, 'sees every line done on Execution');
			await s.point(main(ex).locator('.card').first(), 1000);
			await running().done(`Impact posted the ledger: ${inr(c.actual?.net)} recovered`);
		}
	},
	{
		id: 'finance',
		title: "Priya reads Finance in the ledger: the year's money, then its GST",
		card: 'Finance and ESG',
		async run(s) {
			const page = await s.open('priya', '/report', 'opens the ledger: one ledger, three readings');
			const body = main(page);
			const head = body.locator('.lg-head').first();
			await expect(head).toBeVisible();
			await s.point(head, 1800);
			await s.point(body.locator('.lg-strip').first(), 1400);
			await running().done("The ledger's Money: recovered this year so far, batch by batch");
			const readings = body.getByRole('group', { name: 'Reading' });
			await s.click(readings.getByRole('button', { name: 'GST' }), 800);
			await s.spot(head, WHY.gst);
			await s.point(body.locator('.lg-working').first(), 1600);
			await running().done("The ledger's GST: the input credit kept and reversed, the invoices and credit notes");
			const row = body.getByRole('button', { name: /Mango Drink/ }).first();
			if (await row.isVisible().catch(() => false)) await s.point(row, 1200);
		}
	},
	{
		id: 'esg',
		title: "Priya reads ESG: the Impact dashboard, and the batch's BRSR line",
		async run(s) {
			// the ledger stays open from Finance: its Impact reading, pressed (the reading is read from the address only as
			// the ledger opens)
			const page = await s.open('priya', '/report', 'reads the Impact dashboard for the year so far');
			const body = main(page);
			const impact = body.getByRole('group', { name: 'Reading' }).getByRole('button', { name: 'Impact' });
			if ((await impact.getAttribute('aria-pressed')) !== 'true') await s.click(impact, 800);
			await expect(body).toContainText('Food, by week');
			await s.spot(body.locator('.im-tiles').first(), WHY.impact);
			await running().done('Impact: kept out of landfill, destroyed, CO₂e avoided');
			await s.point(body.locator('.fw-card').first(), 1800);
			await s.point(body.getByText('Where the kilos went').first(), 1500);
			await s.point(body.getByText(/^By /).first(), 1300);
			await running().done('Impact: food by week, where the kilos went, by distributor and product');
			const bp = await s.open('priya', `/report/${HERO}`, "reads the batch's own impact: its BRSR line and meals");
			await s.click(bp.locator('.bh-tabs').getByRole('button', { name: 'Impact' }), 700);
			await expect(main(bp)).toContainText(/BRSR/);
			await s.point(main(bp).getByText(/BRSR/).first(), 1800);
			await running().done("The batch's Impact: its BRSR line, the meals and the evidence");
		}
	},
	{
		id: 'distributor',
		title: 'Lakshmi Agencies reads its batch on its tablet: what happened, how it ends whole, every paper',
		card: "Lakshmi Agencies' side",
		async run(s) {
			const page = await s.open(DIST, `/batches/${HERO}`, 'reads the Mango Drink: what happened, its money and papers');
			const body = main(page);
			await expect(body).toContainText('You sent the label photo');
			await s.point(body.getByText('You sent the label photo').first(), 1000);
			await running().done('Its batch: what happened');
			const tabs = page.locator('.bh-tabs');
			await s.click(tabs.getByRole('button', { name: 'Money' }));
			await expect(body).toContainText('You end whole');
			await s.spot(body.getByText('You end whole').first(), WHY.whole);
			await running().done('Its batch: it ends whole');
			await s.click(tabs.getByRole('button', { name: 'Papers' }));
			await expect(body).toContainText('Your papers');
			const papers = body.locator('button.pt-paper');
			const n = await papers.count();
			for (let i = 0; i < n; i++) {
				const name = (
					(await papers
						.nth(i)
						.innerText()
						.catch(() => '')) || ''
				).split('\n')[0];
				const { paper, inSheet } = await readPaper(s, page, papers.nth(i), undefined, true);
				// the register opens on its list: one invoice from it, read in full
				const inv = paper.locator('button.tl-link').first();
				if (await inv.isVisible().catch(() => false)) await readPaper(s, page, inv, undefined, true);
				if (inSheet) await closeSheet(s, page);
				await running().done(`Its paper: ${name}`, 300);
			}
			const orders = await s.open(DIST, '/orders', 'reads its orders: the scheme, the staff sale and the food bank');
			await s.point(main(orders).locator(`#batch-${HERO}, .card`).first(), 1300);
			await running().done('Orders: the scheme, the staff sale and the food bank, under the batch');
		}
	},
	{
		id: 'swing',
		title: 'Priya shows the swing on the Mango Drink, and how it is worked out',
		card: 'The swing, worked out',
		async run(s) {
			const done = await caseAs('priya');
			await showSwing(s, HERO, 'Mango Drink', NOTE.swing(done));
			const f = figuresOf(done);
			if (f) running().figure('Swing', inr(f.swing));
		}
	}
];

test.describe.configure({ mode: 'serial' });

// eslint-disable-next-line no-empty-pattern
test('Munchly Mango E2E on three screens: the Mango Drink from a fresh journey to its swing', async ({}, info) => {
	test.setTimeout(100 * 60_000);
	const video = info.outputPath('recording.mp4');
	const s = await Stage.open(
		info,
		{
			flow: 'Munchly Mango E2E',
			batch: `MF-2410-118 · Mango Drink 200 ml · Lakshmi Agencies, Hyderabad · recorded ${WHEN}`
		},
		video,
		{
			holds: { priya: 'operator', [DIST]: 'distributor' },
			phone: 'Neha in the console, the kiranas and Meera of Feeding India sign in here as they are needed.',
			ink: 'green',
			notes: 'card',
			quiet: true
		}
	);
	const run = s.run;
	begin(run, HERO);
	let minted = Date.now();
	mint(PEOPLE);
	let error: string | undefined;
	const cards = STEPS.filter((x) => x.card);
	try {
		await s.ready({ operator: 'workspace', distributor: 'workspace', phone: 'console' });
		await s.record();
		const at = (id: string) => STEPS.findIndex((x) => x.id === id);
		const from = process.env.E2E_FROM ? at(process.env.E2E_FROM) : 1;
		const to = process.env.E2E_UNTIL ? at(process.env.E2E_UNTIL) : STEPS.length - 1;
		for (const step of [STEPS[0]!, ...STEPS.slice(Math.max(from, 1), to + 1)]) {
			if (Date.now() - minted > 40 * 60_000) {
				mint(PEOPLE);
				minted = Date.now();
			}
			run.stage = `${STEPS.indexOf(step) + 1}/${STEPS.length}`;
			const n = cards.indexOf(step) + 1;
			await s.chapter(
				`${STEPS.indexOf(step) + 1} · ${step.title}`,
				step.card ? { n, of: cards.length, title: step.card } : undefined
			);
			await test.step(step.title, () => step.run(s));
		}
	} catch (e) {
		error = (e as Error).message;
		throw e;
	} finally {
		const md = run.write(error ? 'failed' : 'passed', error);
		await info.attach('report.md', { body: md, contentType: 'text/markdown' });
		await s.close();
		const keep = process.env.E2E_KEEP?.replaceAll('{stamp}', STAMP);
		if (keep && existsSync(video)) {
			mkdirSync(dirname(keep), { recursive: true });
			copyFileSync(video, keep);
			const chapters = video.replace(/\.mp4$/, '.chapters.json');
			if (existsSync(chapters)) copyFileSync(chapters, keep.replace(/\.mp4$/, '.chapters.json'));
		}
	}
});
