<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { PtPickup } from '../../types';
	import { when } from './pt';

	// what a food bank has collected for the client (SC-130): the meals they made, then each pickup by when it was
	// collected, each opening its page
	let { past, onopen }: { past: PtPickup[]; onopen: (p: PtPickup) => void } = $props();
	const ws = useWorkspace();
	const meals = $derived(past.reduce((t, p) => t + p.meals, 0));
	const packs = $derived(past.reduce((t, p) => t + p.units, 0));
	const kg = $derived(Math.round(past.reduce((t, p) => t + p.kg, 0) * 100) / 100);
</script>

{#if past.length}<Card class="stack" style="gap: 8px"
		><div class="lg-fig">
			<span class="num l">{fmt.num(meals)}</span><span class="lg-what"
				>meals from {ws.data.workspace.short}'s surplus since July</span
			>
		</div>
		<p class="lg-working">
			{past.length}
			{past.length === 1 ? 'pickup' : 'pickups'}, {fmt.num(packs)} packs, {fmt.kg(kg)} kept out of landfill, each with its
			receipt and the FSSAI checklist.
		</p></Card
	>
	<List head="Collected"
		>{#each past as p (p.ref)}<ListRow
				chevron
				onclick={() => onopen(p)}
				title={`${fmt.num(p.units)} packs of ${p.sku.name.replace(/ \d.*$/, '')}`}
				sub={`Collected ${when(p.collected)} · ${p.from}`}
				>{#snippet leading()}<Product name={p.sku.img} size={44} />{/snippet}{#snippet value()}<span class="lg-val"
						><b class="mono">{p.receipt.no}</b><em>{fmt.num(p.meals)} meals</em></span
					>{/snippet}</ListRow
			>{/each}</List
	>{/if}
