import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { api, mint } from './auth.ts';
import { HERO } from './chips.ts';
import { signCertificate } from './destruction.ts';
import { AGENT_WAIT, begin, caseAs, inr, running, story, STORY, until, WS, type Case } from './flow.ts';
import { closeSheet, readPaper, showSwing, sigs } from './read.ts';
import { Stage, type Note } from './stage.ts';

// Munchly Chips Sad Path E2E (SC-179, SC-184, SC-202): the Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from
// a fresh journey, on three screens at once (stage.ts): Priya, Munchly's supply chain operator, on a tablet in landscape,
// and Rakesh, the distributor, on a tablet in portrait, each signing in on camera at the start and online to the end;
// and a phone for everyone else, on which kiranas, Agrawal Wholesale on ExpireSoon and Neha in the Smart-Clearance
// console sign in as they are needed, on the app's own sign-in screen (the password check answered with their own
// session: no password is typed). Every click shows: the cursor glides to it and ripples where it lands.
//
// SC-202 tells it as the admin tour does (SC-199, and SC-201 the Mango Drink): green rings and clicks, and a green card
// beside only the major moments, with a chapter card as each part opens. Priya keeps Execution open from her yes to the
// destruction, and sees each order, the lot won and collected, the window ending short and the destruction asked for,
// checked and approved land live. Every paper is read top to bottom; then the ledger's Money, GST and Impact readings,
// Rakesh ending whole, and last the swing, worked out line by line.
//
// The sad path: of Rakesh's 38 kiranas offered the scheme, only E2E_BUYERS (2) order their share, each order seen
// arriving on Priya's Execution. One shop says Not this time on the phone, and every other shop that joined the app
// says the same from its own phone through backend-api, as itself (one only invited, Shree Sai Kirana in the story,
// cannot answer). Agrawal Wholesale wins the ExpireSoon lot; Neha closes the scheme's window from the console, short of
// its packets, and they stay at the godown. Rakesh loads the buyer's truck, issues his invoice from Tally and runs his
// van round. Neha fires expiry day: Munchly's policy destroys what is left at Rakesh's godown (SC-139, route B). Rakesh
// sends the evidence, the four signing the certificate in place on his tablet (SC-183), Vision checks the photos on live
// Gemini, and Priya gives her second yes from Execution.
//
// The chips' plan has no staff sale and no food bank: its lines are the kiranas' scheme and the ExpireSoon lot.
//
// E2E_BUYERS (2): how many of the ordering kiranas order, the first in the story's order; every other shop says no.
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts.
// E2E_FROM=<step id> resumes on the journey as it stands (the sign-ins always run); E2E_UNTIL=<step id> stops after it.
// E2E_KEEP=<path> copies the recording there; `{stamp}` in it becomes the run's start, as 2026-10-13_09-15-42.
// E2E_LIVE=0 opens no monitor window (the stage is recorded all the same).

const BUYERS = Number(process.env.E2E_BUYERS ?? 2);
const DAY_MINUTES = Number(process.env.E2E_DAY_MINUTES ?? 60);
const PRESETS: Record<number, RegExp> = { 1440: /Real time/, 60: /Rehearsal/, 5: /Demo/, 1: /Fast/ };
/** Rakesh's 38 kiranas, in the story's order: every one is offered the scheme */
const OFFERED = STORY.kiranas.filter((k) => k.distributor === 'rakesh');
const BUY = OFFERED.filter((k) => k.orders > 0).slice(0, BUYERS);
/** a shop whose owner joined the app (one only invited, Shree Sai Kirana in the story, cannot sign in) */
const joined = (k: (typeof OFFERED)[number]) =>
	(STORY.members.find((m) => m.id === k.member) as { status?: string } | undefined)?.status === 'active';
/** every other shop: each says no, the one on the phone first, the rest from their own phones */
const REST = OFFERED.filter((k) => !BUY.includes(k));
const SAYS_NO = REST.find(joined)!;
const NO_BACKEND = REST.filter((k) => k !== SAYS_NO && joined(k));
const NEVER = REST.filter((k) => !joined(k));
const ORDERED = BUY.reduce((t, k) => t + k.orders, 0);
if (!(BUYERS >= 1 && BUYERS < 31))
	throw new Error('E2E_BUYERS must be 1 to 30: some kiranas order, every other shop says no');
const PEOPLE = [
	'neha',
	'priya',
	'rakesh',
	'agrawal',
	...BUY.map((k) => k.member),
	...REST.filter(joined).map((k) => k.member)
];

const REPO = (p: string) => fileURLToPath(new URL(`../../../../${p}`, import.meta.url));
/** the label photo Rakesh sends: the story's own, with the statutory sticker (SC-147) */
const LABEL = REPO('agents/evals/vision/images/story-clean.webp');
/** the destruction's evidence, made for the packs left (evidence/, Qwen-Image, with sidecars); the slow week's
 *  (144 packs) where none was made for this count, which Vision's count and slate checks will then not pass */
const EVIDENCE = (which: 'before' | 'after', left: number) => {
	const made = fileURLToPath(new URL(`evidence/${HERO}-${which}-${left}.webp`, import.meta.url));
	return existsSync(made) ? made : REPO(`design3/system/img/evidence/${HERO}-${which}.webp`);
};
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
/** how fast a signer's pen moves on the pad: milliseconds between its points */
const PEN = 12;
const re = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const num = (n: number | undefined) => (n ?? 0).toLocaleString('en-IN');
type Figures = { net: number; swing: number; units: number; kg: number };
const figuresOf = (c: Case | null) => (c as (Case & { ledger?: { figures?: Figures } | null }) | null)?.ledger?.figures;

