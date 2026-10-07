<script lang="ts">
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import EsBar from './EsBar.svelte';
	import ListingView from './ListingView.svelte';

	// Rakesh Traders' lot on ExpireSoon, as Agrawal ji opens it from the marketplace
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
</script>

<div class="esw">
	<Screen
		{me}
		title={`Lot ${c.listing.id}`}
		sub={`${c.sku.brand} ${c.sku.name} · ${c.dist.name}, ${c.dist.city}`}
		back="Marketplace"><div class="stack" style="gap: 16px"><EsBar /><ListingView {me} /></div></Screen
	>
</div>
