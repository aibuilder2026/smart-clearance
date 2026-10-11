import { keepPreviousData, QueryClient, queryOptions } from '@tanstack/svelte-query';
import type { BatchQuery, ConsoleApi } from '@smart-clearance/api/console';
import type { Component } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { apiQuery, readView } from './overview';
import type { ConsoleRoute, ConsoleScreen } from './route';

/** The console's splash (design3/console/splash.js, SC-51; SC-131), which the console app puts first in its page's
 *  <body> (window.SC3_SPLASH): one surface for the first load, signing in and signing out, saying what it waits for
 *  while the reads land. An embedded console has none. */
export type ConsoleSplash = {
	/** the first load's splash has gone */
	lifted: boolean;
	/** the wait that is on, if any */
	active: 'boot' | 'enter' | 'leave' | null;
	/** the animate() its motion runs on: motion's, given by the app */
	animate: ((...args: never[]) => unknown) | null;
	/** begins a wait; resolves once the cover is in, so the page behind can change under it */
	begin: (
		kind: 'enter' | 'leave',
		opts: {
			who?: string;
			from?: DOMRect | null;
			reads?: { id: string; label: string }[];
			/** words of its own, in place of the wait's (a sign-out refused: still signed in) */
			title?: string;
			sub?: string;
		}
	) => Promise<void>;
	/** what the wait is on now: 'platform' once the console's code runs and its reads have gone out */
	phase: (name: 'code' | 'platform' | 'wake' | 'open') => void;
	/** names the reads of the wait that is on, before any has landed */
	reads: (list: { id: string; label: string }[]) => void;
	/** a read landed */
	mark: (id: string) => void;
	/** the page behind is drawn: opens the window onto it from its mark; resolves once the cover has gone */
	open: (opts: { anchor?: string | Element | DOMRect | null; onOpening?: () => void }) => Promise<void>;
	/** something did not answer */
	fail: (opts: { title?: string; text?: string; label?: string; onRetry?: () => void }) => void;
};

/** what the console reads, as TanStack Query options, each over the one API it is given */
export function queriesOf(api: ConsoleApi) {
	/** the Overview's figures and its page of batches (SC-48), and its runs (SC-49, Agents at work's latest): read again
	 *  every 30 s and on focus, unless paused */
	const live = (paused: boolean) => ({
		refetchInterval: paused ? (false as const) : 30_000,
		refetchOnWindowFocus: !paused,
		staleTime: 10_000
	});
	return {
		// what describes the platform, read once a session
		config: () =>
			queryOptions({
				queryKey: ['platform', 'console-config'] as const,
				queryFn: () => api.config(),
				staleTime: Infinity
			}),
		catalog: () =>
			queryOptions({ queryKey: ['platform', 'catalog'] as const, queryFn: () => api.catalog(), staleTime: Infinity }),
		// who is signed in
		me: () => queryOptions({ queryKey: ['session', 'me'] as const, queryFn: () => api.me() }),
		// the platform's state; a change refreshes everything under 'console'
		overview: (paused = false) =>
			queryOptions({ queryKey: ['console', 'overview'] as const, queryFn: () => api.overview(), ...live(paused) }),
		dashboard: (days: number, paused = false) =>
			queryOptions({
				queryKey: ['console', 'dashboard', days] as const,
				queryFn: () => api.dashboard(days),
				...live(paused)
			}),
		batches: (query: BatchQuery, paused = false) =>
			queryOptions({
				queryKey: ['console', 'batches', query] as const,
				queryFn: () => api.batches(query),
				placeholderData: keepPreviousData,
				...live(paused)
			}),
		clients: () => queryOptions({ queryKey: ['console', 'clients'] as const, queryFn: () => api.clients() }),
		client: (id: string) =>
			queryOptions({ queryKey: ['console', 'client', id] as const, queryFn: () => api.client(id) }),
		/** a client's scheduled runs and journey timers (SC-79): read again every 30 s, so "in 22 h" stays true */
		journey: (id: string) =>
			queryOptions({
				queryKey: ['console', 'journey', id] as const,
				queryFn: () => api.journey(id),
				refetchInterval: 30_000,
				staleTime: 10_000
			}),
		/** a client's open batches with their quick-commerce gates (SC-47) */
		clientBatches: (id: string) =>
			queryOptions({ queryKey: ['console', 'client-batches', id] as const, queryFn: () => api.clientBatches(id) }),
		staff: () => queryOptions({ queryKey: ['console', 'staff'] as const, queryFn: () => api.staff() }),
		audit: (client: string | null = null) =>
			queryOptions({ queryKey: ['console', 'audit', client] as const, queryFn: () => api.audit(client) }),
		requests: () => queryOptions({ queryKey: ['console', 'requests'] as const, queryFn: () => api.demoRequests() })
	};
}
export type ConsoleQueries = ReturnType<typeof queriesOf>;
type AnyQuery = { queryKey: readonly unknown[]; queryFn?: unknown };

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

