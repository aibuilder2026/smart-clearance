import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../src/index';
import { consoleMock, exitsFor, SESSION_KEY, type ConsoleApi, type NewClientInput } from '../src/console/index';
import { memory } from './memory';

// the console's mock: the prototype's seed, the platform's rules, and an audit line for every change in the words
// console.jsx writes it
let store: Storage;
let api: ConsoleApi;
const lastAudit = async () => (await api.audit())[0];

beforeEach(async () => {
	store = memory();
	api = consoleMock({ storage: () => store });
	await api.signIn('neha');
});

const kesari = (patch: Partial<NewClientInput> = {}): NewClientInput => ({
	name: 'Kesari Foods',
	city: 'Indore',
	industry: 'Snacks and drinks',
	colour: '#2563eb',
	slug: 'kesari',
	emailDomain: 'kesari.in',
	signGoogle: true,
	signPhone: true,
	profile: { route: 'distributors', owner: 'manufacturer', expiry: 'full-credit' },
	exits: exitsFor({ route: 'distributors', owner: 'manufacturer', expiry: 'full-credit' }, 50),
	preset: 'standard',
	adminName: 'Ritu Malhotra',
	adminEmail: 'ritu@kesari.in',
	plan: 'pilot',
	request: 'rq-kesari',
	...patch
});

describe('signing in', () => {
	it('lets in active staff only, and remembers the session', async () => {
		expect((await api.signInAccounts()).map((a) => a.id)).toEqual(['neha', 'sameer']);
		expect((await api.me())?.name).toBe('Neha Kulkarni');
		expect(JSON.parse(store.getItem(SESSION_KEY)!).uid).toBe('neha');
		await expect(api.signIn('nobody')).rejects.toBeInstanceOf(ApiError);
	});
	it('refuses changes once signed out', async () => {
		await api.signOut();
		expect(await api.me()).toBeNull();
		await expect(api.goLive('munchly')).rejects.toMatchObject({ status: 401 });
	});
});

describe('the day the console opens on', () => {
	it('has Munchly Foods as the only client, with its batches, runs and two demo requests', async () => {
		expect((await api.clients()).map((c) => c.id)).toEqual(['munchly']);
		const o = await api.overview();
		expect(o.tracks.map((t) => `${t.batch}: ${t.product} · ${t.distributor}, ${t.city}`)).toEqual([
			'MF-2409-117: Masala Chips 150 g · Rakesh Traders, Nagpur',
			'MF-2410-118: Mango Drink 200 ml · Lakshmi Agencies, Hyderabad'
		]);
		expect(o.runs).toHaveLength(8);
		expect((await api.demoRequests()).map((r) => r.company)).toEqual(['Kesari Foods', 'Amrit Dairy']);
	});
	it('needs a person for the two missing permissions, and a file for the late export', async () => {
		const { attention } = await api.overview();
		expect(attention.map((a) => `${a.title}: ${a.text} → ${a.action.label}`)).toEqual([
			'Patil Distributors: one-time permission not given yet → Ask again',
			'Gupta & Sons: one-time permission not given yet → Ask again',
			'Gupta & Sons: stock export arrived 2 h late today → Open'
		]);
	});
	it('answers null for a client that is not there', async () => {
		expect(await api.client('nope')).toBeNull();
	});
});

