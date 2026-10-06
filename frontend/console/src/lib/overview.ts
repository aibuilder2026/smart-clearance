import type { BatchQuery, BatchSort, BatchStatus } from '@smart-clearance/api/console';

/** The Overview's view in the address (SC-48), so a refresh or a shared link keeps it: the range, and the batch table's
 *  status, client, stop, search, sort and page. Anything at its default is left out. */
export type View = {
	days: number;
	query: Required<Omit<BatchQuery, 'client' | 'stop'>> & Pick<BatchQuery, 'client' | 'stop'>;
};

export const DEFAULT: View = {
	days: 30,
	query: { status: 'in-flight', client: null, stop: null, q: '', sort: 'priority', dir: 'asc', page: 1, size: 8 }
};
const STATUSES: BatchStatus[] = ['in-flight', 'waiting', 'closed'];
const SORTS: BatchSort[] = ['priority', 'stop', 'days', 'units', 'value', 'updated'];
const int = (v: string | null) => (v != null && /^\d+$/.test(v) ? Number(v) : null);

export function readView(url: { searchParams: Pick<URLSearchParams, 'get'> }): View {
	const p = url.searchParams,
		d = DEFAULT.query;
	const days = int(p.get('days'));
	const status = p.get('status') as BatchStatus | null;
	const sort = p.get('sort') as BatchSort | null;
	const stop = int(p.get('stop'));
	const size = int(p.get('size'));
	return {
		days: days && [7, 30, 90].includes(days) ? days : DEFAULT.days,
		query: {
			status: status && STATUSES.includes(status) ? status : d.status,
			client: p.get('client') || null,
			stop: stop != null && stop <= 8 ? stop : null,
			q: p.get('q') ?? '',
			sort: sort && SORTS.includes(sort) ? sort : d.sort,
			dir: p.get('dir') === 'desc' ? 'desc' : 'asc',
			page: Math.max(1, int(p.get('page')) ?? 1),
			size: size && [8, 16, 32].includes(size) ? size : d.size
		}
	};
}

export function viewSearch(v: View): string {
	const p = new URLSearchParams();
	if (v.days !== DEFAULT.days) p.set('days', String(v.days));
	for (const [k, val] of Object.entries(v.query))
		if (val != null && val !== '' && val !== (DEFAULT.query as Record<string, unknown>)[k]) p.set(k, String(val));
	const s = p.toString();
	return s ? `?${s}` : '';
}

/** what the page reads: the defaults filled in for the API */
export const apiQuery = (v: View): BatchQuery => ({ ...v.query, q: v.query.q.trim() });

/** a viewer's own choice to pause the live figures, kept in this browser */
export const LIVE_KEY = 'sc-console-live';
export function readPaused(): boolean {
	try {
		return localStorage.getItem(LIVE_KEY) === 'paused';
	} catch {
		return false;
	}
}
export function writePaused(paused: boolean) {
	try {
		localStorage.setItem(LIVE_KEY, paused ? 'paused' : 'live');
	} catch {
		// storage blocked: the choice lasts until the page closes
	}
}
