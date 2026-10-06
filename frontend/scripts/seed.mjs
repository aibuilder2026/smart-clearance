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
		product: D.SKUS[hero.sku].name
	},
	risk: {
		atRisk: D.RISK.atRisk,
		gates: D.RISK.gates.map((g) => pick(g, ['id', 'app', 'rule', 'has', 'need', 'pass']))
	},
	rules: {
		...pick(window.SC3_MONEY.RULES, ['kiranaWindowDays', 'scheme']),
		foodbankMinDays: window.SC3_MONEY.CHANNELS.find((c) => c.id === 'foodbank').minDays
	},
	plan: {
		net: D.PLAN.net,
		soldUnits: D.PLAN.soldUnits,
		itcRetained: D.PLAN.itcRetained,
		kg: D.PLAN.kg,
		writeOff: { total: D.PLAN.writeOff.total, perUnit: D.PLAN.writeOff.perUnit },
		lines: D.PLAN.lines.map((l) => pick(l, ['id', 'short', 'units', 'price', 'packPrice', 'gross', 'cost', 'net'])),
		rows: D.PLAN.rows.map((r) => ({
			...pick(r, ['id', 'short', 'net', 'eligible']),
			capacity: r.capacity === Infinity ? null : r.capacity
		}))
	},
	award: pick(D.AWARD, ['units', 'price', 'gross']),
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
		audit: platform.audit
	}
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
for (const files of Object.values(outputs))
	files['manifest.json'] = json({
		note: 'Generated by frontend/scripts/seed.mjs from design3. Do not edit; run `corepack pnpm seed`.',
		sources: Object.fromEntries(SOURCES.map((p) => ['design3/' + p, sha(read(p)).slice(0, 16)])),
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
