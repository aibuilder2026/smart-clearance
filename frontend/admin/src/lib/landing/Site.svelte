<script lang="ts">
	import { FindWorkspace, cx, useTheme } from '@smart-clearance/core';
	import { animate } from 'motion';
	import { onMount } from 'svelte';
	import { api } from '#lib/api/client.ts';
	import type { Catalog, Showcase } from '@smart-clearance/api/site';
	import Chapters from './Chapters.svelte';
	import Close from './Close.svelte';
	import DemoPill from './DemoPill.svelte';
	import DemoSheet from './DemoSheet.svelte';
	import { figures } from './figures';
	import Footer from './Footer.svelte';
	import Hero from './Hero.svelte';
	import Ledger from './Ledger.svelte';
	import { LINKS, openLink } from './links';
	import Nav from './Nav.svelte';
	import Plans from './Plans.svelte';
	import { PLATES } from './plates';
	import Scene from './Scene.svelte';
	import Statement from './Statement.svelte';
	import Workspace from './Workspace.svelte';

	// smartclearance.com: the product's own landing page, independent of any client (design3/site, SC-60). The miniature
	// business alive on film under the heading, a statement that fills in as it is read, the agents at work on the
	// table, one in focus at a time, the product's moments as chapters, Impact's ledger, a workspace per manufacturer,
	// plans and the close. It names no client: the batch it follows is an illustrative one (SC-28).
	let { showcase, catalog }: { showcase: Showcase; catalog: Catalog } = $props();
	const f = $derived(figures(showcase, catalog));

	let find = $state(false);
	let demo = $state(false);
	let demoPlan: string | null = $state(null);
	// the bar is clear over the film, and takes its glass once the page has scrolled; the demo pill stands down at the close
	let scrolled = $state(false);
	let nearEnd = $state(false);
	// The page's loader (design3/site/loader.js, SC-35; hooks.server.ts puts it first in <body>): it runs its exits on
	// motion's animate(), finds the plates by their hashed names, covers each change of theme, and hears that the page
	// is up. Every load plays the route; every change of theme plays dusk or dawn.
	const theme = useTheme();
	const PLATE_BY_NAME: Record<string, string> = {
		'business.webp': PLATES.town.day,
		'business-night.webp': PLATES.town.night,
		'table.webp': PLATES.table.day,
		'table-night.webp': PLATES.table.night,
		'islands.webp': PLATES.islands.day,
		'islands-night.webp': PLATES.islands.night
	};
	onMount(() => {
		scrolled = window.scrollY > 40;
		const close = document.querySelector('.close');
		const io = new IntersectionObserver((es) => (nearEnd = es.some((e) => e.isIntersecting)), { threshold: 0.2 });
		if (close) io.observe(close);
		const loader = window.SC3_LOADER;
		if (loader) {
			loader.animate = animate as NonNullable<typeof loader.animate>;
			window.SC3_PLATE_URL = (name) => PLATE_BY_NAME[name];
			theme.gate = loader.switchTheme;
			loader.mark('app');
		}
		return () => {
			io.disconnect();
			if (loader && theme.gate === loader.switchTheme) theme.gate = null;
		};
	});
	const onfind = () => (find = true);
	const ondemo = (plan?: string) => {
		demoPlan = typeof plan === 'string' ? plan : null;
		demo = true;
	};
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 40)} />

<div class={cx('site', scrolled && 'scrolled')} id="top">
	<Nav {onfind} {ondemo} />
	<main>
		<Hero {ondemo} />
		<Statement
			id="how"
			text="Short-dated stock that quick commerce sent back. Priced to every exit, the bin included. Sold in the days it has left."
		/>
		<Scene {f} />
		<Chapters {f} />
		<Ledger {f} />
		<Workspace {f} />
		<Plans {f} {ondemo} />
		<Close {ondemo} />
	</main>
	<Footer {onfind} />
	<DemoPill hidden={nearEnd} />
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
