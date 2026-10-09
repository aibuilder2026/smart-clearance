<script lang="ts">
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import type { DistNow } from '../../dist';
	import { useWorkspace } from '../../source';
	import { when } from './pt';

	// the shops on a batch's van round, in the order they ordered (SC-133, screens/trade.jsx Stops)
	let { n }: { n: DistNow } = $props();
	const ws = useWorkspace();
	const stops = $derived(n.shops.slice().sort((a, z) => ((a.at ?? '') < (z.at ?? '') ? -1 : 1)));
	const shop = (id: string) =>
		ws.case?.kiranas.find((k) => k.id === id) ?? ws.data.shops?.find((k) => k.id === id) ?? { name: id, area: '' };
</script>

{#if stops.length}<div class="stack snug">
		<SectionTitle sub="In the order they were placed">Stops</SectionTitle>
		<div class="list">
			{#each stops as o, i (o.kirana)}{@const k = shop(o.kirana)}
				<div class="list-row" style="grid-template-columns: 28px minmax(0,1fr) auto">
					<span class="center t-caption strong dist-stop">{i + 1}</span><span class="stack tight" style="gap: 0"
						><b class="t-subhead">{k.name}</b><span class="t-caption subtle"
							>{k.area}{o.at ? ` · ordered ${when(o.at)}` : ''}</span
						></span
					><span class="tnum strong t-subhead">{o.units}</span>
				</div>{/each}
		</div>
	</div>{/if}
