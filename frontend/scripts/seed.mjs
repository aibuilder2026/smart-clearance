// Seeds the frontend's mock API from the prototype's own data. design3/core (money.js, data.js, store.js, platform.js)
// is run as the browser runs it, so every figure is computed by money.js exactly as on the hosted pages, and the parts
// the frontend shows are written as JSON: the API's seed to api/src/seed/ (the landing page's and the console's), the
// design-system page's to admin/src/lib/seed/. Never edit those files; run this instead.
//   node scripts/seed.mjs           write the seed files
//   node scripts/seed.mjs --check   fail if a seed file is out of date with design3 (run by `pnpm test`)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const design3 = join(root, '../design3');
const SOURCES = [
	'core/money.js',
	'core/data.js',
	'core/store.js',
	'core/platform.js',
	'screens/admin.jsx',
	'system/product.jsx'
];
// the workspace app's seed reads one more file (only a literal in it); backend-api's reference data also runs the live
// world (SC-66) and the journey itself, for the fixtures its Python ports are held to
const WORLD_SOURCES = ['core/world.js', 'core/flow.js', 'core/ledger.js'];
const SOURCES_OF = {
	'core/src/lib/workspace/seed': [...SOURCES, ...WORLD_SOURCES],
	'../backend-api/src/sc_api/reference': [...SOURCES, ...WORLD_SOURCES]
};

const read = (p) => readFileSync(join(design3, p), 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');

// the browser page: one window, scripts in order. Images are referenced as "sc3img:/<path under system/img>", which
// core's imgUrl() resolves to the hashed file.
const window = { SC3_IMG: 'sc3img:/' };
const store = new Map();
const localStorage = {
	getItem: (k) => store.get(k) ?? null,
	setItem: (k, v) => store.set(k, String(v)),
	removeItem: (k) => store.delete(k)
};
const sandbox = vm.createContext({ window, localStorage, console, Date, Intl, Math, JSON, structuredClone });
for (const p of SOURCES.slice(0, 4)) vm.runInContext(read(p), sandbox, { filename: p });
const D = window.SC3_DATA,
	Store = window.SC3_STORE,
	P = window.SC3_PLATFORM;

// the workspace role names, from the workspace admin screen (a JSX file, so only its ROLES literal is read)
const rolesLiteral = read('screens/admin.jsx').match(/const ROLES = (\{[^}]*\});/);
if (!rolesLiteral) throw new Error('seed: ROLES not found in screens/admin.jsx');
const ROLES = vm.runInNewContext(`(${rolesLiteral[1]})`);
// when each of the nine stages happens, from the product patterns (a JSX file, so only its STAGE_TIMES literal is read)
const timesLiteral = read('system/product.jsx').match(/const STAGE_TIMES = (\{[^}]*\});/);
if (!timesLiteral) throw new Error('seed: STAGE_TIMES not found in system/product.jsx');
const STAGE_TIMES = vm.runInNewContext(`(${timesLiteral[1]})`);
// the Data agent's first timeline entry, from the journey's actions (only its CONNECT_EV literal is read)
const connectLiteral = read('core/flow.js').match(/const CONNECT_EV = (\{.*\});/);
if (!connectLiteral) throw new Error('seed: CONNECT_EV not found in core/flow.js');
const CONNECT_EV = vm.runInNewContext(`(${connectLiteral[1]})`);

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
const person = (p) => pick(p, ['id', 'name', 'short', 'role', 'org', 'city', 'img']);
const workspace = pick(D.WORKSPACE, ['id', 'name', 'short', 'domain', 'emailDomain', 'mark']);
const hero = D.BATCHES.find((b) => b.hero);
const dist = D.DISTRIBUTORS[hero.distributor];

/** GET /v1/site/showcase: one batch, as the landing page tells it. It is the prototype's hero batch with every figure
 *  worked out, but nothing in it names the client, its people or its partners: the platform's own page tells it as an
 *  illustrative batch (SC-28) */
