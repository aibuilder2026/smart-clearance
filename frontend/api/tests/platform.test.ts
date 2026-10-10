import { describe, expect, it } from 'vitest';
import {
	agentDefaults,
	batchGates,
	batchPage,
	dashboard,
	type BatchQuery,
	clearOverrideLine,
	DAY_MINUTES,
	DAY_PRESETS,
	dayBadge,
	dayHead,
	dayMinutesError,
	dayMinutesLine,
	dayReadouts,
	dayWords,
	spanWords,
	exitsFor,
	fireLine,
	journeyFromStart,
	journeyOf,
	resetLine,
	type MockJourney,
	overrideError,
	overrideLine,
	skuGatesError,
	skuGatesLine,
	profileLines,
	showValue,
	slug,
	summary,
	type Client,
	type ConsoleConfig,
	type PresetId,
	type Profile
} from '../src/console/index';
import catalog from '../src/seed/catalog.json';
import seed from '../src/seed/console.json';
import { prototype } from './design3';

// the platform's rules, ported to TypeScript, give the answers design3/core/platform.js gives
const P = prototype().SC3_PLATFORM;
const config = seed.config as ConsoleConfig;
const munchly = seed.state.clients[0] as unknown as Client;
const R = config.defaults;

const profiles: Profile[] = [];
for (const route of ['distributors', 'modern-trade', 'own'] as const)
	for (const owner of ['distributor', 'manufacturer'] as const)
		for (const expiry of ['godown', 'full-credit', 'price-support', 'none'] as const)
			profiles.push({ route, owner, expiry });

describe("the platform's rules match platform.js", () => {
	it('reads the seed as platform.js seeds it', () => {
		expect(JSON.parse(JSON.stringify(P.seed().clients))).toEqual(seed.state.clients);
		expect(config.autonomy).toEqual(P.AUTONOMY);
		expect(config.fields).toEqual(P.FIELDS);
	});
	it("writes the line under each agent's name", () => {
		const variants = [
			munchly,
			{ ...munchly, exits: { ...munchly.exits, kirana: { on: false } } },
			{ ...munchly, people: [] }
		];
		for (const c of variants)
			for (const [id, cfg] of Object.entries(c.agents)) {
				expect(summary(id, cfg.settings, c)).toBe(P.summary(id, cfg.settings, c));
				const one = { ...cfg.settings, counters: 1, territoryGuard: false };
				expect(summary(id, one, c)).toBe(P.summary(id, one, c));
			}
	});
	it('shows each setting as the audit log names it', () => {
		for (const [id, fields] of Object.entries(config.fields))
			for (const f of fields)
				for (const v of [munchly.agents[id].settings[f.key], 0.5, 14, true, false, 'Hindi first'])
					expect(showValue(f, v)).toBe(P.showValue(f, v));
	});
	it('switches on the exits each profile allows', () => {
		for (const p of profiles) expect(exitsFor(p, R.staffCap)).toEqual(P.exitsFor(p));
	});
	it('says what each profile sets up', () => {
		for (const p of profiles) expect(profileLines(p, config.exits, R.staffCap)).toEqual(P.profileLines(p));
	});
	it("makes a workspace address from a company's name", () => {
		for (const name of ['Kesari Foods', 'Amrit Dairy Pvt', 'Café Coffee Day Ltd', '  Shree Ram & Sons India ', '', 'X'])
			expect(slug(name)).toBe(P.slug(name));
	});
	it('starts each agent where its preset says', () => {
		for (const preset of ['cautious', 'standard', 'trusted'] as PresetId[])
			expect(agentDefaults(preset, catalog.agents, R, 'admin-x')).toEqual(
				P.agentDefaults(preset, { approver: 'admin-x' })
			);
	});
});

describe('quick-commerce gates per SKU, with a per-batch override (SC-47), match platform.js', () => {
	const state = P.seed();
	const c = state.clients[0];
	it("gives every batch the gates platform.js gives it, on the console's day and at the edges", () => {
		for (const b of state.batches)
			for (const today of [seed.today, '2026-11-18', '2026-11-25', '2026-08-20', '2026-12-08'])
				expect(
					batchGates(
						c,
						c.skus.find((x: { id: string }) => x.id === b.sku),
						b,
						today
					)
				).toEqual(P.batchGates(c, b, today));
	});
	it('checks gates and overrides in the same words', () => {
		for (const g of [
			null,
			{},
			{ blinkitDays: 45, qcomPct: 50 },
			{ blinkitDays: 29 },
			{ qcomPct: 91 },
			{ blinkitDays: 45.5 }
		])
			expect(skuGatesError(g)).toBe(P.skuGatesError(g));
		for (const o of [
			{ reason: 'x' },
			{ blinkitDays: 6, reason: 'x' },
			{ qcomPct: 4, reason: 'x' },
			{ qcomPct: 30, reason: '  ' },
			{ qcomPct: 30, reason: 'y'.repeat(201) },
			{ qcomPct: 30, blinkitDays: 60, reason: 'A deal' }
		])
			expect(overrideError(o)).toBe(P.overrideError(o));
	});
	it('writes the audit lines platform.js writes', () => {
		const sku = c.skus[5];
		expect(skuGatesLine(c, sku, { blinkitDays: 45, qcomPct: 50 })).toBe(
			P.skuGatesLine(c, sku, { blinkitDays: 45, qcomPct: 50 })
		);
		expect(skuGatesLine(c, sku, null)).toBe(P.skuGatesLine(c, sku, null));
		expect(overrideLine('MF-2409-204', { qcomPct: 30, reason: ' A deal ' })).toBe(
			P.overrideLine('MF-2409-204', { qcomPct: 30, reason: ' A deal ' })
		);
		expect(clearOverrideLine('MF-2409-204')).toBe(P.clearOverrideLine('MF-2409-204'));
	});
});

