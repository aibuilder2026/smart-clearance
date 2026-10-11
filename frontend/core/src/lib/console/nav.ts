import type { NavItem } from '../components/Shell.svelte';
import type { ConsoleRoute, ConsoleScreen } from './route';

/** the console's places, in the sidebar's order; the phone's tab bar keeps the four without phoneHidden. Each is a link
 *  to its screen, its address as the host keeps it (href) */
export const navOf = (href: (r: ConsoleRoute) => string): (NavItem & { id: ConsoleScreen })[] => [
	{ id: 'overview', label: 'Overview', short: 'Today', icon: 'layout-dashboard', href: href({ screen: 'overview' }) },
	{ id: 'clients', label: 'Clients', icon: 'building-2', href: href({ screen: 'clients' }) },
	{ id: 'agents', label: 'Agents', icon: 'bot', href: href({ screen: 'agents' }) },
	{ id: 'connectors', label: 'Connectors', icon: 'plug', phoneHidden: true, href: href({ screen: 'connectors' }) },
	{ id: 'plans', label: 'Plans', icon: 'layout-grid', phoneHidden: true, href: href({ screen: 'plans' }) },
	{ id: 'staff', label: 'Staff', icon: 'users', phoneHidden: true, href: href({ screen: 'staff' }) },
	{ id: 'audit', label: 'Audit log', short: 'Audit', icon: 'scroll-text', href: href({ screen: 'audit' }) }
];

export const TITLES: Record<ConsoleScreen, string> = {
	overview: 'Overview',
	clients: 'Clients',
	'new-client': 'New client',
	agents: 'Agents',
	connectors: 'Connectors',
	plans: 'Plans',
	staff: 'Staff',
	audit: 'Audit log'
};