const showcase = {
	platform: D.PLATFORM,
	// the pack's own name: the brand is a field of its own, and the platform's page leaves it out
	batch: {
		daysLeft: hero.daysLeft,
		distributorCity: dist.city,
		units: hero.units,
		sellPerDay: hero.sellPerDay,
		product: D.SKUS[hero.sku].name,
		mrp: D.SKUS[hero.sku].mrp,
		bestBefore: hero.bestBefore
	},
	risk: {
		atRisk: D.RISK.atRisk,
		gates: D.RISK.gates.map((g) => pick(g, ['id', 'app', 'rule', 'has', 'need', 'pass']))
	},
	rules: {
		...pick(window.SC3_MONEY.RULES, ['kiranaWindowDays', 'scheme']),
		foodbankMinDays: window.SC3_MONEY.CHANNELS.find((c) => c.id === 'foodbank').minDays,
		reservePerUnit: window.SC3_MONEY.RULES.negotiation.reservePerUnit
	},
	plan: {
		net: D.PLAN.net,
		pctMRP: D.PLAN.pctMRP,
		swing: D.PLAN.swing,
		soldUnits: D.PLAN.soldUnits,
		itcRetained: D.PLAN.itcRetained,
		kg: D.PLAN.kg,
		co2: D.PLAN.co2,
		writeOff: { total: D.PLAN.writeOff.total, perUnit: D.PLAN.writeOff.perUnit },
		lines: D.PLAN.lines.map((l) => pick(l, ['id', 'short', 'units', 'price', 'packPrice', 'gross', 'cost', 'net'])),
		rows: D.PLAN.rows.map((r) => ({
			...pick(r, ['id', 'short', 'net', 'eligible']),
			capacity: r.capacity === Infinity ? null : r.capacity
		}))
	},
	// the buyer's opening bid is the one data.js counters (M.counter(ASK, 13))
	award: { ...pick(D.AWARD, ['units', 'price', 'gross', 'token']), bid: 13 },
	support: { total: D.SUPPORT.total },
	// the offer's Hindi title only: its body names the shop, the brand and the distributor, which this page leaves out
	offer: { title: D.PUSH.offer.title },
	actual: pick(D.ACTUAL, ['net', 'pnl', 'swing']),
	shops: D.KIRANAS.length,
	stages: D.STAGES.map((s) => ({ id: s.id, title: s.title, human: !!s.human }))
};

/** GET /v1/platform/catalog: what the platform offers every client */
const catalog = {
	agents: P.AGENTS.map((a) => ({ ...pick(a, ['id', 'name', 'stage', 'icon', 'model', 'job']), gate: !!a.gate })),
	connectors: P.CONNECTORS.map((c) => pick(c, ['id', 'name', 'kind', 'icon', 'note', 'status'])),
	plans: P.PLANS.map((p) => pick(p, ['id', 'name', 'scope']))
};

/** the mock's directory for POST /v1/workspaces/lookup: who belongs to which workspace (a real API never sends this) */
const directory = {
	workspaces: [workspace],
	roles: ROLES,
	members: Store.seed().users.map((u) => ({
		workspace: workspace.id,
		...pick(u, ['id', 'name', 'email', 'phone', 'role', 'status', 'kind'])
	}))
};

/** what the design-system page shows: the people, and the figures its specimens quote */
const ds = {
	people: Object.values(D.PEOPLE).map(person),
	workspace,
	gates: D.RISK.gates,
	figures: {
		planNet: D.PLAN.net,
		actualNet: D.ACTUAL.net,
		planSwing: D.PLAN.swing,
		quarterRecovered: D.QUARTER.recovered,
		writeOffTotal: D.PLAN.writeOff.total,
		itcRetained: D.PLAN.itcRetained,
		writeOffItc: D.PLAN.writeOff.itc,
		units: D.PLAN.units
	}
};

/** the workspace app's stub (SC-62): Munchly's workspace as design3/core sets it up, every figure worked out by money.js,
 *  and the store's first state (design3/core/store.js). The app runs the prototype's journey on it in the browser until
 *  backend-api serves the workspace. A quantity without a limit (Infinity) is written as null */
const workspaceSeed = {
	day0: D.DAY0,
	platform: D.PLATFORM,
	workspace: D.WORKSPACE,
	client: D.CLIENT,
	skus: D.SKUS,
	distributors: D.DISTRIBUTORS,
	buyer: D.BUYER,
	people: D.PEOPLE,
	kiranas: D.KIRANAS,
	offered: D.OFFERED,
	// each batch with the Watcher's reading of it (money.js assess); the app adds its SKU and distributor
	batches: D.BATCHES.map((b) => ({ ...b, assess: D.batchView(b).assess })),
	stages: D.STAGES.map((s) => ({ ...s, human: !!s.human, time: STAGE_TIMES[s.id] })),
	push: D.PUSH,
	chat: D.CHAT,
	events: D.EVENTS,
	setup: D.SETUP,
	risk: D.RISK,
	plan: D.PLAN,
	counter: D.COUNTER,
	award: D.AWARD,
	actual: D.ACTUAL,
	support: D.SUPPORT,
	supportPlan: D.SUPPORT_PLAN,
	claim: D.CLAIM,
	docs: D.DOCS,
	mangoPlan: D.MANGO_PLAN,
	mangoFb: D.MANGO_FB,
	// the receipt Feeding India issues as the Mango Drink is collected (SC-110)
	mangoReceipt: D.MANGO_RECEIPT,
	returnBy: D.RETURN_BY,
	rules: window.SC3_MONEY.RULES,
	roles: ROLES,
	// the Data agent's first entry in the timeline (design3/core/flow.js CONNECT_EV)
	connectEvent: CONNECT_EV,
	// the journey's moments beyond its timeline, ExpireSoon's terms and other lots, and who a visitor can step into
	journey: D.JOURNEY,
	market: D.MARKET,
	explore: D.EXPLORE,
	initial: Store.seed()
};

