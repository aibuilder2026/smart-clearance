import { PUBLIC_APP_URL, PUBLIC_SITE_URL } from '$app/env/public';
import type { ClientTab } from '@smart-clearance/api/console';

/** where the other surfaces live: the landing page, and Munchly Foods' workspace */
export const LINKS = { site: PUBLIC_SITE_URL, app: PUBLIC_APP_URL };

/** the console's addresses; the prototype keeps them in the hash (#/clients/munchly/agents), the console in the path */
export type RouteName = 'overview' | 'clients' | 'new-client' | 'agents' | 'connectors' | 'plans' | 'staff' | 'audit';
export function href(name: RouteName, id?: string | null, tab?: ClientTab | null): string {
	if (name === 'overview') return '/';
	if (name === 'clients' && id) return `/clients/${encodeURIComponent(id)}${tab ? '/' + tab : ''}`;
	return '/' + name;
}
