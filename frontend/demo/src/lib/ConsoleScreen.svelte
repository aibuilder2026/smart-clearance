<script lang="ts" module>
	import { demoConsoleApi } from '@smart-clearance/core/console/demo';

	// the console's demo world, made once a visit and kept in memory: Neha signed in, or no one for the sign-in's beat
	let signedIn: ReturnType<typeof demoConsoleApi> | undefined;
	let signedOut: ReturnType<typeof demoConsoleApi> | undefined;
	const apiOf = (signin: boolean) =>
		signin ? (signedOut ??= demoConsoleApi({ signedIn: null })) : (signedIn ??= demoConsoleApi({ signedIn: 'neha' }));
</script>

<script lang="ts">
	import { AppRoot } from '@smart-clearance/core';
	import { ConsoleApp, routeOf, type ConsoleRoute } from '@smart-clearance/core/console';
	import { untrack } from 'svelte';
	import plate from '$design3/site/assets/plates/scene.webp';
	import type { DeviceSpec } from './types.ts';

	// the staff console inside the demo (director.jsx ConsoleScreen, SC-169): the console's own app, embedded, on its
	// demo world (Munchly Foods and four fictional clients), at the beat's route; the visitor can wander off in it, and a
	// new beat points it back. A beat can name a heading to scroll to, by its words
	let { spec }: { spec: DeviceSpec; onsignin?: () => void } = $props();

	const signin = $derived(!!spec.signin);
	const beatRoute = (): ConsoleRoute => {
		const [path, search = ''] = (spec.console || '/overview').replace(/^\/overview\b/, '/').split('?');
		return routeOf(path, search) ?? { screen: 'overview' };
	};
	const key = $derived(`${spec.console}|${spec.scrollTo}|${signin}`);
	let route = $state<ConsoleRoute>(untrack(beatRoute));
	$effect(() => {
		void key;
		route = untrack(beatRoute);
	});

	// scroll the console to the heading the beat is about, once its screen has drawn
	let box: HTMLDivElement | undefined = $state();
	$effect(() => {
		void key;
		const words = spec.scrollTo;
		const t = setTimeout(() => {
			const root = box;
			if (!root) return;
			const el = words
				? [...root.querySelectorAll('h1, h2, h3, h4, .section-title, b, strong')].find((x) =>
						x.textContent?.trim().startsWith(words)
					)
				: null;
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			else root.querySelector('.scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
		}, 700);
		return () => clearTimeout(t);
	});
</script>

<div bind:this={box} class="console-screen" style="position: absolute; inset: 0">
	<AppRoot embedded style="position: absolute; inset: 0">
		{#key signin}<ConsoleApp api={apiOf(signin)} {route} ongo={(r) => (route = r)} embedded mock {plate} />{/key}
	</AppRoot>
</div>
