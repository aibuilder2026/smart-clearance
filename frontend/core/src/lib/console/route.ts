import type { ClientTab } from '@smart-clearance/api/console';

/** The console's places (SC-169): the prototype keeps them in the hash (#/clients/munchly/agents), the console app in
 *  the path (/clients/munchly/agents), and a page that embeds the console (the guided demo) in its own state. */
export type ConsoleScreen =
	'overview' | 'clients' | 'new-client' | 'agents' | 'connectors' | 'plans' | 'staff' | 'audit';

/** where the console is: a screen, the client it is about and the tab open (clients only), and the address's query
 *  (the Overview's view, New client's ?request=), each value a string */
export type ConsoleRoute = {
	screen: ConsoleScreen;
	id?: string | null;
	tab?: ClientTab | null;
	query?: Record<string, string>;
};

/** how a route change goes: in place of the current entry (replace), and keeping the scroll and focus where they are
 *  (keep: a filter, a tab), as SvelteKit's goto's replace and reset: false */
export type GoOptions = { replace?: boolean; keep?: boolean };

export const SCREENS: readonly ConsoleScreen[] = [
	'overview',
	'clients',
	'new-client',
	'agents',
	'connectors',
	'plans',
	'staff',
	'audit'
];
export const TABS: readonly ClientTab[] = ['agents', 'supply', 'rules', 'people', 'integrations', 'plan', 'audit'];

/** a route as the console app's address: /, /clients/munchly/supply, /new-client?request=rq-kesari */
export function routePath(r: ConsoleRoute): string {
	const path =
		r.screen === 'overview'
			? '/'
			: r.screen === 'clients' && r.id
				? `/clients/${encodeURIComponent(r.id)}${r.tab ? '/' + r.tab : ''}`
				: '/' + r.screen;
	const q = new URLSearchParams(r.query ?? {}).toString();
	return q ? `${path}?${q}` : path;
}

/** the route an address names, or null for one the console doesn't have. A client's unknown tab opens its first, as
 *  the console always has */
export function routeOf(pathname: string, search: string | { toString(): string } = ''): ConsoleRoute | null {
	const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
	const query = Object.fromEntries(new URLSearchParams(String(search)));
	if (!parts.length) return { screen: 'overview', query };
	const screen = parts[0] as ConsoleScreen;
	if (screen === 'overview' || !SCREENS.includes(screen)) return null;
	if (screen === 'clients' && parts.length > 1) {
		if (parts.length > 3) return null;
		const tab = TABS.includes(parts[2] as ClientTab) ? (parts[2] as ClientTab) : null;
		return { screen, id: parts[1], tab, query };
	}
	return parts.length === 1 ? { screen, query } : null;
}

/** a route in the hash form the prototype keeps, which an embedded console's links carry: #/clients/munchly/agents */
export const routeHash = (r: ConsoleRoute) => '#' + routePath(r).replace(/^\/(?=$|\?)/, '/overview');
/** the route a hash names (#/clients/munchly/agents), or null */
export function routeOfHash(hash: string): ConsoleRoute | null {
	const [path, search = ''] = hash.replace(/^#/, '').split('?');
	return routeOf(path === '/overview' ? '/' : path, search);
}

/** the same screen: the same screen and client; a tab or a query is the screen's own */
export const sameScreen = (a: ConsoleRoute | null | undefined, b: ConsoleRoute | null | undefined) =>
	!!a && !!b && a.screen === b.screen && (a.screen !== 'clients' || (a.id ?? null) === (b.id ?? null));
/** the same place, its tab and query included */
export const sameRoute = (a: ConsoleRoute | null | undefined, b: ConsoleRoute | null | undefined) =>
	!!a && !!b && routePath(a) === routePath(b);