/** the console's mock backend (design3/core/platform.js): how it describes the agents, exits, the supply-chain profile
 *  and the presets (GET /v1/console/config), and the day it opens on: Munchly Foods as the only client, the platform's
 *  staff, today's runs and batches, and the audit log */
const R = window.SC3_MONEY.RULES;
const platform = P.seed();
const consoleSeed = {
	config: {
		autonomy: P.AUTONOMY,
		stageNames: P.STAGE_NAME,
		fields: P.FIELDS,
		exits: P.EXITS,
		profile: P.PROFILE,
		presets: P.PRESETS,
		stages: D.STAGES.map((s) => ({ id: s.id, title: s.title, human: !!s.human, time: STAGE_TIMES[s.id], who: s.who })),
		defaults: {
			gates: { blinkitDays: R.gates.blinkit.minDays, qcomPct: Math.round(R.gates.zepto.pctLife * 100) },
			returnWindowDays: R.returnWindowDays,
			reserve: R.negotiation.reservePerUnit,
			staffCap: R.staffCap,
			tokenPct: Math.round(R.tokenPct * 100),
			scheme: '2 free with every 10',
			offerWindowHours: 48
		}
	},
	state: {
		clients: platform.clients,
		staff: platform.staff,
		runs: platform.runs.map((r) => pick(r, ['at', 'agent', 'client', 'text'])),
		// each batch names its product and distributor, as the console shows them
		tracks: platform.tracks.map((t) => ({
			client: t.client,
			batch: t.batch,
			product: D.SKUS[t.sku].name,
			distributor: D.DISTRIBUTORS[t.distributor].name,
			city: D.DISTRIBUTORS[t.distributor].city,
			...pick(t, ['done', 'current', 'note', 'money', 'split'])
		})),
		// the batches the Watcher sees, with their best-before dates and any gate override (SC-47)
		batches: platform.batches,
		audit: platform.audit,
		// each live client's journey, as the console fires its runs and timers and resets it (SC-79)
		journeys: platform.journeys
	},
	// the day the console opens on, which every batch's days left counts from
	today: P.TODAY
};

/** backend-api's tests: what platform.js itself answers, so the Python ports of its rules can be checked against it */
const PROFILES = [];
for (const route of ['distributors', 'modern-trade', 'own'])
	for (const owner of ['distributor', 'manufacturer'])
		for (const expiry of ['full-credit', 'price-support', 'none']) PROFILES.push({ route, owner, expiry });
