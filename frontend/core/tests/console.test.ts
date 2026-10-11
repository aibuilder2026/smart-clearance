import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsoleData } from '../src/lib/console/data.svelte';
import { demoConsoleApi } from '../src/lib/console/demo';
import {
	routeHash,
	routeOf,
	routeOfHash,
	routePath,
	sameRoute,
	sameScreen,
	type ConsoleRoute
} from '../src/lib/console/route';
import ConsoleHost from './fixtures/ConsoleHost.svelte';

// The console in core (SC-169): its places as the console app's paths and an embedded console's hashes, what each place
// reads before it draws, and ConsoleApp itself, embedded on the demo world as the guided demo shows it: signed in, its
// own links moving it and telling the host, a client's tab named by the host, and the sign-in when no one is in.

describe("the console's places", () => {
	it('reads an address as a place, and writes it back', () => {
		const cases: [string, string, ConsoleRoute][] = [
			['/', '', { screen: 'overview', query: {} }],
			['/', '?days=7&status=closed', { screen: 'overview', query: { days: '7', status: 'closed' } }],
			['/clients', '', { screen: 'clients', query: {} }],
			['/clients/munchly/supply', '', { screen: 'clients', id: 'munchly', tab: 'supply', query: {} }],
			['/new-client', '?request=rq-kesari', { screen: 'new-client', query: { request: 'rq-kesari' } }],
			['/audit', '', { screen: 'audit', query: {} }]
		];
		for (const [path, search, route] of cases) {
			expect(routeOf(path, search)).toEqual(route);
			expect(routePath(route)).toBe(path + search);
		}
	});
	it("opens a client's first tab for a tab it doesn't have, and knows no other address", () => {
		expect(routeOf('/clients/munchly/nope')).toEqual({ screen: 'clients', id: 'munchly', tab: null, query: {} });
		for (const path of ['/overview', '/nope', '/clients/munchly/agents/more', '/staff/someone'])
			expect(routeOf(path)).toBeNull();
	});
	it("carries the prototype's hash addresses for an embedded console", () => {
		expect(routeHash({ screen: 'overview' })).toBe('#/overview');
		expect(routeHash({ screen: 'clients', id: 'munchly', tab: 'agents' })).toBe('#/clients/munchly/agents');
		expect(routeHash({ screen: 'overview', query: { days: '7' } })).toBe('#/overview?days=7');
		expect(routeOfHash('#/clients/munchly/rules')).toMatchObject({ screen: 'clients', id: 'munchly', tab: 'rules' });
		expect(routeOfHash('#/overview?days=90')).toMatchObject({ screen: 'overview', query: { days: '90' } });
	});
	it('tells a move within a screen (a tab, a filter) from a move to another screen', () => {
		const a: ConsoleRoute = { screen: 'clients', id: 'munchly', tab: 'agents' };
		expect(sameScreen(a, { ...a, tab: 'supply' })).toBe(true);
		expect(sameRoute(a, { ...a, tab: 'supply' })).toBe(false);
		expect(sameScreen(a, { screen: 'clients', id: 'godavari-staples' })).toBe(false);
		expect(sameScreen({ screen: 'overview', query: { days: '7' } }, { screen: 'overview' })).toBe(true);
	});
	it('reads what each place shows before it draws, as the console app did route by route', () => {
		const data = new ConsoleData(demoConsoleApi());
		const keys = (r: ConsoleRoute) => data.readsOf(r).map((q) => q.queryKey.slice(1).join(' '));
		expect(keys({ screen: 'overview', query: { days: '7' } })).toEqual([
			'dashboard 7',
			'batches [object Object]',
			'overview',
			'clients',
			'requests'
		]);
		expect(keys({ screen: 'clients', id: 'munchly', tab: 'supply' })).toEqual([
			'client munchly',
			'clients',
			'audit munchly',
			'client-batches munchly'
		]);
		expect(keys({ screen: 'clients', id: 'munchly' })).toEqual(['client munchly', 'clients', 'audit munchly']);
		expect(keys({ screen: 'staff' })).toEqual(['staff']);
		expect(keys({ screen: 'new-client' })).toEqual(['clients', 'requests']);
	});
	it('keeps one cache a console, never shared', () => {
		expect(new ConsoleData(demoConsoleApi()).queryClient).not.toBe(new ConsoleData(demoConsoleApi()).queryClient);
	});
});

describe('ConsoleApp, embedded on the demo world', () => {
	afterEach(() => vi.useRealTimers());
	const heading = (el: HTMLElement) => el.querySelector('h1')?.textContent?.trim();

	it('opens signed in on the Overview, with its five clients live', async () => {
		const r = render(ConsoleHost, { props: { api: demoConsoleApi(), embedded: true } });
		await waitFor(() => expect(heading(r.container)).toBe('Overview'), { timeout: 5000 });
		expect(r.container.textContent).toContain('5 clients live');
		// the shell's places are the prototype's hash addresses, never the page's own paths
		const clients = r.container.querySelector<HTMLAnchorElement>('nav[aria-label="Main"] a[href="#/clients"]');
		expect(clients).not.toBeNull();
	});

	it('moves through its own links, telling the host', async () => {
		const ongo = vi.fn();
		const r = render(ConsoleHost, { props: { api: demoConsoleApi(), embedded: true, ongo } });
		await waitFor(() => expect(heading(r.container)).toBe('Overview'), { timeout: 5000 });
		const link = r.container.querySelector<HTMLAnchorElement>('nav[aria-label="Main"] a[href="#/clients"]')!;
		await fireEvent.click(link);
		await waitFor(() => expect(heading(r.container)).toBe('Clients'), { timeout: 5000 });
		expect(ongo).toHaveBeenCalledWith(expect.objectContaining({ screen: 'clients' }), {});
		expect(r.container.textContent).toContain('Godavari Staples');
		expect(location.hash).toBe('');
	});

	it("opens the client and the tab the host names, and follows the host's next one", async () => {
		const r = render(ConsoleHost, {
			props: {
				api: demoConsoleApi(),
				embedded: true,
				route: { screen: 'clients', id: 'godavari-staples', tab: 'supply' }
			}
		});
		await waitFor(() => expect(heading(r.container)).toBe('Godavari Staples'), { timeout: 5000 });
		await waitFor(() => expect(r.container.textContent).toContain('First stock export'), { timeout: 5000 });
		await r.rerender({
			api: demoConsoleApi(),
			embedded: true,
			route: { screen: 'clients', id: 'munchly', tab: 'rules' }
		});
		await waitFor(() => expect(heading(r.container)).toBe('Munchly Foods'), { timeout: 5000 });
		expect(r.container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain('Channels & rules');
	});

	it('shows the sign-in when no one is signed in', async () => {
		const r = render(ConsoleHost, { props: { api: demoConsoleApi({ signedIn: null }), embedded: true } });
		await waitFor(() => expect(heading(r.container)).toBe('Sign in'), { timeout: 5000 });
	});
});