describe('the length of a journey day (SC-68) matches platform.js', () => {
	it('says every length from 1 to 1,440 minutes in the same words', () => {
		expect(DAY_MINUTES).toBe(P.DAY_MINUTES);
		expect(DAY_PRESETS).toEqual(P.DAY_PRESETS);
		for (let m = 1; m <= 1440; m++) {
			expect(dayWords(m)).toBe(P.dayWords(m));
			expect(dayBadge(m)).toBe(P.dayBadge(m));
			expect(dayHead(m)).toBe(P.dayHead(m));
			expect(dayReadouts(m)).toEqual(P.dayReadouts(m));
		}
		for (const min of [1, 10, 89, 90, 235, 2159, 2160, 2880, 67680]) expect(spanWords(min)).toBe(P.spanWords(min));
	});
	it('checks a length and writes the audit line platform.js writes', () => {
		for (const v of [0, 1, 5, 1440, 1441, -5, 4.5, null, '5', Number.NaN])
			expect(dayMinutesError(v)).toBe(P.dayMinutesError(v));
		for (const [to, was] of [
			[5, 1440],
			[1440, 5],
			[90, 1],
			[120, 1439]
		])
			expect(dayMinutesLine(munchly, to, was)).toBe(P.dayMinutesLine(munchly, to, was));
		expect(dayMinutesLine(munchly, 5, 1440)).toBe(
			'Set the length of a journey day for Munchly Foods to 5 minutes (was a day)'
		);
		expect(dayBadge(5)).toBe('1 day = 5 min');
		expect(dayReadouts(5).map((r) => r.value)).toEqual(['every 5 minutes', 'open 10 minutes', 'about 3.9 hours']);
	});
	it('starts every client in real time', () => {
		expect(munchly.dayMinutes).toBe(1440);
		expect(
			P.buildClient({
				name: 'Kesari Foods',
				preset: 'standard',
				route: 'distributors',
				owner: 'manufacturer',
				expiry: 'full-credit'
			}).dayMinutes
		).toBe(1440);
	});
});

describe("the Overview's dashboard (SC-48) matches platform.js", () => {
	const noon = Date.parse(seed.today + 'T12:00:00+05:30');
	// the seed, then a world where two batches have closed and one waits for a yes
	const worlds = () => {
		const a = P.seed();
		const b = P.seed();
		b.batches[2].closedAt = '2026-10-05T15:00:00+05:30';
		b.batches[2].recovered = 25000;
		b.batches[2].outcome = 'cleared';
		b.batches[3].closedAt = '2026-09-10T11:00:00+05:30';
		b.batches[3].recovered = 9000;
		b.batches[4].current = b.batches[4].done = 5;
		b.batches[4].openedAt = '2026-10-06T06:00:00+05:30';
		return [a, b];
	};
	it('gives the same figures over 7, 30 and 90 days, every client or one', () => {
		for (const w of worlds())
			for (const days of [7, 30, 90])
				for (const client of [null, 'munchly', 'nobody'])
					expect(dashboard(w, { days, client, today: seed.today, now: noon })).toEqual(
						P.dashboard(w, { days, client, now: noon })
					);
	});
	it('gives the same pages, filtered, searched and sorted', () => {
		const queries: BatchQuery[] = [
			{},
			{ page: 2 },
			{ q: 'chips' },
			{ stop: 1 },
			{ status: 'waiting' },
			{ status: 'closed' },
			{ sort: 'value', dir: 'desc' },
			{ sort: 'updated', dir: 'desc' },
			{ sort: 'days', size: 16 },
			{ client: 'munchly', sort: 'stop' }
		];
		for (const w of worlds()) for (const q of queries) expect(batchPage(w, q, seed.today)).toEqual(P.batchPage(w, q));
	});
	it('refuses a range or a page size it does not offer', () => {
		expect(() => dashboard(P.seed(), { days: 10, today: seed.today })).toThrow('Show 7, 30 or 90 days.');
		expect(() => batchPage(P.seed(), { size: 10 }, seed.today)).toThrow('Show 8, 16 or 32 rows a page.');
	});
});

describe("a client's journey, driven from the console (SC-79), matches platform.js", () => {
	const journeys = (seed.state as unknown as { journeys: Record<string, MockJourney> }).journeys;
	const wall = Date.parse('2026-10-08T06:00:00Z');
	it('lists the same runs and timers, in time order, at every length of a journey day', () => {
		for (const dayMinutes of [1440, 60, 5, 1]) {
			const c = { ...munchly, dayMinutes };
			expect(journeyOf(c, journeys.munchly, wall)).toEqual(P.journey({ clients: [c], journeys }, 'munchly', wall));
		}
	});
	it('gives a client with no live journey its two daily runs, on request', () => {
		expect(journeyOf(munchly, undefined, wall)).toEqual(
			P.journey({ clients: [munchly], journeys: {} }, 'munchly', wall)
		);
	});
	it('writes the audit lines platform.js writes', () => {
		for (const t of journeyOf(munchly, journeys.munchly, wall).triggers)
			expect(fireLine(munchly, t, catalog.agents)).toBe(P.fireLine(munchly, t));
		for (const t of journeyOf(munchly, undefined, wall).triggers)
			expect(fireLine(munchly, t, catalog.agents)).toBe(P.fireLine(munchly, t));
		expect(resetLine(journeys.munchly.day0)).toBe(P.resetLine());
	});
	it('starts the journey again where platform.js does', () => {
		const draft = { journeys: structuredClone(journeys) };
		P.resetJourney(draft, 'munchly');
		expect(journeyFromStart(journeys.munchly.day0)).toEqual(draft.journeys.munchly);
	});
});
