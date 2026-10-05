import { describe, expect, it } from 'vitest';
import { DEMO_REQUESTS_KEY, mockApi } from '#lib/api/mock.ts';
import { ApiError } from '#lib/api/types.ts';

const memory = () => {
	const m = new Map<string, string>();
	return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage;
};

describe('the mock API', () => {
	const store = memory();
	const api = mockApi({ storage: () => store });
	const as = async (q: string) => (await api.lookupWorkspaces(q)).map((m) => `${m.workspace.id}: ${m.as}`);

	it('finds a member by email, in any case', async () => {
		expect(await as('Priya.Deshmukh@munchly.in')).toEqual(['munchly: supply-chain operator']);
	});
	it('finds a member by mobile number, with or without +91', async () => {
		expect(await as('98230 44118')).toEqual(['munchly: distributor']);
		expect(await as('+91 9823044118')).toEqual(['munchly: distributor']);
	});
	it('says how an invitee and a deactivated account belong', async () => {
		expect(await as('98230 60013')).toEqual(['munchly: invited as kirana retailer']);
		expect(await as('9823060012')).toEqual(['munchly: deactivated by the admin']);
	});
	it("points a colleague at their company's workspace", async () => {
		expect(await as('new.joiner@munchly.in')).toEqual(["munchly: your company's workspace · ask its admin for access"]);
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