const SAMPLES = {
	time: ['08:30', '21:05'],
	number: [0.5, 0.9, 0.955, 14, 30, 90, 365],
	money: [1, 13.5, 14, 0.125, 1.005, 99.995],
	stepper: [0, 1, 3],
	switch: [true, false],
	approver: ['priya', 'admin-x']
};
const ruleFixtures = {
	exitsFor: PROFILES.map((profile) => ({ profile, exits: P.exitsFor(profile) })),
	agentDefaults: ['cautious', 'standard', 'trusted'].map((preset) => ({
		preset,
		approver: 'admin-x',
		agents: P.agentDefaults(preset, { approver: 'admin-x' })
	})),
	showValue: Object.entries(P.FIELDS).flatMap(([agent, fields]) =>
		fields.flatMap((f) =>
			(f.type === 'select' ? f.options : SAMPLES[f.type]).map((value) => ({
				agent,
				key: f.key,
				value,
				text: P.showValue(f, value)
			}))
		)
	),
	// SC-47: a batch's quick-commerce gates (its override, else its SKU's, else the client's default), and what an
	// SKU's gates or a batch's override must be
	batchGates: (() => {
		const c = platform.clients[0];
		const cases = platform.batches.map((b) => ({ batch: b, today: P.TODAY }));
		// the edges: a batch on its last day, one past its date, and one exactly at each gate
		const at = (ref, today) => ({ batch: platform.batches.find((b) => b.ref === ref), today });
		cases.push(
			at('MF-2409-117', '2026-11-18'),
			at('MF-2409-117', '2026-11-25'),
			at('MF-2409-117', '2026-08-20'),
			at('MF-2410-402', '2026-12-08')
		);
		return cases.map(({ batch, today }) => ({
			client: { gates: c.gates },
			sku: c.skus.find((s) => s.id === batch.sku),
			batch: pick(batch, ['sku', 'bestBefore', 'override']),
			today,
			gates: P.batchGates(c, batch, today)
		}));
	})(),
	skuGatesError: [
		null,
		{},
		{ blinkitDays: 45, qcomPct: 50 },
		{ blinkitDays: 29 },
		{ blinkitDays: 181 },
		{ qcomPct: 91 },
		{ qcomPct: 30 },
		{ blinkitDays: 45.5 }
	].map((gates) => ({ gates, error: P.skuGatesError(gates) })),
	overrideError: [
		{ reason: 'x' },
		{ blinkitDays: 6, reason: 'x' },
		{ blinkitDays: 7, reason: 'x' },
		{ qcomPct: 4, reason: 'x' },
		{ qcomPct: 91, reason: 'x' },
		{ qcomPct: 30, reason: '   ' },
		{ qcomPct: 30, reason: 'y'.repeat(201) },
		{ qcomPct: 30, blinkitDays: 60, reason: 'A deal' }
	].map((input) => ({ input, error: P.overrideError(input) })),
	// SC-48: the Overview's figures and its pages of batches, on the console's day at noon in India
	dashboard: [7, 30].map((days) => ({
		days,
		figures: P.dashboard(platform, { days, now: Date.parse(P.TODAY + 'T12:00:00+05:30') })
	})),
	batchPages: [
		{},
		{ page: 2 },
		{ q: 'chips' },
		{ q: 'Nagpur' },
		{ stop: 1 },
		{ sort: 'value', dir: 'desc' },
		{ sort: 'days', dir: 'desc', size: 16 },
		{ status: 'closed' },
		{ client: 'nobody' }
	].map((query) => ({ query, page: P.batchPage(platform, query) })),
	gateLines: {
		sku: P.skuGatesLine(platform.clients[0], platform.clients[0].skus[5], { blinkitDays: 45, qcomPct: 50 }),
		skuOne: P.skuGatesLine(platform.clients[0], platform.clients[0].skus[6], { blinkitDays: 180 }),
		skuDefault: P.skuGatesLine(platform.clients[0], platform.clients[0].skus[5], null),
		override: P.overrideLine('MF-2409-204', { qcomPct: 30, reason: ' A deal ' }),
		clear: P.clearOverrideLine('MF-2409-204')
	},
	// SC-68: the length of a journey day, what it must be and the audit line that records a change of it
	dayMinutes: {
		errors: [0, 1, 5, 60, 1440, 1441, -5, 4.5, null, '5'].map((value) => ({ value, error: P.dayMinutesError(value) })),
		lines: [
			[5, 1440],
			[1440, 5],
			[1, 60],
			[90, 1],
			[120, 1439],
			[59, 61]
		].map(([to, was]) => ({
			client: 'Munchly Foods',
			to,
			was,
			text: P.dayMinutesLine({ name: 'Munchly Foods' }, to, was)
		}))
	},
	slug: [
		'Kesari Foods',
		'Amrit Dairy Pvt',
		'Café Coffee Day Ltd',
		'  Shree Ram & Sons India ',
		'',
		'X',
		'A'.repeat(40)
	].map((name) => ({ name, slug: P.slug(name) }))
};

/* ---------- the live journey (SC-66): Munchly's world for backend-api, and the fixtures its Python ports are held to
   design3/core/world.js adds what the live workspace needs beyond the prototype's screens (sign-in addresses, all 38
   kiranas, pincodes); flow.js is run step by step so the backend's journey can be compared with the prototype's. */
for (const p of WORLD_SOURCES) vm.runInContext(read(p), sandbox, { filename: p });
const W = window.SC3_WORLD,
	F = window.SC3_FLOW,
	M = window.SC3_MONEY,
	L = window.SC3_LEDGER;

/** the ledger of Munchly's history (design3/core/ledger.js, SC-121): each batch it cleared before the story as its case
 *  (the stub's batch pages read them), and as the ledger reads it on the story's day 0, which backend-api's ledger.py
 *  is held to */
const historyRows = L.rowsOf(L.HISTORY);
const historyLedger = { today: D.DAY0, batches: historyRows, periods: L.periods(historyRows, D.DAY0) };

/** the world backend-api's hydrate builds Munchly from, and the story's copy the backend renders with live figures */
/** the story's moments (data.js JOURNEY) as rules backend-api times a live journey by: how soon a plan follows the
 *  label, the listing's address, when the van leaves, and the food bank's pickup and the slots it may move to (days
 *  after the proposed day, and the hour). The story's own spot is kept for its own partner and city. */
