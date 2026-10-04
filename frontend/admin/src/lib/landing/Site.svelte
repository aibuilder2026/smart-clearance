<script lang="ts">
	import { FindWorkspace } from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import type { Catalog, Showcase } from '#lib/api/types.ts';
	import Close from './Close.svelte';
	import DemoSheet from './DemoSheet.svelte';
	import Exits from './Exits.svelte';
	import { figures } from './figures';
	import Footer from './Footer.svelte';
	import Hero from './Hero.svelte';
	import { LINKS, openLink } from './links';
	import Nav from './Nav.svelte';
	import Plans from './Plans.svelte';
	import Stops from './Stops.svelte';
	import Story from './Story.svelte';
	import Workspace from './Workspace.svelte';

	// smartclearance.com: the product's own landing page, independent of any client. One carton the size of a godown,
	// parked in a miniature Indian town, and the page follows where its packs go (design3/site, SC-25).
	let { showcase, catalog }: { showcase: Showcase; catalog: Catalog } = $props();
	const f = $derived(figures(showcase, catalog));

	let find = $state(false);
	let demo = $state(false);
	let demoPlan: string | null = $state(null);
	const onfind = () => (find = true);
	const ondemo = (plan?: string) => {
		demoPlan = typeof plan === 'string' ? plan : null;
		demo = true;
	};
</script>

<div class="site" id="top">
	<Nav {onfind} {ondemo} />
	<main>
		<Hero batchId={f.batchId} net={f.actual.net} {onfind} />
		<Exits {f} />
		<Stops {f} />
		<Story s={showcase} {f} />
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
		note="Only {showcase.workspace.name} is set up in this prototype."
	/>
	<DemoSheet bind:open={demo} plan={demoPlan} />
</div>
