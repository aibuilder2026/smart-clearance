<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { untrack } from 'svelte';
	import App from './App.svelte';
	import type { ConsoleLinks } from './console.svelte';
	import type { ConsoleData } from './data.svelte';
	import { sameRoute, type ConsoleRoute, type GoOptions } from './route';

	// ConsoleApp's inside (SC-169): how the platform describes itself, read before anything draws (the console app's
	// load function has read it already), and the route. A host that reads each route itself (preloaded) hands over
	// the route once it is in and says which one it is reading (pending); otherwise this reads each route the host, or
	// the console itself, moves to, and keeps the one before on screen until it is in, as the console app's navigation
	// does
	type Props = {
		data: ConsoleData;
		route?: ConsoleRoute | null;
		ongo?: (route: ConsoleRoute, opts: GoOptions) => unknown;
		preloaded?: boolean;
		pending?: ConsoleRoute | null;
		error?: { status: number; message?: string } | null;
		links?: Partial<ConsoleLinks>;
		plate?: string;
		mock?: boolean;
		embedded?: boolean;
	};
	let { data, route, ongo, preloaded = false, pending = null, ...rest }: Props = $props();

	const config = createQuery(() => data.q.config());
	const catalog = createQuery(() => data.q.catalog());

	// the route the console moves to on its own, when the host keeps none
	let own = $state<ConsoleRoute>(untrack(() => route ?? { screen: 'overview' }));
	const target = $derived(route === undefined ? own : route);
	// what is on screen, and what is being read before it shows
	let shown = $state<ConsoleRoute | null>(null);
	let reading = $state<ConsoleRoute | null>(null);
	let seq = 0;
	$effect(() => {
		const t = target;
		if (preloaded) return;
		untrack(() => {
			if (!t) {
				seq++;
				reading = shown = null;
				return;
			}
			if (sameRoute(t, reading ?? shown)) return;
			const n = ++seq;
			reading = t;
			void data
				.load(t)
				.catch(() => undefined)
				.finally(() => {
					if (n !== seq) return;
					shown = t;
					reading = null;
				});
		});
	});
	const current = $derived(preloaded ? (route ?? null) : shown);
	const next = $derived(preloaded ? pending : reading);

	// a move: the host's, or the console's own; it resolves once the place has its code and data (a button waiting on
	// it, Create workspace, lets go then)
	function go(r: ConsoleRoute, opts: GoOptions = {}) {
		if (route === undefined) own = r;
		return Promise.all([ongo?.(r, opts), data.load(r).catch(() => undefined)]);
	}
</script>

{#if config.data && catalog.data}
	<App {data} config={config.data} catalog={catalog.data} route={current} pending={next} {go} {...rest} />
{/if}
