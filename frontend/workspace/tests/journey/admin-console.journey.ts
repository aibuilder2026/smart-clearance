import { expect, test, type Locator, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { api, mint, ORIGIN, PROD } from './auth.ts';
import { begin, running } from './flow.ts';
import { Stage, type Note } from './stage.ts';

// Admin and console E2E on a laptop and a tablet (SC-191): the platform's own side of Smart-Clearance, on the stage
// (stage.ts) in its two-screen layout. On the laptop Neha Kulkarni, a Super admin, opens the platform's landing page once:
// a brief tour of it, a demo booked as a prospect would, and the ways in (Find your workspace, the bar's Workspace, which
// opens a client's own workspace on the tablet, and the bar's Console, where she signs in). On the tablet Megha Bava, in
// Support, then signs in to the console. Neha sets the company up as a client from its demo request, configures its
// agents, rules, people and plan, and Megha is refused a plan change; then the console in full: the Overview's dashboards,
// a live client's journey, agents and SKUs, and the platform's own screens. Every click shows, every screen scrolls to
// what is read, and the moments a viewer would ask about arrive as a banner on that screen, in business terms.
//
// Each run sets up a new client, which the console cannot delete: the company is the first of COMPANIES that is not a
// client yet (E2E_COMPANY names one).
//
// E2E_FROM=<step id> resumes on the run's client (E2E_COMPANY names it), with both signed in to the console and the
// landing page left out; E2E_UNTIL=<step id> stops after it. E2E_LIVE=0 opens no monitor window (it records all the same).

/** fictional companies, in the synthetic world's manner (a region, then what it makes), each a client once */
const COMPANIES = [
	'Aravalli Snacks',
	'Nilgiri Foods',
	'Shivalik Snacks',
	'Kaveri Foods',
	'Chambal Snacks',
	'Sahyadri Bites',
	'Godavari Foods',
	'Narmada Snacks'
];
const CITY: Record<string, string> = {
	'Aravalli Snacks': 'Jaipur',
	'Nilgiri Foods': 'Coimbatore',
	'Shivalik Snacks': 'Dehradun',
	'Kaveri Foods': 'Mysuru',
	'Chambal Snacks': 'Gwalior',
	'Sahyadri Bites': 'Pune',
	'Godavari Foods': 'Nashik',
	'Narmada Snacks': 'Jabalpur'
};
const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
/** a workspace's address from its company's name, by the console's own rule (`slug` in
 *  frontend/api/src/console/platform.ts, which the runner cannot import: its seed is JSON): "Nilgiri Foods" is nilgiri */
const addressOf = (name: string) =>
	(name || '')
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-(foods?|ltd|limited|pvt|private|india)$/g, '')
		.slice(0, 24) || 'client';
/** a name's possessive: Aravalli Snacks', Nilgiri Foods' */
const of = (name: string) => (name.endsWith('s') ? `${name}'` : `${name}'s`);
/** the Support member on the tablet: the synthetic world's, by address (sessions.sh id=email) */
const SUPPORT = process.env.E2E_SUPPORT ?? 'megha.bava@smartclearance.example';

type Client = { id: string; name: string; status?: string; plan?: string };
const toast = (page: Page) => page.locator('.toast').last();

