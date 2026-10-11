import { PUBLIC_API_BASE, PUBLIC_MOCK_LATENCY_MS } from '$app/env/public';
import { consoleHttp, consoleMock, type ConsoleApi } from '@smart-clearance/api/console';
import { ConsoleData } from '@smart-clearance/core/console';
import { firebaseAuth } from './firebase.ts';

/** The one API the console talks to: backend-api when PUBLIC_API_BASE is set, signing in with Firebase Authentication,
 *  otherwise the in-browser mock of the prototype's platform (both from @smart-clearance/api, the frontend's shared
 *  side of backend-api) */
export const api: ConsoleApi = PUBLIC_API_BASE
	? consoleHttp(PUBLIC_API_BASE, { auth: firebaseAuth })
	: consoleMock({ latency: PUBLIC_MOCK_LATENCY_MS });
export const usingMock = !PUBLIC_API_BASE;

/** The console's data (SC-169): its cache over that API, what each screen reads and each screen's code, which the load
 *  functions fill before a page draws and ConsoleApp reads. The splash, put first in <body> by hooks.server.ts, hears
 *  each read land (SC-51). The console renders only in the browser (no SSR, no prerendering), so one serves the whole
 *  session */
export const data = new ConsoleData(api, {
	splash: () => (typeof window === 'undefined' ? undefined : window.SC3_SPLASH)
});