function moments(J) {
	const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const day = WEEK.indexOf(J.donation.day);
	if (day < 0 || !J.listing.url.includes(J.listing.id)) throw new Error('seed: JOURNEY has changed shape');
	const second = D.BATCHES.find((b) => b.second);
	return {
		planMinutes: J.planMinutes,
		listingUrl: J.listing.url.replace(J.listing.id, '{id}'),
		van: { leaves: J.van.leaves },
		donation: {
			time: J.donation.time,
			slots: J.donation.slots.map((s) => {
				const [d, time] = s.split(' ');
				return { days: (WEEK.indexOf(d) - day + 7) % 7, time };
			}),
			spots: { [J.donation.partner]: { [D.DISTRIBUTORS[second.distributor].city]: J.donation.spot } },
			// the story's reply, for the template's test
			story: { day: J.donation.day, spot: J.donation.spot, reply: J.donation.reply }
		}
	};
}

const journey = {
	day0: D.DAY0,
	platform: D.PLATFORM,
	client: D.CLIENT,
	workspace: { ...D.WORKSPACE, signIn: W.SIGN_IN, outside: W.OUTSIDE },
	domains: W.DOMAINS,
	skus: D.SKUS,
	distributors: D.DISTRIBUTORS,
	buyer: D.BUYER,
	people: D.PEOPLE,
	areas: W.AREAS,
	kiranas: W.KIRANAS,
	offered: D.OFFERED,
	members: W.MEMBERS,
	org: W.ORG,
	batches: D.BATCHES,
	stages: workspaceSeed.stages,
	setup: D.SETUP,
	returnBy: D.RETURN_BY,
	rules: Store.seed().rules,
	moneyRules: M.RULES,
	channels: M.CHANNELS,
	integrations: W.INTEGRATIONS,
	numbers: W.NUMBERS,
	label: W.LABEL,
	labels: W.LABELS,
	roles: ROLES,
	copy: { push: D.PUSH, chat: D.CHAT, events: D.EVENTS, connectEvent: F.CONNECT_EV },
	moments: moments(D.JOURNEY),
	market: D.MARKET,
	// the people a judge may sign in as, by where they stand (data.js EXPLORE): the live sign-in's chips fill their address
	explore: D.EXPLORE.groups,
	// Munchly's history (SC-123): the batches cleared in its pilot quarter, on the schedule backend-api builds them by
	// (services/journey/history.py), each with what money.js makes of it for the tests to hold the build to
	history: {
		at: D.HISTORY_AT,
		start: D.HISTORY.start,
		batches: D.HISTORY.batches.map((b) => ({
			ref: b.ref,
			sku: b.sku,
			distributor: b.distributor,
			units: b.units,
			daysLeft: b.daysLeft,
			sellPerDay: b.sellPerDay,
			flagged: b.flagged,
			bestBefore: b.bestBefore,
			mfg: b.mfg,
			outcome: b.outcome,
			bid: b.bid,
			price: b.price,
			partner: b.partner,
			kirana: b.kirana,
			staff: b.staff,
			steps: b.steps,
			numbers: b.numbers,
			expect: {
				net: b.actual.net,
				swing: b.actual.swing,
				pnl: b.actual.pnl,
				itc: b.realised.itcRetained,
				itcReversed: b.realised.itcReversed,
				kg: b.realised.kg,
				co2: b.realised.co2,
				meals: b.realised.meals,
				godown: b.realised.godown,
				destroyed: b.realised.destroyed,
				support: b.support.total,
				credit: b.expiry ? b.expiry.credit : 0
			}
		})),
		ledger: historyLedger,
		// what a partner's pages read of each batch (SC-130, ledger.js partners), for backend-api's partner route
		partners: L.HISTORY.map((c) => ({
			ref: c.ref,
			sku: c.sku.id,
			dist: c.dist.id,
			outcome: c.outcome,
			flagged: c.flagged,
			cleared: c.cleared,
			steps: c.steps,
			batch: { daysLeft: c.batch.daysLeft, bestBefore: c.batch.bestBefore },
			plan: {
				units: c.plan.units,
				lines: c.plan.lines.map(({ id, short, units, price, packPrice }) => ({ id, short, units, price, packPrice }))
			},
			realised: {
				lines: c.realised.lines.map(({ id, units, gross, price }) => ({ id, units, gross, price })),
				godown: c.realised.godown
			},
			listing: c.listing ? { id: c.listing.id } : null,
			offered: c.offered,
			kiranas: c.kiranas.map(({ kirana, units }) => ({ kirana, units })),
			kirana: c.kirana,
			award: c.award ? { price: c.award.price, token: c.award.token } : null,
			partner: c.partner ? { name: c.partner.name } : null,
			donation: c.donation ? { units: c.donation.units, spot: c.donation.spot } : null,
			receipt: c.receipt ? { no: c.receipt.no, kg: c.receipt.kg, meals: c.receipt.meals } : null,
			support: { total: c.support.total, van: c.support.van, fee: c.support.fee },
			expiry: c.expiry && c.expiry.units ? { units: c.expiry.units, credit: c.expiry.credit } : null,
			docs: c.docs.map(({ id, no, status, amount, reversed }) => ({
				id,
				no,
				status,
				amount,
				...(reversed != null ? { reversed } : {})
			}))
		}))
	}
};