/** what the stage says beside the moments a viewer would ask about, in business terms */
const WHY = {
	site: {
		tag: 'Landing page',
		title: "The platform's front door",
		text: "smartclearance.web.app tells a manufacturer's team what Smart-Clearance does with short-dated stock: the agents, one person's yes, and every exit priced. It names no client: one illustrative batch tells the story."
	},
	agents: {
		tag: 'Agents',
		title: 'Ten agents, one person',
		text: "The table tours one batch from the godown to the report: each agent's part in turn, and the one place a person says yes."
	},
	ledger: {
		tag: 'Money',
		title: 'Every rupee worked out',
		text: "What one batch recovered against destroying it, the credit given away, the GST kept and the kilos saved: the case a prospect's finance team asks for."
	},
	workspace: {
		tag: 'Product',
		title: 'A workspace of its own',
		text: 'Every client gets its own workspace at its own address, set up for its supply chain; each of its teams and partners sees its own part.'
	},
	book: {
		tag: 'Lead',
		title: 'How a prospect asks',
		text: "Book a demo, or Talk to us from a plan: the company, the work email and what it makes go straight to Smart-Clearance's console. No sales inbox in between."
	},
	doors: {
		tag: 'Ways in',
		title: 'Two doors from one page',
		text: "Console is Smart-Clearance's own staff app; Workspace is where a client's people work. Each is its own app at its own address, and the landing page leads to both."
	},
	find: {
		tag: 'Ways in',
		title: 'Find your workspace',
		text: 'Anyone at a client who has lost the address types their email or mobile number: the page names the workspace it belongs to, and nothing else.'
	},
	clientWorkspace: {
		tag: 'Workspace',
		title: "A client's own workspace",
		text: "Workspace opens Munchly Foods' own address, munchly-smartclearance.web.app: its supply chain team, its distributors, its kiranas and its food bank sign in here, each to their own part."
	},
	console: {
		tag: 'Console',
		title: 'One console for the whole platform',
		text: "Neha runs Smart-Clearance's side from the console: every client, its agents and its rules, the demo requests coming in, and the dashboards. It is for Smart-Clearance's staff only."
	},
	roles: {
		tag: 'Roles',
		title: 'Same console, different powers',
		text: "Megha is in Support: she sees every client, the dashboards and the audit log, and helps clients' people. Setting up clients and changing what they pay are kept for Super admins like Neha."
	},
	kpis: {
		tag: 'Dashboard',
		title: 'The platform at a glance',
		text: "Money recovered across every client, the batches in flight, those waiting for a yes, and the agents' runs today, each against the range before. Read live from the database every 30 seconds."
	},
	request: {
		tag: 'Lead',
		title: 'The request, in the console',
		text: 'The demo request booked on the landing page is on the Overview, with the plan it asked about. Set up turns it into a client, its details carried over.'
	},
	company: {
		tag: 'Set up',
		title: 'From request to client',
		text: "The company's name and what it makes come from the request. Neha adds its home city and a colour for its mark; the workspace keeps Smart-Clearance's own look."
	},
	address: {
		tag: 'Set up',
		title: 'Its own address and sign-in',
		text: "The workspace lives at <client>-smartclearance.web.app. Only addresses at the company's own email domain sign in as its staff; distributors and kiranas come by invitation."
	},
	profile: {
		tag: 'Supply chain',
		title: 'The supply chain shapes the agents',
		text: 'Three answers set how the agents work for this client: how it reaches the market, who owns short-dated stock, and what happens to expired packs.'
	},
	exits: {
		tag: 'Exits',
		title: 'Every exit, the bin as the baseline',
		text: 'The exits the agents may use for this client. The bin is always priced, so every plan shows what it saves against destroying the stock.'
	},
	preset: {
		tag: 'Agents',
		title: 'How far the agents go at first',
		text: "Standard lets the agents act on data and pricing and ask before bids and paperwork. Each agent can be changed later on its own; the approval is always a person's."
	},
	admin: {
		tag: 'People',
		title: "The client's own admin",
		text: 'The person who asked for the demo becomes the workspace admin: they invite their team and distributors. No email is sent; they start on the default password.'
	},
	review: {
		tag: 'Review',
		title: 'Ready in a minute',
		text: "Everything chosen, on one page, with the plan. Create workspace sets the client up, writes the audit line in Neha's name, and opens its Supply chain tab."
	},
	export: {
		tag: 'Next',
		title: 'The first stock export',
		text: "The client's distributors' stock export is the one thing left. Staff upload it here; the Data agent maps its columns, and the Watcher starts on its batches the next morning."
	},
	pipeline: {
		tag: 'Agents',
		title: 'The agents, in the order they work',
		text: 'Each stop is an agent, from the Data agent loading stock to Impact writing the report, with the approval as the locked amber gate. Each shows how far it may go: ask first, or act.'
	},
	gates: {
		tag: 'Watcher',
		title: 'The quick-commerce gates',
		text: "The Watcher flags a batch once Blinkit, Zepto and Instamart would refuse it: too few days left, or too little of its life. These are the client's defaults; each SKU and batch can differ."
	},
	reserve: {
		tag: 'Lister',
		title: 'A floor no buyer sees',
		text: "The Lister never lets a lot go below this price a pack on ExpireSoon, and hides it from buyers inside the client's own territories, so cleared stock never undercuts its own shelves."
	},
	autonomy: {
		tag: 'Autonomy',
		title: 'Trust, agent by agent',
		text: 'Here the Negotiator may answer bids on its own, within the reserve. Every other agent keeps its own setting, and the change is written to the audit log.'
	},
	approval: {
		tag: 'Control',
		title: 'Nothing moves without a yes',
		text: "The approval can't be switched off, for any client: every plan waits for one person, with the money on screen."
	},
	rules: {
		tag: 'Rules',
		title: 'Guardrails every agent obeys',
		text: "The channels allowed, the staff-sale cap, the offer window, the label photo before any plan, and what happens to expired packs at the godown: the client's own rules, set once."
	},
	invite: {
		tag: 'People',
		title: "The client's team, invited",
		text: 'Neha invites the person who will approve plans. Their account is made at once on the default password, which an operator hands over: no email is ever sent.'
	},
	integrations: {
		tag: 'Integrations',
		title: 'Where its data comes from',
		text: "The client's distributors' stock exports, Tally for the invoices, ExpireSoon for the lots, and the rest, each with where it stands."
	},
	plan: {
		tag: 'Plan',
		title: 'What the client pays for',
		text: 'The plan sets how many distributors and batches the client may run. Moving it is a commercial change, kept for Super admins, and written to the audit log.'
	},
	refused: {
		tag: 'Roles',
		title: 'Refused, and said why',
		text: 'Megha is in Support, so the plan puts itself back and says why beside the control. Nothing changed and nothing was written: commercial terms stay with Super admins.'
	},
	audit: {
		tag: 'Audit',
		title: 'Every change, on the record',
		text: "Each change Neha made to the new client is a line in its audit log, in her name, with when. It can't be edited or deleted, by anyone."
	},
	food: {
		tag: 'Impact',
		title: 'Food kept out of landfill',
		text: "Each day's kilos sold or given, against the kilos destroyed when no channel took them, across every client: the platform's impact in one chart, with the table behind it."
	},
	atWork: {
		tag: 'Live',
		title: 'Agents at work',
		text: "Every batch in flight, at the stop it has reached, the latest arrivals as their clients' marks. A stop filters the batches below to its own."
	},
	batches: {
		tag: 'Batches',
		title: "Every client's batches",
		text: 'Each batch in flight, the stop it is at, its days left and what it stands to recover, a page at a time. Search, a client or a stop narrows it.'
	},
	attention: {
		tag: 'Attention',
		title: 'What is waiting on a person',
		text: 'Plans waiting for a yes, distributors who have not sent their stock export, and requests to answer: the queue staff work through each morning.'
	},
	live: {
		tag: 'Live client',
		title: "A live client's journey",
		text: "Munchly Foods runs live. Its journey runs on the prototype's own clock, so the story's best-before dates hold; staff can reset it or move it forward from here."
	},
	triggers: {
		tag: 'Live client',
		title: 'Every run, on demand',
		text: 'Under each agent are its scheduled runs and timers. In a demo, staff fire them at once instead of waiting for the schedule; nothing is fired here.'
	},
	skus: {
		tag: 'Supply chain',
		title: 'Each SKU, its own gates',
		text: "The client's SKUs from its stock export, each with its quick-commerce gates: the client's default, or its own. A batch can be overridden for a reason, until it closes."
	},
	platformAgents: {
		tag: 'Agents',
		title: 'The agents, across every client',
		text: 'Each agent, the model it runs on, and how many clients have it on: the platform-wide view of what does the work.'
	},
	connectors: {
		tag: 'Connectors',
		title: 'What the platform connects to',
		text: 'The DMS exports, Tally, ExpireSoon, the quick-commerce gates and the rest: each connector, and which clients use it.'
	},
	plans: {
		tag: 'Plans',
		title: 'Pilot, Growth, Enterprise',
		text: 'What each plan covers, and which clients are on it.'
	},
	staff: {
		tag: 'Staff',
		title: "Smart-Clearance's own team",
		text: 'Every member of staff, their role and their team. A Super admin invites colleagues; no email is sent.'
	},
	platformAudit: {
		tag: 'Audit',
		title: 'Everything staff did, everywhere',
		text: 'The audit log across every client and the platform itself, in the name of whoever did it.'
	}
} satisfies Record<string, Note>;

