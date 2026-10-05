// @smart-clearance/api/site: what the landing page (admin) calls, over HTTP or from the in-browser mock
import { transport, type TransportOptions } from './http';
import type { SiteApi } from './types/site';

export { siteMock, demoRequestErrors, DEMO_REQUESTS_KEY } from './mock/site';
export type * from './types/site';

/** backend-api over HTTP: the same contract as siteMock */
export function siteHttp(base: string, options?: TransportOptions): SiteApi {
	const call = transport(base, options);
	return {
		showcase: () => call('GET', '/v1/site/showcase'),
		catalog: () => call('GET', '/v1/platform/catalog'),
		lookupWorkspaces: (query) => call('POST', '/v1/workspaces/lookup', { query }),
		requestDemo: (input) => call('POST', '/v1/demo-requests', input)
	};
}
export { ApiError } from './types/shared';
export type * from './types/shared';
