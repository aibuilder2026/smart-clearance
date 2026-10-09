import { expect, test } from '@playwright/test';
import { mint } from './auth.ts';
import { chips, HERO, KIRANAS, PEOPLE } from './chips.ts';
import { as, begin, caseAs, inr, sidebar, staff, story, until, type Step } from './flow.ts';
import { Run } from './record.ts';

// Munchly Chips Leftover E2E (SC-116): the Masala Chips batch (MF-2409-117) from a fresh journey, as Munchly Chips E2E
// takes it, except that some of Rakesh's kiranas open the scheme and do not order. The scheme never fills, so packs are
// left at the godown. Agrawal Wholesale still takes the ExpireSoon lot, but its truck waits for the scheme to close
// (backend-api refuses it while the scheme is open). Neha then fires expiry day's report from the console (Report now),
// which closes the batch as it stands (SC-94): the scheme closes with the orders placed, the accepted lot counts as
// collected, the papers are drafted, and Impact's report settles the packs left by Munchly's expiry policy, full
// credit. Anita reads the pack with its Expiry credit note, Priya reads Left at the godown and the Expiry
// settlement on Execution, and Vikram the ESG report.
//
// E2E_LEFTOVER (8): how many of the 31 ordering kiranas place no order, the last in the story's order.
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts; the 48-hour scheme is open 2 hours of real time,
// so Report now closes it, not its window.
// E2E_FROM=<step id> resumes on the journey as it stands; E2E_UNTIL=<step id> stops after that step.

const SKIP = Number(process.env.E2E_LEFTOVER ?? 8);
if (!(SKIP >= 1 && SKIP < KIRANAS.length))
	throw new Error(`E2E_LEFTOVER must be 1 to ${KIRANAS.length - 1}: some kiranas order and some do not`);
const BUYERS = KIRANAS.slice(0, KIRANAS.length - SKIP);
const ORDERED = BUYERS.reduce((t, k) => t + k.orders, 0);

let run: Run;
/** the packets the plan offers the kiranas, read from the case at the orders */
let planned = 0;
/** the packs no channel took: the kiranas' planned packets less those ordered */
const left = () => planned - ORDERED;

