import { expect, test, type Locator, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mint } from './auth.ts';
import { HERO } from './chips.ts';
import { signCertificate } from './destruction.ts';
import { AGENT_WAIT, begin, caseAs, inr, running, story, STORY, until, type Case } from './flow.ts';
import { Stage } from './stage.ts';

// Munchly Chips Sad Path E2E (SC-179, SC-184): the Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from a
// fresh journey, on three screens at once (stage.ts): Priya, Munchly's supply chain operator, on a tablet in landscape,
// and Rakesh, the distributor, on a tablet in portrait, each signing in on camera at the start and online to the end;
// and a phone for everyone else, on which each kirana, Agrawal Wholesale on ExpireSoon and Neha in the Smart-Clearance
// console sign in as they are needed, on the app's own sign-in screen (the password check answered with their own
// session: no password is typed). Every click shows: the cursor glides to it and ripples where it lands. The stage is
// recorded as one video.
//
// The sad path: of Rakesh's 38 kiranas offered the scheme, only E2E_BUYERS (2) order their share, and Priya watches
// each order arrive on her Execution screen as it is placed. Agrawal Wholesale wins the ExpireSoon lot; Neha closes the
// scheme's window from the console on the rest, short of its packets, and they stay at the godown. Rakesh loads the
// buyer's truck, issues his invoice and runs his van round to the shops that ordered. Neha fires expiry day: Munchly's
// policy destroys what is left at Rakesh's godown (SC-139, route B). Rakesh sends the evidence (the photos before and
// after, made for the packs left, the agency, its certificate number, the window the agency destroyed them in and the
// two witnesses who sign with its officer, SC-174), the four signing the certificate in place on his tablet, each
// signature drawn stroke by stroke (SC-183), and Vision validates the photos on live Gemini while his tablet shows it
// checking. Priya reads Vision's checks one by one and the certificate as signed, and gives her second yes; Impact
// reports, and the agency's certificate of destruction is issued with the four signatures as drawn. Then Priya reads
// the certificate and its log, the Expiry credit note, glances at the kiranas' tax invoices, and reads the Impact
// screens; Rakesh reads his batch and his signed certificate; the phone reads a buyer's order and a shop's closed offer.
//
// E2E_BUYERS (2): how many of the ordering kiranas order, the first in the story's order; the window closes on the rest.
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts.
// E2E_FROM=<step id> resumes on the journey as it stands (the sign-ins always run); E2E_UNTIL=<step id> stops after it.
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
/** every other shop: the window closes on them, unanswered */
const REST = OFFERED.filter((k) => !BUY.includes(k));
/** one of them reads its offer once the window has closed */
const CLOSED_ON = REST.find(joined)!;
const ORDERED = BUY.reduce((t, k) => t + k.orders, 0);
if (!(BUYERS >= 1 && BUYERS < 31))
	throw new Error('E2E_BUYERS must be 1 to 30: some kiranas order, the window closes on the rest');
const PEOPLE = ['neha', 'priya', 'rakesh', 'agrawal', ...BUY.map((k) => k.member), CLOSED_ON.member];

const REPO = (p: string) => fileURLToPath(new URL(`../../../../${p}`, import.meta.url));
/** the label photo Rakesh sends: the story's own, with the statutory sticker (SC-147) */
const LABEL = REPO('agents/evals/vision/images/story-clean.webp');
/** the destruction's evidence, made for the packs left (evidence/, Qwen-Image, with sidecars); the slow week's
 *  (144 packs) where none was made for this count, which Vision's count and slate checks will then not pass */
const EVIDENCE = (which: 'before' | 'after', left: number) => {
	const made = fileURLToPath(new URL(`evidence/${HERO}-${which}-${left}.webp`, import.meta.url));
	return existsSync(made) ? made : REPO(`design3/system/img/evidence/${HERO}-${which}.webp`);
};

type Step = { id: string; title: string; run: (s: Stage) => Promise<void> };
/** how fast a signer's pen moves on the pad: milliseconds between its points */
const PEN = 12;

