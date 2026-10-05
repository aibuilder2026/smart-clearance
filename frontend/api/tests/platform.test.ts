import { describe, expect, it } from 'vitest';
import {
	agentDefaults,
	exitsFor,
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