const STEPS: Step[] = [
	chips('reset'),
	chips('setup'),
	chips('permission'),
	chips('detect'),
	chips('photo'),
	chips('approve'),
	chips('execute'),
	{
		id: 'orders',
		title: `${BUYERS.length} of Rakesh's kiranas order their share; ${SKIP} read the scheme and do not`,
		async run(page) {
			planned = (await caseAs('priya'))?.plan?.lines.find((l) => l.id === 'kirana')?.units ?? 0;
			run.figure('Plan line kirana', `${planned} packs`);
			for (const [i, k] of KIRANAS.entries()) {
				const buys = i < BUYERS.length;
				const n = `${i + 1} of ${KIRANAS.length}`;
				await as(
					page,
					k.member,
					`/offer/${HERO}`,
					buys ? `orders ${k.orders} packets (${n})` : `reads the scheme and does not order (${n})`
				);
				const order = page.getByRole('button', { name: new RegExp(`· ${k.orders} packets`) });
				if (!buys) {
					await expect(order).toBeVisible();
					await page.waitForTimeout(600);
					run.find('note', `/offer/${HERO}`, `${k.name} did not order its ${k.orders} packets`);
					await run.done(`${k.name} did not order`);
					continue;
				}
				if (!(await order.isVisible().catch(() => false)) && (await page.getByText(/ऑर्डर हो गया|Ordered/).count())) {
					run.find('note', `/offer/${HERO}`, `${k.name} had already ordered`);
					continue;
				}
				await order.click();
				await expect(page.getByText(/ऑर्डर हो गया/).first()).toBeVisible();
				await run.done(`${k.name} ordered ${k.orders} packets`);
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
			run.figure('Packets the kiranas did not take', left());
			await as(page, 'priya', `/execution/${HERO}`, 'watches the scheme stay open, short of its packets');
			await run.done(`Execution: ${ORDERED} of ${planned} packets ordered, the scheme still open`);
		}
	},
	// no truck: it loads only once the scheme has closed, which here is expiry day, when the accepted lot counts as
	// collected
	chips('deal'),
	{
		id: 'report',
		title:
			"Neha fires expiry day's report from the console: the batch closes as it stands, and Impact settles what is left",
		async run(page) {
			const before = (await caseAs('priya'))!;
			run.figure('Phase before the report', before.journey.phase);
			story('Scheme before the report', before.journey.offer?.status, 'sent');
			await staff(page, '/clients/munchly/agents', "fires expiry day's report for the chips, with the scheme short");
			const fire = page.getByRole('button', { name: `Report now: Impact, expiry day · report, ${HERO}` });
			await expect(fire).toBeEnabled();
			await fire.click();
			const alert = page.getByRole('alertdialog', { name: /Expire it and report now/ });
			await expect(alert).toBeVisible();
			await run.done('Report now: Expire it and report now?');
			await alert.getByRole('button', { name: 'Report now' }).click();
			await expect(alert).toBeHidden();
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			planned ||= c.plan?.lines.find((l) => l.id === 'kirana')?.units ?? 0; // a run resumed after the orders
			run.figure('Phase after the report', c.journey.phase);
			story('Scheme after the report', c.journey.offer?.status, 'closed');
			story("The buyer's truck", c.journey.truck.status, 'dispatched');
			story('Left at the godown', c.realised?.godown, left());
			for (const l of c.realised?.lines ?? []) run.figure(`Realised ${l.id}`, `${l.units} packs`);
			run.figure('Actual net', inr(c.actual?.net));
			story(
				'Expiry settlement',
				c.expiry ? `${c.expiry.units} packs, ${c.expiry.policy}` : '(none)',
				`${left()} packs, full-credit`
			);
			run.figure('Expiry credit', inr(c.expiry?.credit ?? undefined));
			run.figure('Packs destroyed by', c.expiry?.destroyedBy ?? '(none)');
			const paper = c.docs.find((d) => d.id === 'expiry');
			story(
				'Expiry paper',
				paper ? `${paper.type}, ${paper.units} packs` : '(none)',
				`Expiry credit note, ${left()} packs`
			);
			for (const d of c.docs) run.figure(`Paper: ${d.type}`, `${d.no || '—'} (${d.status})`);
			await run.done('Impact posted the ledger, with the packs left settled');
		}
	},
	{
		id: 'papers',
		title: 'Anita reads the pack, the Expiry credit note first, and marks it reviewed',
		async run(page) {
			await as(page, 'anita', `/paperwork/${HERO}`, 'reads the expiry credit note and the rest of the pack');
			// Paperwork opens on the expiry paper (SC-94)
			await expect(page.locator('#main')).toContainText(/packs expired at the godown/i);
			await run.done('Paper: the Expiry credit note, open first');
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
			const mark = page.getByRole('button', { name: 'Mark reviewed' });
			if (await mark.isVisible().catch(() => false)) {
				await mark.click();
				// the papers were drafted on expiry day, which cleared the batch at once: the review finds only an open case,
				// so it is refused (SC-117). Kept as a finding, so the run goes on to what the report shows
				const reviewed = page.getByText('reviewed', { exact: true });
				const refused = page.getByText(/didn't go through/);
				await expect(reviewed.or(refused).first()).toBeVisible();
				if (await refused.isVisible()) {
					const why = (await refused.innerText()).replace(/\s+/g, ' ').trim();
					run.find('warning', `/paperwork/${HERO}`, `Mark reviewed on a batch Report now cleared: "${why}" (SC-117)`);
					await run.done('Mark reviewed, refused on the cleared batch (SC-117)');
				} else {
					await until('the review is recorded', 'anita', (c) => c.journey.reviewed, 30_000);
					await run.done('Pack reviewed');
				}
			}
		}
	},
	{
		id: 'godown',
		title: 'Priya reads what was left at the godown and how it settled, then opens the paper',
		async run(page) {
			planned ||= (await caseAs('priya'))?.plan?.lines.find((l) => l.id === 'kirana')?.units ?? 0;
			await as(page, 'priya', `/execution/${HERO}`, 'reads what was left at the godown and how it settled');
			const leftCard = page.getByText('Left at the godown', { exact: true });
			await leftCard.scrollIntoViewIfNeeded();
			await expect(leftCard).toBeVisible();
			await run.done(`Execution: ${left()} packs left at the godown`);
			const settleCard = page.getByText('Expiry settlement', { exact: true });
			await settleCard.scrollIntoViewIfNeeded();
			await expect(settleCard).toBeVisible();
			const main = (await page.locator('#main').innerText()).replace(/\s+/g, ' ');
			run.figure('Settlement sentence', main.match(/The [\d,]+ packs come back[^.]*\./)?.[0] ?? '(none)');
			await run.done('Execution: the Expiry settlement, full credit');
			await page.getByRole('button', { name: 'Open the paper' }).click();
			await expect(page).toHaveURL(new RegExp(`/paperwork/${HERO}`));
			await expect(page.locator('#main')).toContainText(/packs expired at the godown/i);
			await run.done('The Expiry credit note, from Execution');
		}
	},
	chips('esg'),
	{
		id: 'close',
		title: 'Anita reads the finance report, and Priya the Command Center at the end',
		async run(page) {
			await as(page, 'anita', `/report/${HERO}`, 'reads the finance side of the report');
			await run.done('Finance & ESG report, as Anita');
			await as(page, 'priya', '/command', 'sees the Command Center at the end');
			await expect(sidebar(page, 'Command Center')).toBeVisible();
			await page.waitForTimeout(800);
			await run.done('Command Center at the end');
		}
	}
];

test.describe.configure({ mode: 'serial' });

test('Munchly Chips Leftover E2E: the Masala Chips batch, kiranas that do not order, closed by Report now', async ({
	page
}, info) => {
	run = new Run(page, info, {
		flow: 'Munchly Chips Leftover E2E',
		batch: 'MF-2409-117, Masala Chips 150 g, Rakesh Traders, Nagpur'
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
