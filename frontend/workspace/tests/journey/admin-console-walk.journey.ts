import { expect, test, type Locator, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { api, mint, ORIGIN, PROD } from './auth.ts';
import { begin, running } from './flow.ts';
import { closeSheet } from './read.ts';
import { Stage, type Note } from './stage.ts';

// Admin and console walkthrough (SC-204): a few minutes on one laptop, brief and high level, between the one-minute tour
// (SC-199) and the detailed Admin and console E2E (SC-197).
//
// - the landing page, scrolled over quickly with nothing on it ringed, then its bar's Console, ringed and pressed;
// - Neha Kulkarni, a Super admin, signs in on the console's own screen;
// - monitoring: the Overview's figures read live, the agents at work across every client's batches, what waits on a
//   person and the runs today, and the platform's agents;
// - a SaaS client, configured: where New client starts, then a client an earlier run set up (E2E_CLIENT, kaveri by
//   default): its first stock export mapped by the Data agent and its supply chain (the data), and its people (the
//   users);
// - quick-commerce gates by SKU and batch, read on a client with its own (E2E_GATES_CLIENT, munchly by default; never
//   changed): the SKU table, an SKU with its own Blinkit and Zepto, Instamart gates, a batch's override with its reason,
//   the override's form opened and cancelled;
// - the first client's agents, configured: the pipeline, the Watcher's gate changed and saved, the Negotiator's autonomy,
//   the approval always on. The gate moves between two values, so every run saves a change and writes its audit line.
//
// The notes are green cards beside what is read and the rings and clicks are green (stage.ts `Cast.ink`, `Cast.notes`),
// with a chapter card as each part opens. It adds no client.
//
// E2E_CLIENT (kaveri): the client the walkthrough reads and configures.
// E2E_KEEP=<path> copies the recording there; `{stamp}` in it becomes the run's start, as 2026-10-13_09-15-42.
// E2E_LIVE=0 opens no monitor window (it records all the same).

const CLIENT = process.env.E2E_CLIENT ?? 'kaveri';
/** the client whose quick-commerce gates are read, SKU by SKU and batch by batch: one with SKUs of its own gates and a
 *  batch override (Munchly, on its story's data). It is read, never changed */
const GATES = process.env.E2E_GATES_CLIENT ?? 'munchly';
type Client = { id: string; name: string };
const toast = (page: Page) => page.locator('.toast').last();
/** a name's possessive: Kaveri Foods', Munchly's */
const of = (name: string) => (name.endsWith('s') ? `${name}'` : `${name}'s`);
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

/** the green cards: brief, one per major part */
const WHY = {
	door: {
		tag: 'Console',
		title: "Smart-Clearance's own app",
		text: "The console is where Smart-Clearance's staff run the platform: they watch every client, set clients up and configure their agents."
	},
	signin: {
		tag: 'Sign in',
		title: 'A Super admin signs in',
		text: 'Staff sign in with their work email and password through Firebase Authentication. A Super admin may change every client; Support may only read.'
	},
	kpis: {
		tag: 'Dashboard',
		title: 'Every client, at a glance',
		text: 'Money recovered, batches in flight, plans waiting for a yes and agent runs today, each against the range before, read live from the database every 30 seconds.'
	},
	atWork: {
		tag: 'Live',
		title: 'Agents at work, right now',
		text: "Every batch in flight across every client, at the stop its agents have reached, the latest arrivals as their clients' marks. A stop lists its batches."
	},
	attention: {
		tag: 'Attention',
		title: 'What waits on a person',
		text: 'Plans waiting for a yes, files a distributor has not sent, new demo requests, and every agent run as it lands: the queue staff work through.'
	},
	platformAgents: {
		tag: 'Agents',
		title: 'Eleven agents, every client',
		text: "Each agent's job, the model it runs on, and the clients it works for, with how far each client trusts it to go."
	},
	newClient: {
		tag: 'Clients',
		title: 'A client in seven steps',
		text: 'New client sets a manufacturer up, often straight from its demo request: the company, its own workspace address, its supply chain, its exits, its agents, its people, then a review.'
	},
	clients: {
		tag: 'Clients',
		title: 'Every SaaS client, one table',
		text: 'Each client with its status, plan, workspace address and batches. A row opens the client, with its seven tabs.'
	},
	data: {
		tag: 'Data setup',
		title: 'Its stock data, mapped by an agent',
		text: "Staff upload the client's first stock export from its distributors' DMS, and the Data agent maps its columns to the fields the agents read. Daily exports follow from the workspace."
	},
	chain: {
		tag: 'Data setup',
		title: 'Its supply chain, as the agents see it',
		text: "How the client sells, through which distributors, and what happens to expired stock: the profile every agent reads, with each distributor's SKUs and batches under it."
	},
	people: {
		tag: 'User setup',
		title: 'Its people, by role',
		text: "The client's admin, approver, supply chain operator and partners, each with a role. A new person is invited by email and signs in with the default password; no email is sent."
	},
	skus: {
		tag: 'Gates',
		title: 'Quick-commerce gates, SKU by SKU',
		text: "Blinkit takes a batch with enough days left, Zepto and Instamart with enough of its life left. Each SKU takes the client's default, or its own; the table says which."
	},
	skuGates: {
		tag: 'SKU level',
		title: 'Its own gates for this SKU',
		text: 'A short-life drink gets its own gates: fewer days for Blinkit, a lower share of life for Zepto and Instamart. Below them, what they mean in days on its shelf life, and each open batch checked against them.'
	},
	batchOverride: {
		tag: 'Batch level',
		title: 'One batch, overridden',
		text: "A single batch can go below its SKU's gates, down to 7 days and 5% of life, with a reason: here Zepto's warehouse agreed to take this lot at 30%. The agents read it, and the audit log keeps who and why."
	},
	overrideForm: {
		tag: 'Batch level',
		title: 'Changed in place, with a reason',
		text: "Each batch's override is set here, with why; Remove puts the batch back on its SKU's gates. It holds until the batch closes."
	},
	pipeline: {
		tag: 'Agents',
		title: 'Its eleven agents, in the order they work',
		text: 'Each agent for this client says how far it may go: Suggest, Ask before acting, or Act within its limits. A click opens its settings.'
	},
	gates: {
		tag: 'Watcher',
		title: 'Its own quick-commerce gates',
		text: 'The Watcher flags a batch once Blinkit, Zepto and Instamart would refuse it. Each client sets its own days and share of life; the change is saved and logged.'
	},
	autonomy: {
		tag: 'Negotiator',
		title: 'Trusted to answer bids',
		text: "On Act, the Negotiator counters buyers on its own, never below the client's floor. Every change goes to the client's audit log in Neha's name."
	},
	approval: {
		tag: 'Control',
		title: 'Nothing moves without a yes',
		text: 'The approval cannot be switched off for any client: every plan waits for one of its people, with the money on screen.'
	}
} satisfies Record<string, Note>;

/** a number field moved between two values, so every run changes it: the one it does not hold now */
const toggle = async (s: Stage, field: Locator, a: string, b: string) => {
	const now = await field.inputValue().catch(() => '');
	const next = now === a ? b : a;
	await s.type(field, next);
	return next;
};
/** the cursor reads down a list of things on screen, resting on each */
async function readEach(s: Stage, items: Locator, most = 6, rest = 380) {
	const n = Math.min(await items.count(), most);
	for (let i = 0; i < n; i++) await s.point(items.nth(i), rest);
}

test.describe.configure({ mode: 'serial' });

// eslint-disable-next-line no-empty-pattern
test('Admin and console walkthrough: the landing page, monitoring, a client set up and its agents', async ({}, info) => {
	test.setTimeout(30 * 60_000);
	mint(['neha']);
	const clients = await api<Client[]>('console', 'neha', '/v1/console/clients');
	const client = clients.find((c) => c.id === CLIENT);
	if (!client) throw new Error(`no client ${CLIENT}: run Admin and console E2E first, or name one with E2E_CLIENT`);
	const video = info.outputPath('recording.mp4');
	const s = await Stage.open(
		info,
		{
			flow: 'Admin and console walkthrough',
			batch: `Neha Kulkarni, Super admin · ${client.name} · recorded ${WHEN}`
		},
		video,
		{
			layout: 'one',
			holds: { neha: 'operator' },
			host: 'console',
			ink: 'green',
			notes: 'card',
			pace: 0.8,
			quiet: true
		}
	);
	const run = s.run;
	begin(run, CLIENT);
	running().figure('Target', PROD ? 'production' : 'this machine');
	let error: string | undefined;
	const CH = 6;
	try {
		await s.ready({ operator: 'site' });
		await s.record();

		// 1 · the landing page, scrolled over quickly, and its bar's Console
		await s.chapter('1 · The landing page', { n: 1, of: CH, title: 'The landing page, then the console' }, 900);
		// the landing page is only scrolled over: nothing on it is ringed but the bar's Console
		const site = await s.open('neha', '/', 'opens smartclearance.web.app', 'site');
		await site.waitForTimeout(1800);
		for (const id of ['#agents', '#yes', '#work', '#ledger', '#pricing']) {
			if (await s.reveal(site.locator(id).first())) await site.waitForTimeout(1100);
		}
		await running().done('The landing page, scrolled over');
		await s.top(site);
		const consoleLink = site.locator('.site-nav').getByRole('link', { name: 'Console', exact: true }).first();
		await s.spot(consoleLink, WHY.door, 3400);
		// the bar's Console opens another tab in a browser; here, the same screen, at the console the run takes
		await consoleLink.evaluate((a, href) => {
			a.removeAttribute('target');
			a.setAttribute('href', href);
		}, ORIGIN.console + '/');
		await s.click(consoleLink, 300);
		await expect(site.locator('#si-email')).toBeVisible({ timeout: 30_000 });
		await s.address('operator');
		await running().done("The bar's Console: the console's sign-in");

		// 2 · a Super admin signs in, on the console's own screen
		await s.chapter('2 · Signing in', { n: 2, of: CH, title: 'A Super admin signs in' }, 900);
		await s.spot(site.locator('#si-email'), WHY.signin, 3600);
		const con = await s.open('neha', '/', 'signs in to the console as a Super admin', 'console');
		await expect(con.getByRole('heading', { level: 1 })).toHaveText('Overview', { timeout: 30_000 });
		await running().done('Neha signed in: the Overview');

		// 3 · monitoring: the figures, the agents at work, what waits on a person, the platform's agents
		await s.chapter('3 · Monitoring', { n: 3, of: CH, title: 'Monitoring the platform' }, 900);
		await s.run.act('Neha Kulkarni', 'Smart-Clearance staff · console', 'monitors every client on the Overview');
		const kpis = con.locator('.cs-ov-kpi');
		await expect(kpis).toHaveCount(4);
		await s.mark(
			[
				[kpis.nth(0), 'Recovered across every client'],
				[kpis.nth(1), 'Batches in flight'],
				[kpis.nth(2), 'Waiting for a yes'],
				[kpis.nth(3), 'Agent runs today']
			],
			WHY.kpis
		);
		const live = con.locator('.cs-ov-live');
		if (await live.isVisible().catch(() => false)) await s.point(live, 1100);
		await running().done('The Overview: every client at a glance, read live');
		const stops = con.getByRole('group', { name: 'Batches in flight by stop' });
		await s.reveal(stops);
		await s.spot(stops, WHY.atWork);
		const approve = stops.getByRole('button', { name: /^Approve: / }).first();
		if (await approve.isVisible().catch(() => false)) {
			await s.click(approve, 900);
			await s.reveal(con.locator('.cs-ov-tablecard'));
			await s.point(con.locator('.cs-ov-table tbody tr').first(), 1300);
			await s.click(con.getByRole('button', { name: 'Every stop' }), 600);
		}
		await running().done('Agents at work: every batch at its stop');
		const three = con.locator('.cs-ov-three > *');
		await s.reveal(con.locator('.cs-ov-three'));
		await s.mark(
			[
				[three.nth(0), 'Needs attention'],
				[three.nth(1), 'Demo requests'],
				[three.nth(2), 'Agent runs, as they land']
			],
			WHY.attention
		);
		await running().done('Needs attention, demo requests and the runs today');
		await s.open('neha', '/agents', "reads the platform's agents across every client");
		const cards = con.locator('.cs-agentcard');
		await expect(cards.first()).toBeVisible({ timeout: 20_000 });
		await s.spot(cards.first(), WHY.platformAgents);
		await readEach(s, cards, 4, 380);
		await running().done("The platform's agents, across every client");

		// 4 · a SaaS client, configured: where New client starts, the client's data and its people
		await s.chapter('4 · A client, set up', { n: 4, of: CH, title: `A SaaS client: ${client.name}` }, 900);
		await s.open('neha', '/clients', 'reads every client, and where a new one starts');
		const table = con.getByRole('region', { name: 'Clients' }).first();
		await expect(table).toBeVisible({ timeout: 20_000 });
		await s.spot(table, WHY.clients);
		const newClient = con
			.getByRole('button', { name: 'New client' })
			.or(con.getByRole('link', { name: 'New client' }))
			.first();
		if (await newClient.isVisible().catch(() => false)) await s.spot(newClient, WHY.newClient, 4200);
		await running().done('Every client, and New client');
		await s.click(con.locator('tr', { hasText: client.name }).first(), 500);
		await expect(con).toHaveURL(new RegExp(`/clients/${CLIENT}`), { timeout: 20_000 });
		await s.run.act('Neha Kulkarni', 'Smart-Clearance staff · console', `reads how ${client.name} is set up`);
		const supply = await s.open('neha', `/clients/${CLIENT}/supply`, `reads ${of(client.name)} data: its stock export`);
		const exportCard = supply.locator('.card:has([aria-label="Field mapping"]), .card:has(.cs-drop)').first();
		await expect(exportCard).toBeVisible({ timeout: 20_000 });
		await s.spot(exportCard, WHY.data);
		const mapping = supply.getByRole('region', { name: 'Field mapping' });
		if (await mapping.isVisible().catch(() => false)) await readEach(s, mapping.locator('tbody tr'), 4, 300);
		const chain = supply.locator('.wschain').first();
		if (await chain.isVisible().catch(() => false)) await s.spot(chain, WHY.chain, 4400);
		await running().done(`${of(client.name)} data: its first stock export, mapped, and its supply chain`);
		const people = await s.open('neha', `/clients/${CLIENT}/people`, `reads ${of(client.name)} people`);
		const peopleTable = people.getByRole('region', { name: /People in/ }).first();
		await expect(peopleTable).toBeVisible({ timeout: 20_000 });
		await s.spot(peopleTable, WHY.people);
		const invite = people.locator('.cs-invite');
		if (await invite.isVisible().catch(() => false)) await s.point(invite, 1500);
		await running().done(`${of(client.name)} people, and the invitation`);

		// 5 · quick-commerce gates, SKU by SKU and batch by batch, on a client with its own (read, not changed)
		const gates = clients.find((c) => c.id === GATES);
		if (gates) {
			await s.chapter(
				'5 · Gates by SKU and batch',
				{ n: 5, of: CH, title: 'Blinkit and Zepto gates, by SKU and batch' },
				900
			);
			const sup = await s.open(
				'neha',
				`/clients/${GATES}/supply`,
				`reads ${of(gates.name)} quick-commerce gates, SKU by SKU and batch by batch`
			);
			const skus = sup.getByRole('region', { name: `${gates.name} SKUs` });
			await expect(skus).toBeVisible({ timeout: 20_000 });
			await s.reveal(skus);
			await s.spot(skus, WHY.skus);
			await running().done(`${of(gates.name)} SKUs: each one's Blinkit and Zepto, Instamart gates`);
			// an SKU with its own gates
			await s.click(skus.locator('tr', { hasText: 'Mango Drink' }).first(), 700);
			const sku = sup.getByRole('dialog', { name: /Mango Drink/ });
			await expect(sku).toBeVisible();
			await s.spot(sku.locator('fieldset.cs-gset').first(), WHY.skuGates);
			const mean = sku.locator('.cs-gmean').first();
			if (await mean.isVisible().catch(() => false)) await s.point(mean, 1500);
			const its = sku.locator('.cs-gbatch').first();
			if (await its.isVisible().catch(() => false)) await s.point(its, 1600);
			await running().done('The Mango Drink: its own gates, and its batch checked against them');
			await closeSheet(s, sup);
			// a batch with its own override
			await s.click(skus.locator('tr', { hasText: 'Choco Cream Biscuits' }).first(), 700);
			const bis = sup.getByRole('dialog', { name: /Choco Cream Biscuits/ });
			await expect(bis).toBeVisible();
			const ob = bis.locator('.cs-gbatch', { hasText: 'MF-2409-204' }).first();
			if (await ob.isVisible().catch(() => false)) {
				await s.spot(ob, WHY.batchOverride);
				const change = ob.getByRole('button', { name: 'Change', exact: true });
				if (await change.isVisible().catch(() => false)) {
					await s.click(change, 600);
					await s.mark(
						[
							[ob.locator('[id^="ob-bl-"]').first(), 'Blinkit, for this batch'],
							[ob.locator('[id^="ob-qc-"]').first(), 'Zepto, Instamart, for this batch'],
							[ob.locator('[id^="ob-why-"]').first(), 'Why: the agents and the audit log show it']
						],
						WHY.overrideForm
					);
					// left as it was: the walkthrough changes no live client's gates
					await s.click(ob.getByRole('button', { name: 'Cancel', exact: true }), 500);
				}
				await running().done('Choco Cream Biscuits: MF-2409-204 overridden for Zepto and Instamart, with its reason');
			} else running().find('note', `/clients/${GATES}/supply`, 'no batch override on Choco Cream Biscuits to show');
			await closeSheet(s, sup);
		} else running().find('note', '/clients', `no client ${GATES} to read the gates of`);

		// 6 · the client's agents, configured
		await s.chapter('6 · Its agents', { n: 6, of: CH, title: `${of(client.name)} agents, configured` }, 900);
		await s.open('neha', `/clients/${CLIENT}/agents`, `configures ${of(client.name)} agents`);
		const pipe = con.locator('.cs-pipe');
		await expect(pipe).toBeVisible();
		await s.spot(pipe, WHY.pipeline);
		const agent = (name: string) => con.locator('.cs-pipe .cs-open', { hasText: name }).first();
		const insp = con.locator('.cs-insp');
		const save = async (name: string) => {
			const b = insp.getByRole('button', { name: 'Save', exact: true });
			if (!(await b.isEnabled().catch(() => false))) return;
			await s.click(b, 200);
			await expect(toast(con)).toContainText(`${name} saved`, { timeout: 15_000 });
		};
		await s.click(agent('Watcher'), 300);
		const days = await toggle(s, insp.locator('#set-watcher-blinkitDays'), '60', '65');
		await s.spot(insp.locator('#set-watcher-blinkitDays'), WHY.gates);
		await save('Watcher');
		running().figure('Watcher', `Blinkit takes stock with at least ${days} days`);
		await running().done(`The Watcher's gate, saved: ${days} days`);
		await s.click(agent('Negotiator'), 300);
		const auto = insp.getByRole('group', { name: 'Negotiator: autonomy' }).first();
		const act = auto.getByRole('button', { name: 'Act' });
		if ((await act.getAttribute('aria-pressed')) !== 'true') {
			await s.click(act, 300);
			await expect(toast(con)).toHaveText(`Negotiator: Act, for ${client.name}`, { timeout: 15_000 });
		}
		await s.spot(auto, WHY.autonomy);
		running().figure('Negotiator', 'Act');
		await s.spot(con.locator('.cs-pipe .is-gate').first(), WHY.approval);
		await running().done(`${of(client.name)} agents configured`);
		// the last frame rests on the configured pipeline
		await s.reveal(pipe);
		await con.waitForTimeout(1500);
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
