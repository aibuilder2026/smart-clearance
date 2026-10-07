<script lang="ts">
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import EsBar from './EsBar.svelte';
	import ListingView from './ListingView.svelte';

	// Rakesh Traders' lot on ExpireSoon, as Agrawal ji opens it from the marketplace
	let { me }: { me: User } = $props();
</script>

<div class="esw">
	<Screen {me} title="Lot ES-24117" sub="Munchly Masala Chips 150 g · Rakesh Traders, Nagpur" back="Marketplace"
		><div class="stack" style="gap: 16px"><EsBar /><ListingView {me} /></div></Screen
	>
</div>
