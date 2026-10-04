import { PUBLIC_API_BASE, PUBLIC_MOCK_LATENCY_MS } from '$app/env/public';
import { httpApi } from './http';
import { mockApi } from './mock';
import type { Api } from './types';

/** The one API the app talks to: backend-api when PUBLIC_API_BASE is set, otherwise the in-browser mock of the prototype */
export const api: Api = PUBLIC_API_BASE ? httpApi(PUBLIC_API_BASE) : mockApi({ latency: PUBLIC_MOCK_LATENCY_MS });
export const usingMock = !PUBLIC_API_BASE;
