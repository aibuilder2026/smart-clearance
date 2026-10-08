import { keepPreviousData, QueryClient, queryOptions } from '@tanstack/svelte-query';
import type { BatchQuery } from '@smart-clearance/api/console';
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
/** the Overview's figures and its page of batches (SC-48), and its runs (SC-49, Agents at work's latest): read again
 *  every 30 s and on focus, unless paused */
const live = (paused: boolean) => ({
	refetchInterval: paused ? (false as const) : 30_000,
	refetchOnWindowFocus: !paused,
	staleTime: 10_000
});
export const overviewQuery = (paused = false) =>
	queryOptions({ queryKey: ['console', 'overview'] as const, queryFn: () => api.overview(), ...live(paused) });
export const dashboardQuery = (days: number, paused = false) =>
	queryOptions({
		queryKey: ['console', 'dashboard', days] as const,
		queryFn: () => api.dashboard(days),
		...live(paused)
	});
export const batchesQuery = (query: BatchQuery, paused = false) =>
	queryOptions({
		queryKey: ['console', 'batches', query] as const,
		queryFn: () => api.batches(query),
		placeholderData: keepPreviousData,
		...live(paused)
	});
export const clientsQuery = () =>
	queryOptions({ queryKey: ['console', 'clients'] as const, queryFn: () => api.clients() });
export const clientQuery = (id: string) =>
	queryOptions({ queryKey: ['console', 'client', id] as const, queryFn: () => api.client(id) });
/** a client's scheduled runs and journey timers (SC-79): read again every 30 s, so "in 22 h" stays true */
export const journeyQuery = (id: string) =>
	queryOptions({
		queryKey: ['console', 'journey', id] as const,
		queryFn: () => api.journey(id),
		refetchInterval: 30_000,
		staleTime: 10_000
	});
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

/** what the splash calls each read while the console opens after a sign-in (SC-51), in the order it names them */
const READ_LABELS: Record<string, string> = {
	clients: 'Your clients',
	dashboard: 'Today',
	batches: 'The batches',
	overview: 'The agents',
	requests: 'Demo requests',
	client: 'The client',
	'client-batches': 'Its batches',
	staff: 'The staff',
	audit: 'The audit log'
};
const READ_ORDER = Object.keys(READ_LABELS);

/** a page's data, before it draws (in its load function); nothing while no one is signed in. While the sign-in's
 *  splash is up, the page's reads are its stops, landing one by one */
export async function prefetch(...queries: { queryKey: readonly unknown[]; queryFn?: unknown }[]) {
	if (!(await queryClient.ensureQueryData(meQuery()))) return;
	const splash = typeof window !== 'undefined' ? window.SC3_SPLASH : undefined;
	const named = splash?.active === 'enter';
	if (named) {
		const ids = [...new Set(queries.map((q) => String(q.queryKey[1])))].filter((id) => id in READ_LABELS);
		ids.sort((a, b) => READ_ORDER.indexOf(a) - READ_ORDER.indexOf(b));
		splash.reads(ids.map((id) => ({ id, label: READ_LABELS[id] })));
	}
	await Promise.all(
		queries.map((q) =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each is a queryOptions(); ensureQueryData keeps its type
			queryClient.ensureQueryData(q as any).then((v) => (named && splash.mark(String(q.queryKey[1])), v))
		)
	);
}