/** the packets the plan offers the kiranas, and those left at the godown once the window closes */
let planned = 0;
const left = () => planned - ORDERED;
const plannedOf = (c: Case | null) => c?.plan?.lines.find((l) => l.id === 'kirana')?.units ?? 0;
/** a screen's own content: the app's banners (a push arriving on a screen that stays signed in) sit outside it */
const main = (page: Page) => page.locator('#main');
// a signature on a paper: a specimen's image, or the ink drawn on the certificate at the facility (SC-183)
const sigs = (scope: Locator) => scope.locator('img[alt^="Signed by"], svg[role="img"][aria-label^="Signed by"]');
/** the cursor reads down a list of things on screen, resting on each */
async function readEach(s: Stage, items: Locator, most = 8, rest = 450) {
	const n = Math.min(await items.count(), most);
	for (let i = 0; i < n; i++) await s.point(items.nth(i), rest);
	return n;
}

const STEPS: Step[] = [
	{
		id: 'signin',
		title: 'Priya signs in on her tablet, Rakesh on his, and Neha in the console on the phone',
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
			await s.click(sheet.getByRole('radio', { name: PRESETS[DAY_MINUTES] ?? /Rehearsal/ }));
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
			await s.click(main(page).getByRole('button', { name: 'Confirm and start watching' }));
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
			await expect(main(page).getByText('Let Smart-Clearance act for Rakesh Traders')).toBeVisible();
			await s.click(main(page).getByRole('button', { name: 'Allow', exact: true }));
			await expect(main(page).getByText('Smart-Clearance acts for you')).toBeVisible();
			await running().done('Permission given');
		}
	},
	{
		id: 'detect',
		title: 'The Watcher flags the chips: Neha runs it from the console',
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
			running().figure('Flagged phase', c.journey.phase);
			const page = await s.open('priya', `/command/${HERO}`, 'sees the chips flagged on the Command Center');
			await expect(main(page).getByText('Masala Chips 150 g').first()).toBeVisible();
			story('Write-off at Detect', c.writeOff?.total, 26329.6);
			await s.point(
				main(page)
					.getByText(/if destroyed/)
					.first()
			);
			await running().done('Command Center: the chips at risk, −₹26,330 if destroyed');
		}
	},
	{
		id: 'photo',
		title: "Rakesh sends the chips' label photo, and Vision validates it",
		async run(s) {
			const page = await s.open('rakesh', `/photo/${HERO}`, 'uploads the label photo from the godown');
			await s.upload(main(page).getByRole('button', { name: 'Upload a photo', exact: true }), LABEL);
			await running().done('The label photo chosen');
			await s.click(main(page).getByRole('button', { name: 'Send photo', exact: true }), 150);
			await running().done('Vision is reading the label', 200);
			await expect(main(page).getByText(/Dhanyavaad/)).toBeVisible({ timeout: AGENT_WAIT });
			await s.point(
				main(page)
					.getByText(/Verified|matches your records/)
					.first()
			);
			await running().done('Vision validated the label: the batch, its dates and MRP match the export');
		}
	},
	{
		id: 'approve',
		title: 'The Valuer prices it, the Router plans it, and Priya approves the plan',
		async run(s) {
			const c = await until(
				'the Valuer and the Router plan MF-2409-117',
				'priya',
				(c) => c.journey.phase === 'planned'
			);
			story('Plan net', c.plan?.net, 21770);
			for (const l of c.plan?.lines ?? []) running().figure(`Plan line ${l.id}`, `${l.units} packs`);
			const page = await s.open('priya', `/route/${HERO}`, 'reviews the plan in the Route Room and approves it');
			const review = main(page).getByRole('button', { name: 'Review and approve', exact: true });
			await expect(review).toBeVisible();
			await running().done('Route Room: the plan, waiting for a yes');
			await s.click(review);
			const sheet = page.getByRole('dialog', { name: 'Approve the plan' });
			await expect(sheet).toBeVisible();
			await running().done('The approve sheet');
			await s.click(sheet.getByRole('button', { name: 'Approve · release the agents' }));
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
		async run(s) {
			const c = await until('the Lister lists the lot and Outreach sends the scheme', 'priya', (c) =>
				Boolean(c.journey.listing && c.journey.offer)
			);
			planned = plannedOf(c);
			story('Kiranas offered the scheme', c.journey.offer?.shops, OFFERED.length);
			story('ExpireSoon lot', `${c.journey.listing?.units} packs at ₹${c.journey.listing?.price}`, '772 packs at ₹15');
			await s.stat('offered', 'kiranas offered', String(c.journey.offer?.shops ?? 0));
			await s.open('priya', `/execution/${HERO}`, 'watches the agents carry out the plan');
			await running().done('Execution: the lot listed, the scheme sent');
			const page = await s.open('rakesh', `/orders/${HERO}`, 'watches his kiranas answer the scheme on Orders');
			await expect(main(page)).toContainText(/scheme/i);
			await running().done("Rakesh's Orders: the scheme sent to his 38 kiranas");
		}
	},
	{
		id: 'orders',
		title: `${BUY.length} kiranas order their share on the phone, and Priya sees each order arrive live on Execution`,
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			running().figure('Plan line kirana', `${planned} packets`);
			// Priya's tablet stays on Execution: each order reaches it over the live stream, never by a reload
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
					await s.point(main(page).getByText(/₹\d/).first(), 500);
					await s.click(order);
					await expect(placed).toBeVisible();
				} else running().find('note', `/offer/${HERO}`, `${k.name} had already ordered`);
				await s.stat('ordered', 'shops ordered', String(i + 1));
				await running().done(`${k.name} ordered ${k.orders} packets`);
				// on Priya's tablet, as it happens: the order in the scheme's latest orders, the count moved on
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
				await s.point(row, 900);
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
			story('Scheme after the orders', c.journey.offer?.status, 'sent');
			running().figure('Shops the window will close on', REST.length);
			running().figure('Packets no shop took', left());
		}
	},
	{
		id: 'deal',
		title: 'Agrawal Wholesale bids on ExpireSoon, the Negotiator counters, Agrawal takes it',
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
			running().figure('Counter', (await accept.innerText()).replace(/\s+/g, ' '));
			await running().done('The Negotiator countered');
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
			// the truck waits for the scheme, still open to the shops that said not this time (SC-118)
			await expect(main(van).getByText('Load once the scheme closes')).toBeVisible({ timeout: 30_000 });
			await s.point(main(van).getByText('Load once the scheme closes'));
			await running().done("Rakesh's Deliveries: the truck loads once the scheme closes");
		}
	},
	{
		id: 'window',
		title: "Neha closes the kiranas' offer window from the console, short of its packets",
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			const page = await s.open(
				'neha',
				'/clients/munchly/agents',
				`closes the offer window now: ${BUY.length} shops ordered, ${REST.length} did not`
			);
			const close = page.getByRole('button', { name: `Close now: Outreach, offer window closes, ${HERO}` });
			await expect(close).toBeEnabled();
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
			// the lot was already won, so the shortfall does not move onto it: the packets stay at the godown
			story('ExpireSoon lot after the window', c.journey.listing?.units, 772);
			await s.stat('left', 'packets left at the godown', String(left()));
			// Priya's tablet is still on Execution: the window's end reaches it live, and says where the packets stayed
			const priya = await s.open('priya', `/execution/${HERO}`, 'sees the scheme close short on Execution');
			const ended = main(priya)
				.getByText(/The window ended/)
				.first();
			await expect(ended).toBeVisible({ timeout: 45_000 });
			await expect(ended).toContainText(/stayed at Rakesh Traders' godown/);
			await s.point(ended, 900);
			await running().done(`Execution: the window ended, ${left()} packets stayed at the godown`);
		}
	},
	{
		id: 'truck',
		title: "Rakesh loads the buyer's truck",
		async run(s) {
			const page = await s.open('rakesh', `/van/${HERO}`, "loads Agrawal Wholesale's truck at the godown");
			const load = main(page).getByRole('button', { name: "Load the buyer's truck", exact: true });
			await expect(load).toBeEnabled({ timeout: 30_000 });
			await s.click(load);
			await until('the truck is dispatched', 'rakesh', (c) => c.journey.truck.status === 'dispatched', 60_000);
			await running().done('The truck loaded: 772 packs to Raipur');
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
			await running().done(`Invoice ${invoiceNo} issued from Tally`);
			const van = await s.open('rakesh', `/van/${HERO}`, `runs his van round to the ${BUY.length} shops that ordered`);
			const round = main(van).getByRole('button', { name: 'Start the round', exact: true });
			await expect(round).toBeEnabled();
			await s.click(round);
			await until('the van round is done', 'priya', (c) => c.journey.van.status === 'done', 60_000);
			await running().done(`The van round: ${BUY.length} shops delivered`);
		}
	},
	{
		id: 'report',
		title: 'Neha fires expiry day from the console: Rakesh is asked to destroy what is left at his godown',
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			await s.open('priya', '/command', 'waits on her Command Center');
			const page = await s.open('neha', '/clients/munchly/agents', "fires expiry day's report for the chips");
			const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
			await expect(fire).toBeEnabled();
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
		}
	},
	{
		id: 'destroy',
		title:
			'Rakesh destroys the packs through the agency, names who signs its certificate, sends the evidence; Vision validates the photos',
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
			await s.upload(body.getByRole('button', { name: 'Upload the before photo' }), EVIDENCE('before', units));
			await s.upload(body.getByRole('button', { name: 'Upload the after photo' }), EVIDENCE('after', units));
			await expect(body.locator('.dz-slot .cam-tag', { hasText: '1 · Before' })).toBeVisible();
			await running().done('The photo before, at the godown, and after, at the landfill with the slate');
			await s.select(body.getByLabel('Agency', { exact: true }), 'Orange City Enviro Services');
			await s.type(body.getByLabel("Agency's certificate number"), 'OCE/DC/26-27/0219');
			await running().done('Orange City Enviro Services, its certificate OCE/DC/26-27/0219');
			// who signs the certificate: the window it destroyed them in, and the agency's two independent witnesses
			await s.point(body.getByLabel('Destroyed from'), 500);
			await s.point(body.getByLabel('To', { exact: true }), 500);
			await s.point(body.getByLabel('Witness 1 · name'), 600);
			await s.point(body.getByLabel('Witness 2 · name'), 600);
			await running().done('The window and the two witnesses who sign the certificate with the agency’s officer');
			// the certificate signed in place (SC-183): each of the four signs in their own place on his tablet, drawing
			// their signature on the pad stroke by stroke
			await s.point(body.getByText('Sign the certificate').first(), 700);
			await running().done('The certificate to sign, laid out from what he entered, stamped TO SIGN');
			await signCertificate(page, body, (l) => s.click(l, 400), PEN);
			await s.point(body.getByText('4 of 4 signed').first(), 700);
			await running().done('The certificate signed in place: the officer, both witnesses and Rakesh');
			await s.click(body.getByRole('button', { name: /Send to .* for approval/ }), 150);
			await expect(body.getByText(/Vision is checking/).first()).toBeVisible({ timeout: 15_000 });
			// the photos stay in view while Vision checks them (SC-180)
			await readEach(s, body.locator('.dz-slot img'), 2, 700);
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
		title: "Priya reads Vision's checks on the evidence one by one and gives her second yes; Impact reports",
		async run(s) {
			const before = (await caseAs('priya'))!;
			const page = await s.open('priya', '/command', "reviews the destruction's evidence");
			const review = main(page).getByRole('button', { name: 'Review the destruction', exact: true });
			await expect(review).toBeVisible({ timeout: 30_000 });
			await running().done('Command Center: the destruction waits for her yes');
			await s.click(review);
			const sheet = page.getByRole('dialog', { name: 'Approve the destruction' });
			await expect(sheet).toBeVisible();
			await expect(sheet.locator('img.cam-feed')).toHaveCount(2);
			await readEach(s, sheet.locator('img.cam-feed'), 2, 700);
			for (const x of before.destruction?.checks ?? []) await s.point(sheet.getByText(x.label).first(), 600);
			await running().done('The review: both photos, and Vision’s four checks read one by one');
			// the certificate as signed at the facility, each signature drawing itself as it was signed (SC-183)
			await s.point(sheet.getByText('The certificate, as signed at the facility').first(), 600);
			await readEach(s, sigs(sheet), 4, 900);
			await s.point(sheet.getByText(/Four signatures on the certificate/).first(), 700);
			await running().done('The certificate as signed: the officer, both witnesses and Rakesh, each in its place');
			await s.point(sheet.getByText(/Expiry credit note to/).first(), 700);
			await running().done('What her yes issues: the Expiry credit note and the agency’s certificate');
			await s.click(sheet.getByRole('button', { name: 'Approve · issue the papers' }));
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			story('Destruction', c.destruction?.status, 'approved');
			const paper = c.docs.find((d) => d.id === 'expiry');
			const cert = c.docs.find((d) => d.id === 'destruction');
			story('Expiry credit note', paper?.amount ?? undefined, before.expiry?.amount ?? 0);
			story('Certificate of destruction', cert?.status, 'generated');
			running().figure('Certificate', `${cert?.no} (${cert?.units} packs)`);
			running().figure('Actual net', inr(c.actual?.net));
			await expect(
				main(page)
					.getByText(/Cleared · [\d,]+ packs destroyed at the godown/)
					.first()
			).toBeVisible({ timeout: 30_000 });
			await running().done(`Impact reported: ${paper?.no}, certificate ${cert?.no}; the chips cleared`);
		}
	},
	{
		id: 'certificate',
		title: 'Priya reads the certificate of destruction: what was destroyed, where and when, and who signed it',
		async run(s) {
			const page = await s.open('priya', `/paperwork/${HERO}`, 'opens the certificate of destruction in the pack');
			const body = main(page);
			await s.click(body.getByRole('button', { name: /Destruction certificate/ }).first(), 600);
			await expect(body.getByText('Destruction log').first()).toBeVisible();
			await running().done('The certificate of destruction, page 1');
			// the goods, the reason, the method and the facility, read down the page
			for (const what of [/Reason/, /Method/, /Facility|facility/, /Date and time/])
				await s.point(body.getByText(what).first(), 450);
			await running().done('The certificate: the reason, the method, the facility, the date and time');
			// signed: the agency's supervising officer and the two witnesses, and Rakesh for the packs he handed over
			const signed = await readEach(s, sigs(body), 6, 800);
			story('Certificate: signatures (officer, two witnesses, handed over)', signed >= 4 ? 'signed' : signed, 'signed');
			await running().done(`The certificate signed: ${signed} signatures, the officer’s under the agency’s seal`);
			await s.point(body.getByText('Destruction log').first(), 500);
			await readEach(s, body.locator('img[alt^="Initialled by"]'), 3, 500);
			await running().done(
				'Page 2, the destruction log: each step’s time, initialled by the officer and the witnesses'
			);
		}
	},
	{
		id: 'pack',
		title: "Priya reads the Expiry credit note, glances at the kiranas' tax invoices, and marks the pack reviewed",
		async run(s) {
			const page = await s.open('priya', `/paperwork/${HERO}`, 'reads the Expiry credit note');
			const body = main(page);
			const c = (await caseAs('priya'))!;
			await s.click(body.getByRole('button', { name: /Expiry credit note/ }).first(), 600);
			await s.point(sigs(body).first(), 700);
			await running().done(`The Expiry credit note ${c.docs.find((d) => d.id === 'expiry')?.no}, signed for Munchly`);
			for (const id of ['invoice', 'support', 'itc'] as const) {
				const d = c.docs.find((x) => x.id === id);
				if (!d) continue;
				await s.click(body.getByRole('button', { name: new RegExp(d.type) }).first(), 500);
				await s.point(sigs(body).first(), 400);
				await running().done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}, signed`, 600);
			}
			// the kiranas' tax invoices, one for each order (SC-153): the register, then each invoice at a glance
			const register = body.getByRole('button', { name: /Tax invoices to kiranas/ }).first();
			if (await register.count()) {
				await s.click(register, 600);
				await expect(body).toContainText('Sales Register');
				await running().done(`The sales register: ${BUY.length} tax invoices to the kiranas`);
				const numbers = (c.journey.orders ?? [])
					.map((o) => o.invoice?.no)
					.filter((x): x is string => !!x)
					.sort();
				for (const no of numbers) {
					// an invoice opens in the register's place: the register is opened again for the next
					if (!(await body.getByText('Sales Register').count())) await s.click(register, 500);
					const link = body.getByRole('button', { name: new RegExp(no.replace(/\//g, '\\/')) }).first();
					if (!(await link.count())) {
						running().find('warning', `/paperwork/${HERO}`, `no link to ${no} in the sales register`);
						continue;
					}
					await s.click(link, 900);
					await s.point(body.getByText(/Shree|Kirana|Stores/).first(), 500);
					await running().done(`A glance at ${no}`, 500);
				}
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
		id: 'esg',
		title:
			"Priya reads the Impact screens: the quarter's food and CO₂e, where the kilos went, and the batch's BRSR line",
		async run(s) {
			const page = await s.open('priya', '/report?reading=impact', 'reads the Impact dashboard for the quarter');
			const body = main(page);
			await expect(body).toContainText('Food, by week');
			await readEach(s, body.getByText(/Kept out of landfill|Destroyed|CO₂e avoided/), 3, 600);
			await running().done('Impact: kept out of landfill, destroyed, CO₂e avoided');
			await s.point(body.getByText('Food, by week').first(), 600);
			await s.scroll(page, 0.55);
			await running().done('Impact: food, by week');
			await s.point(body.getByText('Where the kilos went').first(), 700);
			await s.scroll(page, 0.55);
			await running().done('Impact: where the kilos went, by distributor');
			const product = body.getByRole('group', { name: 'Group by' }).getByRole('button', { name: 'Product' });
			if (await product.count()) {
				await s.click(product, 600);
				await running().done('Impact: by product');
			}
			await s.open('priya', `/report/${HERO}`, "reads the batch's own impact: its BRSR line and evidence");
			await s.click(page.locator('.bh-tabs').getByRole('button', { name: 'Impact' }), 700);
			await expect(body).toContainText(/BRSR/);
			await s.point(body.getByText(/BRSR/).first(), 800);
			await running().done("The batch's Impact: its BRSR line, the kilos destroyed, the evidence");
			const cc = await s.open('priya', '/command', "reads the Command Center's Impact card");
			const card = cc.locator('.imc');
			if (await card.count()) {
				await s.point(card, 900);
				await running().done("Command Center: the quarter's Impact card");
			}
		}
	},
	{
		id: 'his',
		title: 'Rakesh reads his batch on his tablet: his money, his signed certificate and the photos he sent',
		async run(s) {
			const page = await s.open('rakesh', `/batches/${HERO}`, 'reads the chips: what happened, his money and papers');
			const body = main(page);
			await expect(body).toContainText('You sent the label photo');
			await running().done('His batch: what happened');
			await s.click(page.locator('.bh-tabs').getByRole('button', { name: 'Money' }));
			await expect(body).toContainText('You end whole');
			await s.point(body.getByText('You end whole').first(), 600);
			await running().done('His batch: he ends whole');
			await s.click(page.locator('.bh-tabs').getByRole('button', { name: 'Papers' }));
			await expect(body).toContainText('Your papers');
			for (const name of [/Expiry credit note/, /Certificate of destruction|Destruction certificate/]) {
				const card = body.getByRole('button', { name }).first();
				if (!(await card.count())) {
					running().find('warning', `/batches/${HERO}`, `no ${name.source} in his papers`);
					continue;
				}
				await s.click(card, 700);
				await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
				await readEach(s, sigs(page.getByRole('dialog').last()), 5, 500);
				await running().done(`His papers: ${name.source.split('|')[0]}, signed`);
				await page.keyboard.press('Escape');
			}
			await s.click(page.locator('.bh-tabs').getByRole('button', { name: 'Photos' }));
			await expect(body).toContainText('Vision read');
			await running().done('His batch: the photos he sent, and what Vision read from each');
		}
	},
	{
		id: 'shops',
		title: `On the phone: ${BUY[0]!.name} reads its order and tax invoice; ${CLOSED_ON.name} reads the offer the window closed on`,
		async run(s) {
			const buyer = BUY[0]!;
			const page = await s.open(buyer.member, `/offer/${HERO}`, 'reads its order and its tax invoice');
			await expect(
				main(page)
					.getByText(/ऑर्डर हो गया|Ordered · \d+/)
					.first()
			).toBeVisible();
			await s.point(
				main(page)
					.getByText(/Tax invoice/)
					.first(),
				700
			);
			await running().done(`${buyer.name}: its order and its tax invoice`);
			const p2 = await s.open(CLOSED_ON.member, `/offer/${HERO}`, 'reads the offer it did not order on');
			const over = main(p2)
				.getByText(/closed|ended|Expired/i)
				.first();
			if (
				await over
					.waitFor({ state: 'visible', timeout: 10_000 })
					.then(() => true)
					.catch(() => false)
			)
				await s.point(over, 800);
			else
				running().find('warning', `/offer/${HERO}`, `${CLOSED_ON.name}'s offer does not say the window closed on it`);
			await running().done(`${CLOSED_ON.name}: the window closed before it ordered`);
		}
	},
	{
		id: 'close',
		title: 'Priya reads what was left at the godown and how it settled, and the batch in the ledger',
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			const page = await s.open('priya', `/execution/${HERO}`, 'reads what was left at the godown and how it settled');
			await s.point(main(page).getByText('Expiry settlement', { exact: true }), 800);
			await running().done(`Execution: ${left()} packs left at the godown, destroyed there`);
			await s.open('priya', `/report/${HERO}`, "reads the batch's money in the ledger");
			await running().done("The ledger: the batch's money");
			await s.open('priya', '/command', 'sees the Command Center at the end');
			await running().done('Command Center at the end');
		}
	}
];

test.describe.configure({ mode: 'serial' });

// eslint-disable-next-line no-empty-pattern
test('Munchly Chips Sad Path E2E: two kiranas buy, the window closes on the rest, the packs destroyed at the godown', async ({}, info) => {
	test.setTimeout(90 * 60_000);
	const video = info.outputPath('recording.mp4');
	const s = await Stage.open(
		info,
		{ flow: 'Munchly Chips Sad Path E2E', batch: 'MF-2409-117 · Masala Chips 150 g · Rakesh Traders, Nagpur' },
		video
	);
	const run = s.run;
	begin(run, HERO);
	// a custom token is good for an hour: minted again before a step once 40 minutes have gone
	let minted = Date.now();
	mint(PEOPLE);
	let error: string | undefined;
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
		// the recording kept beside the run's report, where the runs/ folder keeps each run's record (it is git-ignored)
		const keep = process.env.E2E_KEEP;
		if (keep && existsSync(video)) {
			mkdirSync(dirname(keep), { recursive: true });
			copyFileSync(video, keep);
		}
	}
});
