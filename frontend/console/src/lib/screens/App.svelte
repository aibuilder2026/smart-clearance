<script lang="ts">
	import type { Catalog, ConsoleConfig, SignInInput, Staff } from '@smart-clearance/api/console';
	import { Mark, Shell, Wordmark, useNotice } from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Snippet } from 'svelte';
	import { onMount, tick } from 'svelte';
	import { animate } from 'motion';
	import { afterNavigate, beforeNavigate, refreshAll } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { api } from '#lib/api/client.ts';
	import { clientsQuery, meQuery, queryClient } from '#lib/api/queries.ts';
	import { Console, provideConsole } from '#lib/console.svelte.ts';
	import type { RouteName } from '#lib/links.ts';
	import { NAV, TITLES } from '#lib/nav.ts';
	import AccountSheet from './AccountSheet.svelte';
	import Screen from './Screen.svelte';
	import SignIn from './SignIn.svelte';
	import Placeholder from './loading/Placeholder.svelte';
	import RouteBar from './loading/RouteBar.svelte';
	import { SCREEN_SHAPE, SLOW_MS, type Shape } from './loading/shapes.ts';

	// the console: the sign-in until a staff member is in, then the shell with the screen the address names. Each screen
	// starts at its top, and loads under the route (SC-49): the route draws along the top as soon as a link is followed,
	// the screen's shape shows if its read takes a moment, and the content rises into place
	type Props = { me: Staff | null; config: ConsoleConfig; catalog: Catalog; children: Snippet };
	let { me, config, catalog, children }: Props = $props();

	// svelte-ignore state_referenced_locally (the platform's description is read once a session)
	provideConsole(new Console(config, catalog, useNotice(), () => me!));

	const nameOf = (route: string | null | undefined): RouteName | null =>
		route === '/' ? 'overview' : ((route?.split('/')[1] as RouteName | undefined) ?? null);
	const name = $derived(nameOf(page.route.id));
	const id = $derived(name === 'clients' ? (page.params.id ?? null) : null);
	const clients = createQuery(() => ({ ...clientsQuery(), enabled: !!me }));
	const client = $derived(id ? clients.data?.find((c) => c.id === id) : undefined);
	const title = $derived(
		me
			? `${client ? client.name : name ? TITLES[name] : 'Not found'} · Smart-Clearance Console`
			: 'Sign in · Smart-Clearance Console'
	);
	const nav = $derived(NAV.map((n) => (n.id === 'clients' ? { ...n, count: clients.data?.length } : n)));
	let account = $state(false);

	// a new screen starts at its top: the page scrolls inside #main, not the window
	afterNavigate(({ from, to }) => {
		const key = (r: typeof to) => (r ? `${r.route.id}|${r.params?.id ?? ''}` : '');
		if (from && key(from) !== key(to)) document.getElementById('main')?.scrollTo(0, 0);
	});
	// a new screen is being read: the route starts at once (a new one each time), the shape after SLOW_MS
	let run = $state(1);
	let reading = $state<{ title: string; shape: Shape } | null>(null);
	let slow = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	beforeNavigate(({ to, willUnload }) => {
		const next = nameOf(to?.route.id);
		if (willUnload || !next) return;
		const nextId = next === 'clients' ? (to?.params?.id ?? null) : null;
		if (next === name && nextId === id) return; // the same screen: a tab or a filter, which the screen handles
		const c = nextId ? clients.data?.find((x) => x.id === nextId) : undefined;
		reading = {
			title: c ? c.name : TITLES[next],
			shape: nextId ? 'client' : (SCREEN_SHAPE[next] ?? 'list')
		};
		run += 1;
		slow = false;
		clearTimeout(timer);
		timer = setTimeout(() => (slow = true), SLOW_MS);
	});
	const settle = () => {
		reading = null;
		slow = false;
		clearTimeout(timer);
	};
	afterNavigate(settle);
	$effect(() => {
		if (!navigating.to && reading) settle(); // a navigation that was cancelled or went nowhere
	});

	// the console's three waits go through the splash (design3/console/splash.js, SC-51), which follows the reads as
	// they land and opens onto the page from its mark. The first load's cover is up from the first paint: once this
	// draws, the splash opens onto it. Its motion runs on motion's animate()
	const MARK = { console: '.sb-brand .mark, .sidebar .mark', signin: '.si-ws .mark' };
	const splash = () => {
		const S = window.SC3_SPLASH;
		if (S) S.animate = animate as NonNullable<typeof S.animate>;
		return S;
	};
	onMount(() => {
		const S = splash();
		if (S && !S.lifted && S.active === 'boot') void S.open({ anchor: me ? MARK.console : MARK.signin });
	});
	// signing in: the check, then, once Sign in has said who is in, the card's mark grows into the splash, the console
	// draws under its cover while its reads land (prefetch names them), and the splash opens onto it
	const check = (input: SignInInput) => api.signIn(input);
	async function enter(staff: Staff) {
		const S = splash();
		if (S) {
			const from = document.querySelector(MARK.signin)?.getBoundingClientRect() ?? null;
			await S.begin('enter', { who: staff.name.split(' ')[0], from });
		}
		queryClient.setQueryData(meQuery().queryKey, staff);
		await refreshAll();
		await tick();
		if (S) await S.open({ anchor: MARK.console });
	}
	// signing out: the console recedes behind the splash while the session closes (two stops: the platform's, then
	// Firebase's), the sign-in takes its place, and the splash opens onto it from the card's mark
	async function signOut() {
		account = false;
		const S = splash();
		if (S) void S.begin('leave', { who: me?.name.split(' ')[0] });
		await api.signOut();
		S?.mark('session-end');
		S?.mark('firebase');
		queryClient.setQueryData(meQuery().queryKey, null);
		queryClient.removeQueries({ queryKey: ['console'] });
		await refreshAll();
		await tick();
		if (S) await S.open({ anchor: MARK.signin });
	}
	// the session can end elsewhere (another tab signs out): the next read of who is in says so
	const session = createQuery(() => meQuery());
	$effect(() => {
		if (me && session.data === null) void refreshAll();
	});
</script>

<svelte:head><title>{title}</title></svelte:head>

{#if !me}
	<SignIn {check} {enter} />
{:else}
	{#snippet brand()}<Mark size={32} /><span class="cs-brand"
			><Wordmark size={17} /><span class="cs-brand-sub">Console</span></span
		>{/snippet}
	<Shell
		{nav}
		current={name === 'new-client' ? 'clients' : (name ?? '')}
		user={{ name: me.name, role: me.role, org: 'Smart-Clearance' }}
		onuser={() => (account = true)}
		{brand}
	>
		<div class="cs-loading">
			{#key run}<RouteBar done={!reading} />{/key}
			{#if reading && slow}<Screen title={reading.title}
					><Placeholder shape={reading.shape} label={reading.title} /></Screen
				>{:else}{#key `${name}|${id ?? ''}`}<div class="cs-in" data-kind="screen">{@render children()}</div>{/key}{/if}
		</div>
	</Shell>
	<AccountSheet bind:open={account} onout={signOut} />
{/if}
