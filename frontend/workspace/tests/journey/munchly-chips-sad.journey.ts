import { expect, test, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mint } from './auth.ts';
import { HERO } from './chips.ts';
import { listerCard, schemeCard } from './features.ts';
import { AGENT_WAIT, begin, caseAs, inr, running, story, STORY, until, type Case } from './flow.ts';
import { Stage } from './stage.ts';

// Munchly Chips Sad Path E2E (SC-179): the Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from a fresh
// journey, on three screens at once (stage.ts): Priya, Munchly's supply chain operator, on a laptop; Rakesh, the
// distributor, on a tablet; and a phone for everyone else. Priya and Rakesh sign in once and stay signed in, their
// screens moving with the journey; the phone signs in each kirana, Agrawal Wholesale on ExpireSoon, and Neha in the
// Smart-Clearance console, as each is needed. The stage is recorded as one video.
//
// The sad path: of Rakesh's 38 kiranas offered the scheme, only E2E_BUYERS (2) order their share; every other shop
// says Not this time. Agrawal Wholesale still wins the ExpireSoon lot, so its packs leave; Neha closes the scheme's
// window from the console, short of its packets, and they stay at the godown. Rakesh loads the buyer's truck, issues his
// invoice and runs his van round to the shops that ordered. Neha fires expiry day: Munchly's policy destroys what is
// left at Rakesh's godown (SC-139, route B), so he sends the evidence (the photos before and after, made for the packs
// left, the agency, its certificate number, the window and the witnesses, SC-174), Vision checks it on live Gemini, and
// Priya gives her second yes. Impact reports: the Expiry credit note and the agency's certificate of destruction. Then
// the papers are read back on each screen, signed (SC-174).
//
// E2E_BUYERS (2): how many of the ordering kiranas order, the first in the story's order; every other kirana declines.
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts.
// E2E_FROM=<step id> resumes on the journey as it stands; E2E_UNTIL=<step id> stops after that step.
// E2E_LIVE=0 hides the stage window (it is still recorded).

const BUYERS = Number(process.env.E2E_BUYERS ?? 2);
const DAY_MINUTES = Number(process.env.E2E_DAY_MINUTES ?? 60);
const PRESETS: Record<number, RegExp> = { 1440: /Real time/, 60: /Rehearsal/, 5: /Demo/, 1: /Fast/ };
/** Rakesh's 38 kiranas, in the story's order: every one is offered the scheme */
const OFFERED = STORY.kiranas.filter((k) => k.distributor === 'rakesh');
const BUY = OFFERED.filter((k) => k.orders > 0).slice(0, BUYERS);
/** a shop whose owner joined the app: one only invited (Shree Sai Kirana, in the story) cannot sign in to answer */
const joined = (k: (typeof OFFERED)[number]) =>
	(STORY.members.find((m) => m.id === k.member) as { status?: string } | undefined)?.status === 'active';
const DECLINE = OFFERED.filter((k) => !BUY.includes(k) && joined(k));
/** the shops offered the scheme that never joined the app, so cannot answer it: the window closes on them */
const SILENT = OFFERED.filter((k) => !BUY.includes(k) && !joined(k));
const ORDERED = BUY.reduce((t, k) => t + k.orders, 0);
if (!(BUYERS >= 1 && BUYERS < 31)) throw new Error('E2E_BUYERS must be 1 to 30: some kiranas order, the rest decline');
const PEOPLE = ['neha', 'priya', 'rakesh', 'agrawal', ...[...BUY, ...DECLINE].map((k) => k.member)];

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

/** the packets the plan offers the kiranas, and those left at the godown once the window closes */
let planned = 0;
const left = () => planned - ORDERED;
const plannedOf = (c: Case | null) => c?.plan?.lines.find((l) => l.id === 'kirana')?.units ?? 0;
/** what the scheme's offer carries beyond the shared type: the shops that said not this time */
type Offer = { status: string; declined?: Record<string, unknown> };
const offerOf = (c: Case) => c.journey.offer as unknown as Offer | null;
const signatures = async (page: Page) => page.locator('#main img[alt^="Signed by"]').count();
/** a screen's own content: the app's banners (a push arriving on a screen that stays signed in) sit outside it */
const main = (page: Page) => page.locator('#main');

