import type { NavItem } from '@smart-clearance/core';
import { href, type RouteName } from './links';

/** the console's places, in the sidebar's order; the phone's tab bar keeps the four without phoneHidden */
export const NAV: (NavItem & { id: RouteName })[] = [
	{ id: 'overview', label: 'Overview', short: 'Today', icon: 'layout-dashboard', href: href('overview') },
	{ id: 'clients', label: 'Clients', icon: 'building-2', href: href('clients') },
	{ id: 'agents', label: 'Agents', icon: 'bot', href: href('agents') },
	{ id: 'connectors', label: 'Connectors', icon: 'plug', phoneHidden: true, href: href('connectors') },
	{ id: 'plans', label: 'Plans', icon: 'layout-grid', phoneHidden: true, href: href('plans') },
	{ id: 'staff', label: 'Staff', icon: 'users', phoneHidden: true, href: href('staff') },
	{ id: 'audit', label: 'Audit log', short: 'Audit', icon: 'scroll-text', href: href('audit') }
];

export const TITLES: Record<RouteName, string> = {
	overview: 'Overview',
	clients: 'Clients',
	'new-client': 'New client',
	agents: 'Agents',
	connectors: 'Connectors',
	plans: 'Plans',
	staff: 'Staff',
	audit: 'Audit log'
};