/** money.js's own answers, for backend-api's domain/money.py: every case carries its inputs */
const moneyFixtures = (() => {
	const sku = (b) => D.SKUS[b.sku];
	const hero = D.BATCHES.find((b) => b.hero);
	const vary = (b, patch) => ({ ...b, ...patch, id: `${b.id}~${Object.keys(patch).join('-')}` });
	// the story's nine batches, and the edges: too few days for the kirana scheme, for every exit but the staff sale, a
	// personal-care batch the food bank may not take, a batch without label dates, and more stock than the exits hold
	const batches = [
		...D.BATCHES,
		vary(hero, { daysLeft: 18 }),
		vary(hero, { daysLeft: 10 }),
		vary(hero, { mfg: undefined, bestBefore: undefined }),
		vary(
			D.BATCHES.find((b) => b.sku === 'facewash'),
			{ daysLeft: 25, sellPerDay: 2 }
		),
		vary(
			D.BATCHES.find((b) => b.sku === 'facewash'),
			{ daysLeft: 12, units: 2000, sellPerDay: 1 }
		),
		vary(hero, { units: 20000 })
	];
	const plans = batches.map((b) => ({ batch: b, sku: sku(b), assess: M.assess(b, sku(b)), plan: M.plan(b, sku(b)) }));
	const heroPlan = M.plan(hero, D.SKUS.chips);
	const award = M.award(772, M.counter(15, 13).price);
	const support = M.priceSupport(heroPlan, D.SKUS.chips, award.price);
	const parties = { seller: D.DISTRIBUTORS.rakesh, buyer: D.BUYER, client: D.CLIENT };
	const mango = D.BATCHES.find((b) => b.sku === 'mango');
	const mangoPlan = M.plan(mango, D.SKUS.mango);
	return {
		rules: M.RULES,
		channels: M.CHANNELS,
		plans,
		writeOff: [
			[1360, 'chips'],
			[58, 'mango'],
			[1, 'facewash']
		].map(([units, id]) => ({ units, sku: D.SKUS[id], out: M.writeOff(units, D.SKUS[id]) })),
		counter: [15, 14, 12.5, 10].flatMap((ask) =>
			[10, 13, 13.5, 14, 14.2, 14.25, 15, 16].map((bid) => ({ ask, bid, out: M.counter(ask, bid) }))
		),
		award: [
			[772, 14.2],
			[772, 15],
			[100, 13.33]
		].map(([units, price]) => ({ units, price, out: M.award(units, price) })),
		actualNet: [
			{ plan: heroPlan, awardPrice: 14.2 },
			{ plan: heroPlan, awardPrice: 15 },
			{ plan: mangoPlan, awardPrice: 14 }
		].map((c) => ({ ...c, out: M.actualNet(c.plan, c.awardPrice) })),
		// SC-86: a plan once its lines were done, as the journey reports them: done as planned, short on orders, the lot
		// unsold, and the Mango with part of its kirana scheme and staff sale and no food bank
		realised: [
			{ plan: heroPlan, sku: D.SKUS.chips, done: { kirana: 588, expiresoon: 772 } },
			{ plan: heroPlan, sku: D.SKUS.chips, done: { kirana: 500, expiresoon: 772 } },
			{ plan: heroPlan, sku: D.SKUS.chips, done: { kirana: 588, expiresoon: 0 } },
			{ plan: mangoPlan, sku: D.SKUS.mango, done: { kirana: 1372, staff: 150, foodbank: 58 } },
			{ plan: mangoPlan, sku: D.SKUS.mango, done: { kirana: 240, staff: 120, foodbank: 0 } },
			{ plan: mangoPlan, sku: D.SKUS.mango, done: null },
			// SC-110: the meals counted by the rule of the food bank that collected
			...D.SETUP.partners.map((p) => ({
				plan: mangoPlan,
				sku: D.SKUS.mango,
				done: { kirana: 1372, staff: 150, foodbank: 58 },
				mealsRule: p.meals
			})),
			{
				plan: mangoPlan,
				sku: D.SKUS.mango,
				done: { kirana: 240, staff: 120, foodbank: 58 },
				mealsRule: D.SETUP.partners[1].meals
			},
			// SC-122: the packs left at the godown under each expiry policy: under full credit the client destroys them and
			// reverses their credit; otherwise the distributor destroys his own, and the client keeps its credit
			{ plan: heroPlan, sku: D.SKUS.chips, done: { kirana: 444, expiresoon: 772 }, policy: 'full-credit' },
			{ plan: heroPlan, sku: D.SKUS.chips, done: { kirana: 444, expiresoon: 772 }, policy: 'price-support' },
			{ plan: heroPlan, sku: D.SKUS.chips, done: { kirana: 444, expiresoon: 772 }, policy: 'none' }
		].map((c) => ({ ...c, out: M.realised(c.plan, c.sku, c.done, c.mealsRule, c.policy) })),
		// SC-110: each food bank's meals rule, and its receipt for what it collected
		mealsOf: [
			[58, 'mango'],
			[86, 'mango'],
			[1, 'mango'],
			[200, 'chips']
		].flatMap(([units, id]) =>
			[...D.SETUP.partners.map((p) => p.meals), null].map((rule) => ({
				units,
				sku: D.SKUS[id],
				rule,
				out: M.mealsOf(units, D.SKUS[id], rule ?? undefined)
			}))
		),
		receipt: D.SETUP.partners.map((partner, i) => {
			const facts = {
				no: ['FI/HYD/26-27/0417', 'IFBN/ACK/26-27/0112'][i],
				date: '2026-10-06',
				at: '10:00',
				by: 'Meera',
				donor: D.CLIENT.name,
				fssai: D.CLIENT.fssai,
				via: 'Lakshmi Agencies',
				from: 'Begum Bazaar godown, Hyderabad',
				spot: 'the Charminar hunger spot'
			};
			return { units: 86, sku: D.SKUS.mango, partner, facts, out: M.receipt(86, D.SKUS.mango, partner, facts) };
		}),
		priceSupport: [
			{
				plan: M.realised(heroPlan, D.SKUS.chips, { kirana: 500, expiresoon: 772 }),
				sku: D.SKUS.chips,
				awardPrice: 14.2
			},
			{ plan: heroPlan, sku: D.SKUS.chips, awardPrice: 14.2 },
			{ plan: heroPlan, sku: D.SKUS.chips, awardPrice: null },
			{ plan: mangoPlan, sku: D.SKUS.mango, awardPrice: null }
		].map((c) => ({ ...c, out: M.priceSupport(c.plan, c.sku, c.awardPrice ?? undefined) })),
		expiryClaim: [
			[1360, 'chips'],
			[500, 'facewash']
		].map(([units, id]) => ({ units, sku: D.SKUS[id], out: M.expiryClaim(units, D.SKUS[id]) })),
		// SC-94: what the godown's packs come to on expiry day, under each expiry policy; the Mango has no dealer price
		expirySettlement: [
			[564, 'chips', 'full-credit'],
			[564, 'chips', 'price-support'],
			[564, 'chips', 'none'],
			[1318, 'mango', 'full-credit'],
			[1318, 'mango', 'price-support'],
			[0, 'chips', 'full-credit']
		].map(([units, id, policy]) => ({
			units,
			sku: D.SKUS[id],
			policy,
			out: M.expirySettlement(units, D.SKUS[id], policy)
		})),
		// money.js numbers the story's invoice and credit note itself; the port takes the numbers as arguments
		documents: [
			{ plan: heroPlan, sku: D.SKUS.chips, award, support, parties },
			// SC-122: the leftover run's pack: 144 packs came back for full credit, so the memo reverses their credit and
			// the destruction certificate counts them
			{
				plan: M.realised(heroPlan, D.SKUS.chips, { kirana: 444, expiresoon: 772 }),
				sku: D.SKUS.chips,
				award,
				support: M.priceSupport(
					M.realised(heroPlan, D.SKUS.chips, { kirana: 444, expiresoon: 772 }),
					D.SKUS.chips,
					14.2
				),
				parties
			},
			{ plan: mangoPlan, sku: D.SKUS.mango, award: null, support: M.priceSupport(mangoPlan, D.SKUS.mango), parties },
			// SC-110: a donated batch's pack carries the food bank's receipt
			{
				plan: mangoPlan,
				sku: D.SKUS.mango,
				award: null,
				support: M.priceSupport(mangoPlan, D.SKUS.mango),
				parties,
				receipt: D.MANGO_RECEIPT
			}
		].map((c) => ({
			...c,
			numbers: { invoice: 'INV/26-27/0931', support: 'CN/0117' },
			out: M.documents(c.plan, c.sku, c.award, c.support, c.parties, c.receipt)
		})),
		fmt: {
			num: [0, 7, 1360, 21770.4, 123456789, -1840],
			inr: [0, 13.5, 1644, 21770.4, 26330, -26330, 1234567, -0.4],
			inr2: [19.36, -19.36, 0.5, 1234.5, 100000],
			signed: [26340, -26340, 0],
			rate: [0.9, 13.5, 14.2, 22],
			lakh: [630000, 1800000, 41000],
			kg: [217.6, 544, 999.95, 1000, 5700, 14250.5],
			pct: [0.6, 0.355, 1],
			date: ['2026-11-18', '2026-10-02', '2027-01-09'],
			day: ['2026-10-29', '2026-11-01']
		}
	};
})();
// each fmt sample with its answer
moneyFixtures.fmt = Object.fromEntries(
	Object.entries(moneyFixtures.fmt).map(([k, xs]) => [k, xs.map((x) => ({ in: x, out: M.fmt[k](x) }))])
);

