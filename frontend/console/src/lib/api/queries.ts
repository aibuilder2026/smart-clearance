import { QueryClient, queryOptions } from '@tanstack/svelte-query';
import { api } from './client';

/** The console's one cache. The console renders only in the browser (no SSR, no prerendering), so a single client
 *  serves the whole session; load functions fill it before a page draws, and every change refreshes it. */
export const queryClient = new QueryClient({
	defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } }
});

// what describes the platform, read once a session
export const configQuery = () =>
	queryOptions({ queryKey: ['platform', 'console-config'] as const, queryFn: () => api.config(), staleTime: Infinity });
export const catalogQuery = () =>
	queryOptions({ queryKey: ['platform', 'catalog'] as const, queryFn: () => api.catalog(), staleTime: Infinity });

// who is signed in
export const meQuery = () => queryOptions({ queryKey: ['session', 'me'] as const, queryFn: () => api.me() });

// the platform's state; a change refreshes everything under 'console'
export const overviewQuery = () =>
	queryOptions({ queryKey: ['console', 'overview'] as const, queryFn: () => api.overview() });
export const clientsQuery = () =>
	queryOptions({ queryKey: ['console', 'clients'] as const, queryFn: () => api.clients() });
export const clientQuery = (id: string) =>
	queryOptions({ queryKey: ['console', 'client', id] as const, queryFn: () => api.client(id) });
/** a client's open batches with their quick-commerce gates (SC-47) */
export const clientBatchesQuery = (id: string) =>
	queryOptions({ queryKey: ['console', 'client-batches', id] as const, queryFn: () => api.clientBatches(id) });
export const staffQuery = () => queryOptions({ queryKey: ['console', 'staff'] as const, queryFn: () => api.staff() });
export const auditQuery = (client: string | null = null) =>
	queryOptions({ queryKey: ['console', 'audit', client] as const, queryFn: () => api.audit(client) });
export const requestsQuery = () =>
	queryOptions({ queryKey: ['console', 'requests'] as const, queryFn: () => api.demoRequests() });

/** after a change: everything the console shows is read again */
export const refresh = () => queryClient.invalidateQueries({ queryKey: ['console'] });

/** a page's data, before it draws (in its load function); nothing while no one is signed in */
export async function prefetch(...queries: { queryKey: readonly unknown[]; queryFn?: unknown }[]) {
	if (!(await queryClient.ensureQueryData(meQuery()))) return;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each is a queryOptions(); ensureQueryData keeps its type
	await Promise.all(queries.map((q) => queryClient.ensureQueryData(q as any)));
}