// each screen's code, fetched when it is first opened (or while the sign-in is typed in, for the Overview), as the
// console app's routes split it before the screens moved into core
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each screen takes its own props, none required
type Screen = Component<any>;
const CODE: Record<ConsoleScreen, () => Promise<{ default: Screen }>> = {
	overview: () => import('./screens/Overview.svelte'),
	clients: () => import('./screens/Clients.svelte'),
	'new-client': () => import('./screens/NewClient.svelte'),
	agents: () => import('./screens/Agents.svelte'),
	connectors: () => import('./screens/Connectors.svelte'),
	plans: () => import('./screens/Plans.svelte'),
	staff: () => import('./screens/Staff.svelte'),
	audit: () => import('./screens/Audit.svelte')
};
const clientCode = () => import('./screens/ClientPage.svelte');

/** One console's data (SC-169): the API it talks to, its own cache, what each screen reads, and each screen's code. A
 *  host makes one (the console app at its start, for its load functions to fill) or ConsoleApp makes its own from the
 *  API it is given; two consoles in one page never share a cache. */
export class ConsoleData {
	readonly queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } }
	});
	readonly q: ConsoleQueries;
	/** the screens whose code has arrived, by screen ('client' for a client's page) */
	readonly screens = new SvelteMap<ConsoleScreen | 'client', Screen>();
	readonly #splash: () => ConsoleSplash | undefined;

	constructor(
		readonly api: ConsoleApi,
		opts: {
			/** the splash that covers the console's waits, when the host has one (the console app's window.SC3_SPLASH) */
			splash?: () => ConsoleSplash | undefined;
		} = {}
	) {
		this.q = queriesOf(api);
		this.#splash = opts.splash ?? (() => undefined);
	}

	get splash() {
		return this.#splash();
	}

	/** who is signed in, and how the platform describes itself, before anything draws. The splash covers the page from
	 *  its first paint (SC-51; SC-131): it hears that the console's code is running and its reads have gone out, then
	 *  each read as it lands, or that one was refused */
	boot = async () => {
		this.splash?.phase('platform');
		const landed =
			(id: string) =>
			<T>(v: T) => (this.splash?.mark(id), v);
		try {
			const [me, config, catalog] = await Promise.all([
				this.queryClient.ensureQueryData(this.q.me()).then(landed('session')),
				this.queryClient.ensureQueryData(this.q.config()).then(landed('config')),
				this.queryClient.ensureQueryData(this.q.catalog()).then(landed('catalog'))
			]);
			return { me, config, catalog };
		} catch (err) {
			this.splash?.fail({ text: 'The platform could not answer just now. Check the connection, then try again.' });
			throw err;
		}
	};

	/** what a screen reads before it draws */
	readsOf(route: ConsoleRoute): AnyQuery[] {
		const q = this.q;
		switch (route.screen) {
			case 'overview': {
				const v = readView(route.query);
				return [q.dashboard(v.days), q.batches(apiQuery(v)), q.overview(), q.clients(), q.requests()];
			}
			case 'clients':
				return route.id
					? [
							q.client(route.id),
							q.clients(),
							q.audit(route.id),
							...(route.tab === 'supply' ? [q.clientBatches(route.id)] : [])
						]
					: [q.clients()];
			case 'audit':
				return [q.clients(), q.audit()];
			case 'new-client':
				return [q.clients(), q.requests()];
			case 'staff':
				return [q.staff()];
			default:
				return [q.clients()];
		}
	}

	/** a screen's data, before it draws; nothing while no one is signed in. While the sign-in's splash is up, the
	 *  screen's reads are its stops, landing one by one */
	prefetch = async (...queries: AnyQuery[]) => {
		if (!(await this.queryClient.ensureQueryData(this.q.me()))) return;
		const splash = this.splash;
		const named = splash?.active === 'enter';
		if (named) {
			const ids = queries
				.map((q) => String(q.queryKey[1]))
				.filter((id, i, all) => id in READ_LABELS && all.indexOf(id) === i);
			ids.sort((a, b) => READ_ORDER.indexOf(a) - READ_ORDER.indexOf(b));
			splash.reads(ids.map((id) => ({ id, label: READ_LABELS[id] })));
		}
		await Promise.all(
			queries.map((q) =>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each is a queryOptions(); ensureQueryData keeps its type
				this.queryClient.ensureQueryData(q as any).then((v) => (named && splash.mark(String(q.queryKey[1])), v))
			)
		);
	};

	/** a screen's code: the component, once it has arrived */
	code = async (route: Pick<ConsoleRoute, 'screen' | 'id'>): Promise<Screen> => {
		const key = route.screen === 'clients' && route.id ? 'client' : route.screen;
		const have = this.screens.get(key);
		if (have) return have;
		const m = await (key === 'client' ? clientCode() : CODE[route.screen]());
		this.screens.set(key, m.default);
		return m.default;
	};

	/** everything a route needs before it draws: its screen's code and its data */
	load = async (route: ConsoleRoute) => {
		await Promise.all([this.prefetch(...this.readsOf(route)), this.code(route)]);
	};

	/** after a change: everything the console shows is read again */
	refresh = () => this.queryClient.invalidateQueries({ queryKey: ['console'] });
}