/** the green cards: only the major moments of the flow, in business terms */
const WHY = {
	verified: {
		tag: 'Trust',
		title: 'Verified before any price',
		text: "Vision reads the carton label in Rakesh's photo and matches its batch, dates and MRP to the DMS export. No match, no plan: nothing is priced or sold on a guess."
	},
	approve: {
		tag: 'Control',
		title: 'Nothing moves without a yes',
		text: "The agents have prepared the ExpireSoon listing and the kirana scheme. Priya's one tap releases them, and every step after it is logged in her name."
	},
	live: {
		tag: 'Live',
		title: 'Every order, as it lands',
		text: "The kirana ordered on the phone a moment ago. It reaches Priya's Execution at once, with its GST invoice from Rakesh already issued: no spreadsheet, no phone calls."
	},
	window: {
		tag: 'Why',
		title: 'Closing the offer window early',
		text: `The kiranas' offer stays open 48 hours and closes on its own timer. In the demo Neha closes it now: ${BUY.length} shops ordered and the rest said no, so the packets no shop took stay at Rakesh Traders' godown.`
	},
	invoice: {
		tag: 'GST',
		title: 'Invoiced from his own Tally',
		text: "Rakesh issues the buyer's tax invoice from Tally, an e-invoice with its IRN. Every kirana's order already carries its own invoice in his series, and Munchly's credit notes and GST memo match them."
	},
	report: {
		tag: 'Why',
		title: 'Expiry day, brought forward',
		text: "The batch's report falls due on its best-before, 18 Nov on the story's calendar. Report now treats today as expiry day: the journey closes as it stands, and the packs left at the godown are destroyed there, against evidence and Priya's second yes."
	},
	destroy: {
		tag: 'Compliance',
		title: 'Destroyed against evidence, signed in place',
		text: "An authorised agency destroys the packs nobody bought. Rakesh sends photos before and after, and the agency's officer, two independent witnesses and Rakesh sign its certificate here, at the facility. Munchly pays only on that evidence."
	},
	certificate: {
		tag: 'Audit',
		title: 'Evidence an auditor accepts',
		text: 'The certificate names the goods, batch, quantity and weight, the reason, the method and facility, the time window and every signature, with a log from the godown to the landfill. One PDF, ready for the auditor.'
	},
	gst: {
		tag: 'Finance',
		title: 'GST, accounted for',
		text: 'Input credit is kept on every pack sold and reversed only on the packs destroyed or given away, as section 17(5)(h) requires. Every invoice and credit note is counted from the papers themselves.'
	},
	impact: {
		tag: 'ESG',
		title: 'Impact, from the ledger',
		text: "Kilos kept out of landfill, kilos destroyed and the CO₂e avoided come from each batch's own ledger, not an estimate: ready for BRSR Principle 6 and Munchly's EPR reporting."
	},
	whole: {
		tag: 'Distributor',
		title: 'Rakesh ends whole',
		text: "Every rupee Rakesh paid for the batch comes back to him: from his kiranas, the buyer, and Munchly's credit notes, the expiry note among them. Clearing it cost him nothing."
	}
} satisfies Record<string, Note>;
/** the cards whose figures are the case's own */
const NOTE = {
	risk: (c: Case): Note => ({
		tag: 'Risk',
		title: `${inr(Math.round(c.writeOff?.total ?? 0))} at stake`,
		text: `${num(c.batch.assess?.atRisk)} packs will not sell before quick-commerce stops taking them. Destroying them would cost Munchly ${inr(Math.round(c.writeOff?.total ?? 0))}: the stock, the GST credit reversed, disposal and EPR.`
	}),
	split: (c: Case): Note => {
		const lines = (c.plan?.lines ?? []) as { id: string; units: number; price?: number }[];
		const k = lines.find((l) => l.id === 'kirana');
		const es = lines.find((l) => l.id === 'expiresoon');
		return {
			tag: 'Router',
			title: 'Every exit priced, one split',
			text: `${num(k?.units)} packets to Rakesh Traders' 38 kiranas${k?.price ? ` at ₹${k.price} effective` : ''}, as many as they can sell in 14 days, and ${num(es?.units)} to ExpireSoon${es?.price ? ` at ₹${es.price}` : ''}: ${inr(c.plan?.net)} net, where the bin would cost ${inr(Math.round(c.writeOff?.total ?? 0))}.`
		};
	},
	lister: (units: number): Note => ({
		tag: 'Marketplace',
		title: "Sold where it won't undercut",
		text: `${num(units)} packs listed on ExpireSoon, a B2B marketplace for short-dated stock, hidden from buyers in Munchly's own territories, so the lot never competes with its distributors. The reserve price stays private.`
	}),
	no: (others: number): Note => ({
		tag: 'Kiranas',
		title: 'A no is an answer too',
		text: `A shop that says Not this time keeps its 48 hours to change its mind. The other ${others} shops said the same from their own phones: only ${BUY.length} of 38 ordered, and the rest of the scheme's packets will stay at Rakesh's godown.`
	}),
	counter: (offer: string): Note => ({
		tag: 'Negotiator',
		title: 'Countered, not undersold',
		text: `Agrawal Wholesale bid ₹13 a pack. The Negotiator countered above Munchly's reserve, ${offer.replace(/^Accept /, '')}, and the buyer takes it with a 15% token to lock the lot. The reserve is never shown.`
	}),
	secondYes: (credit?: number | null): Note => ({
		tag: 'Second yes',
		title: 'Money moves only on proof',
		text: `Vision's checks and the four signatures are in front of Priya. Her approval issues the expiry credit note to Rakesh${credit ? `, ${inr(credit)}` : ''}: the dealer price, the GST he reverses and the agency's charges. Until she says yes, nothing is paid.`
	}),
	swing: (c: Case | null): Note => {
		const f = figuresOf(c);
		return {
			tag: 'Outcome',
			title: f ? `${inr(Math.round(f.swing))} better than destroying it` : 'Better than destroying it',
			text: f
				? `Even with only ${BUY.length} kiranas buying, ${inr(Math.round(f.net))} was recovered and ${num(f.kg)} kg of food sold on instead of sent to a landfill. Below, every figure behind the swing, the packs destroyed at the godown included.`
				: 'Below, every figure behind the swing: what the bin would have cost, what each exit made, and the P&L with the plan.'
		};
	}
};

