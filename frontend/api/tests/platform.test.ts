import { describe, expect, it } from 'vitest';
import {
	agentDefaults,
	batchGates,
	clearOverrideLine,
	exitsFor,
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
		for (const expiry of ['full-credit', 'price-support', 'none'] as const) profiles.push({ route, owner, expiry });

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
