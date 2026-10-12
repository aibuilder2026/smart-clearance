import { expect, test, type Locator, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
	film: {
		tag: 'Hero film',
		title: 'One day of the journey, in four chapters',
		text: 'The film under the heading follows one batch through one day with real people: the strip reads its four chapters, each lit as the film reaches it, and the camera leans in on each place.'
	},
	filmPause: {
		tag: 'Accessibility',
		title: 'The film has its own Pause',
		text: 'The hero film loops, so it carries Pause and Play (WCAG 2.2.2); under reduced motion it rests on its first frame.'
	},
	theatre: {
		tag: 'Demo film',
		title: 'The 6-minute demo, on request',
		text: "Watch opens a theatre over the page: the demo film from YouTube's no-cookie player, loaded only now, with nothing of YouTube on the page before it. Escape gives the page back where it was."
	},
	theatreRead: {
		tag: 'Demo film',
		title: 'Read the film instead',
		text: 'Every chapter of the film as chips to jump to, and its words, chapter by chapter, for anyone who would rather read than watch.'
	},
	statement: {
		tag: 'Pitch',
		title: 'Three sentences, read as they fill in',
		text: "The page's case in short: near-expiry stock is binned when it could still sell, and the agents find every exit before it is. Its words light up as the reader scrolls through them."
	},
	tableAgent: {
		tag: 'Agents',
		title: 'One agent in focus at a time',
		text: 'The camera closes in on each post on the miniature, and the card in the centre shows what that agent is doing for the batch, live: the gates, the prices, the split, the yes.'
	},
	tableRail: {
		tag: 'Agents',
		title: 'Jump to any agent',
		text: 'The rail names all eleven in the order they work; a click moves the tour to that agent. The tour holds while the reader looks.'
	},
	tableResult: {
		tag: 'Outcome',
		title: 'Sold, not binned',
		text: 'The tour lands on the result: the packs sent to the kiranas and the buyer as dots, the tags counting them in, and what the batch recovered. Replay walks it again.'
	},
	chWatch: {
		tag: 'Detect',
		title: "The Watcher's alert",
		points: ["The Watcher's alert: the batch, its packs at risk, the gates it fails"],
		text: 'Every morning the Watcher checks each batch against the quick-commerce gates and its sales a day, and flags the packs that will not sell in time, with the write-off they face.'
	},
	chPrice: {
		tag: 'Value',
		title: 'Every exit priced, the bin included',
		points: ["The Valuer's prices, net a pack, for each exit", "The Router's split: what each exit takes"],
		text: "The Valuer prices each exit net a pack: the kiranas' scheme, the marketplace, the staff sale, a food bank and the bin; the Router splits the batch to recover the most."
	},
	chYes: {
		tag: 'Approve',
		title: 'One yes, with the money on screen',
		text: 'The plan waits for one person: what each exit takes, what it recovers against destroying it, and the button that releases the agents.'
	},
	chWork: {
		tag: 'Execute',
		title: 'The agents at work, all at once',
		text: 'Outreach sends the kiranas their offer in Hindi, the Lister and the Negotiator sell the lot on ExpireSoon, and Paperwork drafts every paper finance needs.',
		points: [
			"Outreach: the kiranas' offer, in Hindi",
			'Lister and Negotiator: the lot on ExpireSoon',
			'Paperwork: the documents, drafted'
		]
	},
	teams: {
		tag: 'Teams',
		title: 'Each team, its own view',
		text: "Supply chain approves, finance gets its papers, sustainability its ledger, distributors their part: the tabs play through what each team's day looks like in the workspace."
	},
	addresses: {
		tag: 'Product',
		title: 'One address per client',
		text: 'Every manufacturer gets its own workspace at <client>-smartclearance.web.app, set up for its own supply chain.'
	},
	worksWith: {
		tag: 'Integrations',
		title: 'Works with what they already run',
		text: "The distributors' DMS exports, Tally for the invoices, ExpireSoon for the lots, WhatsApp-style pushes for the kiranas: no new system for anyone in the chain."
	},
	plansSite: {
		tag: 'Plans',
		title: 'Start with one distributor',
		text: 'Three plans, priced on request: each widens how far the agents reach in the network.'
	},
	booked: {
		tag: 'Lead',
		title: 'Sent, and on its way to the console',
		text: "The request is saved at once: it shows on the console's Overview for Smart-Clearance's staff to set the company up."
	},
	footer: {
		tag: 'Ways in',
		title: 'The footer, for anyone who already works here',
		text: "Product's sections, Find your workspace for a client's people, and the staff console for Smart-Clearance's own team."
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
	signin: {
		tag: 'Sign in',
		title: 'The agents, before anyone signs in',
		text: "Behind the sign-in, Smart-Clearance's ten agents and one person walk a batch through its nine stops, on a loop. The network answers the pointer: it links to it, and a click sends a ripple through it."
	},
	signinPick: {
		tag: 'Sign in',
		title: 'Pick an agent, see its work',
		text: 'Picking an agent holds the walk on it and says what it did for the batch, and the call it made. The amber one is the person: the only yes in the loop. Escape, or a click on the field, lets it go.'
	},
	signinPause: {
		tag: 'Accessibility',
		title: 'A loop with its own Pause',
		text: 'The only motion here that loops, so it has Pause and Play, remembered in the browser; under reduced motion it rests on its result (WCAG 2.2.2).'
	},
	signinForm: {
		tag: 'Sign in',
		title: 'Email and password, nothing else',
		text: 'Staff sign in with their work email and password through Firebase Authentication. Nothing is mailed, so there is no forgot-password: an operator hands the default password over.'
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
		text: "The approval can't be switched off, for any client: every plan waits for one person, with the money on screen. Plans go to the approver set here, on their phone: nothing moves until they tap Approve. Someone just invited joins the list once they have signed in."
	},
	rules: {
		tag: 'Rules',
		title: 'Guardrails every agent obeys',
		text: "The channels allowed, the staff-sale cap, the offer window, the label photo before any plan, and what happens to expired packs at the godown: the client's own rules, set once."
	},
	invite: {
		tag: 'People',
		title: "The client's team, invited",
		text: 'Neha invites the person who will approve plans. Their account is made at once on the default password, which an operator hands over: no email is ever sent. Next, the Approval agent sends plans to him.'
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
	steps: {
		tag: 'Set up',
		title: 'Seven steps, from request to workspace',
		text: 'Company, workspace, supply chain, exits, agents, people, review: each step carries over what the request already said, and a step done can be opened again from the list.'
	},
	clientHead: {
		tag: 'Client',
		title: 'A client of its own',
		text: 'Its mark, its address and where it stands, then its seven tabs. Setting up means the agents are configured but nothing runs on its stock until it goes live.'
	},
	mapping: {
		tag: 'Data agent',
		title: 'The Data agent reads the file',
		text: "The export goes straight to the client's own bucket; the Data agent reads its columns and maps each to a Smart-Clearance field: distributor, SKU, batch, dates, closing stock, godown."
	},
	mapped: {
		tag: 'Data agent',
		title: 'Mapped, and remembered',
		text: "Every field the agents need, found in the file. The mapping is kept for the client, so its distributors' daily exports load the same way, and Setup in its workspace opens mapped."
	},
	chain: {
		tag: 'Supply chain',
		title: 'The chain, drawn from its answers',
		text: 'Manufacturer, distributors, kiranas and the exits, as set up: the picture the agents work to.'
	},
	profileSheet: {
		tag: 'Supply chain',
		title: 'The profile, editable any time',
		text: 'The route to market, who owns the stock, the expiry policy and the gates new SKUs start on: changed here, and every agent follows from its next run.'
	},
	peopleTable: {
		tag: 'People',
		title: "Everyone in the client's workspace",
		text: 'Each person, their access, how they sign in and whether they have yet. A row can change access, resend an invitation or deactivate someone.'
	},
	legend: {
		tag: 'Autonomy',
		title: 'Suggest, Ask, Act',
		text: 'Suggest says what an agent would do and a person does it; Ask waits for a yes first; Act acts within its limits and reports. Each agent is set on its own, for this client only.'
	},
	data: {
		tag: 'Data',
		title: 'The Data agent: the stock comes in',
		text: "Each morning it loads the distributors' stock exports. Here it runs at 08:00, before the Watcher, and loads 180 days of sell-through the first time, so the Watcher knows each SKU's sales a day."
	},
	runNow: {
		tag: 'On demand',
		title: 'Any run, on request',
		text: "Run now starts the agent's run at once instead of waiting for its hour. This client is not live yet, so it records the run with nothing new to load, and writes the audit line."
	},
	vision: {
		tag: 'Vision',
		title: 'Vision reads the label photo',
		text: "Before any plan, the distributor sends one photo of the carton's label; Vision reads its batch, dates and MRP and checks them against the export. Below 0.92 confidence it asks for another photo."
	},
	valuer: {
		tag: 'Valuer',
		title: 'Every exit priced, the bin as the baseline',
		text: 'The Valuer prices each exit net a pack, the bin included. Its EPR, disposal and CO₂e factors are estimates, so they are always marked indicative: that one stays locked.'
	},
	router: {
		tag: 'Router',
		title: 'The split, and what it aims for',
		text: "The Router splits the batch between the exits under each one's caps. It can aim for the most money recovered, or for the fastest clearance when room at the godown matters more."
	},
	outreach: {
		tag: 'Outreach',
		title: 'The kiranas, in their own language',
		text: "Outreach sends the distributor's kiranas the offer as a push: English first for a Coimbatore network, and the scheme the shops get, 2 free with every 10."
	},
	onOff: {
		tag: 'Control',
		title: 'Any agent off, the rest carry on',
		text: 'Switched off, an agent is skipped and the stops around it carry on: the kiranas would get no offer, and the other exits take the batch. Saved at once, and on the record.'
	},
	negotiator: {
		tag: 'Negotiator',
		title: 'Bids, inside a floor',
		text: 'The Negotiator answers buyers on ExpireSoon: never below ₹11.50 a pack, up to three counter offers, and a 20% token paid on award before the truck is loaded.'
	},
	paperwork: {
		tag: 'Paperwork',
		title: 'Drafts only; people send them',
		text: 'Paperwork drafts the tax invoice, the e-way bill check, the credit notes, the GST memo and the FSSAI checklist. Invoices and credit notes always go out from a person: that is locked.'
	},
	impact: {
		tag: 'Impact',
		title: 'The report, once the returns are in',
		text: "Impact posts the ledger and the BRSR line once the return window closes: 21 days for this client, so finance closes the batch on figures that won't move."
	},
	pipelineAfter: {
		tag: 'Agents',
		title: 'Configured, stop by stop',
		text: "Each stop now reads its own settings and autonomy, every change saved and written to the audit log in Neha's name. Nothing runs on its stock until the client goes live."
	},
	actions: {
		tag: 'Control',
		title: "The client's own switches",
		text: 'Go live turns the workspace on; Pause every agent stops anything new being detected, priced, listed or sent, while approved plans stay where they are. Read here, not pressed.'
	},
	exitsRules: {
		tag: 'Exits',
		title: 'Each exit, on or off',
		text: 'The exits chosen at set-up, each its own switch. Discount D2C stays off: it is only for stock the manufacturer owns. The bin is always the baseline.'
	},
	destruction: {
		tag: 'Godown',
		title: 'Destroyed at the godown, on evidence',
		text: "When packs expire at the distributor's, he destroys them there through an authorised agency, and the client's credit follows a second yes."
	},
	goLive: {
		tag: 'Go live',
		title: 'Not live yet, on purpose',
		text: 'Go live is the last step, once its first export is in and its people have signed in. Left for its own day here.'
	},
	clockGuide: {
		tag: 'Demo',
		title: 'Prototype time, explained',
		text: 'The note under the clock opens how a demo is run again or moved forward, so anyone on the call can follow it.'
	},
	journeyDay: {
		tag: 'Demo',
		title: 'How long a journey day lasts',
		text: 'Real time, an hour, five minutes or a minute a day: a demo walks the 47-day journey in an afternoon. Left at Real time, and cancelled.'
	},
	liveActions: {
		tag: 'Live client',
		title: "A live client's switches",
		text: "Open the workspace at its own address, pause every agent, or reset the journey to the story's start: the controls a demo needs. Read here, not pressed."
	},
	distributors: {
		tag: 'Supply chain',
		title: 'Its distributors, and their permission',
		text: 'Each distributor gives the agents permission once, on their own phone. One not yet given can be reminded from here.'
	},
	override: {
		tag: 'Gates',
		title: 'A batch can differ, with a reason',
		text: 'One open batch can have its own gates, down to 7 days and 5%, with a reason, until it closes. The form is opened and cancelled here: nothing changed.'
	},
	clientsSearch: {
		tag: 'Clients',
		title: 'Found by city, name or address',
		text: 'The search narrows every client to the ones that match, as staff look one up on a call.'
	},
	clientsAll: {
		tag: 'Clients',
		title: 'Every manufacturer on the platform',
		text: 'Each client, its address, plan and status, its distributors and SKUs, its agents on and what it has recovered. A row opens its agents.'
	},
	agentChip: {
		tag: 'Agents',
		title: 'The new client, in every agent',
		text: "Each agent's card lists the clients it works for, with its autonomy there: the new client's settings already show."
	},
	connectorSheet: {
		tag: 'Connectors',
		title: 'Who uses it',
		text: 'Each connector opens on the clients that use it; a client opens straight on its integrations.'
	},
	staffInvite: {
		tag: 'Staff',
		title: 'A colleague, invited',
		text: 'A Super admin invites staff with a smartclearance address and one of three roles. The form is read and closed here.'
	},
	account: {
		tag: 'Account',
		title: 'Her account',
		text: 'Her work email, her passkey, and Sign out. The console signs out on its own address; a client workspace keeps its own sign-in.'
	},
	signedOut: {
		tag: 'Sign out',
		title: 'Signing out',
		text: 'The console covers itself while it signs out, then comes back to its sign-in.'
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
		text: `From a demo request on the landing page to a configured client: its supply chain, its first stock export mapped, its eleven agents, its rules, its approver and its plan, with ${lines} lines in its audit log. Next, it goes live.`
	})
};

type Step = { id: string; title: string; run: (s: Stage) => Promise<void> };

/** the run's company: E2E_COMPANY, else the first of COMPANIES that is not a client yet */
let company = process.env.E2E_COMPANY ?? '';
let slug = '';
let domain = '';
const PROSPECT = { first: 'Ritu', name: 'Ritu Malhotra' };
const APPROVER = { name: 'Arvind Sethi', email: () => `arvind.sethi@${domain}` };
/** the new client's first stock export (its distributors' closing stock, in the Bizom-style layout the story's export
 *  uses, SC-84), written for the run: fictional distributors in the client's own city and SKUs of its own */
const EXPORT_ROWS = [
	[
		'Sri Murugan Agencies',
		'SKU-CH-100',
		'B-2409-031',
		'2026-06-02',
		'2026-12-02',
		'1440',
		'Gandhipuram godown',
		'641012'
	],
	[
		'Sri Murugan Agencies',
		'SKU-MX-200',
		'B-2409-044',
		'2026-05-20',
		'2026-11-20',
		'960',
		'Gandhipuram godown',
		'641012'
	],
	['Kovai Traders', 'SKU-CH-100', 'B-2408-019', '2026-05-11', '2026-11-11', '1200', 'Peelamedu godown', '641004'],
	['Kovai Traders', 'SKU-BS-075', 'B-2409-052', '2026-07-01', '2027-01-01', '720', 'Peelamedu godown', '641004'],
	[
		'Annapoorna Distributors',
		'SKU-MX-200',
		'B-2408-027',
		'2026-05-06',
		'2026-11-06',
		'1080',
		'Ukkadam godown',
		'641001'
	],
	['Annapoorna Distributors', 'SKU-BS-075', 'B-2409-060', '2026-06-18', '2026-12-18', '840', 'Ukkadam godown', '641001']
];
const exportFile = () => {
	const file = test.info().outputPath(`dms_export_${slug}_2026-10-01.csv`);
	mkdirSync(dirname(file), { recursive: true });
	const head = 'distributor_name,item_code,batch_no,mfg_date,bb_date,closing_qty,location,pin';
	writeFileSync(file, [head, ...EXPORT_ROWS.map((r) => r.join(','))].join('\n') + '\n');
	return file;
};
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

/** the cursor sweeps across the sign-in's agents network as a visitor's hand would, quickly, the field linking to it */
const sweep = async (page: Page, points: [number, number][]) => {
	const vp = page.viewportSize() ?? { width: 1440, height: 900 };
	for (const [fx, fy] of points) {
		await page.mouse.move(Math.round(vp.width * fx), Math.round(vp.height * fy), { steps: 14 });
		await page.waitForTimeout(90);
	}
};

/** the sign-in's agents at work (SC-195, SC-196), read in detail before anyone signs in: the network swept by the cursor,
 *  four agents picked in turn (each says what it did for the batch), a ripple on the field, Pause and Play. On a laptop
 *  the agents ring the sign-in as named chips; on a tablet they sit round the card, with the nine stops as a rail */
const agentsTour = async (s: Stage, page: Page) => {
	await expect(page.locator('#si-email')).toBeVisible({ timeout: 30_000 });
	await page.waitForTimeout(1200);
	const chips = page.locator('.ag-crew .ag-chip');
	const desk = await chips
		.first()
		.isVisible()
		.catch(() => false);
	await s.spot(page.locator(desk ? '.ag-orbit' : '.ag-pill').first(), WHY.signin);
	await sweep(page, [
		[0.12, 0.2],
		[0.3, 0.75],
		[0.55, 0.15],
		[0.82, 0.62],
		[0.9, 0.22],
		[0.62, 0.86],
		[0.2, 0.5]
	]);
	if (desk) {
		for (const name of ['Watcher', 'Valuer', 'You', 'Negotiator', 'Impact']) {
			const chip = chips.filter({ hasText: name }).first();
			if (!(await chip.isVisible().catch(() => false))) continue;
			await s.click(chip, 250);
			await s.point(page.locator('.ag-caption').first(), 1300);
		}
		await s.spot(page.locator('.ag-caption').first(), WHY.signinPick);
		await page.keyboard.press('Escape');
		await page.waitForTimeout(400);
	} else {
		const rail = page.locator('.ag-rail button');
		for (const i of [1, 3, 4, 6, 8]) {
			const stop = rail.nth(i);
			if (!(await stop.isVisible().catch(() => false))) continue;
			await s.click(stop, 250);
			await s.point(page.locator('.ag-pill-now').first(), 1100);
		}
		await s.spot(page.locator('.ag-pill').first(), WHY.signinPick);
	}
	// a click on the open field: a ripple, and the walk let go
	const vp = page.viewportSize() ?? { width: 1440, height: 900 };
	await page.mouse.click(Math.round(vp.width * 0.08), Math.round(vp.height * 0.86));
	await page.waitForTimeout(900);
	const pause = page.getByRole('button', { name: 'Pause the agents' }).first();
	if (await pause.isVisible().catch(() => false)) {
		await s.click(pause, 900);
		await s.spot(page.getByRole('button', { name: 'Play the agents' }).first(), WHY.signinPause, 4200);
		await s.click(page.getByRole('button', { name: 'Play the agents' }).first(), 700);
	}
	await s.mark(
		[
			[page.locator('#si-email'), 'Work email: staff sign in with their smartclearance address'],
			[page.locator('#si-pw'), 'Password: shown or hidden; one message for any wrong sign-in'],
			[
				page.getByRole('button', { name: 'Sign in', exact: true }),
				'Sign in: the button says what it is doing while it waits'
			]
		],
		WHY.signinForm
	);
};

/** Neha signs in to the console on the laptop, from wherever the laptop is */
const nehaIn = async (s: Stage) => {
	const con = await s.open('neha', '/', 'signs in to the Smart-Clearance console', 'console');
	await expect(con.getByRole('heading', { level: 1 })).toHaveText('Overview', { timeout: 30_000 });
	return con;
};

const STEPS: Step[] = [
	{
		id: 'landing',
		title: "Neha opens the platform's landing page: the hero, its film of one day, and the demo film",
		async run(s) {
			const page = await s.open('neha', '/', 'opens smartclearance.web.app on her laptop', 'site');
			await s.spot(page.locator('.hero h1, .hero').first(), WHY.site);
			// the film's strip: one day of the journey in four chapters, each lit as the film reaches it
			const story = page.locator('.film-story .fs');
			await s.mark(
				[
					[story.nth(0), '06:30 · the brand and the distributor: the batch flagged'],
					[story.nth(1), '11:00 · the kiranas order on the scheme'],
					[story.nth(2), '18:00 · the food bank and the staff sale'],
					[story.nth(3), '21:30 · Paperwork drafts the papers']
				],
				WHY.film
			);
			const pause = page.locator('.film-ctl button');
			if (await pause.isVisible().catch(() => false)) {
				await s.click(pause, 1200);
				await s.spot(pause, WHY.filmPause, 3800);
				await s.click(pause, 600);
			}
			await running().done("The landing page's hero: one day of the journey on film");

			// the demo film, on request, in a theatre over the page
			const watch = page
				.locator('.hero')
				.getByRole('button', { name: /^Watch the/ })
				.first();
			if (await watch.isVisible().catch(() => false)) {
				await s.click(watch, 900);
				const theatre = page.getByRole('dialog').first();
				await expect(theatre).toBeVisible({ timeout: 20_000 });
				await page.waitForTimeout(3500);
				await s.spot(theatre.locator('.th-frame, .fp-media').first(), WHY.theatre);
				const chips = theatre.locator('.fp-ch button');
				await read(s, chips, 5, 260);
				if (
					await chips
						.nth(3)
						.isVisible()
						.catch(() => false)
				) {
					await s.click(chips.nth(3), 2600);
				}
				const words = theatre.locator('.fp-read summary');
				if (await words.isVisible().catch(() => false)) {
					await s.click(words, 900);
					await s.spot(theatre.locator('.fp-read-in').first(), WHY.theatreRead, 4200);
					await s.click(words, 400);
				}
				await s.click(theatre.getByRole('button', { name: 'Close the film' }), 900);
				await expect(theatre).toBeHidden({ timeout: 10_000 });
				await running().done('The demo film, in its theatre: its chapters and its words');
			}
		}
	},
	{
		id: 'tour',
		title:
			'The landing page, section by section: the statement, the agents at work, the four chapters, the ledger, the workspace, the plans',
		async run(s) {
			const page = await s.open('neha', '/', 'reads the landing page, section by section', 'site');
			// the statement: its words fill in as they are read
			const say = page.locator('#how');
			await s.reveal(say);
			for (let i = 0; i < 3; i++) await s.scroll(page, 0.18);
			await s.spot(say, WHY.statement, 4800);
			await running().done('The statement');

			// the agents at work on the table
			await s.spot(page.locator('#agents .tb-head, #agents').first(), WHY.agents);
			await s.reveal(page.locator('#agents .tb-world').first());
			await page.waitForTimeout(3000);
			const card = page.locator('#agents .tb-focus').first();
			if (await card.isVisible().catch(() => false)) await s.spot(card, WHY.tableAgent, 4500);
			const rail = page.locator('#agents .rail button');
			if (
				await rail
					.first()
					.isVisible()
					.catch(() => false)
			) {
				for (const i of [2, 5, 7]) {
					if (
						!(await rail
							.nth(i)
							.isVisible()
							.catch(() => false))
					)
						continue;
					await s.click(rail.nth(i), 1800);
				}
				await s.spot(rail.first().locator('xpath=..'), WHY.tableRail, 4200);
			}
			const result = page.locator('#agents .tb-result');
			await expect(result)
				.toBeVisible({ timeout: 40_000 })
				.catch(() => {});
			if (await result.isVisible().catch(() => false)) await s.spot(result, WHY.tableResult, 4500);
			await running().done('The agents at work on the table, one in focus at a time');

			// the product's four moments, each in its own colour field
			const fields: [string, Note][] = [
				['#watch', WHY.chWatch],
				['#price', WHY.chPrice],
				['#yes', WHY.chYes],
				['#work', WHY.chWork]
			];
			for (const [id, note] of fields) {
				const sec = page.locator(id);
				await s.reveal(sec.locator('.ch-h').first());
				await page.waitForTimeout(1100);
				const cards = sec.locator('.m-card');
				const n = await cards.count();
				if (n > 1) {
					await s.mark(
						Array.from(
							{ length: Math.min(n, 3) },
							(_, i) => [cards.nth(i), note.points?.[i] ?? `Card ${i + 1}`] as [Locator, string]
						),
						{ ...note, points: undefined }
					);
				} else await s.spot(n ? cards.first() : sec, note);
			}
			await running().done("The four chapters: the Watcher's alert, the prices, the one yes, the agents at work");

			// Impact's ledger for one batch
			const ledger = page.locator('.ledger').first();
			await s.reveal(ledger);
			await read(s, ledger.locator('.ledger-row, tr, li'), 6, 320);
			await s.spot(ledger, WHY.ledger);
			await running().done("Impact's ledger: every rupee worked out");

			// the workspace section: each team's own view
			await s.spot(page.locator('#teams .sec-h, #teams').first(), WHY.workspace);
			const tabs = page.locator('#teams [role="tab"]');
			for (let i = 0; i < Math.min(await tabs.count(), 4); i++) {
				await s.click(tabs.nth(i), 1700);
				if (i === 0) await s.spot(page.locator('#teams .wsd-main').first(), WHY.teams, 4500);
			}
			const urls = page.locator('#teams .isl-urls');
			if (await urls.isVisible().catch(() => false)) await s.spot(urls, WHY.addresses, 4200);
			const conn = page.locator('#teams .conn-list');
			if (await conn.isVisible().catch(() => false)) await s.spot(conn, WHY.worksWith, 4200);
			await running().done("The workspace: each team's own view, at the client's own address");

			// the plans
			const plans = page.locator('#pricing .plan');
			await s.reveal(page.locator('#pricing'));
			await s.mark(
				[
					[plans.nth(0), 'Pilot: one distributor, to prove it on one batch'],
					[plans.nth(1), 'Growth: every distributor in a region'],
					[plans.nth(2), 'Enterprise: the whole network, with its own integrations']
				],
				WHY.plansSite
			);
			await running().done('The plans: Pilot, Growth, Enterprise');
		}
	},
	{
		id: 'book',
		title: 'Neha books a demo as a prospect would, from a plan',
		async run(s) {
			const page = await s.open('neha', '/', 'books a demo as a prospect would', 'site');
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
			await s.spot(sheet.getByText(`Thanks, ${PROSPECT.first}.`).locator('xpath=..'), WHY.booked, 4200);
			running().figure('Demo request', `${PROSPECT.name}, ${company}, ${PROSPECT.first.toLowerCase()}@${domain}`);
			await s.click(sheet.getByRole('button', { name: 'Done' }), 400);
			await running().done(`A demo booked for ${company}`);
		}
	},
	{
		id: 'doors',
		title: "The ways in: Find your workspace, a client's workspace on the tablet, and the console, where Neha signs in",
		async run(s) {
			const page = await s.open('neha', '/', 'finds the ways in', 'site');
			// Find your workspace, in the footer
			await s.reveal(page.locator('.close'));
			await page.waitForTimeout(1200);
			await s.spot(page.locator('.foot').first(), WHY.footer, 4200);
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
			await s.mark(
				[
					[nav.locator('.nav-links'), 'The sections: How it works, Agents, For teams, Pricing'],
					[nav.getByRole('link', { name: 'Console', exact: true }).first(), "Console: Smart-Clearance's own staff app"],
					[nav.getByRole('link', { name: 'Workspace', exact: true }).first(), "Workspace: where a client's people work"]
				],
				WHY.doors
			);
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
			await s.active('operator');
			await s.click(consoleLink, 400);
			await expect(page.locator('#si-email')).toBeVisible({ timeout: 30_000 });
			await s.address('operator');
			await running().done("The console's sign-in");
		}
	},
	{
		id: 'signin',
		title: 'Neha signs in to the console, after the agents at work behind its sign-in',
		async run(s) {
			const page = s.pane('operator');
			await s.run.act(
				'Neha Kulkarni',
				'Smart-Clearance staff · console',
				'reads the agents at work behind the sign-in'
			);
			await s.active('operator');
			await agentsTour(s, page);
			await running().done("The sign-in's agents: picked, paused, played");
			const con = await nehaIn(s);
			await s.spot(con.locator('.cs-ov-kpis'), WHY.console);
			await running().done('Neha signed in to the console: the Overview');
		}
	},
	{
		id: 'support',
		title: 'Megha, in Support, signs in to the console on the tablet',
		async run(s) {
			await s.run.act(
				'Megha Bava',
				'Smart-Clearance staff · Support',
				'reads the agents round the sign-in on her tablet'
			);
			await agentsTour(s, await s.atSignIn('megha', 'console'));
			await running().done("The tablet's sign-in: the agents round the card");
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
		title: 'Neha sets the company up as a client from its request, in seven steps',
		async run(s) {
			const page = await s.open('neha', '/', `sets ${company} up as a client`);
			await s.click(
				page.locator('.list-row', { hasText: company }).getByRole('button', { name: 'Set up' }).first(),
				600
			);
			await expect(page).toHaveURL(/\/new-client\?request=/);
			await s.spot(page.locator('ol.cs-steps'), WHY.steps, 4200);
			const next = () => s.click(page.getByRole('button', { name: 'Continue' }), 600);

			// 1 Company
			await expect(page.getByLabel('Company name')).toHaveValue(company);
			await s.type(page.getByLabel('Home city'), CITY[company] ?? 'Indore');
			await s.select(page.getByLabel('What it makes'), 'Snacks and drinks').catch(() => {});
			const teal = page.getByRole('radio', { name: 'Teal' });
			if (await teal.count()) await s.click(teal, 300);
			await s.mark(
				[
					[page.getByLabel('Company name'), 'Company name, from the demo request'],
					[page.getByLabel('Home city'), 'Home city: where its supply chain starts'],
					[page.getByLabel('What it makes'), 'What it makes: sets the shelf lives and the gates to expect'],
					[
						page.locator('input[name="nc-colour"]').first().locator('xpath=ancestor::fieldset[1]'),
						"A colour for its mark, in Smart-Clearance's own look"
					]
				],
				WHY.company
			);
			await running().done('New client · 1 Company');
			await next();

			// 2 Workspace
			await expect(page.getByLabel('Staff email domain')).toHaveValue(domain);
			slug = await page.getByLabel('Workspace address').inputValue();
			await s.mark(
				[
					[page.getByLabel('Workspace address'), `Its address: ${slug}-smartclearance.web.app`],
					[page.getByLabel('Staff email domain'), `Its staff sign in from @${domain} only`],
					[page.getByText(/Google Workspace, for staff/).first(), 'Google Workspace, for its own staff'],
					[
						page.getByText(/Mobile number and a one-time code/).first(),
						'A one-time code, for invited distributors and kiranas'
					]
				],
				WHY.address
			);
			await running().done('New client · 2 Workspace: its address and sign-in');
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
			const set = (q: string) => page.locator(`input[name="nc-${q}"]`).first().locator('xpath=ancestor::fieldset[1]');
			await s.mark(
				[
					[set('route'), 'Route to market: through distributors, modern trade, or its own warehouses'],
					[set('owner'), 'Who owns short-dated stock: here the distributor'],
					[set('expiry'), 'Expiry policy: destroyed at the godown, on evidence and a second yes']
				],
				WHY.profile
			);
			await running().done('New client · 3 Supply chain');
			await next();

			// 4 Exits
			const exitSwitch = (n: string) => page.getByRole('switch', { name: n }).first();
			await s.mark(
				[
					[exitSwitch('ExpireSoon marketplace'), 'ExpireSoon: the lot sold to a wholesale buyer'],
					[exitSwitch('Kirana scheme'), "The kirana scheme: the distributor's own shops"],
					[exitSwitch('Staff sale'), "A staff sale at the distributor's godown"],
					[exitSwitch('Food bank'), 'A food bank, for packs no one will buy in time'],
					[exitSwitch('Discount D2C'), "Discount D2C: only for the manufacturer's own stock"]
				],
				WHY.exits
			);
			await running().done('New client · 4 Exits');
			await next();

			// 5 Agents
			const preset = (v: string) =>
				page.locator(`input[name="nc-preset"][value="${v}"]`).locator('xpath=ancestor::label[1]');
			await s.mark(
				[
					[preset('cautious'), 'Cautious: every agent suggests, a person does it'],
					[preset('standard'), 'Standard: act on data and prices, ask before bids and papers'],
					[preset('trusted'), 'Trusted: act within the limits, report what was done']
				],
				WHY.preset
			);
			const std = page.locator('input[name="nc-preset"][value="standard"]');
			if (await std.count()) await s.click(std, 400);
			await running().done('New client · 5 Agents: Standard');
			await next();

			// 6 People: the request's person as the workspace's admin
			const adminName = page.getByLabel("Workspace admin's name");
			if (!(await adminName.inputValue())) await s.type(adminName, PROSPECT.name);
			const adminEmail = page.getByLabel("Admin's work email");
			if (!(await adminEmail.inputValue())) await s.type(adminEmail, `${PROSPECT.first.toLowerCase()}@${domain}`);
			await expect(adminEmail).toHaveValue(`${PROSPECT.first.toLowerCase()}@${domain}`);
			await s.spot(page.locator('.cs-step'), WHY.admin);
			await running().done("New client · 6 People: the workspace's admin");
			await next();

			// 7 Review, on the Pilot plan
			const pilot = page.getByRole('group', { name: 'Plan' }).getByRole('button', { name: 'Pilot' });
			if (await pilot.count()) await s.click(pilot, 300);
			await read(s, page.locator('.cs-step .list-row'), 9, 300);
			await s.spot(page.locator('.cs-step'), WHY.review);
			await running().done('New client · 7 Review');
			await s.click(page.getByRole('button', { name: 'Create workspace' }), 300);
			await expect(page).toHaveURL(new RegExp(`/clients/${slug}/supply$`), { timeout: 30_000 });
			await expect(toast(page)).toHaveText(`${company}'s workspace is set up`);
			await s.point(toast(page), 1200);
			running().figure('Client', `${company} (${slug}-smartclearance.web.app), set up from its request`);
			await s.mark(
				[
					[page.getByRole('heading', { level: 1 }), `${company}, its mark and name`],
					[page.locator('.cs-head .si-url').first(), 'Its own address'],
					[page.locator('.cs-head').getByText('Setting up').first(), 'Setting up: not live until Neha says so'],
					[
						page.locator('.cs-tabs [role="tablist"]').first(),
						'Its seven tabs: agents, supply chain, rules, people, integrations, plan, audit'
					]
				],
				WHY.clientHead
			);
			await running().done(`${of(company)} workspace set up: its Supply chain tab`);

			const tab = await s.open('megha', '/clients', 'sees the new client in Clients');
			const crow = tab.locator('a, tr, .list-row', { hasText: company }).first();
			await expect(crow).toBeVisible({ timeout: 30_000 });
			await s.point(crow, 1600);
			await running().done(`${company} in Megha's Clients`);
		}
	},
	{
		id: 'export',
		title: "Neha uploads the client's first stock export, and the Data agent maps it",
		async run(s) {
			const page = await s.open('neha', `/clients/${slug}/supply`, `uploads ${of(company)} first stock export`);
			const choose = page.getByRole('button', { name: 'Choose a CSV' });
			await expect(choose).toBeVisible({ timeout: 20_000 });
			// the card holds its drop zone until the upload, then the field mapping
			const card = page.locator('.card:has(.cs-drop), .card:has([aria-label="Field mapping"])').first();
			await s.spot(card, WHY.export);
			await s.point(choose, 500);
			await page.locator('input[type="file"][accept*="csv"]').setInputFiles(exportFile());
			await page.waitForTimeout(600);
			const progress = page.getByRole('progressbar', { name: 'Uploading the stock export' });
			if (await progress.isVisible().catch(() => false)) await s.point(progress, 600);
			const mapping = page.getByRole('region', { name: 'Field mapping' });
			await expect(mapping).toBeVisible({ timeout: 30_000 });
			await s.spot(mapping, WHY.mapping, 4500);
			const mapped = card.getByText('Mapped', { exact: true }).first();
			const done = await mapped
				.waitFor({ state: 'visible', timeout: 150_000 })
				.then(() => true)
				.catch(() => false);
			if (done) {
				await read(s, mapping.locator('tbody tr'), 8, 300);
				await s.spot(card, WHY.mapped);
				running().figure('First export', `${EXPORT_ROWS.length} rows, mapped by the Data agent`);
				await running().done('The first stock export, mapped by the Data agent');
			} else {
				running().find('note', `/clients/${slug}/supply`, 'The first stock export stayed on Mapping for 150 s');
				await running().done('The first stock export, uploaded; the Data agent is mapping it');
			}

			// the profile the agents work from, and the supply chain drawn
			const chain = page.locator('.wschain').first();
			if (await chain.isVisible().catch(() => false)) await s.spot(chain, WHY.chain, 4500);
			const edit = page.getByRole('button', { name: 'Edit', exact: true }).first();
			if (await edit.isVisible().catch(() => false)) {
				await s.click(edit, 700);
				const sheet = page.getByRole('dialog', { name: 'Supply-chain profile' });
				await expect(sheet).toBeVisible();
				await s.mark(
					[
						[sheet.locator('input[name="pf-route"]').first().locator('xpath=ancestor::fieldset[1]'), 'Route to market'],
						[sheet.locator('input[name="pf-expiry"]').first().locator('xpath=ancestor::fieldset[1]'), 'Expiry policy'],
						[sheet.locator('#pf-bl'), 'Blinkit gate for new SKUs'],
						[sheet.locator('#pf-qc'), 'Zepto and Instamart gate for new SKUs']
					],
					WHY.profileSheet
				);
				await s.click(sheet.getByRole('button', { name: 'Close' }).first(), 500);
			}
			await running().done('The supply-chain profile');
		}
	},
	{
		id: 'people',
		title: "Neha invites the client's approver, and reads its people",
		async run(s) {
			const page = await s.open('neha', `/clients/${slug}/people`, `invites ${of(company)} approver`);
			const form = page.locator('.cs-invite');
			await s.reveal(form);
			await s.type(form.getByLabel('Name'), APPROVER.name);
			await s.type(form.getByLabel('Email', { exact: true }), APPROVER.email());
			await s.select(form.getByLabel('Access'), 'Approver');
			await s.mark(
				[
					[form.getByLabel('Name'), 'The person'],
					[form.getByLabel('Email', { exact: true }), `A ${domain} address: staff of ${company}`],
					[form.getByLabel('Access'), 'Approver: plans reach their phone for the yes']
				],
				WHY.invite
			);
			await s.click(form.getByRole('button', { name: 'Invite', exact: true }), 400);
			await expect(toast(page)).toHaveText(`${APPROVER.name} can sign in with the default password`, {
				timeout: 30_000
			});
			await s.point(toast(page), 1200);
			running().figure('Invited', `${APPROVER.name}, ${APPROVER.email()}, Approver`);
			const table = page.getByRole('region', { name: /People in/ }).first();
			await expect(table).toContainText(APPROVER.name, { timeout: 20_000 });
			await s.spot(table, WHY.peopleTable);
			const menu = page.getByRole('button', { name: `Actions for ${APPROVER.name}` }).first();
			if (await menu.isVisible().catch(() => false)) {
				await s.click(menu, 600);
				await read(s, page.getByRole('menuitem'), 4, 420);
				await page.keyboard.press('Escape');
				await page.waitForTimeout(400);
			}
			await running().done(`${APPROVER.name} invited as approver`);
		}
	},
	{
		id: 'agents',
		title: "Neha configures the new client's eleven agents, one by one",
		async run(s) {
			const page = await s.open('neha', `/clients/${slug}/agents`, `configures ${of(company)} agents`);
			const pipe = page.locator('.cs-pipe');
			await expect(pipe).toBeVisible();
			const legend = page.locator('.cs-legend').first();
			if (await legend.isVisible().catch(() => false)) await s.spot(legend, WHY.legend, 5000);
			await s.spot(pipe, WHY.pipeline);
			await running().done('The agents, in the order they work');
			const agent = (name: string) => page.locator('.cs-pipe .cs-open', { hasText: name }).first();
			const insp = page.locator('.cs-insp');
			const save = async (name: string) => {
				const b = insp.getByRole('button', { name: 'Save', exact: true });
				if (!(await b.isEnabled().catch(() => false))) return;
				await s.click(b, 300);
				await expect(toast(page)).toContainText(`${name} saved`, { timeout: 15_000 });
				await s.point(toast(page), 700);
			};
			const open = async (name: string) => {
				await s.click(name === 'Approval' ? page.locator('.cs-pipe .is-gate .cs-open').first() : agent(name), 600);
				await expect(insp.locator('.t-title3, b').first()).toBeVisible();
			};
			const field = (id: string) => insp.locator(`#set-${id}`);
			const hasField = async (id: string) => (await field(id).count()) > 0;

			// Data: when it loads the stock, and how much history
			await open('Data');
			if (await hasField('data-time')) await s.type(field('data-time'), '0800');
			if (await hasField('data-backfillDays')) await s.type(field('data-backfillDays'), '180');
			await s.spot(insp, WHY.data);
			await save('Data');
			await running().done('The Data agent: loads at 08:00, 180 days of history');

			// the Data agent's run on request: the client is not live, so it records the run and nothing new
			const runNow = insp.getByRole('button', { name: /^Run now: Data/ }).first();
			if (await runNow.isVisible().catch(() => false)) {
				await s.click(runNow, 600);
				await expect(toast(page)).toContainText('daily load', { timeout: 15_000 });
				await s.spot(runNow.locator('xpath=ancestor::*[contains(@class,"cs-trig")][1]'), WHY.runNow);
				await running().done('The Data agent, run on request');
			}

			// Watcher: the quick-commerce gates
			await open('Watcher');
			await s.type(field('watcher-blinkitDays'), '60');
			if (await hasField('watcher-qcomPct')) await s.type(field('watcher-qcomPct'), '55');
			await s.spot(insp, WHY.gates);
			await save('Watcher');
			await running().done("The Watcher's gates: Blinkit at 60 days, Zepto and Instamart at 55% of life");

			// Vision: how sure it must be of a label photo
			await open('Vision');
			if (await hasField('vision-confidence')) await s.type(field('vision-confidence'), '0.92');
			await s.spot(insp, WHY.vision);
			await save('Vision');
			await running().done('Vision: asks for another photo below 0.92 confidence');

			// Valuer: the estimates, always labelled
			await open('Valuer');
			await s.spot(insp, WHY.valuer);
			await running().done('The Valuer: every exit priced, the bin included');

			// Router: what the split aims for
			await open('Router');
			if (await hasField('router-objective')) await s.select(field('router-objective'), 'Most money recovered');
			await s.spot(insp, WHY.router);
			await save('Router');
			await running().done('The Router: aims for the most money recovered');

			// Approval: always on, and to whom plans go
			await open('Approval');
			const approver = field('gate-approver');
			if (await hasField('gate-approver')) {
				const opts = await approver.locator('option').allInnerTexts();
				const his = opts.find((o) => o.startsWith(APPROVER.name));
				if (his) await s.select(approver, his);
			}
			await s.spot(insp, WHY.approval);
			await save('Approval');
			// whoever the select holds now: the approver just invited when it offers him, else the workspace's admin
			const chosen = (await hasField('gate-approver'))
				? (await approver.locator('option:checked').innerText()).split(' · ')[0]
				: '';
			running().figure('Approver', chosen || 'the workspace admin');
			await running().done(`The approval: always on, to ${chosen || 'the workspace admin'}`);

			// Lister: the reserve, hidden at home
			await open('Lister');
			await s.type(field('lister-reserve'), '12');
			const hide = insp.getByRole('switch', { name: /Hide lots from buyers/ }).first();
			if (await hide.isVisible().catch(() => false)) await s.point(hide, 600);
			await s.spot(insp, WHY.reserve);
			await save('Lister');
			await running().done("The Lister's reserve: ₹12 a pack, hidden in the client's territories");

			// Outreach: the kiranas' language and scheme, and switched off and on
			await open('Outreach');
			if (await hasField('outreach-language')) await s.select(field('outreach-language'), 'English first');
			if (await hasField('outreach-scheme')) await s.select(field('outreach-scheme'), '2 free with every 10');
			await s.spot(insp, WHY.outreach);
			await save('Outreach');
			const on = insp.getByRole('switch', { name: `Outreach on for ${company}` }).first();
			if (await on.isVisible().catch(() => false)) {
				await s.click(on, 900);
				await expect(insp.locator('.save-note').first()).toContainText('Saved', { timeout: 15_000 });
				await s.spot(on.locator('xpath=ancestor::*[contains(@class,"list-row")][1]'), WHY.onOff, 4800);
				await s.click(on, 900);
				await expect(on).toHaveAttribute('aria-checked', 'true', { timeout: 15_000 });
			}
			await running().done('Outreach: English first, 2 free with every 10; off and on again');

			// Negotiator: its floor, counters and token, and trusted to act
			await open('Negotiator');
			if (await hasField('negotiator-floor')) await s.type(field('negotiator-floor'), '11.5');
			const more = insp.getByRole('button', { name: 'More counter offers' }).first();
			if (await more.isEnabled().catch(() => false)) await s.click(more, 400);
			if (await hasField('negotiator-tokenPct')) await s.type(field('negotiator-tokenPct'), '20');
			await s.spot(insp, WHY.negotiator);
			await save('Negotiator');
			const act = insp
				.getByRole('group', { name: 'Negotiator: autonomy' })
				.first()
				.getByRole('button', { name: 'Act' });
			await s.click(act, 400);
			await expect(toast(page)).toHaveText(`Negotiator: Act, for ${company}`, { timeout: 15_000 });
			await s.spot(insp.getByRole('group', { name: 'Negotiator: autonomy' }).first(), WHY.autonomy);
			await running().done('The Negotiator: never below ₹11.50, a 20% token, on Act');

			// Paperwork: drafts only
			await open('Paperwork');
			await s.spot(insp, WHY.paperwork);
			await running().done('Paperwork: drafts only; people send them');

			// Impact: when the report posts
			await open('Impact');
			if (await hasField('impact-returnWindowDays')) await s.type(field('impact-returnWindowDays'), '21');
			await s.spot(insp, WHY.impact);
			await save('Impact');
			await running().done('Impact: posts after a 21-day return window');

			// the pipeline again, each stop with its new setting; and the client's actions, read, not pressed
			await s.reveal(pipe);
			await s.spot(pipe, WHY.pipelineAfter, 4800);
			const actions = page.getByRole('button', { name: `Actions for ${company}` }).first();
			if (await actions.isVisible().catch(() => false)) {
				await s.click(actions, 600);
				await read(s, page.getByRole('menuitem'), 4, 450);
				await s.spot(page.getByRole('menuitem').first().locator('xpath=..'), WHY.actions, 4500);
				await page.keyboard.press('Escape');
				await page.waitForTimeout(400);
			}
			await running().done("The client's actions: Go live, Pause every agent");
		}
	},
	{
		id: 'rules',
		title: "Neha sets the client's channels and rules, and how packs are destroyed at the godown",
		async run(s) {
			const page = await s.open('neha', `/clients/${slug}/rules`, `sets ${of(company)} channels and rules`);
			const exits = page.locator('.list-row', { hasText: 'The bin' }).locator('xpath=..');
			await s.reveal(exits);
			await read(s, exits.locator('.list-row'), 6, 300);
			await s.spot(exits, WHY.exitsRules);
			const more = (name: string) => page.getByRole('button', { name: `More ${name}` }).first();
			const cap = more('staff sale cap');
			if (await cap.isVisible().catch(() => false)) {
				await s.click(cap, 300);
				await s.click(cap, 300);
			}
			const win = more('offer window hours');
			if (await win.isVisible().catch(() => false)) await s.click(win, 400);
			await s.spot(page.locator('.list-row', { hasText: 'Staff sale cap' }).locator('xpath=..'), WHY.rules);
			await running().done('Channels and guardrails');

			const godown = page.locator('.list-row', { hasText: 'Authorised agencies' }).locator('xpath=..');
			if (await godown.count()) {
				await s.reveal(godown);
				const charges = more("the agency's charges a pack, in rupees");
				if (await charges.isVisible().catch(() => false)) await s.click(charges, 400);
				const again = page.getByRole('button', { name: 'Fewer days before he is asked again' }).first();
				if (await again.isEnabled().catch(() => false)) await s.click(again, 400);
				await s.mark(
					[
						[
							godown.locator('.list-row', { hasText: 'Evidence' }).first(),
							'Evidence: two photos and the certificate number, always'
						],
						[
							page.getByRole('switch', { name: 'Vision checks the destruction photos' }).first(),
							'Vision checks both photos against the batch'
						],
						[
							godown.locator('.list-row', { hasText: 'Authorised agencies' }).first(),
							'Only an agency on the list may destroy them'
						],
						[
							page.getByRole('switch', { name: 'Make good the GST he reverses' }).first(),
							'The GST the distributor reverses, made good'
						],
						[
							godown.locator('.list-row', { hasText: "The agency's charges" }).first(),
							"The agency's charges a pack, credited"
						],
						[godown.locator('.list-row', { hasText: 'Ask again' }).first(), 'A reminder when the evidence is late']
					],
					WHY.destruction
				);
			}
			const saveRules = page.getByRole('button', { name: 'Save changes' });
			if (await saveRules.isEnabled().catch(() => false)) {
				await s.click(saveRules, 400);
				await expect(toast(page)).toHaveText('Channels and rules saved', { timeout: 15_000 });
				await s.point(toast(page), 1000);
			}
			await running().done('Destroyed at the godown: evidence, checks, credit');
		}
	},
	{
		id: 'plan',
		title: "Neha reads the client's integrations and moves its plan",
		async run(s) {
			const page = await s.open('neha', `/clients/${slug}/integrations`, `reads ${of(company)} integrations`);
			const rows = page.locator('.list-row');
			await read(s, rows, 6, 350);
			if (await rows.count()) await s.spot(rows.first().locator('xpath=..'), WHY.integrations);
			await running().done('Integrations');

			await s.open('neha', `/clients/${slug}/plan`, `moves ${company} from Pilot to Growth`);
			const plan = page.getByRole('group', { name: 'Plan' });
			await s.click(plan.getByRole('button', { name: 'Growth' }), 400);
			await expect(toast(page)).toHaveText(`${company} on Growth`, { timeout: 15_000 });
			await s.spot(plan, WHY.plan);
			const live = page.getByRole('button', { name: 'Go live' }).first();
			if (await live.isVisible().catch(() => false))
				await s.spot(live.locator('xpath=ancestor::*[contains(@class,"card")][1]'), WHY.goLive, 4800);
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
			await read(s, log, 14, 330);
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
		title: "A live client, Munchly Foods: its journey clock, its agents' runs and timers, its SKUs and their gates",
		async run(s) {
			const page = await s.open('neha', '/clients/munchly/agents', 'opens Munchly Foods, a live client');
			await s.mark(
				[
					[page.locator('.cs-head').getByText('Live', { exact: true }).first(), 'Live: its workspace runs the journey'],
					[page.locator('.cs-jday').first(), 'The length of its journey day'],
					[page.locator('.jc-note').first(), "Prototype time: the story's own calendar"]
				],
				WHY.live
			);
			// the clock's guide: how a demo is reset or moved forward
			const guide = page.locator('.jc-link').first();
			if (await guide.isVisible().catch(() => false)) {
				await s.click(guide, 700);
				const sheet = page.getByRole('dialog', { name: 'Prototype time' });
				await expect(sheet).toBeVisible();
				await s.mark(
					[
						[sheet.locator('.jc-lede'), 'Why the journey keeps its own clock'],
						[sheet.locator('#jc-reset'), 'Start the journey again, from the console'],
						[sheet.locator('#jc-ff'), 'Move it forward: shorter days, and the runs fired now']
					],
					WHY.clockGuide
				);
				await s.click(sheet.getByRole('button', { name: 'Close' }).last(), 500);
			}
			// the journey day, read and left as it is
			const badge = page.locator('.cs-jday').first();
			if (await badge.isVisible().catch(() => false)) {
				await s.click(badge, 700);
				const sheet = page.getByRole('dialog', { name: 'Length of a journey day' });
				await expect(sheet).toBeVisible();
				await read(s, sheet.locator('.cs-jd-preset'), 4, 420);
				await s.spot(sheet, WHY.journeyDay);
				await s.click(sheet.getByRole('button', { name: 'Cancel' }), 500);
			}
			await running().done("Munchly Foods' journey clock, read and left at real time");

			const trigs = page.locator('.cs-trigs').first();
			await s.spot((await trigs.count()) ? trigs : page.locator('.cs-pipe'), WHY.triggers);
			const all = page.locator('.cs-pipe .cs-trig');
			await read(s, all, 6, 380);
			await running().done("Munchly Foods' scheduled runs and timers (nothing fired)");

			const actions = page.getByRole('button', { name: 'Actions for Munchly Foods' }).first();
			if (await actions.isVisible().catch(() => false)) {
				await s.click(actions, 600);
				await s.spot(page.getByRole('menuitem').first().locator('xpath=..'), WHY.liveActions, 4800);
				await page.keyboard.press('Escape');
				await page.waitForTimeout(400);
			}
			await running().done("A live client's actions: open its workspace, pause, reset");

			await s.open('neha', '/clients/munchly/supply', "reads Munchly Foods' supply chain");
			const dists = page.locator('.list-row', { hasText: /given|not yet/ });
			if (await dists.count()) {
				await read(s, dists, 4, 380);
				await s.spot(dists.first().locator('xpath=..'), WHY.distributors, 4500);
			}
			const skus = page.locator('tr', { hasText: 'Masala Chips 150 g' }).first();
			await s.reveal(skus);
			await s.spot(skus.locator('xpath=ancestor::table[1]'), WHY.skus);
			await s.pan(skus.locator('xpath=ancestor::table[1]'));
			await s.click(skus, 700);
			const sheet = page.getByRole('dialog', { name: 'Masala Chips 150 g' });
			if (await sheet.isVisible({ timeout: 8000 }).catch(() => false)) {
				await s.point(sheet.getByRole('group', { name: 'Whose gates' }).first(), 900);
				const batch = sheet.locator('.cs-gbatch').first();
				if (await batch.isVisible().catch(() => false)) {
					await s.spot(batch, WHY.override, 4800);
					const ovr = batch.getByRole('button', { name: 'Override for this batch' });
					if (await ovr.isVisible().catch(() => false)) {
						await s.click(ovr, 700);
						await s.point(batch.locator('[id^="ob-why-"]').first(), 900);
						await s.click(batch.getByRole('button', { name: 'Cancel' }).first(), 500);
					}
				}
				await page.keyboard.press('Escape');
				await page.waitForTimeout(500);
			}
			await running().done("Munchly Foods' SKUs, their gates and a batch's override");
		}
	},
	{
		id: 'platform',
		title: "The platform's own screens: Clients, Agents, Connectors, Plans, Staff and the audit log",
		async run(s) {
			const page = await s.open('neha', '/clients', 'searches the clients');
			const search = page.getByRole('searchbox').first();
			if (await search.isVisible().catch(() => false)) {
				await s.type(search, CITY[company] ?? company);
				await page.waitForTimeout(900);
				await s.spot(page.getByRole('region', { name: 'Clients' }).first(), WHY.clientsSearch, 4200);
				await search.fill('');
				await page.waitForTimeout(700);
			}
			await s.spot(page.getByRole('region', { name: 'Clients' }).first(), WHY.clientsAll);
			await s.pan(page.getByRole('region', { name: 'Clients' }).first());
			await running().done('Every client, in one table');

			await s.open('neha', '/agents', 'reads the agents across every client');
			const cards = page.locator('.cs-agentcard');
			await expect(cards.first()).toBeVisible({ timeout: 20_000 });
			await s.spot(cards.first(), WHY.platformAgents);
			await read(s, cards, 6, 380);
			const chip = page.locator('.cs-agentcard button.chip', { hasText: company }).first();
			if (await chip.isVisible().catch(() => false)) await s.spot(chip, WHY.agentChip, 4200);
			await running().done(WHY.platformAgents.title);

			await s.open('neha', '/connectors', 'reads the connectors');
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
			await s.spot(page.locator('.pagebody').first(), WHY.connectors);
			const conn = page.locator('.pagebody .list-row').first();
			if (await conn.isVisible().catch(() => false)) {
				await s.click(conn, 700);
				const sheet = page.getByRole('dialog').first();
				if (await sheet.isVisible().catch(() => false)) {
					await s.spot(sheet, WHY.connectorSheet, 4500);
					await page.keyboard.press('Escape');
					await page.waitForTimeout(400);
				}
			}
			await running().done(WHY.connectors.title);

			await s.open('neha', '/plans', 'reads the plans');
			await s.mark(
				[
					[page.locator('.cs-plans > *').nth(0), 'Pilot'],
					[page.locator('.cs-plans > *').nth(1), 'Growth'],
					[page.locator('.cs-plans > *').nth(2), 'Enterprise']
				],
				WHY.plans
			);
			await running().done(WHY.plans.title);

			await s.open('neha', '/staff', "reads Smart-Clearance's staff");
			await s.spot(page.getByRole('region', { name: 'Console staff' }).first(), WHY.staff);
			const invite = page.getByRole('button', { name: 'Invite', exact: true }).first();
			if (await invite.isVisible().catch(() => false)) {
				await s.click(invite, 700);
				const sheet = page.getByRole('dialog', { name: 'Invite a colleague' });
				if (await sheet.isVisible().catch(() => false)) {
					await s.mark(
						[
							[sheet.locator('#st-name'), 'Their name'],
							[sheet.locator('#st-email'), 'A smartclearance address only'],
							[sheet.locator('#st-role'), 'Super admin, Platform engineer or Support']
						],
						WHY.staffInvite
					);
					await page.keyboard.press('Escape');
					await page.waitForTimeout(400);
				}
			}
			await running().done(WHY.staff.title);

			await s.open('neha', '/audit', 'reads the audit log across the platform');
			await s.spot(page.locator('.pagebody').first(), WHY.platformAudit);
			const filter = page.locator('button.chip', { hasText: company }).first();
			if (await filter.isVisible().catch(() => false)) {
				await s.click(filter, 900);
				await read(s, page.locator('.pagebody .list-row'), 6, 320);
				await s.click(page.locator('button.chip', { hasText: 'Everything' }).first(), 600);
			}
			await running().done(WHY.platformAudit.title);
		}
	},
	{
		id: 'close',
		title: 'Neha sees the new client among the clients',
		async run(s) {
			const page = await s.open('neha', '/clients', 'sees the new client among the clients');
			const row = page.locator('a, tr, .list-row', { hasText: company }).first();
			await expect(row).toBeVisible({ timeout: 30_000 });
			await s.spot(row, NOTE.outcome(company, auditLines || 12));
			await running().done(`${company} among the clients`);
		}
	},
	{
		id: 'signout',
		title: 'Neha reads her account and signs out of the console',
		async run(s) {
			const page = await s.open('neha', '/', 'opens her account');
			const me = page.locator('button.sb-user').first();
			await s.click(me, 700);
			const sheet = page.getByRole('dialog', { name: 'Account' });
			await expect(sheet).toBeVisible();
			await s.mark(
				[
					[sheet.locator('.list-row', { hasText: 'Email' }).first(), 'Her work email'],
					[sheet.locator('.list-row', { hasText: 'Passkey' }).first(), 'Her passkey'],
					[sheet.getByRole('button', { name: 'Sign out' }), 'Sign out']
				],
				WHY.account
			);
			await s.click(sheet.getByRole('button', { name: 'Sign out' }), 300);
			const splash = page.locator('.cs-splash');
			if (await splash.isVisible({ timeout: 3000 }).catch(() => false)) {
				await s.spot(splash, WHY.signedOut, 2400).catch(() => {});
			}
			await expect(page.locator('#si-email')).toBeVisible({ timeout: 30_000 });
			await page.waitForTimeout(1500);
			await running().done('Signed out: back at the sign-in');
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
			await s.chapter(
				n ? `${n} · ${step.title}` : step.title,
				n ? { n, of: STEPS.length, title: step.title } : undefined
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
		const keep = process.env.E2E_KEEP;
		if (keep && existsSync(video)) {
			mkdirSync(dirname(keep), { recursive: true });
			copyFileSync(video, keep);
			const chapters = video.replace(/\.mp4$/, '.chapters.json');
			if (existsSync(chapters)) copyFileSync(chapters, keep.replace(/\.mp4$/, '.chapters.json'));
		}
	}
});