describe('every change is logged in the words the prototype uses', () => {
	it("an agent's autonomy, and nothing when it is unchanged", async () => {
		await api.updateAgent('munchly', 'negotiator', { autonomy: 'act' });
		expect(await lastAudit()).toMatchObject({
			who: 'Neha Kulkarni',
			client: 'munchly',
			text: 'Set the Negotiator agent to Act for Munchly Foods (was Ask)'
		});
		const n = (await api.audit()).length;
		await api.updateAgent('munchly', 'negotiator', { autonomy: 'act' });
		expect(await api.audit()).toHaveLength(n);
	});
	it("an agent's settings and its approver", async () => {
		const c = (await api.client('munchly'))!;
		await api.updateAgent('munchly', 'negotiator', {
			settings: { ...c.agents.negotiator.settings, floor: 14, counters: 1 }
		});
		expect((await lastAudit()).text).toBe(
			'Changed the Negotiator agent for Munchly Foods: floor ₹13.50 to ₹14.00; counter offers 2 to 1'
		);
		await api.updateAgent('munchly', 'gate', { settings: { approver: 'arjun' } });
		expect((await lastAudit()).text).toBe(
			'Changed the Approval agent for Munchly Foods: approver Priya Deshmukh to Arjun Nair'
		);
	});
	it('switching an agent off, running one, and pausing them all', async () => {
		await api.updateAgent('munchly', 'outreach', { on: false });
		expect((await lastAudit()).text).toBe('Switched off the Outreach agent for Munchly Foods');
		const ran = await api.runAgent('munchly', 'data');
		expect(ran.agents.data.last).toMatch(/^\d\d:\d\d today · ran on request; nothing new$/);
		expect((await api.overview()).runs[0]).toMatchObject({ agent: 'data', text: 'ran on request; nothing new' });
		const paused = await api.setAllAgents('munchly', false);
		expect(Object.entries(paused.agents).filter(([id, a]) => id !== 'gate' && a.on)).toEqual([]);
		expect(paused.agents.gate.on).toBe(true);
		expect((await lastAudit()).text).toBe('Paused every agent for Munchly Foods');
	});
	it('channels and rules', async () => {
		const c = (await api.client('munchly'))!;
		await api.saveRules('munchly', {
			rules: { ...c.rules, staffCap: 60, hindiOffers: false },
			exits: { ...c.exits, foodbank: { on: false } }
		});
		expect((await lastAudit()).text).toBe(
			"Changed Munchly Foods's channels and rules: Food bank off; staff sale cap 60; Hindi offers off"
		);
	});
	it('the supply-chain profile, which re-derives the exits and carries the gates to the Watcher', async () => {
		const c = await api.saveProfile('munchly', {
			profile: { route: 'own', owner: 'manufacturer', expiry: 'none' },
			gates: { blinkitDays: 70, qcomPct: 50 },
			returnWindowDays: 21
		});
		expect(c.exits.d2c).toEqual({ on: false, locked: null });
		expect(c.agents.watcher.settings).toMatchObject({ blinkitDays: 70, qcomPct: 50 });
		expect(c.agents.impact.settings.returnWindowDays).toBe(21);
		expect((await lastAudit()).text).toBe(
			"Changed Munchly Foods's supply-chain profile: own warehouses and d2c, the manufacturer owns the stock, no returns"
		);
	});
	it('people: an invitation, its access and deactivation', async () => {
		const bad = await api
			.invitePerson('munchly', { name: 'Sunil', contact: 'sunil@gmail.com', access: 'Member' })
			.catch((e) => e);
		expect(bad).toBeInstanceOf(ApiError);
		expect(bad.fields.contact).toBe(
			'Munchly Foods staff need a munchly.in address. Partners can use any address or a phone number.'
		);
		const c = await api.invitePerson('munchly', { name: ' Sunil Rao ', contact: '+91 98230 11111', access: 'Partner' });
		const p = c.people.at(-1)!;
		expect(p).toMatchObject({ name: 'Sunil Rao', org: 'Sunil Rao', provider: 'Phone and code', status: 'invited' });
		expect((await lastAudit()).text).toBe('Invited Sunil Rao as Partner');
		await api.updatePerson('munchly', p.id, { access: 'Member' });
		expect((await lastAudit()).text).toBe('Gave Sunil Rao Member access');
		await api.updatePerson('munchly', 'krishna', { status: 'active' });
		expect((await lastAudit()).text).toBe('Reactivated Krishna Kirana Bhandar');
	});
	it('a reminder to a distributor, the plan, and going live', async () => {
		await api.remindDistributor('munchly', 'patil');
		expect((await lastAudit()).text).toBe('Asked Patil Distributors again for its one-time permission');
		await api.setPlan('munchly', 'growth');
		expect((await lastAudit()).text).toBe('Moved Munchly Foods from Pilot to Growth');
	});
});

describe('a new client', () => {
	it('is set up from its demo request, with its admin invited and the preset applied', async () => {
		const c = await api.createClient(kesari());
		expect(c).toMatchObject({
			id: 'kesari',
			domain: 'kesari.smartclearance.com',
			status: 'setting-up',
			approver: 'admin-kesari'
		});
		expect(c.agents.negotiator.autonomy).toBe('ask');
		expect(c.agents.gate.settings.approver).toBe('admin-kesari');
		expect(c.exits.d2c.on).toBe(true);
		expect((await api.demoRequests()).find((r) => r.id === 'rq-kesari')).toMatchObject({
			status: 'set up',
			client: 'kesari'
		});
		expect((await lastAudit()).text).toBe(
			'Set up Kesari Foods from its supply-chain profile: through distributors, the manufacturer owns the stock, full credit at expiry; invited Ritu Malhotra as admin'
		);
		const { attention } = await api.overview();
		expect(attention.find((a) => a.id === 'kesari-invite')?.text).toBe(
			'waiting for Ritu Malhotra to accept the invitation'
		);
		await api.goLive('kesari');
		expect((await lastAudit()).text).toBe('Moved Kesari Foods to Live on the Pilot plan');
	});
	it('is refused an address that is taken, or an admin outside its domain', async () => {
		await expect(api.createClient(kesari({ slug: 'munchly' }))).rejects.toMatchObject({
			message: 'munchly.smartclearance.com is taken.'
		});
		await expect(api.createClient(kesari({ adminEmail: 'ritu@gmail.com' }))).rejects.toMatchObject({
			message: "Enter the admin's name and a @kesari.in address."
		});
	});
});

describe('staff and the stored state', () => {
	it('invites a colleague with a smartclearance.com address only', async () => {
		await expect(api.inviteStaff({ name: 'Asha', email: 'asha@gmail.com', role: 'Support' })).rejects.toMatchObject({
			fields: { email: 'Staff use a smartclearance.com address.' }
		});
		const s = await api.inviteStaff({ name: 'Asha Iyer', email: 'Asha.Iyer@smartclearance.com', role: 'Support' });
		expect(s).toMatchObject({
			short: 'Asha',
			team: 'Customer success',
			email: 'asha.iyer@smartclearance.com',
			status: 'invited'
		});
		expect(await lastAudit()).toMatchObject({ client: null, text: 'Invited Asha Iyer to the console as Support' });
	});
	it('keeps changes in the browser, and goes back to the seed on reset', async () => {
		await api.goLive('munchly');
		await api.setPlan('munchly', 'enterprise');
		const again = consoleMock({ storage: () => store });
		expect((await again.client('munchly'))?.plan).toBe('enterprise');
		await again.reset!();
		expect((await again.client('munchly'))?.plan).toBe('pilot');
		expect((await again.me())?.id).toBe('neha');
	});
});
