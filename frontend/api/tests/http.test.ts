import { describe, expect, it, vi } from 'vitest';
import { consoleHttp, type ConsoleAuth } from '../src/console/index';
import { siteHttp } from '../src/site';

// the HTTP clients against a fake backend-api: the Firebase ID token on every console call, sign-in through the app's
// Firebase, and the error shape
const reply = (status: number, body?: unknown) =>
	new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});

function fakeAuth(): ConsoleAuth & { signedIn: boolean } {
	const a = {
		signedIn: false,
		async signIn(email: string, password: string) {
			if (password !== 'right') throw new Error('auth/invalid-credential');
			a.signedIn = !!email;
		},
		async signOut() {
			a.signedIn = false;
		},
		async token() {
			return a.signedIn ? 'id-token' : null;
		}
	};
	return a;
}

describe('consoleHttp', () => {
	it('signs in through Firebase, then asks backend-api who it is, carrying the ID token', async () => {
		const auth = fakeAuth();
		const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) =>
			reply(200, { id: 'neha', name: 'Neha Kulkarni', auth: new Headers(init?.headers).get('authorization') })
		);
		const api = consoleHttp('http://api', { auth, fetcher: fetcher as typeof fetch });
		expect(await api.me()).toBeNull();
		expect(fetcher).not.toHaveBeenCalled();
		const staff = await api.signIn({ email: ' neha@x.example ', password: 'right' });
		expect(staff).toMatchObject({ id: 'neha', auth: 'Bearer id-token' });
		expect(fetcher.mock.calls[0][0]).toBe('http://api/v1/console/session');
		expect(fetcher.mock.calls[0][1]?.method).toBe('POST');
	});
	it('signs out of Firebase when the account is not staff', async () => {
		const auth = fakeAuth();
		const fetcher = vi.fn(async () => reply(401, { message: 'This account cannot sign in to the console.' }));
		const api = consoleHttp('http://api', { auth, fetcher: fetcher as unknown as typeof fetch });
		await expect(api.signIn({ email: 'priya@munchly.example', password: 'right' })).rejects.toMatchObject({
			status: 401,
			message: 'This account cannot sign in to the console.'
		});
		expect(auth.signedIn).toBe(false);
	});
	it('answers null for a 404 client and reads the error envelope', async () => {
		const auth = fakeAuth();
		await auth.signIn('neha@x.example', 'right');
		const fetcher = vi.fn(async (url: string | URL | Request) =>
			String(url).endsWith('/nope')
				? reply(404, { message: 'No such client.' })
				: reply(422, { message: 'Check the highlighted fields.', fields: { contact: 'Enter a name.' } })
		);
		const api = consoleHttp('http://api', { auth, fetcher: fetcher as unknown as typeof fetch });
		expect(await api.client('nope')).toBeNull();
		await expect(api.invitePerson('munchly', { name: '', contact: '', access: 'Member' })).rejects.toMatchObject({
			status: 422,
			fields: { contact: 'Enter a name.' }
		});
	});
});

describe('siteHttp', () => {
	it('looks a workspace up with a POST, so the address never reaches a URL', async () => {
		const fetcher = vi.fn(async () => reply(200, []));
		await siteHttp('http://api', { fetcher: fetcher as unknown as typeof fetch }).lookupWorkspaces('a@b.example');
		expect(fetcher).toHaveBeenCalledWith(
			'http://api/v1/workspaces/lookup',
			expect.objectContaining({ method: 'POST', body: JSON.stringify({ query: 'a@b.example' }) })
		);
	});
});

describe('consoleHttp: quick-commerce gates (SC-47)', () => {
	it('reads and changes gates on their backend-api routes', async () => {
		const auth = fakeAuth();
		await auth.signIn('neha@x.example', 'right');
		const fetcher = vi.fn(async () => reply(200, []));
		const api = consoleHttp('http://api', { auth, fetcher: fetcher as unknown as typeof fetch });
		await api.clientBatches('munchly', 'mango');
		await api.saveSkuGates('munchly', 'chips', null);
		await api.overrideBatch('munchly', 'MF-2408-209', { qcomPct: 35, reason: 'x' });
		await api.clearBatchOverride('munchly', 'MF-2408-209');
		const calls = (fetcher.mock.calls as unknown as [string, RequestInit][]).map(([url, init]) => [
			init?.method,
			url,
			init?.body ?? null
		]);
		expect(calls).toEqual([
			['GET', 'http://api/v1/console/clients/munchly/batches?sku=mango', null],
			['PUT', 'http://api/v1/console/clients/munchly/skus/chips/gates', '{"gates":null}'],
			['PUT', 'http://api/v1/console/clients/munchly/batches/MF-2408-209/override', '{"qcomPct":35,"reason":"x"}'],
			['DELETE', 'http://api/v1/console/clients/munchly/batches/MF-2408-209/override', null]
		]);
	});
});

describe('consoleHttp: the dashboard (SC-48)', () => {
	it('asks for the figures and a page of batches on their routes, leaving out what is not set', async () => {
		const auth = fakeAuth();
		await auth.signIn('neha@x.example', 'right');
		const fetcher = vi.fn(async () => reply(200, {}));
		const api = consoleHttp('http://api', { auth, fetcher: fetcher as unknown as typeof fetch });
		await api.dashboard(30);
		await api.dashboard(7, 'munchly');
		await api.batches();
		await api.batches({
			status: 'waiting',
			client: null,
			stop: 5,
			q: '',
			sort: 'days',
			dir: 'desc',
			page: 2,
			size: 16
		});
		expect((fetcher.mock.calls as unknown as [string][]).map(([url]) => url)).toEqual([
			'http://api/v1/console/dashboard?days=30',
			'http://api/v1/console/dashboard?days=7&client=munchly',
			'http://api/v1/console/batches',
			'http://api/v1/console/batches?status=waiting&stop=5&sort=days&dir=desc&page=2&size=16'
		]);
	});
});