/** the notes whose figures are the run's own */
const NOTE = {
	outcome: (company: string, lines: number): Note => ({
		tag: 'Outcome',
		title: `${company}, set up in minutes`,
		text: `From a demo request on the landing page to a configured client: its supply chain, its exits, its agents, its rules, its approver and its plan, with ${lines} lines in its audit log. Next, its first stock export.`
	})
};

type Step = { id: string; title: string; run: (s: Stage) => Promise<void> };

/** the run's company: E2E_COMPANY, else the first of COMPANIES that is not a client yet */
let company = process.env.E2E_COMPANY ?? '';
let slug = '';
let domain = '';
const PROSPECT = { first: 'Ritu', name: 'Ritu Malhotra' };
const APPROVER = { name: 'Arvind Sethi' };
/** whose email Find your workspace is shown with: a Munchly person */
const FINDER = 'priya.deshmukh@munchly.example';
/** the new client's audit lines, as the audit step counts them */
let auditLines = 0;

/** a list a person reads down, resting on each */
const read = async (s: Stage, items: Locator, most = 6, rest = 450) => {
	const n = Math.min(await items.count(), most);
	for (let i = 0; i < n; i++) await s.point(items.nth(i), rest);
	return n;
};

/** a link the page opens in another tab: here the click is kept on the page, and the stage opens it where it belongs */
const keep = (link: Locator) =>
	link.evaluate((a) => a.addEventListener('click', (e) => e.preventDefault(), { once: true }));

/** Neha signs in to the console on the laptop, from wherever the laptop is */
const nehaIn = async (s: Stage) => {
	const con = await s.open('neha', '/', 'signs in to the Smart-Clearance console', 'console');
	await expect(con.getByRole('heading', { level: 1 })).toHaveText('Overview', { timeout: 30_000 });
	return con;
};