/** design3's journey, step by step (flow.js SCRIPT): after each step, the stage and what changed. Ids and the
 *  prototype's clock are left out, so the backend's journey can be compared with it */
const flowFixture = (() => {
	Store.reset();
	const steps = [];
	let before = Store.get();
	const strip = ({ id: _id, ...rest }) => rest;
	for (const [stage, name, o] of F.SCRIPT) {
		F.run(name, o && o.arg);
		const s = Store.get();
		steps.push({
			stage,
			action: name,
			arg: (o && o.arg) ?? null,
			human: (o && o.human) ?? null,
			stageOf: F.stageOf(s),
			setup: s.setup,
			hero: s.hero,
			mango: s.mango,
			feed: s.feed.slice(before.feed.length).map(strip),
			notifications: s.notifications.slice(0, s.notifications.length - before.notifications.length).map(strip),
			audit: s.audit.slice(0, s.audit.length - before.audit.length).map(strip)
		});
		before = s;
	}
	Store.reset();
	return { stages: F.STAGE_IDS, steps };
})();

const json = (o) => JSON.stringify(o, null, '\t') + '\n';
// each folder of generated files, with a manifest of where they came from
const outputs = {
	'api/src/seed': {
		'showcase.json': json(showcase),
		'catalog.json': json(catalog),
		'directory.json': json(directory),
		'console.json': json(consoleSeed)
	},
	'admin/src/lib/seed': { 'ds.json': json(ds) },
	'core/src/lib/workspace/seed': {
		'workspace.json': json(workspaceSeed),
		// the SKU, distributor and buyer by id, as the stub looks them up; the invoice is the pack's own
		'history.json': json({
			cases: L.HISTORY.map(({ sku, dist, buyer: _b, invoice: _i, ...c }) => ({ ...c, sku: sku.id, dist: dist.id })),
			// the ledger's rows: the history's, and the story's chips batch once Impact posts it, on the day it clears
			rows: historyRows,
			story: { row: L.rowOf(L.storyCase()), cleared: L.STORY_CLEARED },
			// every shop a distributor's scheme goes to (world.js), as a kirana's portal finds its own (SC-130)
			shops: W.KIRANAS.map(({ id, name, area, sales14, distributor, member }) => ({
				id,
				name,
				area,
				sales14,
				distributor,
				member
			}))
		})
	},
	// backend-api loads the same reference data into its database at migrate time, and imports the console's day
	// (Munchly Foods) through its own services when it hydrates; its image builds from backend-api/ alone
	'../backend-api/src/sc_api/reference': {
		'showcase.json': json(showcase),
		'catalog.json': json(catalog),
		'directory.json': json(directory),
		'console.json': json(consoleSeed),
		'rules.json': json(ruleFixtures),
		'journey.json': json(journey),
		'money.json': json(moneyFixtures),
		'flow.json': json(flowFixture)
	}
};
for (const [dir, files] of Object.entries(outputs))
	files['manifest.json'] = json({
		note: 'Generated by frontend/scripts/seed.mjs from design3. Do not edit; run `corepack pnpm seed`.',
		sources: Object.fromEntries((SOURCES_OF[dir] ?? SOURCES).map((p) => ['design3/' + p, sha(read(p)).slice(0, 16)])),
		files: Object.fromEntries(Object.entries(files).map(([f, s]) => [f, sha(s).slice(0, 16)]))
	});

const all = Object.entries(outputs).flatMap(([dir, files]) =>
	Object.entries(files).map(([f, s]) => [join(root, dir, f), `${dir}/${f}`, s])
);
if (process.argv.includes('--check')) {
	const stale = all.filter(([path, , s]) => !existsSync(path) || readFileSync(path, 'utf8') !== s);
	if (stale.length) {
		console.error(
			`seed: out of date with design3: ${stale.map(([, name]) => name).join(', ')}. Run \`corepack pnpm seed\`.`
		);
		process.exit(1);
	}
	console.log(`seed: ${all.length} files, up to date with design3`);
} else {
	for (const dir of Object.keys(outputs)) mkdirSync(join(root, dir), { recursive: true });
	for (const [path, , s] of all) writeFileSync(path, s);
	console.log(`seed: wrote ${all.map(([, name]) => name).join(', ')}`);
}
