import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../src/index';
import {
	consoleMock,
	exitsFor,
	SESSION_KEY,
	SIGN_IN_FAILED,
	type ConsoleApi,
	type NewClientInput
} from '../src/console/index';
import { memory } from './memory';

// the console's mock: the prototype's seed, the platform's rules, and an audit line for every change in the words
// console.jsx writes it
let store: Storage;
let api: ConsoleApi;
const lastAudit = async () => (await api.audit())[0];

beforeEach(async () => {
	store = memory();
	api = consoleMock({ storage: () => store });
	await api.signIn({ email: 'neha.kulkarni@smartclearance.com', password: 'anything' });
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
	it('lets in active staff by their email, and remembers the session', async () => {
		expect((await api.me())?.name).toBe('Neha Kulkarni');
		expect(JSON.parse(store.getItem(SESSION_KEY)!).uid).toBe('neha');
		await expect(api.signIn({ email: 'Sameer.Rao@smartclearance.com', password: 'x' })).resolves.toMatchObject({
			id: 'sameer'
		});
	});
	it('says the same thing for an unknown address and a missing password', async () => {
		for (const input of [
			{ email: 'nobody@smartclearance.com', password: 'x' },
			{ email: 'neha.kulkarni@smartclearance.com', password: '' }
		])
			await expect(api.signIn(input)).rejects.toMatchObject({ status: 401, message: SIGN_IN_FAILED });
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
		expect(bad.fields.contact).toBe('Munchly Foods staff need a munchly.in address. Partners can use any address.');
		// an email address only (SC-68): a mobile number is refused
		const phone = await api
			.invitePerson('munchly', { name: 'Sunil Rao', contact: '+91 98230 11111', access: 'Partner' })
			.catch((e) => e);
		expect(phone.fields.contact).toBe('Enter an email address, such as name@munchly.in.');
		const c = await api.invitePerson('munchly', {
			name: ' Sunil Rao ',
			contact: ' Sunil.Rao@Google.example ',
			access: 'Partner'
		});
		const p = c.people.at(-1)!;
		expect(p).toMatchObject({
			name: 'Sunil Rao',
			org: 'Sunil Rao',
			provider: 'Email and password',
			status: 'invited',
			email: 'sunil.rao@google.example',
			phone: ''
		});
		expect((await lastAudit()).text).toBe('Invited Sunil Rao as Partner');
		await api.updatePerson('munchly', p.id, { access: 'Member' });
		expect((await lastAudit()).text).toBe('Gave Sunil Rao Member access');
		await api.updatePerson('munchly', 'krishna', { status: 'active' });
		expect((await lastAudit()).text).toBe('Reactivated Krishna Kirana Bhandar');
	});
	it('the length of a journey day, and nothing when it is unchanged (SC-68)', async () => {
		expect((await api.client('munchly'))!.dayMinutes).toBe(1440);
		const c = await api.setDayMinutes('munchly', 5);
		expect(c.dayMinutes).toBe(5);
		expect(await lastAudit()).toMatchObject({
			who: 'Neha Kulkarni',
			client: 'munchly',
			text: 'Set the length of a journey day for Munchly Foods to 5 minutes (was a day)'
		});
		const n = (await api.audit()).length;
		await api.setDayMinutes('munchly', 5);
		expect(await api.audit()).toHaveLength(n);
		await api.setDayMinutes('munchly', 1440);
		expect((await lastAudit()).text).toBe('Set the length of a journey day for Munchly Foods to a day (was 5 minutes)');
		for (const bad of [0, 1441, 4.5])
			await expect(api.setDayMinutes('munchly', bad)).rejects.toMatchObject({
				status: 422,
				fields: { dayMinutes: 'Enter a whole number of minutes, from 1 to 1,440.' }
			});
		await expect(api.setDayMinutes('nope', 5)).rejects.toMatchObject({ status: 404 });
	});
	it("a client's runs and timers fired now, and its journey started again (SC-79)", async () => {
		const j = await api.journey('munchly');
		expect(j.live).toBe(true);
		expect(j.clock).toMatchObject({ day: 1, day0: '2026-10-02', dayMinutes: 1440 });
		expect(j.triggers.map((t) => t.id)).toEqual(['data', 'watcher', 'timer-1', 'timer-2', 'timer-3']);
		// today's daily load has run: a run now looks again, and the next is still tomorrow's
		const next = j.triggers.find((t) => t.id === 'data')!.due;
		expect((await api.fireTrigger('munchly', 'data')).triggers.find((t) => t.id === 'data')!.due).toBe(next);
		expect((await lastAudit()).text).toBe("Ran the Data agent's daily load now for Munchly Foods");
		// a timer: refused with its reason until it is ready, gone once fired
		await expect(api.fireTrigger('munchly', 'timer-2')).rejects.toMatchObject({
			status: 409,
			message: 'After the van round: the papers come first'
		});
		const fired = await api.fireTrigger('munchly', 'timer-1');
		expect(fired.triggers.map((t) => t.id)).not.toContain('timer-1');
		expect((await lastAudit()).text).toBe(
			"Fired the Outreach agent's timer now for Munchly Foods: closed the offer window for MF-2409-117"
		);
		await expect(api.fireTrigger('munchly', 'timer-1')).rejects.toMatchObject({ status: 404 });
		// the reset, at a day length chosen then: both lines, and only the day's two runs to come
		const reset = await api.resetJourney('munchly', { dayMinutes: 5 });
		expect(reset.clock).toMatchObject({ day: 0, dayMinutes: 5, now: '2026-10-02T08:00:00+05:30' });
		expect(reset.triggers.map((t) => [t.id, t.blocked])).toEqual([
			['data', null],
			['watcher', 'After Setup is confirmed']
		]);
		const [last, prev] = await api.audit();
		expect([prev.text, last.text]).toEqual([
			'Set the length of a journey day for Munchly Foods to 5 minutes (was a day)',
			'started the journey again from 2026-10-02'
		]);
		// day 0's load, early: it is that day's run, so the next is the day after
		expect(reset.triggers[0].due).toBe('2026-10-02T08:30:00+05:30');
		const early = await api.fireTrigger('munchly', 'data');
		expect(early.triggers.find((t) => t.id === 'data')!.due).toBe('2026-10-03T08:30:00+05:30');
		await expect(api.resetJourney('munchly', { dayMinutes: 0 })).rejects.toMatchObject({ status: 422 });
	});
	it('a client with no live journey runs its daily agents on request, and has no journey to reset', async () => {
		await api.createClient(kesari());
		const j = await api.journey('kesari');
		expect(j.live).toBe(false);
		expect(j.triggers.map((t) => [t.id, t.due])).toEqual([
			['data', null],
			['watcher', null]
		]);
		await api.fireTrigger('kesari', 'data');
		expect((await lastAudit()).text).toBe('Ran the Data agent now for Kesari Foods');
		await expect(api.resetJourney('kesari')).rejects.toMatchObject({
			status: 409,
			message: "Kesari Foods' workspace isn't live, so it has no journey to start again."
		});
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
			approver: 'admin-kesari',
			dayMinutes: 1440
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

describe('quick-commerce gates per SKU, with a per-batch override (SC-47)', () => {
	it("lists a client's open batches with their gates, one SKU's when asked", async () => {
		const all = await api.clientBatches('munchly');
		expect(all).toHaveLength(9);
		const b = all.find((x) => x.ref === 'MF-2409-204')!;
		expect(b.override).toEqual({
			qcomPct: 30,
			reason: "Zepto's Pune warehouse agreed to take this lot at 30% of its life",
			by: 'Neha Kulkarni',
			at: '4 Oct, 16:20'
		});
		expect(b.checks.map((c) => [c.app, c.has, c.need, c.pass, c.source])).toEqual([
			['blinkit', 92, 90, true, 'default'],
			['zepto', 34, 30, true, 'override'],
			['instamart', 34, 30, true, 'override']
		]);
		expect((await api.clientBatches('munchly', 'mango')).map((x) => x.ref)).toEqual(['MF-2410-118']);
	});
	it("sets an SKU's own gates, writes nothing when unchanged, and puts it back on the default", async () => {
		const c = await api.saveSkuGates('munchly', 'chips', { blinkitDays: 75, qcomPct: 60 });
		expect(c.skus.find((x) => x.id === 'chips')!.gates).toEqual({ blinkitDays: 75, qcomPct: 60 });
		expect((await lastAudit()).text).toBe(
			"Set Masala Chips 150 g's quick-commerce gates: Blinkit 75+ days, Zepto and Instamart 60% of life"
		);
		const n = (await api.audit()).length;
		await api.saveSkuGates('munchly', 'chips', { blinkitDays: 75, qcomPct: 60 });
		expect(await api.audit()).toHaveLength(n);
		const back = await api.saveSkuGates('munchly', 'chips', null);
		expect(back.skus.find((x) => x.id === 'chips')!.gates).toEqual({});
		expect((await lastAudit()).text).toBe("Put Masala Chips 150 g back on Munchly Foods' default quick-commerce gates");
	});
	it("refuses an SKU's gates out of bounds, and an SKU that is not there", async () => {
		await expect(api.saveSkuGates('munchly', 'chips', { blinkitDays: 20 })).rejects.toMatchObject({
			status: 422,
			message: 'Blinkit takes 30 to 180 days.'
		});
		await expect(api.saveSkuGates('munchly', 'nope', null)).rejects.toMatchObject({ status: 404 });
	});
	it("overrides one batch's gates with why, and removes it", async () => {
		await api.overrideBatch('munchly', 'MF-2408-209', { qcomPct: 35, reason: '  Instamart Indore clears this lot  ' });
		expect((await lastAudit()).text).toBe(
			"Overrode MF-2408-209's quick-commerce gates: Zepto and Instamart 35% of life (Instamart Indore clears this lot)"
		);
		const row = (await api.clientBatches('munchly', 'chips')).find((x) => x.ref === 'MF-2408-209')!;
		expect(row.override).toMatchObject({
			qcomPct: 35,
			reason: 'Instamart Indore clears this lot',
			by: 'Neha Kulkarni'
		});
		expect(row.checks[1]).toEqual({ app: 'zepto', need: 35, has: 38, pass: true, source: 'override' });
		await api.clearBatchOverride('munchly', 'MF-2408-209');
		expect((await lastAudit()).text).toBe("Removed MF-2408-209's quick-commerce gate override");
		const n = (await api.audit()).length;
		await api.clearBatchOverride('munchly', 'MF-2408-209');
		expect(await api.audit()).toHaveLength(n);
	});
	it('needs a reason for an override, and a batch that is there', async () => {
		await expect(api.overrideBatch('munchly', 'MF-2408-209', { qcomPct: 35, reason: ' ' })).rejects.toMatchObject({
			status: 422,
			message: 'Say why this batch is different.'
		});
		await expect(api.overrideBatch('munchly', 'NOPE', { qcomPct: 35, reason: 'x' })).rejects.toMatchObject({
			status: 404
		});
	});
});

describe("the Overview's dashboard (SC-48)", () => {
	it('reads the figures over a range, and a page of batches', async () => {
		const d = await api.dashboard(7);
		expect(d.byDay.map((x) => x.label)).toEqual(['30 Sep', '1 Oct', '2 Oct', '3 Oct', '4 Oct', '5 Oct', '6 Oct']);
		expect([d.recovered, d.inFlight, d.waiting, d.runsToday]).toEqual([21152.4, 9, 0, 8]);
		expect(d.byStop).toEqual([0, 7, 0, 0, 0, 0, 1, 0, 1]);
		const p = await api.batches();
		expect([p.total, p.rows.length, p.rows[0].ref]).toEqual([9, 8, 'MF-2410-118']);
		expect((await api.batches({ page: 2 })).rows.map((r) => r.ref)).toEqual(['GL-2410-012']);
	});
	it("gives Agents at work the latest arrivals at each stop, and today's closed batches (SC-49)", async () => {
		const d = await api.dashboard(7);
		expect(d.atStop.map((x) => x.length)).toEqual([0, 3, 0, 0, 0, 0, 1, 0, 1]);
		expect(d.atStop[6]).toEqual([{ client: 'munchly', ref: 'MF-2410-118', at: '2026-10-06T09:40:00+05:30' }]);
		expect(d.atStop[8]).toEqual([{ client: 'munchly', ref: 'MF-2409-117', at: '2026-10-05T18:10:00+05:30' }]);
		expect(d.closedToday).toEqual({ count: 0, recovered: 0, batches: [] });
	});
	it("refuses a range or a page size it doesn't offer", async () => {
		await expect(api.dashboard(10)).rejects.toMatchObject({ status: 422, message: 'Show 7, 30 or 90 days.' });
		await expect(api.batches({ size: 10 })).rejects.toMatchObject({ status: 422 });
	});
	it("counts an override's time as the batch's last change", async () => {
		await api.overrideBatch('munchly', 'MF-2408-311', { qcomPct: 30, reason: 'A deal' });
		const row = (await api.batches({ q: 'MF-2408-311' })).rows[0];
		expect(row.updated).toMatch(/^\d\d:\d\d$|^\d+ \w{3}$/);
	});
});