const STEPS: Step[] = [
	{
		id: 'landing',
		title:
			'Neha opens the landing page once: a brief tour, a demo booked, and the ways into the console and a workspace',
		async run(s) {
			const page = await s.open('neha', '/', 'opens smartclearance.web.app on her laptop', 'site');
			await s.spot(page.locator('.hero h1, .hero').first(), WHY.site);
			await running().done("The platform's landing page");

			// a brief tour, top to bottom
			await s.reveal(page.locator('#how'));
			await page.waitForTimeout(1800);
			await s.spot(page.locator('#agents .tb-head, #agents').first(), WHY.agents);
			await s.reveal(page.locator('#agents .tb-stage, #agents .tb-world').first());
			await page.waitForTimeout(3500);
			await s.reveal(page.locator('.ch-h').first());
			await page.waitForTimeout(1500);
			await s.spot(page.locator('.ledger').first(), WHY.ledger);
			await s.spot(page.locator('#teams .sec-h, #teams').first(), WHY.workspace);
			await s.reveal(page.locator('#teams .wsd-rail, #teams .teams').first());
			await page.waitForTimeout(2000);
			await running().done('The tour: the pitch, the agents, the money, the workspace');

			// how a prospect asks: Talk to us from a plan
			await s.reveal(page.locator('#pricing'));
			const ask = page
				.locator('#pricing')
				.getByRole('button', { name: /Talk to us/ })
				.first();
			await s.click(ask, 600);
			const sheet = page.getByRole('dialog');
			await expect(sheet.getByLabel('Your name')).toBeVisible();
			await s.type(sheet.getByLabel('Your name'), PROSPECT.name);
			await s.type(sheet.getByLabel('Company'), company);
			await s.type(sheet.getByLabel('Work email'), `${PROSPECT.first.toLowerCase()}@${domain}`);
			await s.select(sheet.getByLabel('What you make'), 'Snacks and drinks');
			await s.type(
				sheet.getByLabel('Anything we should know (optional)'),
				'About 40 distributors; quick commerce sends back our snacks with weeks left.'
			);
			await s.spot(sheet.locator('form'), WHY.book, 5000);
			await s.click(sheet.getByRole('button', { name: 'Send request' }), 400);
			await expect(sheet.getByText(`Thanks, ${PROSPECT.first}.`)).toBeVisible({ timeout: 30_000 });
			await s.point(sheet.getByText(`Thanks, ${PROSPECT.first}.`), 1400);
			running().figure('Demo request', `${PROSPECT.name}, ${company}, ${PROSPECT.first.toLowerCase()}@${domain}`);
			await s.click(sheet.getByRole('button', { name: 'Done' }), 400);
			await running().done(`A demo booked for ${company}`);

			// the ways in: Find your workspace, in the footer
			await s.reveal(page.locator('.close'));
			await page.waitForTimeout(1200);
			await s.click(page.getByRole('button', { name: 'Find your workspace' }).last(), 600);
			const find = page.getByRole('dialog', { name: 'Find your workspace' });
			await s.type(find.getByLabel('Email or mobile number'), FINDER);
			await s.click(find.getByRole('button', { name: 'Find workspaces' }), 800);
			const found = find.locator('.card').first();
			await expect(found).toContainText('Munchly Foods', { timeout: 20_000 });
			await s.spot(found, WHY.find);
			await page.keyboard.press('Escape');
			await page.waitForTimeout(500);
			await running().done('Find your workspace names it');

			// the bar's two doors
			const nav = page.locator('.site-nav');
			await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
			await page.waitForTimeout(1200);
			await s.spot(nav.locator('.nav-actions'), WHY.doors);
			const workspace = nav.getByRole('link', { name: 'Workspace', exact: true }).first();
			await keep(workspace);
			await s.click(workspace, 300);
			// the workspace opens where its people work: on the tablet
			const ws = await s.open('ws', '/', "Workspace opens Munchly Foods' own address", 'workspace');
			await expect(ws.locator('#si-email')).toBeVisible({ timeout: 30_000 });
			await s.spot(ws.locator('main, .si-card, form').first(), WHY.clientWorkspace);
			await running().done("Workspace: Munchly Foods' own workspace, on the tablet");

			const consoleLink = nav.getByRole('link', { name: 'Console', exact: true }).first();
			// the bar's Console opens another tab in a browser; here, the same screen, at the console the run takes
			await consoleLink.evaluate((a, href) => {
				a.removeAttribute('target');
				a.setAttribute('href', href);
			}, ORIGIN.console + '/');
			await s.run.act('Neha Kulkarni', 'Smart-Clearance staff · console', 'goes to the console from the bar');
			await s.click(consoleLink, 400);
			await expect(page.locator('#si-email')).toBeVisible({ timeout: 30_000 });
			const con = await nehaIn(s);
			await s.spot(con.locator('.cs-ov-kpis'), WHY.console);
			await running().done('Neha signed in to the console: the Overview');
		}
	},
	{
		id: 'support',
		title: 'Megha, in Support, signs in to the console on the tablet',
		async run(s) {
			const page = await s.open('megha', '/', 'signs in to the console on her tablet');
			await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview', { timeout: 30_000 });
			await s.spot(page.locator('.cs-ov-kpis, .cs-ov-live').first(), WHY.roles);
			await running().done('Megha signed in on the tablet: the same Overview');
		}
	},
	{
		id: 'request',
		title: 'The demo request reaches the console',
		async run(s) {
			// the Overview's live reading covers its figures, not the demo requests, which are read again when the page is
			// opened anew: Neha glances at Clients and comes back, as a person would; a reload is the fallback
			running().find(
				'note',
				'/',
				"The Overview's demo requests are not part of its 30-second live reading: a new request shows once the Overview is opened again"
			);
			const clients = await s.open('neha', '/clients', 'checks her clients');
			await s.point(clients.locator('tr:has(td), .list-row').first(), 600);
			const page = await s.open('neha', '/', 'sees the demo request on the Overview');
			const row = page.locator('.list-row', { hasText: company }).first();
			if (!(await row.isVisible({ timeout: 10_000 }).catch(() => false))) {
				await s.refresh('neha');
				await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview', { timeout: 30_000 });
			}
			await expect(row).toBeVisible({ timeout: 30_000 });
			await s.spot(row, WHY.request);
			await running().done(`The request on the Overview: ${company}`);
		}
	},
	{
		id: 'setup',
		title: 'Neha sets the company up as a client from its request',
		async run(s) {
			const page = await s.open('neha', '/', `sets ${company} up as a client`);
			await s.click(
				page.locator('.list-row', { hasText: company }).getByRole('button', { name: 'Set up' }).first(),
				600
			);
			await expect(page).toHaveURL(/\/new-client\?request=/);
			const next = () => s.click(page.getByRole('button', { name: 'Continue' }), 600);

			// 1 Company
			await expect(page.getByLabel('Company name')).toHaveValue(company);
			await s.point(page.getByLabel('Company name'), 500);
			await s.type(page.getByLabel('Home city'), CITY[company] ?? 'Indore');
			await s.select(page.getByLabel('What it makes'), 'Snacks and drinks').catch(() => {});
			const swatch = page.locator('.cs-swatch').nth(2);
			if (await swatch.count()) await s.click(swatch, 300);
			await s.spot(page.locator('.cs-step'), WHY.company);
			await running().done('New client · Company');
			await next();

			// 2 Workspace
			await expect(page.getByLabel('Staff email domain')).toHaveValue(domain);
			await s.point(page.getByLabel('Workspace address'), 600);
			slug = await page.getByLabel('Workspace address').inputValue();
			await s.spot(page.locator('.cs-step'), WHY.address);
			await running().done('New client · Workspace: its address and sign-in');
			await next();

			// 3 Supply chain: through distributors, the distributor owns the stock, destroyed at the godown
			for (const [q, v] of [
				['route', 'distributors'],
				['owner', 'distributor'],
				['expiry', 'godown']
			]) {
				const opt = page.locator(`input[name="nc-${q}"][value="${v}"]`);
				if (await opt.count()) await s.click(opt, 300);
			}
			await s.spot(page.locator('.cs-step'), WHY.profile);
			await running().done('New client · Supply chain');
			await next();

			// 4 Exits
			await read(s, page.locator('.cs-step .list-row'), 6, 300);
			await s.spot(page.locator('.cs-step'), WHY.exits);
			await running().done('New client · Exits');
			await next();

			// 5 Agents
			const std = page.locator('input[name="nc-preset"][value="standard"]');
			if (await std.count()) await s.click(std, 400);
			await s.spot(page.locator('.cs-step'), WHY.preset);
			await running().done('New client · Agents: Standard');
			await next();

			// 6 People: the request's person as the workspace's admin
			const adminName = page.getByLabel("Workspace admin's name");
			if (!(await adminName.inputValue())) await s.type(adminName, PROSPECT.name);
			const adminEmail = page.getByLabel("Admin's work email");
			if (!(await adminEmail.inputValue())) await s.type(adminEmail, `${PROSPECT.first.toLowerCase()}@${domain}`);
			await expect(adminEmail).toHaveValue(`${PROSPECT.first.toLowerCase()}@${domain}`);
			await s.spot(page.locator('.cs-step'), WHY.admin);
			await running().done("New client · People: the workspace's admin");
			await next();

			// 7 Review, on the Pilot plan
			const pilot = page.getByRole('group', { name: 'Plan' }).getByRole('button', { name: 'Pilot' });
			if (await pilot.count()) await s.click(pilot, 300);
			await read(s, page.locator('.cs-step .list-row'), 8, 280);
			await s.spot(page.locator('.cs-step'), WHY.review);
			await running().done('New client · Review');
			await s.click(page.getByRole('button', { name: 'Create workspace' }), 300);
			await expect(page).toHaveURL(new RegExp(`/clients/${slug}/supply$`), { timeout: 30_000 });
			await expect(toast(page)).toHaveText(`${company}'s workspace is set up`);
			await s.point(toast(page), 1200);
			const first = page.getByRole('button', { name: 'Choose a CSV' });
			await expect(first).toBeVisible();
			await s.spot(first.locator('xpath=ancestor::*[contains(@class,"card")][1]'), WHY.export);
			running().figure('Client', `${company} (${slug}-smartclearance.web.app), set up from its request`);
			await running().done(`${of(company)} workspace set up: its Supply chain tab`);

			const tab = await s.open('megha', '/clients', 'sees the new client in Clients');
			const crow = tab.locator('a, tr, .list-row', { hasText: company }).first();
			await expect(crow).toBeVisible({ timeout: 30_000 });
			await s.point(crow, 1600);
			await running().done(`${company} in Megha's Clients`);
		}
	},
	{
		id: 'agents',
		title: "Neha configures the new client's agents",
		async run(s) {
			const page = await s.open('neha', `/clients/${slug}/agents`, `configures ${of(company)} agents`);
			const pipe = page.locator('.cs-pipe');
			await expect(pipe).toBeVisible();
			await s.spot(pipe, WHY.pipeline);
			await running().done('The agents, in the order they work');
			const agent = (name: string) => page.locator('.cs-pipe .cs-open', { hasText: name }).first();
			const insp = page.locator('.cs-insp');
			const save = async (what: string) => {
				await s.click(insp.getByRole('button', { name: 'Save', exact: true }), 300);
				await expect(toast(page)).toContainText(what, { timeout: 15_000 });
			};

			await s.click(agent('Watcher'), 500);
			await s.type(insp.getByLabel('Blinkit takes stock with at least'), '60');
			await s.spot(insp, WHY.gates);
			await save('Watcher saved');
			await running().done("The Watcher's gates: Blinkit at 60 days");

			await s.click(agent('Lister'), 500);
			await s.type(insp.getByLabel('Reserve price, per pack'), '12');
			await s.spot(insp, WHY.reserve);
			await save('Lister saved');
			await running().done("The Lister's reserve: ₹12 a pack");

			await s.click(agent('Negotiator'), 500);
			const act = page
				.getByRole('group', { name: 'Negotiator: autonomy' })
				.first()
				.getByRole('button', { name: 'Act' });
			await s.click(act, 400);
			await expect(toast(page)).toHaveText(`Negotiator: Act, for ${company}`, { timeout: 15_000 });
			await s.spot(page.getByRole('group', { name: 'Negotiator: autonomy' }).first(), WHY.autonomy);
			await running().done('The Negotiator: Act');

			await s.click(page.locator('.cs-pipe .is-gate .cs-open').first(), 500);
			await s.spot(insp, WHY.approval);
			await running().done('The approval: always on');
		}
	},
	{
		id: 'tabs',
		title: "Neha sets the client's rules, invites its approver, reads its integrations and moves its plan",
		async run(s) {
			const page = await s.open('neha', `/clients/${slug}/rules`, `reads ${of(company)} channels and rules`);
			const exits = page.locator('.list-row', { hasText: 'The bin' }).locator('xpath=..');
			await s.reveal(exits);
			await read(s, exits.locator('.list-row'), 6, 300);
			await s.spot(page.locator('.list-row', { hasText: 'Staff sale cap' }).locator('xpath=..'), WHY.rules);
			const agencies = page.locator('.list-row', { hasText: 'Authorised agencies' });
			if (await agencies.count()) await s.point(agencies, 1400);
			await running().done('Channels & rules');

			await s.open('neha', `/clients/${slug}/people`, `invites ${of(company)} approver`);
			const form = page.locator('.cs-invite');
			await s.reveal(form);
			await s.type(form.getByLabel('Name'), APPROVER.name);
			await s.type(form.getByLabel('Email', { exact: true }), `arvind.sethi@${domain}`);
			await s.spot(form, WHY.invite);
			await s.click(form.getByRole('button', { name: 'Invite', exact: true }), 400);
			await expect(toast(page)).toHaveText(`${APPROVER.name} can sign in with the default password`, {
				timeout: 30_000
			});
			await s.point(toast(page), 1200);
			running().figure('Invited', `${APPROVER.name}, arvind.sethi@${domain}`);
			await running().done(`${APPROVER.name} invited`);

			await s.open('neha', `/clients/${slug}/integrations`, `reads ${of(company)} integrations`);
			const rows = page.locator('.list-row');
			await read(s, rows, 5, 350);
			if (await rows.count()) await s.spot(rows.first().locator('xpath=..'), WHY.integrations);
			await running().done('Integrations');

			await s.open('neha', `/clients/${slug}/plan`, `moves ${company} from Pilot to Growth`);
			const plan = page.getByRole('group', { name: 'Plan' });
			await s.click(plan.getByRole('button', { name: 'Growth' }), 400);
			await expect(toast(page)).toHaveText(`${company} on Growth`, { timeout: 15_000 });
			await s.spot(plan, WHY.plan);
			running().figure('Plan', 'Pilot, then Growth');
			await running().done(`${company} on Growth`);
		}
	},
	{
		id: 'refused',
		title: "Megha, in Support, tries to change the client's plan on the tablet and is refused",
		async run(s) {
			const page = await s.open('megha', `/clients/${slug}/plan`, `opens ${of(company)} plan on her tablet`);
			const plan = page.getByRole('group', { name: 'Plan' });
			await s.reveal(plan);
			await s.click(plan.getByRole('button', { name: 'Enterprise' }), 600);
			const why = page.locator('.save-note.err');
			await expect(why).toHaveText("Only a Super admin can change a client's plan. Put back as it was.", {
				timeout: 15_000
			});
			await expect(plan.getByRole('button', { name: 'Enterprise' })).not.toHaveAttribute('aria-pressed', 'true');
			await s.spot(why, WHY.refused);
			running().figure('Support refused', "Only a Super admin can change a client's plan");
			// the refusal is the point: the API's 403 to Megha's plan change is not a finding
			const run = running();
			const expected = (f: { where: string; what: string }) =>
				f.where.startsWith(`/v1/console/clients/${slug}`) || (f.where.endsWith('/plan') && /403/.test(f.what));
			run.findings.splice(0, run.findings.length, ...run.findings.filter((f) => !expected(f)));
			await running().done('Megha refused: only a Super admin changes a plan');
		}
	},
	{
		id: 'audit',
		title: "Neha reads the new client's audit log",
		async run(s) {
			const page = await s.open('neha', `/clients/${slug}/audit`, `reads ${of(company)} audit log`);
			const log = page.locator('.list-row');
			await expect(log.first()).toContainText(`Moved ${company} from Pilot to Growth`, { timeout: 15_000 });
			for (const line of [
				`Invited ${APPROVER.name}`,
				`Set the Negotiator agent to Act for ${company}`,
				`Set up ${company}`
			])
				await expect(log.filter({ hasText: line }), line).not.toHaveCount(0);
			await expect(log.first()).toContainText('Neha Kulkarni');
			auditLines = await log.count();
			await read(s, log, 7, 380);
			await s.spot(log.first(), WHY.audit);
			running().figure('Audit lines', auditLines);
			await running().done(`${auditLines} audit lines, each in Neha's name`);
		}
	},
	{
		id: 'overview',
		title: 'Neha monitors the dashboards; Megha follows them on the tablet',
		async run(s) {
			const page = await s.open('neha', '/', 'monitors the platform on the Overview');
			const kpis = page.locator('.cs-ov-kpi');
			await expect(kpis).toHaveCount(4);
			await s.spot(page.locator('.cs-ov-kpis'), WHY.kpis);
			// a rolling figure draws a strip of digits behind the one shown (the kit's Roll): set aside
			const fig = (t: string) =>
				t
					.replace(/(?:\s*\b0\s+1\s+2\s+3\s+4\s+5\s+6\s+7\s+8\s+9\b)+/g, '')
					.replace(/₹[\s,]*(?=₹)/g, '')
					.replace(/\s+/g, ' ')
					.trim();
			running().figure('Overview', (await kpis.allInnerTexts()).map(fig).join(' · '));
			await running().done('The figures: recovered, in flight, waiting, runs');

			const card = page.locator('.cs-ov-card').filter({ hasText: 'Food, by day' }).first();
			await s.reveal(card);
			const range = card.getByRole('group', { name: 'Range' });
			if (await range.count()) await s.click(range.getByRole('button', { name: /90/ }), 900);
			await s.spot(card, WHY.food);
			const bar = card.locator('svg rect, svg path').nth(40);
			const box = await bar.boundingBox().catch(() => null);
			if (box) {
				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
				await page.waitForTimeout(1600);
			}
			const table = card.getByRole('button', { name: /Show as a table/ });
			if (await table.count()) {
				await s.click(table, 900);
				await s.pan(card.locator('.cs-ov-daytable').first());
				await s.click(card.getByRole('button', { name: /Show as a chart/ }).first(), 500).catch(() => {});
			}
			await running().done('Food, by day: kept and destroyed');

			const stops = page.getByRole('group', { name: 'Batches in flight by stop' });
			await s.reveal(stops);
			await s.spot(stops, WHY.atWork);
			const approve = stops.getByRole('button', { name: /^Approve: / }).first();
			if (await approve.count()) {
				await s.click(approve, 900);
				await s.reveal(page.locator('.cs-ov-tablecard'));
				await s.point(page.locator('.cs-ov-table tbody tr').first(), 900);
				await s.click(page.getByRole('button', { name: 'Every stop' }), 700);
			}
			await running().done('Agents at work, a stop filtering the batches');

			const tablecard = page.locator('.cs-ov-tablecard');
			await s.reveal(tablecard);
			await s.spot(tablecard, WHY.batches);
			const search = page.locator('.cs-ov-search input');
			if (await search.count()) {
				await s.type(search, 'Munchly');
				await page.waitForTimeout(1500);
				await s.point(page.locator('.cs-ov-table tbody tr').first(), 700);
				await search.fill('');
				await page.waitForTimeout(800);
			}
			const nextPage = page.getByRole('button', { name: 'Next page' });
			if (await nextPage.isEnabled().catch(() => false)) await s.click(nextPage, 900);
			await running().done("Every client's batches, searched and paged");

			const three = page.locator('.cs-ov-three');
			await s.reveal(three);
			await s.spot(three, WHY.attention);
			await running().done('Needs attention, demo requests and agent runs');

			const tab = await s.open('megha', '/', 'follows the dashboards on her tablet');
			await s.point(tab.locator('.cs-ov-kpis'), 1200);
			await s.scroll(tab, 0.7);
			await s.scroll(tab, 0.7);
			await running().done('The Overview on the tablet');
		}
	},
	{
		id: 'live',
		title: "A live client: Munchly Foods' journey, its agents' runs, its SKUs and their gates",
		async run(s) {
			const page = await s.open('neha', '/clients/munchly/agents', 'opens Munchly Foods, a live client');
			const clock = page.locator('.jc-note').first();
			await s.spot((await clock.count()) ? clock : page.locator('.cs-tabs').first(), WHY.live);
			const trigs = page.locator('.cs-trigs').first();
			await s.spot((await trigs.count()) ? trigs : page.locator('.cs-pipe'), WHY.triggers);
			await running().done("Munchly Foods' journey and its agents' runs");

			await s.open('neha', '/clients/munchly/supply', "reads Munchly Foods' supply chain");
			const skus = page.locator('tr', { hasText: 'Masala Chips 150 g' }).first();
			await s.reveal(skus);
			await s.spot(skus.locator('xpath=ancestor::table[1]'), WHY.skus);
			await s.click(skus, 700);
			const sheet = page.getByRole('dialog', { name: 'Masala Chips 150 g' });
			if (await sheet.isVisible({ timeout: 8000 }).catch(() => false)) {
				await s.point(sheet.getByRole('button', { name: /default|Its own/ }).first(), 900);
				await s.point(sheet.locator('.cs-govr-h, .list-row').first(), 900);
				await page.keyboard.press('Escape');
				await page.waitForTimeout(500);
			}
			await running().done("Munchly Foods' SKUs and their gates");
		}
	},
	{
		id: 'platform',
		title: "The platform's own screens: Clients, Agents, Connectors, Plans, Staff and the audit log",
		async run(s) {
			const screens: [string, string, Note][] = [
				['/agents', 'reads the agents across every client', WHY.platformAgents],
				['/connectors', 'reads the connectors', WHY.connectors],
				['/plans', 'reads the plans', WHY.plans],
				['/staff', "reads Smart-Clearance's staff", WHY.staff],
				['/audit', 'reads the audit log across the platform', WHY.platformAudit]
			];
			for (const [path, did, note] of screens) {
				const page = await s.open('neha', path, did);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
				const body = page.locator('.pagebody').first();
				await s.spot((await body.count()) ? body : page.getByRole('heading', { level: 1 }), note);
				await s.scroll(page, 0.5);
				await running().done(note.title);
			}
		}
	},
	{
		id: 'close',
		title: 'Neha sees the new client among the clients',
		async run(s) {
			const page = await s.open('neha', '/clients', 'sees the new client among the clients');
			const row = page.locator('a, tr, .list-row', { hasText: company }).first();
			await expect(row).toBeVisible({ timeout: 30_000 });
			await s.spot(row, NOTE.outcome(company, auditLines || 6));
			await running().done(`${company} among the clients`);
		}
	}
];

