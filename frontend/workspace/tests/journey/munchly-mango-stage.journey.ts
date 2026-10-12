import { expect, test, type Locator, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { api, mint } from './auth.ts';
import { AGENT_WAIT, begin, caseAs, inr, running, story, until, WS, type Case } from './flow.ts';
import { DIST, HERO, KIRANAS, orderPlan, past, printed, STEP } from './mango.ts';
import { Stage, type Note } from './stage.ts';

// Munchly Mango E2E on three screens (SC-190): the Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad)
// from a fresh journey to Impact's report, on the happy path, as Munchly Chips Sad Path E2E plays the chips (stage.ts):
// Priya, Munchly's supply chain operator, on a tablet in landscape, and Lakshmi Agencies, the distributor, on a tablet
// in portrait, each signing in on camera and online to the end; and a phone on which Neha in the console, the kiranas
// and Meera of Feeding India sign in as each is needed, on the app's own sign-in screen (no password typed). Every click
// shows, every screen scrolls to what is read, and the moments a viewer would ask about carry a note in business terms.
//
// The happy path: the Mango's plan has three lines and no ExpireSoon lot (22 days left is under ExpireSoon's 30): the
// kiranas' scheme, the staff sale at Lakshmi Agencies' godown, and the food bank's donation. The first E2E_SHOWN (3)
// ordering kiranas sign in on the phone and order; the other ordering kiranas order as themselves through backend-api,
// their own sessions, meanwhile (a sign-in on camera for each of 52 shops would take twenty minutes), and Priya watches
// the scheme fill on her Execution. Lakshmi Agencies records the staff sale on its consolidated receipt, Meera collects
// the donation, Paperwork drafts the pack and Lakshmi runs the van round; Priya reviews the pack, Neha fires the report,
// Priya reads the impact, and Lakshmi reads her portal.
//
// E2E_SHOWN (3): how many of the ordering kiranas order on the phone.
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts.
// E2E_FROM=<step id> resumes on the journey as it stands (the sign-ins always run); E2E_UNTIL=<step id> stops after it.
// E2E_LIVE=0 opens no monitor window (the stage is recorded all the same).

const SHOWN = Number(process.env.E2E_SHOWN ?? 3);
const DAY_MINUTES = Number(process.env.E2E_DAY_MINUTES ?? 60);
const PRESETS: Record<number, RegExp> = { 1440: /Real time/, 60: /Rehearsal/, 5: /Demo/, 1: /Fast/ };
const PEOPLE = ['neha', 'priya', DIST, 'meera', ...KIRANAS.map((k) => k.member)];
const REPO = (p: string) => fileURLToPath(new URL(`../../../../${p}`, import.meta.url));
/** the label photo Lakshmi Agencies sends, and the staff sale's consolidated receipt (SC-147, SC-174) */
const LABEL = REPO('agents/evals/vision/images/mango.webp');
const RECEIPT = REPO(`design3/system/img/receipts/${HERO}.webp`);

type Step = { id: string; title: string; run: (s: Stage) => Promise<void> };
const main = (page: Page) => page.locator('#main');
/** the cursor reads down a list of things on screen, resting on each */
async function readEach(s: Stage, items: Locator, most = 8, rest = 450) {
	const n = Math.min(await items.count(), most);
	for (let i = 0; i < n; i++) await s.point(items.nth(i), rest);
	return n;
}
type Line = { id: string; units: number; price?: number };
const lineOf = (c: Case | null, id: string) => ((c?.plan?.lines ?? []) as Line[]).find((l) => l.id === id);
const num = (n: number | undefined) => (n ?? 0).toLocaleString('en-IN');

/** what the stage says beside the moments a viewer would ask about, in business terms (SC-188) */
const WHY = {
	rehearsal: {
		tag: 'Why',
		title: 'Rehearsal: a journey day in an hour',
		text: "The demo runs on a small synthetic dataset: Munchly's nine batches, each with a fixed best-before date. Reset replays the story's calendar from day 0, and Rehearsal runs each journey day in an hour, so a 48-hour offer and the days after it fit in one sitting. A live client runs in real time."
	},
	setup: {
		tag: 'Setup',
		title: "Munchly's rules, set once",
		text: "The stock export from the distributors' DMS is mapped once. Munchly's guardrails (price floors, the channels allowed, the territories its lots stay out of) bound every agent from here on."
	},
	permission: {
		tag: 'Distributor',
		title: 'One permission, then the legwork is done',
		text: "Lakshmi Agencies lets Smart-Clearance send scheme offers to its kiranas, draft its invoices and book its van and pickups, inside Munchly's floors. Every action shows on its Today, and it can pause them at any time."
	},
	watcher: {
		tag: 'Why',
		title: 'A daily check, fired by hand',
		text: "In production the Watcher checks every batch each morning at 09:00, against the quick-commerce gates and the sell-through. For the demo Neha runs this morning's check now from the console: the same run the schedule makes."
	},
	verified: {
		tag: 'Trust',
		title: 'Verified before any price',
		text: "Vision reads the carton label from Lakshmi Agencies' photo and matches the batch, the dates and the MRP to the DMS export. No match, no plan: nothing is priced or sold on a guess."
	},
	channels: {
		tag: 'Valuer',
		title: 'Every exit priced net',
		text: 'Each channel is priced after its own costs and its effect on GST, and set against what destroying the packs would cost. With 22 days left the Mango Drink is too close to its date for ExpireSoon, so the Router looks closer to home.'
	},
	approve: {
		tag: 'Control',
		title: 'Nothing moves without a yes',
		text: "The agents have prepared the kirana scheme, the staff sale and the donation. Priya's one tap releases them, and every step after it is logged in her name."
	},
	live: {
		tag: 'Live',
		title: 'Every order, as it lands',
		text: "The kirana ordered on the phone a moment ago. It reaches Priya's screen at once, with its GST invoice from Lakshmi Agencies already issued: no spreadsheet, no phone calls."
	},
	staff: {
		tag: 'Staff sale',
		title: 'Sold to staff, on one receipt',
		text: 'Lakshmi Agencies sells packs to its own staff at the godown, every payment by its UPI reference on one consolidated receipt. Vision reads it, and the sale records only when the payments come to the count.'
	},
	van: {
		tag: 'Delivery',
		title: "Delivered on Lakshmi's own round",
		text: "The kiranas' packets ride Lakshmi Agencies' usual van round, every shop's order on it in the order they came in. Munchly's credit note covers the van, so the delivery costs her nothing."
	},
	support: {
		tag: 'Distributor',
		title: 'The gap, made good',
		text: 'The price-support credit note pays Lakshmi Agencies the gap between what she paid for the packs and what each channel fetched, plus her van, so clearing the batch costs her nothing.'
	},
	invoices: {
		tag: 'GST',
		title: 'An invoice for every shop',
		text: "Every kirana's order carries its own GST invoice from Lakshmi Agencies, in her series. Munchly sees the register and each invoice, with nothing to chase."
	},
	report: {
		tag: 'Why',
		title: 'The report, brought forward',
		text: "The Mango Drink's report falls due on its best-before, 24 Oct, on the story's calendar. Report now posts it today: every line is done, nothing is left at the godown, and Impact posts the batch to the ledger."
	},
	impact: {
		tag: 'ESG',
		title: 'Impact, from the ledger',
		text: "Kilos kept out of landfill, the meals the donation made and CO₂e come from each batch's own ledger, not an estimate: ready for BRSR Principle 6 and Munchly's EPR reporting."
	},
	whole: {
		tag: 'Distributor',
		title: 'Lakshmi Agencies ends whole',
		text: "Every rupee Lakshmi Agencies paid for the batch comes back: from her kiranas, her staff and Munchly's credit note. Clearing it cost her nothing."
	}
} satisfies Record<string, Note>;
/** the notes whose figures are the case's own */
const NOTE = {
	risk: (c: Case): Note => ({
		tag: 'Risk',
		title: `${inr(Math.round(c.writeOff?.total ?? 0))} at stake`,
		text: `${num(c.batch.assess?.atRisk)} packs of Mango Drink will not sell before quick-commerce stops taking them. Destroying them would cost Munchly ${inr(Math.round(c.writeOff?.total ?? 0))}: the stock, the GST credit reversed, disposal and EPR. The agents start on it at once.`
	}),
	split: (c: Case): Note => {
		const k = lineOf(c, 'kirana');
		const st = lineOf(c, 'staff');
		const fb = lineOf(c, 'foodbank');
		return {
			tag: 'Router',
			title: 'The recommended split',
			text: `${num(k?.units)} packets to Lakshmi Agencies' kiranas${k?.price ? ` at ₹${k.price} effective` : ''}, ${num(st?.units)} to her staff${st?.price ? ` at ₹${st.price}` : ''}, and ${num(fb?.units)} to a food bank. Net ${inr(Math.round(c.plan?.net ?? 0))}, where destroying them would cost ${inr(Math.round(c.writeOff?.total ?? 0))}.`
		};
	},
	scheme: (shops: number, price?: number): Note => ({
		tag: 'Kiranas',
		title: 'Kept in the neighbourhood',
		text: `Lakshmi Agencies' own ${shops} kiranas in Hyderabad are offered the packs${price ? ` at ₹${price} effective` : ''}, buy 10 get 2, each shop capped at what it can sell in 14 days. The packs sell through shelves their customers know.`
	}),
	filled: (shops: number, packets: number): Note => ({
		tag: 'Live',
		title: 'The scheme fills',
		text: `The other shops ordered from their own phones meanwhile; the recording shows ${SHOWN}. Their orders reached Priya's screen as they landed, and the scheme closed the moment it filled: ${num(packets)} packets to ${shops} shops.`
	}),
	donation: (units: number, partner: string): Note => ({
		tag: 'Food bank',
		title: 'Food, not landfill',
		text: `${num(units)} packs go to ${partner}: an FSSAI checklist with the batch, a receipt in the food bank's own series, and the meals counted for Munchly's ESG report.`
	}),
	outcome: (c: Case): Note => {
		const f = (
			c as Case & {
				ledger?: { figures?: { net: number; swing: number; units: number; kg: number; meals: number } } | null;
			}
		).ledger?.figures;
		return {
			tag: 'Outcome',
			title: f ? `${inr(Math.round(f.swing))} better than destroying` : 'Better than destroying',
			text: f
				? `Against destroying all ${num(f.units)} packs at risk, Munchly is ${inr(Math.round(f.swing))} better off: ${inr(Math.round(f.net))} recovered, ${num(f.kg)} kg of food sold or given instead of sent to a landfill, and ${num(f.meals)} meals.`
				: 'Every line done as planned: the packs sold to shops and staff, and the rest given to a food bank.'
		};
	}
};

const STEPS: Step[] = [
	{
		id: 'signin',
		title: 'Priya signs in on her tablet, Lakshmi Agencies on its, and Neha in the console on the phone',
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
		title: "Neha starts Munchly's journey again from the console, on the phone",
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
			await s.spot(preset, WHY.rehearsal);
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
			await s.spot(confirm, WHY.setup);
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
				await s.spot(ask, WHY.permission);
				await s.click(main(page).getByRole('button', { name: 'Allow', exact: true }));
				await expect(given).toBeVisible();
				await running().done('Permission given');
			} else {
				await s.spot(given, WHY.permission);
				await running().done('Permission given before: Smart-Clearance acts for Lakshmi Agencies');
			}
		}
	},
	{
		id: 'detect',
		title: 'The Watcher flags the Mango Drink: Neha runs it from the console',
		async run(s) {
			if (!(await caseAs('priya'))) {
				const page = await s.open('neha', '/clients/munchly/agents', "runs the Watcher's daily check now");
				const go = page.getByRole('button', { name: 'Run now: Watcher, daily check' });
				await expect(go).toBeEnabled();
				await s.spot(go, WHY.watcher);
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
			await s.spot(body.locator('.chart').first(), WHY.channels);
			const bars = body.locator('.chart g');
			for (let i = 0, n = Math.min(await bars.count(), 5); i < n; i++) await s.point(bars.nth(i), 650);
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
		async run(s) {
			const c = await until('Outreach sends the scheme and Donation books the food bank', 'priya', (c) =>
				Boolean(c.journey.offer && c.donation)
			);
			story('Kiranas offered the scheme', c.journey.offer?.shops, 58);
			await s.stat('offered', 'kiranas offered', String(c.journey.offer?.shops ?? 0));
			const ex = await s.open('priya', `/execution/${HERO}`, 'watches the agents carry out the plan');
			await s.spot(
				main(ex)
					.locator('.card', { hasText: /Outreach · \d+ kiranas/ })
					.first(),
				NOTE.scheme(c.journey.offer?.shops ?? 0, lineOf(c, 'kirana')?.price)
			);
			await running().done('Execution: the scheme sent, the staff sale open, the donation booked');
			const page = await s.open(DIST, `/orders/${HERO}`, 'watches its kiranas answer the scheme on Orders');
			await expect(main(page)).toContainText(/scheme/i);
			await running().done("Lakshmi Agencies' Orders: the scheme sent to its kiranas");
		}
	},
	{
		id: 'orders',
		title: `The first ${SHOWN} kiranas order on the phone and the rest from their own; Priya watches the scheme fill`,
		async run(s) {
			const before = (await caseAs('priya'))!;
			const line = lineOf(before, 'kirana')!.units;
			const { plan, over } = orderPlan(KIRANAS, line);
			if (over)
				running().find(
					'warning',
					HERO,
					`the scheme cannot be filled to the packet from the offer screen: ${over} over`
				);
			for (const p of plan.filter((p) => p.units !== p.story))
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
					await s.point(main(page).getByText(/₹\d/).first(), 500);
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
				else await s.point(row, 900);
				await running().done(`Live on Priya's tablet: ${p.k.name}, ${p.units} packets`);
			}
			// the rest order from their own phones meanwhile, as themselves, while Priya's tablet counts them in
			await s.run.act('Priya Deshmukh', 'Supply Chain', 'watches the other shops order, and the scheme fill');
			await s.active('operator');
			await s.point(count, 300);
			for (const [i, p] of plan.slice(SHOWN).entries()) {
				const c = await caseAs(p.k.member);
				const mine = c?.journey.orders.some((o) => o.id === p.k.id);
				if (!mine)
					await api('workspace', p.k.member, `${WS}/cases/${HERO}/orders`, {
						method: 'POST',
						body: JSON.stringify({ units: p.units }),
						headers: { 'idempotency-key': randomUUID() }
					});
				await s.stat('ordered', 'shops ordered', String(SHOWN + i + 1));
			}
			const c = await until(
				'the scheme fills and closes',
				'priya',
				(c) => c.journey.offer?.status === 'closed',
				120_000
			);
			const packets = c.journey.orders.reduce((t, o) => t + o.units, 0);
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
		title: 'Lakshmi Agencies records the staff sale at its godown, on its consolidated receipt',
		async run(s) {
			const c = await until('the staff sale is open', DIST, (c) => Boolean(c.journey.staff));
			if (c.journey.staff?.status === 'recorded')
				return void running().find('note', HERO, 'the staff sale was recorded');
			const page = await s.open(DIST, '/home', `records the staff sale: ${c.journey.staff?.units} packs at the godown`);
			const card = main(page).locator(`#batch-${HERO}`);
			await expect(card).toContainText('Record the staff sale');
			await s.point(card, 900);
			await running().done('Today: the staff sale asked for on the batch');
			await s.click(card.getByRole('button', { name: 'Record what sold', exact: true }));
			await expect(page).toHaveURL(new RegExp(`/van/${HERO}`));
			const sale = main(page).locator('.card', { hasText: 'Staff sale ·' }).first();
			await s.spot(sale, WHY.staff);
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
			await s.point(match, 900);
			await running().done('Vision read the receipt: its UPI payments match the count');
			await s.click(record);
			const r = await until('the staff sale is recorded', DIST, (c) => c.journey.staff?.status === 'recorded', 60_000);
			story('Staff sale', r.journey.staff?.sold ?? undefined, 150);
			await running().done(`Staff sale recorded: ${r.journey.staff?.sold} packs, with its receipt`);
		}
	},
	{
		id: 'donation',
		title: 'Meera of Feeding India confirms the pickup and collects the donation, on the phone',
		async run(s) {
			const c = await until('the donation is booked', 'meera', (c) => Boolean(c.donation));
			if (['collected', 'declined'].includes(c.donation!.status))
				return void running().find('note', HERO, `the donation was ${c.donation!.status}`);
			const page = await s.open('meera', '/pickups', 'confirms the pickup at the Begum Bazaar godown');
			const pickup = main(page).locator('.card', { hasText: 'Mango Drink' }).first();
			await s.spot(pickup, NOTE.donation(c.donation!.units, c.donation!.partner ?? 'the food bank'));
			if (c.donation!.status === 'booked') {
				await s.click(main(page).getByRole('button', { name: /^Confirm / }));
				await until('the pickup is confirmed', 'meera', (c) => c.donation?.status === 'confirmed', 60_000);
				await running().done('Pickup confirmed');
			}
			await s.click(main(page).getByRole('button', { name: 'Mark collected' }));
			const r = await until('the donation is collected', 'meera', (c) => c.donation?.status === 'collected', 60_000);
			story(
				'Donation',
				`${r.donation?.units} packs ${r.donation?.status}`,
				`${lineOf(await caseAs('priya'), 'foodbank')?.units} packs collected`
			);
			await running().done(`Donation collected: ${r.donation?.units} packs`);
		}
	},
	{
		id: 'papers',
		title: 'Paperwork drafts the pack, with its PDFs; Lakshmi Agencies runs the van round',
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
			await s.spot(round, WHY.van);
			await s.click(round);
			await until('the van round is done', 'priya', (c) => c.journey.van.status === 'done', 60_000);
			await running().done('The van round run: every shop delivered');
		}
	},
	{
		id: 'review',
		title:
			"Priya reads the pack (the credit note, the GST memo, the FSSAI checklist, the receipt, the kiranas' invoices) and marks it reviewed",
		async run(s) {
			const c = (await caseAs('priya'))!;
			const page = await s.open('priya', `/paperwork/${HERO}`, 'reads each paper, then marks the pack reviewed');
			const body = main(page);
			for (const d of c.docs.filter((d) => d.status !== 'not required')) {
				const card = body.getByRole('button', { name: new RegExp(d.type) }).first();
				if (!(await card.count())) continue;
				await s.click(card, 600);
				if (d.id === 'support') await s.spot(body.getByText(/credit note/i).first(), WHY.support);
				else await s.point(body.locator('img[alt^="Signed by"]').first(), 500);
				await running().done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}`, 500);
			}
			const register = body.getByRole('button', { name: /Tax invoices to kiranas/ }).first();
			if (await register.count()) {
				await s.click(register, 600);
				await expect(body).toContainText('Sales Register');
				await s.spot(body.getByText('Sales Register').first(), WHY.invoices);
				await running().done('The sales register: a tax invoice for every kirana order');
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
			await running().done(`Impact posted the ledger: ${inr(c.actual?.net)} recovered`);
		}
	},
	{
		id: 'esg',
		title: "Priya reads the Impact screens: the quarter, and the batch's BRSR line",
		async run(s) {
			const page = await s.open('priya', '/report?reading=impact', 'reads the Impact dashboard for the quarter');
			const body = main(page);
			await expect(body).toContainText('Food, by week');
			await s.spot(body.getByText(/Kept out of landfill/).first(), WHY.impact);
			await readEach(s, body.getByText(/Kept out of landfill|Destroyed|CO₂e avoided/), 3, 600);
			await running().done('Impact: kept out of landfill, destroyed, CO₂e avoided');
			await s.point(body.getByText('Food, by week').first(), 600);
			await s.point(body.getByText('Where the kilos went').first(), 700);
			await running().done('Impact: food by week, and where the kilos went');
			const bp = await s.open('priya', `/report/${HERO}`, "reads the batch's own impact: its BRSR line and meals");
			await s.click(bp.locator('.bh-tabs').getByRole('button', { name: 'Impact' }), 700);
			await expect(main(bp)).toContainText(/BRSR/);
			await s.point(main(bp).getByText(/BRSR/).first(), 900);
			await running().done("The batch's Impact: its BRSR line, the meals and the evidence");
		}
	},
	{
		id: 'distributor',
		title: 'Lakshmi Agencies reads its batch on its tablet: what happened, its money, its papers',
		async run(s) {
			const page = await s.open(DIST, `/batches/${HERO}`, 'reads the Mango Drink: what happened, its money and papers');
			const body = main(page);
			await expect(body).toContainText('You sent the label photo');
			await s.point(body.getByText('You sent the label photo').first(), 600);
			await running().done('Its batch: what happened');
			await s.click(page.locator('.bh-tabs').getByRole('button', { name: 'Money' }));
			await expect(body).toContainText('You end whole');
			await s.spot(body.getByText('You end whole').first(), WHY.whole);
			await running().done('Its batch: it ends whole');
			await s.click(page.locator('.bh-tabs').getByRole('button', { name: 'Papers' }));
			await expect(body).toContainText('Your papers');
			await readEach(s, body.getByRole('button', { name: /credit note|receipt/i }), 3, 600);
			await running().done('Its papers: the credit note, and its copy of the food bank receipt');
			const orders = await s.open(DIST, '/orders', 'reads its orders: the scheme, the staff sale and the food bank');
			await s.point(main(orders).locator(`#batch-${HERO}, .card`).first(), 900);
			await running().done('Orders: the scheme, the staff sale and the food bank, under the batch');
		}
	},
	{
		id: 'close',
		title: 'Priya sees the Mango Drink through, and the batch in the ledger',
		async run(s) {
			await s.open('priya', `/execution/${HERO}`, 'sees every line done on Execution');
			await running().done('Execution: every line done');
			const ledger = await s.open('priya', `/report/${HERO}`, "reads the batch's money in the ledger");
			const done = await caseAs('priya');
			if (done) await s.spot(main(ledger).locator('.card').first(), NOTE.outcome(done));
			await running().done("The ledger: the batch's money");
			await s.open('priya', '/command', 'sees the Command Center at the end');
			await running().done('Command Center at the end');
		}
	}
];

