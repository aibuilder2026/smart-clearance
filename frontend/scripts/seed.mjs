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
// the workspace app's seed reads one more file (only a literal in it)
const SOURCES_OF = { 'core/src/lib/workspace/seed': [...SOURCES, 'core/flow.js'] };

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
	quarter: D.QUARTER,
	setup: D.SETUP,
	shelf: D.SHELF,
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
	returnBy: D.RETURN_BY,
	rules: window.SC3_MONEY.RULES,
	roles: ROLES,
	// the Data agent's first entry in the timeline (design3/core/flow.js CONNECT_EV)
	connectEvent: CONNECT_EV,
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
		audit: platform.audit
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
	'core/src/lib/workspace/seed': { 'workspace.json': json(workspaceSeed) },
	// backend-api loads the same reference data into its database at migrate time, and imports the console's day
	// (Munchly Foods) through its own services when it hydrates; its image builds from backend-api/ alone
	'../backend-api/src/sc_api/reference': {
		'showcase.json': json(showcase),
		'catalog.json': json(catalog),
		'directory.json': json(directory),
		'console.json': json(consoleSeed),
		'rules.json': json(ruleFixtures)
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
