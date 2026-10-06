import { ApiError } from './types/shared';

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
export type Call = <T>(method: Method, path: string, body?: unknown) => Promise<T>;

export type TransportOptions = {
	fetcher?: typeof fetch;
	/** the bearer token each call carries (backend-api trusts Firebase ID tokens); none while it resolves to null */
	token?: () => Promise<string | null> | string | null;
};

const hex = (bytes: number) =>
	Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');

/** a W3C traceparent starting a new trace for one call (SC-57). Cloud Run keeps its trace id and backend-api continues
 *  it, so the call's log lines, spans and audit rows share the id. The flags leave sampling to Cloud Run and the API. */
function startTrace(): { trace: string; traceparent: string } {
	const trace = hex(16);
	return { trace, traceparent: `00-${trace}-${hex(8)}-00` };
}

/** backend-api over HTTP, JSON both ways. A failure becomes an ApiError with the server's message, the call's trace id
 *  and, for a 422, the fields it rejected; a 204 resolves to undefined. Every surface's client (site.ts,
 *  console/http.ts) is built on it. */
export function transport(base: string, { fetcher = fetch, token }: TransportOptions = {}): Call {
	return async function call<T>(method: Method, path: string, body?: unknown): Promise<T> {
		const bearer = token ? await token() : null;
		const { trace, traceparent } = startTrace();
		const res = await fetcher(base + path, {
			method,
			headers: {
				accept: 'application/json',
				traceparent,
				...(body === undefined ? {} : { 'content-type': 'application/json' }),
				...(bearer ? { authorization: `Bearer ${bearer}` } : {})
			},
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		if (!res.ok) {
			const detail = await res.json().catch(() => ({}));
			throw new ApiError(res.status, detail.message ?? res.statusText, detail.fields ?? {}, trace);
		}
		if (res.status === 204) return undefined as T;
		return res.json() as Promise<T>;
	};
}
