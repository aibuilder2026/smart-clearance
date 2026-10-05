import { PUBLIC_API_BASE, PUBLIC_MOCK_LATENCY_MS } from '$app/env/public';
import { consoleHttp, consoleMock, type ConsoleApi } from '@smart-clearance/api/console';

/** The one API the console talks to: backend-api when PUBLIC_API_BASE is set, otherwise the in-browser mock of the
 *  prototype's platform (both from @smart-clearance/api, the frontend's shared side of backend-api) */
export const api: ConsoleApi = PUBLIC_API_BASE
	? consoleHttp(PUBLIC_API_BASE)
	: consoleMock({ latency: PUBLIC_MOCK_LATENCY_MS });
export const usingMock = !PUBLIC_API_BASE;