/** the packets the plan offers the kiranas, and those left at the godown once the window closes */
let planned = 0;
const left = () => planned - ORDERED;
const plannedOf = (c: Case | null) => c?.plan?.lines.find((l) => l.id === 'kirana')?.units ?? 0;
/** a screen's own content: the app's banners (a push arriving on a screen that stays signed in) sit outside it */
const main = (page: Page) => page.locator('#main');
/** Priya's Execution, open all along: a card on it, seen as it changes over the live stream, never by a reload. `badge`
 *  reads the card's own badge (the ExpireSoon card names its four stops, Collected among them, all along) */
async function watch(s: Stage, card: string | RegExp, shows: RegExp | string, did: string, rest = 1300, badge = false) {
	const ex = await s.open('priya', `/execution/${HERO}`, did);
	const el = main(ex).locator('.card', { hasText: card }).first();
	const live = await expect(badge ? el.locator('.badge').first() : el)
		.toContainText(shows, { timeout: 45_000 })
		.then(() => true)
		.catch(() => false);
	if (!live) running().find('error', `/execution/${HERO}`, `${String(card)} did not show ${String(shows)} live`);
	await s.point(el, rest);
	return { ex, el };
}

const STEPS: Step[] = [
	{
		id: 'signin',
		title: 'Priya signs in on her tablet, Rakesh on his, and Neha in the console on the phone',
		card: 'Everyone signs in',
		async run(s) {
			await s.open('priya', '/command', "signs in to Munchly's workspace on her tablet");
			await running().done('Priya signed in: her Command Center');
			await s.open('rakesh', '/home', "signs in to Munchly's workspace on his tablet");
			await running().done('Rakesh signed in: his Today');
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
			await expect(page.getByRole('group', { name: 'Watcher: scheduled runs and timers' })).toContainText(
				'After Setup is confirmed'
			);
			await running().done('Journey reset to day 0, 08:00');
			// Priya's and Rakesh's tablets stay signed in, and catch up with the fresh journey
			await s.refresh('priya');
			await s.refresh('rakesh');
			await running().done("Priya's and Rakesh's tablets on the fresh journey");
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
		title: 'Rakesh gives Smart-Clearance the one-time permission on his tablet',
		async run(s) {
			const page = await s.open('rakesh', '/home', 'allows the agents to act for Rakesh Traders');
			const ask = main(page).locator('.card', { hasText: 'Let Smart-Clearance act for Rakesh Traders' }).first();
			const given = main(page).getByText('Smart-Clearance acts for you').first();
			await expect(ask.or(given).first()).toBeVisible();
			if (await ask.isVisible()) {
				await s.point(ask, 900);
				await s.click(main(page).getByRole('button', { name: 'Allow', exact: true }));
				await expect(given).toBeVisible();
				await running().done('Permission given');
			} else {
				await s.point(given, 700);
				await running().done('Permission given before: Smart-Clearance acts for Rakesh Traders');
			}
		}
	},
	{
		id: 'detect',
		title: "The Watcher flags the chips: Neha runs this morning's check from the console",
		card: 'The Watcher finds the risk',
		async run(s) {
			if (!(await caseAs('priya'))) {
				const page = await s.open('neha', '/clients/munchly/agents', "runs the Watcher's daily check now");
				const go = page.getByRole('button', { name: 'Run now: Watcher, daily check' });
				await expect(go).toBeEnabled();
				await s.click(go);
				await running().done('Watcher run from the console');
			}
			const c = await until('the Watcher flags MF-2409-117 and Vision asks for its label photo', 'priya', (c) =>
				['requested', 'reading', 'verified'].includes(c.journey.photo.status)
			);
			const page = await s.open('priya', `/command/${HERO}`, 'sees the chips flagged on the Command Center');
			await expect(main(page).getByText('Masala Chips 150 g').first()).toBeVisible();
			story('Write-off at Detect', c.writeOff?.total, 26329.6);
			await s.spot(
				main(page)
					.getByText(/if destroyed/)
					.first(),
				NOTE.risk(c)
			);
			await running().done('Command Center: the chips at risk, −₹26,330 if destroyed');
		}
	},
	{
		id: 'photo',
		title: "Rakesh sends the chips' label photo, and Vision validates it",
		card: 'Vision checks the label',
		async run(s) {
			const page = await s.open('rakesh', `/photo/${HERO}`, 'uploads the label photo from the godown');
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
			const c = await until(
				'the Valuer and the Router plan MF-2409-117',
				'priya',
				(c) => c.journey.phase === 'planned'
			);
			story('Plan net', c.plan?.net, 21770);
			for (const l of c.plan?.lines ?? []) running().figure(`Plan line ${l.id}`, `${l.units} packs`);
			const cc = await s.open('priya', `/command/${HERO}`, 'sees the plan arrive on her Command Center');
			await expect(main(cc).getByText(inr(c.plan?.net)).first()).toBeAttached({ timeout: 60_000 });
			await s.point(main(cc).locator('.card', { hasText: 'Masala Chips' }).first(), 1100);
			await running().done(`Command Center: the plan ready, ${inr(c.plan?.net)}`);
			const opener = main(cc)
				.getByRole('button', { name: /Open Route Room/ })
				.or(main(cc).getByRole('link', { name: /Open Route Room/ }))
				.first();
			if (await opener.isVisible().catch(() => false)) {
				await s.click(opener, 600);
				await expect(cc).toHaveURL(new RegExp(`/route/${HERO}`));
			}
			const page = await s.open('priya', `/route/${HERO}`, 'reads the Route Room down to its split, and approves it');
			const body = main(page);
			const review = body.getByRole('button', { name: 'Review and approve', exact: true });
			await expect(review).toBeVisible();
			await s.point(body.getByText('Label, read from the shelf').first(), 700);
			await s.point(body.locator('.chart').first(), 900);
			const bars = body.locator('.chart g');
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
			await running().done('The approve sheet: the ExpireSoon lot and the kirana scheme');
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
		title: 'The Lister lists the lot on ExpireSoon and Outreach sends the scheme to all 38 kiranas',
		card: 'The kiranas answer, live',
		async run(s) {
			const c = await until('the Lister lists the lot and Outreach sends the scheme', 'priya', (c) =>
				Boolean(c.journey.listing && c.journey.offer)
			);
			planned = plannedOf(c);
			story('Kiranas offered the scheme', c.journey.offer?.shops, OFFERED.length);
			story('ExpireSoon lot', `${c.journey.listing?.units} packs at ₹${c.journey.listing?.price}`, '772 packs at ₹15');
			await s.stat('offered', 'kiranas offered', String(c.journey.offer?.shops ?? 0));
			const ex = await s.open(
				'priya',
				`/execution/${HERO}`,
				'keeps Execution open to watch the agents carry out the plan'
			);
			await s.spot(
				main(ex).locator('.card', { hasText: 'Lister · ExpireSoon' }).first(),
				NOTE.lister(c.journey.listing?.units ?? 0)
			);
			await s.point(
				main(ex)
					.locator('.card', { hasText: /Outreach · \d+ kiranas/ })
					.first(),
				1300
			);
			await running().done('Execution: the lot listed, the scheme sent');
			const page = await s.open('rakesh', `/orders/${HERO}`, 'watches his kiranas answer the scheme on Orders');
			await expect(main(page)).toContainText(/scheme/i);
			await s.point(main(page).locator('.card').first(), 900);
			await running().done("Rakesh's Orders: the scheme sent to his 38 kiranas");
		}
	},
	{
		id: 'orders',
		title: `${BUY.length} kiranas order their share on the phone, and Priya sees each order arrive live on Execution`,
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			running().figure('Plan line kirana', `${planned} packets`);
			const priya = await s.open('priya', `/execution/${HERO}`, "watches the kiranas' scheme on Execution");
			const count = main(priya).getByText('kiranas ordered').first();
			await s.point(count, 500);
			await running().done('Execution: the scheme sent, no order yet');
			for (const [i, k] of BUY.entries()) {
				const page = await s.open(k.member, `/offer/${HERO}`, `orders ${k.orders} packets (${i + 1} of ${BUY.length})`);
				const order = main(page).getByRole('button', { name: new RegExp(`· ${k.orders} packets`) });
				const placed = main(page)
					.getByText(/ऑर्डर हो गया|Ordered · \d+/)
					.first();
				await expect(order.or(placed).first()).toBeVisible();
				if (await order.isVisible()) {
					await s.point(main(page).getByText(/₹\d/).first(), 700);
					await s.click(order);
					await expect(placed).toBeVisible();
				} else running().find('note', `/offer/${HERO}`, `${k.name} had already ordered`);
				await s.stat('ordered', 'shops ordered', String(i + 1));
				await running().done(`${k.name} ordered ${k.orders} packets`);
				await s.run.act('Priya Deshmukh', 'Supply Chain', `sees ${k.name}'s order arrive live on Execution`);
				await s.active('operator');
				const row = main(priya).locator('.row.between', { hasText: k.name }).first();
				const live = await row
					.waitFor({ state: 'visible', timeout: 45_000 })
					.then(() => true)
					.catch(() => false);
				if (!live)
					running().find(
						'error',
						`/execution/${HERO}`,
						`${k.name}'s order did not reach Priya's Execution screen within 45 s without a reload`
					);
				if (i === 0) await s.spot(row, WHY.live);
				else await s.point(row, 1200);
				await s.point(count, 600);
				await running().done(`Live on Priya's tablet: ${k.name}, ${k.orders} packets (${i + 1} of 38 shops)`);
			}
			const c = await until(
				`the ${BUY.length} orders are in`,
				'priya',
				(c) => c.journey.orders.length === BUY.length,
				60_000
			);
			story(
				'Kirana orders',
				`${c.journey.orders.length} shops, ${c.journey.orders.reduce((t, o) => t + o.units, 0)} packets`,
				`${BUY.length} shops, ${ORDERED} packets`
			);
		}
	},
	{
		id: 'declines',
		title: `${SAYS_NO.name} says Not this time on the phone; the other ${NO_BACKEND.length} shops say the same from their own`,
		async run(s) {
			const page = await s.open(SAYS_NO.member, '/home', 'reads the scheme, and says Not this time');
			const no = main(page).getByRole('button', { name: 'Not this time' });
			const said = main(page).getByText('You said not this time').first();
			await expect(no.or(said).first()).toBeVisible();
			if (await no.isVisible()) {
				await s.point(main(page).getByText(/₹\d/).first(), 900);
				await s.click(no);
				await expect(said).toBeVisible();
			} else running().find('note', '/home', `${SAYS_NO.name} had already said no`);
			await s.spot(said, NOTE.no(NO_BACKEND.length));
			await s.stat('declined', 'said Not this time', '1');
			await running().done(`${SAYS_NO.name}: Not this time`);
			// the rest answer from their own phones meanwhile, as themselves, while Priya's tablet stays on Execution
			await s.run.act(
				'Priya Deshmukh',
				'Supply Chain',
				'watches Execution while the other shops answer from their phones'
			);
			await s.active('operator');
			const priya = await s.open('priya', `/execution/${HERO}`, 'watches Execution while the other shops say no');
			await s.point(main(priya).getByText('kiranas ordered').first(), 300);
			let declined = 1;
			for (const k of NO_BACKEND) {
				try {
					await api('workspace', k.member, `${WS}/cases/${HERO}/offer/decline`, {
						method: 'POST',
						headers: { 'idempotency-key': randomUUID() }
					});
					declined++;
					await s.stat('declined', 'said Not this time', String(declined));
				} catch (e) {
					running().find('warning', `/offer/${HERO}`, `${k.name} could not say no: ${(e as Error).message}`);
				}
			}
			for (const k of NEVER)
				running().find(
					'note',
					`/offer/${HERO}`,
					`${k.name} never joined the app (its invitation is open): it cannot answer`
				);
			story('Kiranas who said Not this time', declined, REST.length - NEVER.length);
			await s.point(main(priya).getByText('kiranas ordered').first(), 1200);
			await running().done(
				`${BUY.length} shops ordered, ${declined} said Not this time${NEVER.length ? `, ${NEVER.length} never answered` : ''}`
			);
		}
	},
	{
		id: 'deal',
		title: 'Agrawal Wholesale bids on ExpireSoon, the Negotiator counters, Agrawal takes it; Priya sees the lot won',
		card: 'The ExpireSoon lot',
		async run(s) {
			const van = await s.open('rakesh', `/van/${HERO}`, "waits on Deliveries: the buyer's truck, once the lot is won");
			await expect(main(van)).toContainText(/truck/i);
			await running().done('Rakesh on Deliveries');
			const page = await s.open('agrawal', '/market', 'finds the chips lot on ExpireSoon and bids ₹13');
			await s.click(main(page).getByRole('button', { name: 'View lot' }).first());
			await expect(page).toHaveURL(/\/listing/);
			const bid = main(page).getByRole('button', { name: /^Bid ₹13\.00 for 772/ });
			await expect(bid).toBeVisible();
			await running().done('The lot on ExpireSoon');
			await s.click(bid);
			await running().done('Bid ₹13 a packet');
			const accept = main(page).getByRole('button', { name: /^Accept ₹/ });
			await expect(accept).toBeVisible({ timeout: AGENT_WAIT });
			const offer = (await accept.innerText()).replace(/\s+/g, ' ');
			running().figure('Counter', offer);
			await running().done('The Negotiator countered');
			await s.spot(accept, NOTE.counter(offer));
			await s.click(accept);
			const c = await until('the lot is awarded', 'priya', (c) => Boolean(c.journey.award));
			story(
				'Award',
				`${c.journey.award?.units} packs at ₹${c.journey.award?.price}, token ₹${c.journey.award?.token}`,
				'772 packs at ₹14.2, token ₹1644'
			);
			await expect(
				main(page)
					.getByText(/won|Lot won/i)
					.first()
			).toBeVisible();
			await running().done('Agrawal took the counter and paid the token');
			await watch(s, 'Lister · ExpireSoon', /awarded/, 'sees the lot awarded on Execution', 1500, true);
			await running().done("Live on Priya's tablet: the lot won by Agrawal Wholesale");
			await expect(main(van).getByText('Load once the scheme closes')).toBeVisible({ timeout: 30_000 });
			await s.open('rakesh', `/van/${HERO}`, 'sees the truck wait for the scheme to close');
			await s.point(main(van).getByText('Load once the scheme closes'), 900);
			await running().done("Rakesh's Deliveries: the truck loads once the scheme closes");
		}
	},
	{
		id: 'window',
		title: "Neha closes the kiranas' offer window from the console, short of its packets",
		card: 'The window closes short',
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			const page = await s.open(
				'neha',
				'/clients/munchly/agents',
				`closes the offer window now: ${BUY.length} shops ordered, the rest said no`
			);
			const close = page.getByRole('button', { name: `Close now: Outreach, offer window closes, ${HERO}` });
			await expect(close).toBeEnabled();
			await s.spot(close, WHY.window);
			await s.click(close);
			const alert = page.getByRole('alertdialog', { name: /Close the offer window now/ });
			await expect(alert).toBeVisible();
			await running().done('Close the offer window now?');
			await s.click(alert.getByRole('button', { name: 'Close now' }));
			await expect(alert).toBeHidden();
			const c = await until('the scheme closes', 'priya', (c) => c.journey.offer?.status === 'closed', 60_000);
			story(
				'Scheme closed with',
				`${c.journey.orders.length} shops, ${c.journey.orders.reduce((t, o) => t + o.units, 0)} packets`,
				`${BUY.length} shops, ${ORDERED} packets`
			);
			story('ExpireSoon lot after the window', c.journey.listing?.units, 772);
			await s.stat('left', 'packets left at the godown', String(left()));
			const priya = await s.open('priya', `/execution/${HERO}`, 'sees the scheme close short on Execution');
			const ended = main(priya)
				.getByText(/The window ended/)
				.first();
			await expect(ended).toBeVisible({ timeout: 45_000 });
			await expect(ended).toContainText(/stayed at Rakesh Traders' godown/);
			await s.point(ended, 1300);
			await running().done(`Execution: the window ended, ${left()} packets stayed at the godown`);
		}
	},
	{
		id: 'truck',
		title: "Rakesh loads the buyer's truck; Priya sees the lot collected",
		async run(s) {
			const page = await s.open('rakesh', `/van/${HERO}`, "loads Agrawal Wholesale's truck at the godown");
			const load = main(page).getByRole('button', { name: "Load the buyer's truck", exact: true });
			await expect(load).toBeEnabled({ timeout: 30_000 });
			await s.click(load);
			await until('the truck is dispatched', 'rakesh', (c) => c.journey.truck.status === 'dispatched', 60_000);
			await running().done('The truck loaded: 772 packs to Raipur');
			await watch(s, 'Lister · ExpireSoon', /collected/, 'sees the lot collected on Execution', 1300, true);
			await running().done("Live on Priya's tablet: the lot collected");
		}
	},
	{
		id: 'papers',
		title: 'Paperwork drafts the pack; Rakesh issues his invoice from Tally and runs his van round',
		async run(s) {
			const c = await until(
				'Paperwork drafts the papers',
				'rakesh',
				(c) => c.journey.phase === 'settled' && c.docs.length > 0
			);
			for (const d of c.docs) running().figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status})`);
			const invoiceNo = c.docs.find((d) => d.id === 'invoice')?.no ?? '';
			const page = await s.open('rakesh', `/orders/${HERO}`, 'issues his invoice from Tally');
			const sold = main(page).locator('.dist-order').filter({ hasText: invoiceNo });
			await s.click(sold.getByRole('button', { name: 'Issue from Tally' }));
			await expect(sold.getByText('issued from Tally', { exact: true })).toBeVisible();
			await s.spot(sold, WHY.invoice);
			await running().done(`Invoice ${invoiceNo} issued from Tally`);
			const van = await s.open('rakesh', `/van/${HERO}`, `runs his van round to the ${BUY.length} shops that ordered`);
			const round = main(van).getByRole('button', { name: 'Start the round', exact: true });
			await expect(round).toBeEnabled();
			await s.point(round, 600);
			await s.click(round);
			await until('the van round is done', 'priya', (c) => c.journey.van.status === 'done', 60_000);
			await running().done(`The van round: ${BUY.length} shops delivered`);
		}
	},
	{
		id: 'report',
		title: 'Neha fires expiry day from the console: Rakesh is asked to destroy what is left at his godown',
		card: 'Expiry day',
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			const page = await s.open('neha', '/clients/munchly/agents', "fires expiry day's report for the chips");
			const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
			await expect(fire).toBeEnabled();
			await s.spot(fire, WHY.report);
			await s.click(fire);
			const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
			await expect(alert).toBeVisible();
			await running().done('Report now: Expire it and report now?');
			await s.click(alert.getByRole('button', { name: 'Report now' }));
			await expect(alert).toBeHidden();
			const c = await until('the destruction is asked for', 'priya', (c) => !!c.destruction);
			story('Ledger posted before the yes', String(c.journey.posted), 'false');
			story('Destruction', c.destruction?.status, 'requested');
			story('Left at the godown', c.realised?.godown, left());
			for (const l of c.realised?.lines ?? []) running().figure(`Realised ${l.id}`, `${l.units} packs`);
			story(
				'Expiry settlement',
				c.expiry ? `${c.expiry.units} packs, ${c.expiry.policy}, destroyed by ${c.expiry.destroyedBy}` : '(none)',
				`${left()} packs, godown, destroyed by distributor`
			);
			running().figure('Expiry credit note on the yes', inr(c.expiry?.amount ?? undefined));
			await running().done(`Expiry day: ${left()} packs to destroy at Kalamna godown`);
			await watch(s, 'Destruction at the godown', /./, 'sees the destruction asked for on Execution', 1600);
			await running().done("Live on Priya's tablet: the destruction asked of Rakesh");
		}
	},
	{
		id: 'destroy',
		title:
			'Rakesh destroys the packs through the agency, the four sign the certificate in place, he sends the evidence; Vision checks the photos',
		card: 'Destroyed against evidence',
		async run(s) {
			const asked = await until('the destruction is asked for', 'priya', (c) => !!c.destruction, 120_000);
			const units = asked.destruction!.units;
			const page = await s.open('rakesh', '/home', `opens the destruction of ${units} expired packs on Today`);
			const step = main(page).getByRole('button', { name: 'Send the evidence', exact: true }).first();
			await expect(step).toBeVisible();
			await running().done(`Today: destroy ${units} expired packs at your godown`);
			await s.click(step);
			await expect(page).toHaveURL(new RegExp(`/destroy/${HERO}`));
			await s.address('distributor');
			const body = main(page);
			await expect(body.getByRole('button', { name: /Send to .* for approval/ })).toBeDisabled();
			await s.spot(body.locator('.dz-slot').first(), WHY.destroy);
			await s.upload(body.getByRole('button', { name: 'Upload the before photo' }), EVIDENCE('before', units));
			await s.upload(body.getByRole('button', { name: 'Upload the after photo' }), EVIDENCE('after', units));
			await expect(body.locator('.dz-slot .cam-tag', { hasText: '1 · Before' })).toBeVisible();
			await running().done('The photo before, at the godown, and after, at the landfill with the slate');
			await s.select(body.getByLabel('Agency', { exact: true }), 'Orange City Enviro Services');
			await s.type(body.getByLabel("Agency's certificate number"), 'OCE/DC/26-27/0219');
			await running().done('Orange City Enviro Services, its certificate OCE/DC/26-27/0219');
			await s.point(body.getByLabel('Destroyed from'), 500);
			await s.point(body.getByLabel('To', { exact: true }), 500);
			await s.point(body.getByLabel('Witness 1 · name'), 600);
			await s.point(body.getByLabel('Witness 2 · name'), 600);
			await running().done('The window and the two witnesses who sign the certificate with the agency’s officer');
			await s.point(body.getByText('Sign the certificate').first(), 900);
			await signCertificate(page, body, (l) => s.click(l, 400), PEN);
			await s.point(body.getByText('4 of 4 signed').first(), 900);
			await running().done('The certificate signed in place: the officer, both witnesses and Rakesh');
			await s.click(body.getByRole('button', { name: /Send to .* for approval/ }), 150);
			await expect(body.getByText(/Vision is checking/).first()).toBeVisible({ timeout: 15_000 });
			const slots = body.locator('.dz-slot img');
			for (let i = 0, n = Math.min(await slots.count(), 2); i < n; i++) await s.point(slots.nth(i), 900);
			await running().done('Vision is checking the two photos: the label, the count, the slate, the landfill', 200);
			const c = await until("Vision checks the destruction's evidence", 'priya', (c) =>
				['checked', 'approved'].includes(c.destruction?.status ?? '')
			);
			for (const x of c.destruction!.checks)
				running().figure(`Vision: ${x.id}`, `${x.ok ? 'ok' : 'not ok'} · ${x.label}`);
			const ok = c.destruction!.checks.filter((x) => x.ok).length;
			story("Vision's checks passed", `${ok} of ${c.destruction!.checks.length}`, '4 of 4');
			await expect(body.getByText('Sent for approval')).toBeVisible({ timeout: 30_000 });
			await running().done(`Validated: Vision's checks ${ok} of ${c.destruction!.checks.length}, sent for approval`);
		}
	},
	{
		id: 'destroyed',
		title:
			"Priya reviews the evidence from Execution, reads Vision's checks and the four signatures, and gives her second yes",
		async run(s) {
			const before = (await caseAs('priya'))!;
			const { ex, el } = await watch(
				s,
				'Destruction at the godown',
				/./,
				'sees the evidence arrive on Execution, checked by Vision',
				900
			);
			const review = el.getByRole('button', { name: 'Review and approve' });
			await expect(review).toBeVisible({ timeout: 45_000 });
			await running().done("Execution: the destruction's evidence, waiting for her yes");
			await s.click(review);
			const sheet = ex.getByRole('dialog', { name: 'Approve the destruction' });
			await expect(sheet).toBeVisible();
			await expect(sheet.locator('img.cam-feed')).toHaveCount(2);
			const photos = sheet.locator('img.cam-feed');
			for (let i = 0; i < 2; i++) await s.point(photos.nth(i), 900);
			for (const x of before.destruction?.checks ?? []) {
				const line = sheet.getByText(x.label).first();
				if (!x.ok)
					await s.spot(line, {
						tag: 'Vision',
						title: 'A check not passed',
						text: `${x.label}. Vision's count is an estimate from a photo of heaped crates, one of its four checks; the batch, the slate and the place are read separately. The yes stays Priya's, with the photos in front of her.`
					});
				else await s.point(line, 700);
			}
			await running().done('The review: both photos, and Vision’s four checks read one by one');
			await s.point(sheet.getByText('The certificate, as signed at the facility').first(), 600);
			const signed = sigs(sheet);
			for (let i = 0, n = Math.min(await signed.count(), 4); i < n; i++) await s.point(signed.nth(i), 900);
			await running().done('The certificate as signed: the officer, both witnesses and Rakesh, each in its place');
			const issue = sheet.getByRole('button', { name: 'Approve · issue the papers' });
			await s.point(sheet.getByText(/Expiry credit note to/).first(), 700);
			await s.spot(issue, NOTE.secondYes(before.expiry?.amount));
			await s.click(issue);
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			story('Destruction', c.destruction?.status, 'approved');
			const paper = c.docs.find((d) => d.id === 'expiry');
			const cert = c.docs.find((d) => d.id === 'destruction');
			story('Expiry credit note', paper?.amount ?? undefined, before.expiry?.amount ?? 0);
			story('Certificate of destruction', cert?.status, 'generated');
			running().figure('Certificate', `${cert?.no} (${cert?.units} packs)`);
			running().figure('Actual net', inr(c.actual?.net));
			await watch(s, 'Destruction at the godown', /approved/i, 'sees the destruction approved on Execution', 1200);
			await s.point(main(ex).getByText('Expiry settlement', { exact: true }).first(), 1400);
			await running().done(`Impact reported: ${paper?.no}, certificate ${cert?.no}; the chips cleared`);
		}
	},
	{
		id: 'pack',
		title:
			"Priya reads every paper in the pack (the certificate and its log, the credit notes, the tax invoice, the GST memo, the kiranas' invoices) and marks it reviewed",
		card: 'The papers',
		async run(s) {
			const c = (await caseAs('priya'))!;
			const page = await s.open('priya', `/paperwork/${HERO}`, 'reads every paper in the pack, then marks it reviewed');
			const body = main(page);
			await expect(body.locator('.docgrid')).toBeVisible();
			await s.point(body.locator('.docgrid'), 1300);
			const rank = (id: string) => ['destruction', 'expiry', 'invoice', 'support', 'itc'].indexOf(id) + 1 || 9;
			const docs = c.docs.filter((d) => d.status !== 'not required').sort((a, b) => rank(a.id) - rank(b.id));
			for (const d of docs) {
				const card = body.getByRole('button', { name: re(d.type) }).first();
				if (!(await card.count())) continue;
				await readPaper(s, page, card, d.id === 'destruction' ? WHY.certificate : undefined);
				await running().done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}, read in full`, 300);
			}
			// the kiranas' tax invoices: the register, then each shop's invoice in full
			const register = body.getByRole('button', { name: /Tax invoices to kiranas/ }).first();
			if (await register.count()) {
				const opened = await readPaper(s, page, register, undefined, true);
				await running().done(`The sales register: ${BUY.length} tax invoices to the kiranas`);
				for (let i = 0; i < BUY.length; i++) {
					// an invoice opens in the register's place: the register is opened again for the next
					if (i > 0) {
						const back = (opened.inSheet ? page.getByRole('dialog').last() : body)
							.getByRole('button', { name: /^All \d+ invoices/ })
							.first();
						if (await back.isVisible().catch(() => false)) await s.click(back, 500);
					}
					const link = (opened.inSheet ? page.getByRole('dialog').last() : body).locator('button.tl-link').nth(i);
					if (!(await link.isVisible().catch(() => false))) break;
					await readPaper(s, page, link, undefined, true);
					await running().done(`A kirana's tax invoice, read in full (${i + 1} of ${BUY.length})`);
				}
				if (opened.inSheet) await closeSheet(s, page);
			} else running().find('warning', `/paperwork/${HERO}`, 'no card for the kiranas’ tax invoices in the pack');
			const mark = body.getByRole('button', { name: 'Mark reviewed', exact: true });
			if (await mark.isVisible().catch(() => false)) {
				await s.click(mark);
				await until('the review is recorded', 'priya', (c) => c.journey.reviewed, 30_000);
				await running().done('Pack reviewed');
			}
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
			const bp = await s.open('priya', `/report/${HERO}`, "reads the batch's own impact: its BRSR line and evidence");
			await s.click(bp.locator('.bh-tabs').getByRole('button', { name: 'Impact' }), 700);
			await expect(main(bp)).toContainText(/BRSR/);
			await s.point(main(bp).getByText(/BRSR/).first(), 1800);
			await running().done("The batch's Impact: its BRSR line, the kilos destroyed, the evidence");
		}
	},
	{
		id: 'his',
		title: 'Rakesh reads his batch on his tablet: what happened, how he ends whole, every paper and the photos he sent',
		card: 'Rakesh and his kiranas',
		async run(s) {
			const page = await s.open('rakesh', `/batches/${HERO}`, 'reads the chips: what happened, his money and papers');
			const body = main(page);
			await expect(body).toContainText('You sent the label photo');
			await s.point(body.getByText('You sent the label photo').first(), 1000);
			await running().done('His batch: what happened');
			const tabs = page.locator('.bh-tabs');
			await s.click(tabs.getByRole('button', { name: 'Money' }));
			await expect(body).toContainText('You end whole');
			await s.spot(body.getByText('You end whole').first(), WHY.whole);
			await running().done('His batch: he ends whole');
			await s.click(tabs.getByRole('button', { name: 'Papers' }));
			await expect(body).toContainText('Your papers');
			const papers = body.locator('button.pt-paper');
			for (let i = 0, n = await papers.count(); i < n; i++) {
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
				await running().done(`His paper: ${name}`, 300);
			}
			await s.click(tabs.getByRole('button', { name: 'Photos' }));
			await expect(body).toContainText('Vision read');
			const shots = body.locator('img');
			for (let i = 0, n = Math.min(await shots.count(), 3); i < n; i++) await s.point(shots.nth(i), 900);
			await running().done('His batch: the photos he sent, and what Vision read from each');
		}
	},
	{
		id: 'shops',
		title: `On the phone: ${BUY[0]!.name} reads its order and tax invoice; ${SAYS_NO.name} reads the offer it said no to`,
		async run(s) {
			const buyer = BUY[0]!;
			const page = await s.open(buyer.member, `/offer/${HERO}`, 'reads its order and its tax invoice');
			await expect(
				main(page)
					.getByText(/ऑर्डर हो गया|Ordered · \d+/)
					.first()
			).toBeVisible();
			const inv = main(page)
				.getByRole('button', { name: /Tax invoice/ })
				.first();
			if (await inv.isVisible().catch(() => false)) await readPaper(s, page, inv);
			else
				await s.point(
					main(page)
						.getByText(/Tax invoice/)
						.first(),
					900
				);
			await running().done(`${buyer.name}: its order, and its tax invoice read in full`);
			const p2 = await s.open(SAYS_NO.member, `/offer/${HERO}`, 'reads the offer it said no to');
			const said = main(p2)
				.getByText(/You said not this time|declined/i)
				.first();
			if (
				await said
					.waitFor({ state: 'visible', timeout: 10_000 })
					.then(() => true)
					.catch(() => false)
			)
				await s.point(said, 1200);
			else running().find('warning', `/offer/${HERO}`, `${SAYS_NO.name}'s offer does not say it said no`);
			await running().done(`${SAYS_NO.name}: the offer it said no to`);
		}
	},
	{
		id: 'swing',
		title: 'Priya shows the swing on the chips, and how it is worked out',
		card: 'The swing, worked out',
		async run(s) {
			const done = await caseAs('priya');
			await showSwing(s, HERO, 'Masala Chips', NOTE.swing(done));
			const f = figuresOf(done);
			if (f) running().figure('Swing', inr(f.swing));
		}
	}
];