const STEPS: Step[] = [
	{
		id: 'reset',
		title: "Neha starts Munchly's journey again from the console, on the phone",
		async run(s) {
			const page = await s.open(
				'neha',
				'/clients/munchly/agents',
				`resets Munchly's journey, at ${DAY_MINUTES} min a journey day`
			);
			await page.getByRole('button', { name: 'Actions for Munchly Foods' }).click();
			await page.getByRole('menuitem', { name: /Reset journey/ }).click();
			const sheet = page.getByRole('dialog', { name: /journey again/ });
			await sheet.getByRole('radio', { name: PRESETS[DAY_MINUTES] ?? /Rehearsal/ }).check();
			await running().done('Reset journey: the day length');
			await sheet.getByRole('button', { name: 'Reset journey' }).click();
			await expect(sheet).toBeHidden();
			await expect(page.getByRole('group', { name: 'Watcher: scheduled runs and timers' })).toContainText(
				'After Setup is confirmed'
			);
			await running().done('Journey reset to day 0, 08:00');
		}
	},
	{
		id: 'signin',
		title: 'Priya signs in on her laptop and Rakesh on his tablet: both stay signed in to the end',
		async run(s) {
			await s.open('priya', '/command', 'signs in to Munchly’s workspace on her laptop');
			await running().done('Priya signed in: the Command Center');
			await s.open('rakesh', '/home', 'signs in to Munchly’s workspace on his tablet');
			await running().done('Rakesh signed in: his Today');
		}
	},
	{
		id: 'setup',
		title: "Priya confirms Setup: the stock export's mapping and the guardrails",
		async run(s) {
			const page = await s.open('priya', '/setup', 'opens Setup and confirms the mapping and the guardrails');
			await expect(main(page).getByText('Mapped · confirm below')).toBeVisible({ timeout: AGENT_WAIT });
			await running().done('Setup: the export mapped');
			const confirm = main(page).getByRole('button', { name: 'Confirm and start watching' });
			await confirm.scrollIntoViewIfNeeded();
			await confirm.click();
			await expect(main(page).getByRole('button', { name: 'Open Command Center' })).toBeVisible();
			await running().done('Setup confirmed: the Watcher starts at 09:00');
		}
	},
	{
		id: 'permission',
		title: 'Rakesh gives Smart-Clearance the one-time permission on his tablet',
		async run(s) {
			const page = await s.open('rakesh', '/home', 'allows the agents to act for Rakesh Traders');
			await expect(main(page).getByText('Let Smart-Clearance act for Rakesh Traders')).toBeVisible();
			await main(page).getByRole('button', { name: 'Allow', exact: true }).click();
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
				await go.click();
				await running().done('Watcher run from the console');
			}
			const c = await until('the Watcher flags MF-2409-117 and Vision asks for its label photo', 'priya', (c) =>
				['requested', 'reading', 'verified'].includes(c.journey.photo.status)
			);
			running().figure('Flagged phase', c.journey.phase);
			const page = await s.open('priya', `/command/${HERO}`, 'sees the chips flagged on the Command Center');
			await expect(main(page).getByText('Masala Chips 150 g').first()).toBeVisible();
			story('Write-off at Detect', c.writeOff?.total, 26329.6);
			await running().done('Command Center: the chips at risk, Vision waiting for the label photo');
		}
	},
	{
		id: 'photo',
		title: "Rakesh sends the chips' label photo from his tablet",
		async run(s) {
			const page = await s.open('rakesh', `/photo/${HERO}`, 'uploads the label photo from the godown');
			await expect(main(page).getByRole('button', { name: 'Upload a photo' })).toBeVisible();
			await page.locator('input[type=file]:not([capture])').setInputFiles(LABEL);
			await running().done('The label photo chosen');
			await main(page).getByRole('button', { name: 'Send photo' }).click();
			await expect(main(page).getByText(/Dhanyavaad/)).toBeVisible({ timeout: AGENT_WAIT });
			await running().done('Vision read the label');
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
			const review = main(page).getByRole('button', { name: 'Review and approve' });
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
			await expect(page.locator('#main')).toContainText(/scheme/i);
			await running().done("Rakesh's Orders: the scheme sent to his 38 kiranas");
		}
	},
	{
		id: 'orders',
		title: `${BUY.length} kiranas order their share; ${DECLINE.length} say Not this time${SILENT.length ? `; ${SILENT.length} never joined the app` : ''}`,
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			running().figure('Plan line kirana', `${planned} packets`);
			const all = OFFERED.length;
			for (const [i, k] of BUY.entries()) {
				const page = await s.open(k.member, `/offer/${HERO}`, `orders ${k.orders} packets (${i + 1} of ${all})`);
				const order = main(page).getByRole('button', { name: new RegExp(`· ${k.orders} packets`) });
				const placed = main(page)
					.getByText(/ऑर्डर हो गया|Ordered · \d+/)
					.first();
				await expect(order.or(placed)).toBeVisible();
				if (await order.isVisible()) {
					await order.click();
					await expect(placed).toBeVisible();
				} else running().find('note', `/offer/${HERO}`, `${k.name} had already ordered`);
				await s.stat('ordered', 'shops ordered', String(i + 1));
				await running().done(`${k.name} ordered ${k.orders} packets`);
			}
			for (const [i, k] of DECLINE.entries()) {
				const page = await s.open(
					k.member,
					'/home',
					`reads the scheme and says Not this time (${BUY.length + i + 1} of ${all})`
				);
				const no = main(page).getByRole('button', { name: 'Not this time' });
				const said = main(page).getByText('You said not this time');
				await expect(no.or(said)).toBeVisible();
				if (await no.isVisible()) {
					await no.click();
					await expect(said).toBeVisible();
				}
				await s.stat('declined', 'said not this time', String(i + 1));
				await running().done(`${k.name}: Not this time`, 300);
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
			const declined = Object.keys(offerOf(c)?.declined ?? {}).length;
			story('Kiranas that said Not this time', declined, DECLINE.length);
			for (const k of SILENT)
				running().find(
					'note',
					`/offer/${HERO}`,
					`${k.name} was offered the scheme but has not joined the app (its invitation is open), so it cannot answer: the window closes on it`
				);
			if (SILENT.length) {
				running().figure('Never joined the app', SILENT.map((k) => k.name).join(', '));
				await s.stat('silent', 'never joined the app', String(SILENT.length));
			}
			story('Scheme after the answers', c.journey.offer?.status, 'sent');
			running().figure('Packets no shop took', left());
			const page = await s.open('priya', `/execution/${HERO}`, 'reads the scheme: two orders, the rest declined');
			await schemeCard(page, c, 'open');
		}
	},
	{
		id: 'deal',
		title: 'Agrawal Wholesale bids on ExpireSoon, the Negotiator counters, Agrawal takes it',
		async run(s) {
			const van = await s.open('rakesh', `/van/${HERO}`, "waits on Deliveries: the buyer's truck, once the lot is won");
			await expect(van.locator('#main')).toContainText(/truck/i);
			await running().done('Rakesh on Deliveries');
			const page = await s.open('agrawal', '/market', 'finds the chips lot on ExpireSoon and bids ₹13');
			await main(page).getByRole('button', { name: 'View lot' }).first().click();
			await expect(page).toHaveURL(/\/listing/);
			const bid = main(page).getByRole('button', { name: /^Bid ₹13\.00 for 772/ });
			await expect(bid).toBeVisible();
			await running().done('The lot on ExpireSoon');
			await bid.click();
			await running().done('Bid ₹13 a packet');
			const accept = main(page).getByRole('button', { name: /^Accept ₹/ });
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
			await expect(
				main(page)
					.getByText(/won|Lot won/i)
					.first()
			).toBeVisible();
			await running().done('Agrawal took the counter and paid the token');
			// the truck waits for the scheme, still open to the shops that said not this time (SC-118)
			await expect(main(van).getByText('Load once the scheme closes')).toBeVisible({ timeout: 30_000 });
			await running().done("Rakesh's Deliveries: the truck loads once the scheme closes");
			await listerCard(s.pane('laptop'), c, 'awarded');
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
				`closes the offer window now: ${BUY.length} shops ordered, ${DECLINE.length} said not this time${SILENT.length ? `, ${SILENT.length} never answered` : ''}`
			);
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
				`${BUY.length} shops, ${ORDERED} packets`
			);
			// the lot was already won, so the shortfall does not move onto it: the packets stay at the godown
			story('ExpireSoon lot after the window', c.journey.listing?.units, 772);
			await s.stat('left', 'packets left at the godown', String(left()));
			await s.open('priya', `/execution/${HERO}`, 'reads Execution once the scheme has closed short');
			await running().done(`Execution: the scheme closed, ${left()} packets unordered`);
		}
	},
	{
		id: 'truck',
		title: "Rakesh loads the buyer's truck",
		async run(s) {
			const page = await s.open('rakesh', `/van/${HERO}`, "loads Agrawal Wholesale's truck at the godown");
			const load = main(page).getByRole('button', { name: "Load the buyer's truck" });
			await expect(load).toBeEnabled({ timeout: 30_000 });
			await load.click();
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
			const sold = page.locator('.dist-order').filter({ hasText: invoiceNo });
			await sold.getByRole('button', { name: 'Issue from Tally' }).click();
			await expect(sold.getByText('issued from Tally', { exact: true })).toBeVisible();
			await running().done(`Invoice ${invoiceNo} issued from Tally`);
			const van = await s.open('rakesh', `/van/${HERO}`, `runs his van round to the ${BUY.length} shops that ordered`);
			const round = main(van).getByRole('button', { name: 'Start the round' });
			await expect(round).toBeEnabled();
			await round.click();
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
			await fire.click();
			const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
			await expect(alert).toBeVisible();
			await running().done('Report now: Expire it and report now?');
			await alert.getByRole('button', { name: 'Report now' }).click();
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
		title: 'Rakesh destroys the packs left through the agency, and sends the evidence from his tablet',
		async run(s) {
			const asked = await until('the destruction is asked for', 'priya', (c) => !!c.destruction, 120_000);
			const units = asked.destruction!.units;
			const page = await s.open('rakesh', '/home', `opens the destruction of ${units} expired packs on Today`);
			const step = main(page).getByRole('button', { name: 'Send the evidence' }).first();
			await expect(step).toBeVisible();
			await running().done(`Today: destroy ${units} expired packs at your godown`);
			await step.click();
			await expect(page).toHaveURL(new RegExp(`/destroy/${HERO}`));
			await s.address('tablet');
			await expect(main(page).getByRole('button', { name: /Send to .* for approval/ })).toBeDisabled();
			const uploads = page.locator('input[type="file"]:not([capture])');
			await uploads.nth(0).setInputFiles(EVIDENCE('before', units));
			await uploads.nth(1).setInputFiles(EVIDENCE('after', units));
			await expect(page.locator('.dz-slot .cam-tag', { hasText: '1 · Before' })).toBeVisible();
			await running().done('The photo before, at the godown, and after, at the landfill');
			await main(page).getByLabel('Agency', { exact: true }).selectOption({ label: 'Orange City Enviro Services' });
			await main(page).getByLabel("Agency's certificate number").fill('OCE/DC/26-27/0219');
			await main(page).getByText('Two independent witnesses').scrollIntoViewIfNeeded();
			await running().done('The agency, its certificate, the window and the two witnesses');
			await main(page)
				.getByRole('button', { name: /Send to .* for approval/ })
				.click();
			const c = await until("Vision checks the destruction's evidence", 'priya', (c) =>
				['checked', 'approved'].includes(c.destruction?.status ?? '')
			);
			for (const x of c.destruction!.checks)
				running().figure(`Vision: ${x.id}`, `${x.ok ? 'ok' : 'not ok'} · ${x.label}`);
			const ok = c.destruction!.checks.filter((x) => x.ok).length;
			story("Vision's checks passed", `${ok} of ${c.destruction!.checks.length}`, '4 of 4');
			await expect(main(page).getByText('Sent for approval')).toBeVisible({ timeout: 30_000 });
			await running().done(`Sent for approval: Vision's checks ${ok} of ${c.destruction!.checks.length}`);
		}
	},
	{
		id: 'destroyed',
		title: "Priya reviews the destruction's evidence on her laptop and gives her second yes; Impact reports",
		async run(s) {
			const before = (await caseAs('priya'))!;
			const page = await s.open('priya', '/command', "reviews the destruction's evidence");
			const review = main(page).getByRole('button', { name: 'Review the destruction' });
			await expect(review).toBeVisible({ timeout: 30_000 });
			await running().done('Command Center: the destruction waits for her yes');
			await review.click();
			const sheet = page.getByRole('dialog', { name: 'Approve the destruction' });
			await expect(sheet).toBeVisible();
			await expect(sheet.locator('img.cam-feed')).toHaveCount(2);
			await running().done('The review: both photos, Vision’s checks, what the yes issues');
			await sheet.getByRole('button', { name: 'Approve · issue the papers' }).click();
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
			).toBeVisible({
				timeout: 30_000
			});
			await running().done(`Impact reported: ${paper?.no}, certificate ${cert?.no}; the chips cleared`);
		}
	},
	{
		id: 'pack',
		title: "Priya reads the pack on her laptop: the Expiry credit note, the agency's certificate, every paper signed",
		async run(s) {
			const page = await s.open('priya', `/paperwork/${HERO}`, 'reads the pack, the expiry credit note first');
			await expect(page.locator('#main')).toContainText(/packs destroyed at the godown/i);
			const c = (await caseAs('priya'))!;
			for (const d of c.docs) {
				const card = main(page)
					.getByRole('button', { name: new RegExp(d.type) })
					.first();
				if (!(await card.count())) continue;
				await card.click();
				await page.waitForTimeout(700);
				const signed = await signatures(page);
				running().figure(`Signed: ${d.type}`, signed);
				if (d.id === 'destruction') {
					await expect(main(page).getByText('Destruction log').first()).toBeVisible();
					story(
						'Certificate: signatures (officer, two witnesses, handed over)',
						signed >= 4 ? 'signed' : signed,
						'signed'
					);
					await main(page).getByText('Destruction log').first().scrollIntoViewIfNeeded();
					await running().done(`Paper: the certificate ${d.no}, page 2, the destruction log`);
					await page.locator('#main').evaluate((m) => m.scrollTo({ top: 0 }));
				}
				await running().done(`Paper: ${d.type}${d.no ? ` ${d.no}` : ''}`);
			}
			const mark = main(page).getByRole('button', { name: 'Mark reviewed' });
			if (await mark.isVisible().catch(() => false)) {
				await mark.click();
				await until('the review is recorded', 'priya', (c) => c.journey.reviewed, 30_000);
				await running().done('Pack reviewed');
			}
		}
	},
	{
		id: 'his',
		title: 'Rakesh reads his batch on his tablet: his money, his papers and the photos he sent',
		async run(s) {
			const page = await s.open('rakesh', `/batches/${HERO}`, 'reads the chips: what happened, his money and papers');
			const body = main(page);
			await expect(body).toContainText('You sent the label photo');
			await running().done('His batch: what happened');
			await page.locator('.bh-tabs').getByRole('button', { name: 'Money' }).click();
			await expect(body).toContainText('You end whole');
			await running().done('His batch: he ends whole');
			await page.locator('.bh-tabs').getByRole('button', { name: 'Papers' }).click();
			await expect(body).toContainText('Your papers');
			for (const name of [/Expiry credit note/, /Certificate of destruction|Destruction certificate/]) {
				const card = body.getByRole('button', { name }).first();
				if (!(await card.count())) {
					running().find('warning', `/batches/${HERO}`, `no ${name.source} in his papers`);
					continue;
				}
				await card.click();
				await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
				await running().done(`His papers: ${name.source.split('|')[0]}`);
				await page.keyboard.press('Escape');
			}
			await page.locator('.bh-tabs').getByRole('button', { name: 'Photos' }).click();
			await expect(body).toContainText('Vision read');
			await running().done('His batch: the photos he sent, the label and the destruction');
		}
	},
	{
		id: 'shops',
		title: 'On the phone: Shree Ganesh Kirana reads its order and invoice; a shop that declined reads its offer',
		async run(s) {
			const buyer = BUY[0]!;
			const page = await s.open(buyer.member, `/offer/${HERO}`, 'reads its order and its tax invoice');
			await expect(
				main(page)
					.getByText(/ऑर्डर हो गया|Ordered · \d+/)
					.first()
			).toBeVisible();
			await running().done(`${buyer.name}: its order`);
			const no = DECLINE[0]!;
			const p2 = await s.open(no.member, '/home', 'reads the offer it said not this time to');
			await expect(p2.locator('#main')).toContainText(/not this time|Declined/i);
			await running().done(`${no.name}: the offer it declined`);
		}
	},
	{
		id: 'close',
		title: 'Priya reads what was left at the godown and how it settled, and the batch in the ledger',
		async run(s) {
			planned ||= plannedOf(await caseAs('priya'));
			const page = await s.open('priya', `/execution/${HERO}`, 'reads what was left at the godown and how it settled');
			const settle = main(page).getByText('Expiry settlement', { exact: true });
			await settle.scrollIntoViewIfNeeded();
			await expect(settle).toBeVisible();
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
test('Munchly Chips Sad Path E2E: two kiranas buy, the rest decline, the packs destroyed at the godown', async ({}, info) => {
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
	const from = process.env.E2E_FROM ? STEPS.findIndex((x) => x.id === process.env.E2E_FROM) : 0;
	const to = process.env.E2E_UNTIL ? STEPS.findIndex((x) => x.id === process.env.E2E_UNTIL) : STEPS.length - 1;
	let error: string | undefined;
	try {
		for (const step of STEPS.slice(from, to + 1)) {
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
		if (keep) {
			mkdirSync(dirname(keep), { recursive: true });
			copyFileSync(video, keep);
		}
	}
});