/** a run resumed with E2E_FROM: both signed in to the console, the landing page left out */
const RESUME: Step = {
	id: 'resume',
	title: 'Neha and Megha sign in to the console',
	async run(s) {
		await nehaIn(s);
		await running().done('Neha signed in to the console');
		const page = await s.open('megha', '/', 'signs in to the console on her tablet');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview', { timeout: 30_000 });
		await running().done('Megha signed in on the tablet');
	}
};

test.describe.configure({ mode: 'serial' });

// eslint-disable-next-line no-empty-pattern
test('Admin and console E2E on a laptop and a tablet: the landing page, a client set up and configured, the console in full', async ({}, info) => {
	test.setTimeout(60 * 60_000);
	mint(['neha', `megha=${SUPPORT}`]);
	const clients = await api<Client[]>('console', 'neha', '/v1/console/clients');
	if (!company) {
		const taken = new Set(clients.flatMap((c) => [c.id, c.name]));
		company =
			COMPANIES.find((c) => !taken.has(c) && !taken.has(addressOf(c))) ?? `${COMPANIES[0]} ${Date.now() % 1000}`;
	}
	// the workspace's address by the console's own rule ("Nilgiri Foods" is nilgiri), or the client's own when the run
	// resumes on one already set up; the prospect's email domain is the company's whole name
	slug = clients.find((c) => c.name === company)?.id ?? addressOf(company);
	domain = `${slugOf(company)}.example`;
	const video = info.outputPath('recording.mp4');
	const s = await Stage.open(
		info,
		{
			flow: 'Admin and console E2E',
			batch: `${company}, set up from its demo request · Neha Kulkarni, Super admin · Megha Bava, Support`
		},
		video,
		{
			layout: 'two',
			holds: { neha: 'operator', megha: 'distributor', ws: 'distributor' },
			apps: { megha: 'console' },
			guests: { ws: { name: "Munchly Foods' workspace", role: "A client's own address", org: '' } },
			roles: { megha: 'Smart-Clearance staff · Support' },
			host: 'console'
		}
	);
	const run = s.run;
	begin(run, slug);
	running().figure('Target', PROD ? 'production' : 'this machine');
	let error: string | undefined;
	try {
		const resume = !!process.env.E2E_FROM;
		await s.ready(
			resume ? { operator: 'console', distributor: 'console' } : { operator: 'site', distributor: 'console' }
		);
		await s.record();
		const at = (id: string) => STEPS.findIndex((x) => x.id === id);
		const from = resume ? at(process.env.E2E_FROM!) : 0;
		const to = process.env.E2E_UNTIL ? at(process.env.E2E_UNTIL) : STEPS.length - 1;
		for (const step of [...(resume ? [RESUME] : []), ...STEPS.slice(from, to + 1)]) {
			const n = STEPS.indexOf(step) + 1;
			run.stage = n ? `${n}/${STEPS.length}` : '';
			await s.chapter(n ? `${n} · ${step.title}` : step.title);
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
