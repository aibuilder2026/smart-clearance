<script lang="ts">
	import type { Catalog, ConsoleConfig, SignInInput, Staff } from '@smart-clearance/api/console';
	import { Mark, Shell, Wordmark, ease, motionMs, useNotice } from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Snippet } from 'svelte';
	import { afterNavigate, refreshAll } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '#lib/api/client.ts';
	import { clientsQuery, meQuery, queryClient } from '#lib/api/queries.ts';
	import { Console, provideConsole } from '#lib/console.svelte.ts';
	import type { RouteName } from '#lib/links.ts';
	import { NAV, TITLES } from '#lib/nav.ts';
	import AccountSheet from './AccountSheet.svelte';
	import SignIn from './SignIn.svelte';

	// the console: the sign-in until a staff member is in, then the shell with the screen the address names. Each screen
	// fades in as it opens, and starts at its top
	type Props = { me: Staff | null; config: ConsoleConfig; catalog: Catalog; children: Snippet };
	let { me, config, catalog, children }: Props = $props();

	// svelte-ignore state_referenced_locally (the platform's description is read once a session)
	provideConsole(new Console(config, catalog, useNotice(), () => me!));

	const name = $derived<RouteName | null>(
		page.route.id === '/' ? 'overview' : ((page.route.id?.split('/')[1] as RouteName | undefined) ?? null)
	);
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
	const enter = (_: Element) => ({
		duration: motionMs(180),
		easing: ease,
		css: (t: number) => `opacity: ${t}; transform: translateY(${(1 - t) * 6}px)`
	});

	async function signIn(input: SignInInput) {
		const staff = await api.signIn(input);
		queryClient.setQueryData(meQuery().queryKey, staff);
		await refreshAll();
	}
	async function signOut() {
		account = false;
		await api.signOut();
		queryClient.setQueryData(meQuery().queryKey, null);
		queryClient.removeQueries({ queryKey: ['console'] });
		await refreshAll();
	}
	// the session can end elsewhere (another tab signs out): the next read of who is in says so
	const session = createQuery(() => meQuery());
	$effect(() => {
		if (me && session.data === null) void refreshAll();
	});
</script>

<svelte:head><title>{title}</title></svelte:head>

{#if !me}
	<SignIn onin={signIn} />
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
		{#key `${name}|${id ?? ''}`}<div in:enter>{@render children()}</div>{/key}
	</Shell>
	<AccountSheet bind:open={account} onout={signOut} />
{/if}