test.describe.configure({ mode: 'serial' });

// eslint-disable-next-line no-empty-pattern
test('Munchly Mango E2E on three screens: the Mango Drink from a fresh journey to its report', async ({}, info) => {
	test.setTimeout(90 * 60_000);
	const video = info.outputPath('recording.mp4');
	const s = await Stage.open(
		info,
		{ flow: 'Munchly Mango E2E', batch: 'MF-2410-118 · Mango Drink 200 ml · Lakshmi Agencies, Hyderabad' },
		video,
		{
			holds: { priya: 'operator', [DIST]: 'distributor' },
			phone: 'Neha in the console, the kiranas and Meera of Feeding India sign in here as they are needed.'
		}
	);
	const run = s.run;
	begin(run, HERO);
	let minted = Date.now();
	mint(PEOPLE);
	let error: string | undefined;
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
			await s.chapter(`${STEPS.indexOf(step) + 1} · ${step.title}`);
			await test.step(step.title, () => step.run(s));
		}
	} catch (e) {
		error = (e as Error).message;
		throw e;
	} finally {
		const md = run.write(error ? 'failed' : 'passed', error);
		await info.attach('report.md', { body: md, contentType: 'text/markdown' });
		await s.close();
		const keep = process.env.E2E_KEEP;
		if (keep && existsSync(video)) {
			mkdirSync(dirname(keep), { recursive: true });
			copyFileSync(video, keep);
		}
	}
});
