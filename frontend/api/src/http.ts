import { ApiError } from './types/shared';

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
export type Call = <T>(method: Method, path: string, body?: unknown) => Promise<T>;

export type TransportOptions = {
	fetcher?: typeof fetch;
	/** the bearer token each call carries (backend-api trusts Firebase ID tokens); none while it resolves to null */
	token?: () => Promise<string | null> | string | null;
};

/** backend-api over HTTP, JSON both ways. A failure becomes an ApiError with the server's message and, for a 422, the
 *  fields it rejected; a 204 resolves to undefined. Every surface's client (site.ts, console/http.ts) is built on it. */
export function transport(base: string, { fetcher = fetch, token }: TransportOptions = {}): Call {
	return async function call<T>(method: Method, path: string, body?: unknown): Promise<T> {
		const bearer = token ? await token() : null;
		const res = await fetcher(base + path, {
			method,
			headers: {
				accept: 'application/json',
				...(body === undefined ? {} : { 'content-type': 'application/json' }),
				...(bearer ? { authorization: `Bearer ${bearer}` } : {})
			},
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		if (!res.ok) {
			const detail = await res.json().catch(() => ({}));
			throw new ApiError(res.status, detail.message ?? res.statusText, detail.fields ?? {});
		}
		if (res.status === 204) return undefined as T;
		return res.json() as Promise<T>;
	};
}
