<script lang="ts">
	import type { Catalog, ConsoleConfig, SignInInput, Staff } from '@smart-clearance/api/console';
	import { createQuery } from '@tanstack/svelte-query';
	import { animate } from 'motion';
	import { onMount, tick, untrack } from 'svelte';
	import { useApp } from '../app.svelte';
	import Mark from '../components/Mark.svelte';
	import Shell from '../components/Shell.svelte';
	import Wordmark from '../components/Wordmark.svelte';
	import { useNotice } from '../notice.svelte';
	import { refusal } from '../wait.svelte';
	import { Console, provideConsole, type ConsoleLinks } from './console.svelte';
	import type { ConsoleData } from './data.svelte';
	import { navOf, TITLES } from './nav';
	import { routeHash, routeOfHash, routePath, sameScreen, type ConsoleRoute, type GoOptions } from './route';
	import AccountSheet from './screens/AccountSheet.svelte';
	import Failed from './screens/Failed.svelte';
	import Placeholder from './screens/loading/Placeholder.svelte';
	import RouteBar from './screens/loading/RouteBar.svelte';
	import { SCREEN_SHAPE, SLOW_MS, type Shape } from './screens/loading/shapes';
	import Screen from './screens/Screen.svelte';
	import SignIn from './screens/SignIn.svelte';

	// the console: the sign-in until a staff member is in, then the shell with the screen the route names. Each screen
	// starts at its top, and loads under the route (SC-49): the route draws along the top as soon as a link is followed,
	// the screen's shape shows if its read takes a moment, and the content rises into place
	type Props = {
		data: ConsoleData;
		config: ConsoleConfig;
		catalog: Catalog;
		/** the route on screen (null before the first is in), and the one being read */
		route: ConsoleRoute | null;
		pending: ConsoleRoute | null;
		go: (route: ConsoleRoute, opts?: GoOptions) => Promise<unknown>;
		error?: { status: number; message?: string } | null;
		links?: Partial<ConsoleLinks>;
		mock?: boolean;
		embedded?: boolean;
	};
	let { data, config, catalog, route, pending, go, error = null, links, mock, embedded = false }: Props = $props();

	const app = useApp();
	const notices = useNotice();
	// who is in: the session's read, which also says when it ended elsewhere (another tab signed out)
	const session = createQuery(() => data.q.me());
	const me = $derived(session.data ?? null);
	let root: HTMLElement | undefined = $state();
	// the console's own page, which scrolls inside its shell's #main: never another app's in the same page
	const main = () => root?.querySelector<HTMLElement>('#main') ?? null;
	// svelte-ignore state_referenced_locally (the platform's description is read once a session)
	const k = new Console({
		data,
		config,
		catalog,
		notices,
		me: () => me!,
		route: () => route,
		pending: () => pending,
		go,
		// embedded, a link carries the prototype's hash address and comes back through go (below); hosted, the path
		href: untrack(() => (embedded ? routeHash : routePath)),
		links: untrack(() => links),
		mock: untrack(() => mock),
		embedded: untrack(() => embedded),
		top: () => main()?.scrollTo?.(0, 0),
		account: () => (account = true)
	});
	provideConsole(k);

	const name = $derived(route?.screen ?? null);
	const id = $derived(route?.screen === 'clients' ? (route.id ?? null) : null);
	const clients = createQuery(() => ({ ...data.q.clients(), enabled: !!me }));
	const client = $derived(id ? clients.data?.find((c) => c.id === id) : undefined);
	const title = $derived(
		me
			? `${client ? client.name : name ? TITLES[name] : 'Not found'} · Smart-Clearance Console`
			: 'Sign in · Smart-Clearance Console'
	);
	const nav = $derived(navOf(k.href).map((n) => (n.id === 'clients' ? { ...n, count: clients.data?.length } : n)));
	let account = $state(false);

	// a new screen starts at its top: the page scrolls inside #main, not the window
	const screenKey = $derived(route ? `${route.screen}|${id ?? ''}` : '');
	let lastKey = '';
	$effect(() => {
		const key = screenKey;
		untrack(() => {
			if (lastKey && key !== lastKey) main()?.scrollTo?.(0, 0);
			lastKey = key;
		});
	});
	// a new screen is being read: the route starts at once (a new one each time), the shape after SLOW_MS. Another tab
	// or filter of the same screen is the screen's own to show
	const next = $derived(pending && !sameScreen(pending, route) ? pending : null);
	const nextKey = $derived(next ? `${next.screen}|${next.screen === 'clients' ? (next.id ?? '') : ''}` : null);
	let run = $state(1);
	let slow = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const key = nextKey;
		untrack(() => {
			clearTimeout(timer);
			slow = false;
			if (!key) return;
			run += 1;
			timer = setTimeout(() => (slow = true), SLOW_MS);
		});
	});
	const reading = $derived.by((): { title: string; shape: Shape } | null => {
		if (!next) return null;
		const c = next.screen === 'clients' && next.id ? clients.data?.find((x) => x.id === next.id) : undefined;
		return {
			title: c ? c.name : TITLES[next.screen],
			shape: next.screen === 'clients' && next.id ? 'client' : (SCREEN_SHAPE[next.screen] ?? 'list')
		};
	});
	// the screen on show, once its code is in
	const Body = $derived(
		route ? data.screens.get(route.screen === 'clients' && route.id ? 'client' : route.screen) : undefined
	);
	$effect(() => {
		if (route && !Body) void data.code(route).catch(() => undefined);
	});

	// embedded, a link inside the console (its hash address) moves the console, never the page around it; sheets and
	// alerts sit in the host's app root, beside the console's own root
	function follow(e: MouseEvent) {
		if (!embedded || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		const a = (e.target as Element | null)?.closest?.('a[href^="#/"]');
		if (!a || a.getAttribute('target')) return;
		const r = routeOfHash(a.getAttribute('href')!);
		if (!r) return;
		e.preventDefault();
		void go(r);
	}
	$effect(() => {
		const host = app.overlays ?? root;
		if (!embedded || !host) return;
		host.addEventListener('click', follow);
		return () => host.removeEventListener('click', follow);
	});

	// the console's three waits go through the splash (design3/console/splash.js, SC-51), when the host has one, which
	// follows the reads as they land and opens onto the page from its mark. The first load's cover is up from the first
	// paint: once this draws, the splash opens onto it. Its motion runs on motion's animate()
	const MARK = { console: '.sb-brand .mark, .sidebar .mark', signin: '.si-ws .mark' };
	const splash = () => {
		const S = data.splash;
		if (S) S.animate = animate as NonNullable<typeof S.animate>;
		return S;
	};
	onMount(() => {
		const S = splash();
		if (S && !S.lifted && S.active === 'boot') void S.open({ anchor: me ? MARK.console : MARK.signin });
	});
	// signing in: the check, then, once Sign in has said who is in, the card's mark grows into the splash, the console
	// draws under its cover while its reads land (data.load names them), and the splash opens onto it
	const check = (input: SignInInput) => data.api.signIn(input);
	async function enter(staff: Staff) {
		const S = splash();
		if (S) {
			const from = root?.querySelector(MARK.signin)?.getBoundingClientRect() ?? null;
			await S.begin('enter', { who: staff.name.split(' ')[0], from });
		}
		data.queryClient.setQueryData(data.q.me().queryKey, staff);
		await data.load(route ?? { screen: 'overview' });
		await tick();
		if (S) await S.open({ anchor: MARK.console });
	}
	// signing out: the console recedes behind the splash while the session closes (two stops: the platform's, then
	// Firebase's), the sign-in takes its place, and the splash opens onto it from the card's mark. A sign-out the
	// platform refuses keeps the person signed in (SC-152): the splash says so and opens back onto the console, and a
	// toast gives the reason
	async function signOut() {
		account = false;
		const S = splash();
		const who = me?.name.split(' ')[0];
		const leaving = S ? S.begin('leave', { who }) : Promise.resolve();
		try {
			await data.api.signOut();
		} catch (e) {
			await leaving;
			if (S) {
				await S.begin('enter', {
					who,
					title: 'You are still signed in',
					sub: 'The sign-out did not go through.',
					reads: []
				});
				await S.open({ anchor: MARK.console });
			}
			notices.toast({ text: `You are still signed in. ${refusal(e)}`, tone: 'err', ms: 6000 });
			return;
		}
		S?.mark('session-end');
		S?.mark('firebase');
		data.queryClient.setQueryData(data.q.me().queryKey, null);
		data.queryClient.removeQueries({ queryKey: ['console'] });
		await tick();
		if (S) await S.open({ anchor: MARK.signin });
	}
</script>

<svelte:head>
	{#if !embedded}<title>{title}</title>{/if}
</svelte:head>

<!-- .cs-app: the console's root, a box of no size (console.css), which its few rules on the kit's shared components are
     scoped to, so a page that hosts the console keeps its own look -->
<div class="cs-app" bind:this={root}>
	{#if session.isPending}
		<!-- who is in is being read (an embedded console's first moment): nothing to show yet -->
	{:else if !me}
		<SignIn {check} {enter} />
	{:else}
		{#snippet brand()}<Mark size={32} /><span class="cs-brand"
				><Wordmark size={17} /><span class="cs-brand-sub">Console</span></span
			>{/snippet}
		<Shell
			{nav}
			current={name === 'new-client' ? 'clients' : (name ?? '')}
			user={{ name: me.name, role: me.role, org: 'Smart-Clearance', img: me.img }}
			onuser={() => (account = true)}
			{brand}
		>
			<div class="cs-loading">
				{#key run}<RouteBar done={!reading} />{/key}
				{#if error}<Failed status={error.status} message={error.message} />{:else if reading && slow}<Screen
						title={reading.title}><Placeholder shape={reading.shape} label={reading.title} /></Screen
					>{:else if Body}{#key screenKey}<div class="cs-in" data-kind="screen"><Body /></div>{/key}{/if}
			</div>
		</Shell>
		<AccountSheet bind:open={account} onout={signOut} />
	{/if}
</div>
