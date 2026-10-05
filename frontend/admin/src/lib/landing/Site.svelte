<script lang="ts">
	import { FindWorkspace, useTheme } from '@smart-clearance/core';
	import { animate } from 'motion';
	import { onMount } from 'svelte';
	import { api } from '#lib/api/client.ts';
	import type { Catalog, Showcase } from '#lib/api/types.ts';
	import Close from './Close.svelte';
	import DemoSheet from './DemoSheet.svelte';
	import Exits from './Exits.svelte';
	import { figures } from './figures';
	import Footer from './Footer.svelte';
	import Hero from './Hero.svelte';
	import How from './How.svelte';
	import { LINKS, openLink } from './links';
	import { PLATES } from './plates';
	import Nav from './Nav.svelte';
	import Plans from './Plans.svelte';
	import Workspace from './Workspace.svelte';

	// smartclearance.com: the product's own landing page, independent of any client. One carton the size of a godown,
	// parked in a miniature Indian town, and the page follows where its packs go (design3/site, SC-25). It names no
	// client: the batch it follows is an illustrative one (SC-28).
	let { showcase, catalog }: { showcase: Showcase; catalog: Catalog } = $props();
	const f = $derived(figures(showcase, catalog));

	let find = $state(false);
	let demo = $state(false);
	let demoPlan: string | null = $state(null);
	// The page's loader (design3/site/loader.js, SC-35; hooks.server.ts puts it first in <body>): it runs its exits on
	// motion's animate(), finds the plates by their hashed names, covers each change of theme, and hears that the page
	// is up. Every load plays the route; every change of theme plays dusk or dawn.
	const theme = useTheme();
	const PLATE_BY_NAME: Record<string, string> = {
		'business.webp': PLATES.town.day,
		'business-night.webp': PLATES.town.night,
		'exits.webp': PLATES.exits.day,
		'exits-night.webp': PLATES.exits.night,
		'islands.webp': PLATES.islands.day,
		'islands-night.webp': PLATES.islands.night
	};
	onMount(() => {
		const loader = window.SC3_LOADER;
		if (!loader) return;
		loader.animate = animate as NonNullable<typeof loader.animate>;
		window.SC3_PLATE_URL = (name) => PLATE_BY_NAME[name];
		theme.gate = loader.switchTheme;
		loader.mark('app');
		return () => {
			if (theme.gate === loader.switchTheme) theme.gate = null;
		};
	});
	const onfind = () => (find = true);
	const ondemo = (plan?: string) => {
		demoPlan = typeof plan === 'string' ? plan : null;
		demo = true;
	};
</script>

<div class="site" id="top">
	<Nav {onfind} {ondemo} />
	<main>
		<Hero {f} {onfind} />
		<How {f} />
		<Exits {f} />
		<Workspace {f} />
		<Plans {f} {ondemo} />
		<Close {ondemo} />
	</main>
	<Footer {onfind} />
	<FindWorkspace
		bind:open={find}
		find={(q) => api.lookupWorkspaces(q)}
		onuse={() => {
			find = false;
			openLink(LINKS.app);
		}}
		domain={showcase.platform.domain}
		note="One manufacturer's workspace is set up in this prototype."
	/>
	<DemoSheet bind:open={demo} plan={demoPlan} />
</div>
