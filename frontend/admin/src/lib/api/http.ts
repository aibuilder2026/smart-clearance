import { ApiError, type Api } from './types';

/** backend-api over HTTP: the same contract as the mock (types.ts) */
export function httpApi(base: string, fetcher: typeof fetch = fetch): Api {
	async function call<T>(path: string, body?: unknown): Promise<T> {
		const res = await fetcher(base + path, {
			method: body === undefined ? 'GET' : 'POST',
			headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		if (!res.ok) {
			const detail = await res.json().catch(() => ({}));
			throw new ApiError(res.status, detail.message ?? res.statusText, detail.fields ?? {});
		}
		return res.json() as Promise<T>;
	}
	return {
		showcase: () => call('/v1/site/showcase'),
		catalog: () => call('/v1/platform/catalog'),
		lookupWorkspaces: (query) => call('/v1/workspaces/lookup', { query }),
		requestDemo: (input) => call('/v1/demo-requests', input)
	};
}
