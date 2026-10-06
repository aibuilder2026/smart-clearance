import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/index';
import { DEMO_REQUESTS_KEY, siteMock } from '../src/site';
import { memory } from './memory';

describe("the landing page's mock API", () => {
	const store = memory();
	const api = siteMock({ storage: () => store });
	// the workspace only: never the person's role, or whether they were deactivated (SC-43)
	const as = async (q: string) => {
		const found = await api.lookupWorkspaces(q);
		for (const m of found) expect(Object.keys(m).sort()).toEqual(['value', 'workspace']);
		return found.map((m) => m.workspace.id);
	};

	it('finds a member by email, in any case', async () => {
		expect(await as('Priya.Deshmukh@munchly.in')).toEqual(['munchly']);
	});
	it('finds a member by mobile number, with or without +91', async () => {
		expect(await as('98230 44118')).toEqual(['munchly']);
		expect(await as('+91 9823044118')).toEqual(['munchly']);
	});
	it('finds the workspace of an invitee and of a deactivated account, and says no more', async () => {
		expect(await as('98230 60013')).toEqual(['munchly']);
		expect(await as('9823060012')).toEqual(['munchly']);
	});
	it("points a colleague at their company's workspace", async () => {
		expect(await as('new.joiner@munchly.in')).toEqual(['munchly']);
	});
	it('never shows a marketplace buyer a workspace', async () => {
		expect(await as('orders@agrawalwholesale.example')).toEqual([]);
	});
	it('refuses what is neither an email nor a mobile number', async () => {
		await expect(api.lookupWorkspaces('12345')).rejects.toBeInstanceOf(ApiError);
	});
	it("takes a demo request and keeps it in the prototype's shape", async () => {
		const req = await api.requestDemo({
			name: ' Ritu Malhotra ',
			company: 'Kesari Foods',
			email: 'Ritu@Kesari.in',
			makes: 'Dairy',
			plan: 'Growth',
			note: ''
		});
		expect(req).toMatchObject({ name: 'Ritu Malhotra', email: 'ritu@kesari.in', plan: 'Growth', status: 'new' });
		expect(req.id).toMatch(/^rq-/);
		expect(JSON.parse(store.getItem(DEMO_REQUESTS_KEY)!)[0].id).toBe(req.id);
	});
	it('names each field a demo request is missing', async () => {
		const e = await api
			.requestDemo({ name: '', company: '', email: 'nope', makes: 'Dairy', plan: null, note: '' })
			.catch((x) => x);
		expect(e).toBeInstanceOf(ApiError);
		expect(Object.keys(e.fields)).toEqual(['name', 'company', 'email']);
	});
});
