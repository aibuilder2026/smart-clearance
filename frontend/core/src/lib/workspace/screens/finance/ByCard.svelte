<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Product from '../../../components/Product.svelte';
	import Segmented from '../../../components/Segmented.svelte';
	import type { Dashboard } from '../../impact';
	import { kg } from './ledger';

	// by distributor, by product (SC-157, screens/finance.jsx ByCard): a row each, resold, donated and destroyed side by
	// side on one scale
	let { d }: { d: Dashboard } = $props();
	let by = $state<'dist' | 'sku'>('dist');
	const rows = $derived(by === 'dist' ? d.byDist : d.bySku);
	const max = $derived(Math.max(1, ...rows.map((r) => r.kept + r.destroyed)));
</script>

<Card class="stack" style="gap: 12px">
	<div class="card-head">
		<span class="card-title">By {by === 'dist' ? 'distributor' : 'product'}</span><Segmented
			size="sm"
			label="Group by"
			bind:value={by}
			options={[
				{ id: 'dist', label: 'Distributor' },
				{ id: 'sku', label: 'Product' }
			]}
		/>
	</div>
	<div class="hb">
		{#each rows as r (r.label)}
			<div class="hb-row">
				<span class="lab"
					>{#if by === 'sku'}<Product name={r.img} size={26} />{/if}<span>{r.label}</span></span
				>
				<span class="bar" aria-hidden="true"
					><i class="k" style="width: {(r.resold / max) * 100}%"></i>{#if r.donated > 0}<i
							class="n"
							style="width: {(r.donated / max) * 100}%"
						></i>{/if}{#if r.destroyed > 0}<i class="d" style="width: {(r.destroyed / max) * 100}%"></i>{/if}</span
				>
				<span class="v"
					><b>{kg(r.kept)}</b>{r.destroyed ? ` · ${kg(r.destroyed)} destroyed` : ''} · {r.batches}
					{r.batches === 1 ? 'batch' : 'batches'}</span
				>
			</div>
		{/each}
	</div>
	<ul class="fw-legend">
		<li><i class="im-sw kept" aria-hidden="true"></i>Resold</li>
		<li><i class="im-sw donated" aria-hidden="true"></i>Donated</li>
		<li><i class="im-sw gone" aria-hidden="true"></i>Destroyed</li>
	</ul>
</Card>
