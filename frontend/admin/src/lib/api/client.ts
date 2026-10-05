import { PUBLIC_API_BASE, PUBLIC_MOCK_LATENCY_MS } from '$app/env/public';
import { siteHttp, siteMock, type SiteApi } from '@smart-clearance/api/site';

/** The one API the app talks to: backend-api when PUBLIC_API_BASE is set, otherwise the in-browser mock of the prototype
 *  (both from @smart-clearance/api, the frontend's shared side of backend-api) */
export const api: SiteApi = PUBLIC_API_BASE ? siteHttp(PUBLIC_API_BASE) : siteMock({ latency: PUBLIC_MOCK_LATENCY_MS });
export const usingMock = !PUBLIC_API_BASE;