test.describe.configure({ mode: 'serial' });

// eslint-disable-next-line no-empty-pattern
test('Munchly Chips Sad Path E2E: two kiranas buy, the rest say no, the packs destroyed at the godown', async ({}, info) => {
	test.setTimeout(100 * 60_000);
	const video = info.outputPath('recording.mp4');
	const s = await Stage.open(
		info,
		{
			flow: 'Munchly Chips Sad Path E2E',
			batch: `MF-2409-117 · Masala Chips 150 g · Rakesh Traders, Nagpur · recorded ${WHEN}`
		},
		video,
		{
			phone: 'Kiranas, Agrawal Wholesale on ExpireSoon and Neha in the console sign in here as they are needed.',
			ink: 'green',
			notes: 'card',
			quiet: true
		}
	);
	const run = s.run;
	begin(run, HERO);
	// a custom token is good for an hour: minted again before a step once 40 minutes have gone
	let minted = Date.now();
	mint(PEOPLE);
	let error: string | undefined;
	const cards = STEPS.filter((x) => x.card);
	try {
		// the three screens on their apps' sign-in screens, fully drawn; the recording starts before anyone signs in
		await s.ready({ operator: 'workspace', distributor: 'workspace', phone: 'console' });
		await s.record();
		const at = (id: string) => STEPS.findIndex((x) => x.id === id);
		const from = process.env.E2E_FROM ? at(process.env.E2E_FROM) : 1;
		const to = process.env.E2E_UNTIL ? at(process.env.E2E_UNTIL) : STEPS.length - 1;
		// the sign-ins always run first: a resumed run starts signed out too
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
