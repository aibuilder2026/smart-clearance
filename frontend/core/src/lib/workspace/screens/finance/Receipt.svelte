<script lang="ts">
	import { fmt } from '../../model';
	import type { Batch, Distributor, Doc, Sku } from '../../types';

	// the food bank's receipt for the packs it collected (SC-110, screens/finance.jsx Receipt), in its own form: Feeding
	// India's in-app receipt, India FoodBanking Network's acknowledgement, which adds the value at the donor's cost for its
	// CSR records. The same paper in the batch's pack and on the food bank's pickup
	let { doc: r, batch, sku, dist }: { doc: Doc; batch: Batch; sku: Sku; dist: Distributor } = $props();
</script>

{#snippet line(key: string, v: string, sub?: string)}<div class="pp-line">
		<span
			>{key}{#if sub}<em>{` ${sub}`}</em>{/if}</span
		><span>{v}</span>
	</div>{/snippet}

<div class="paper pp">
	<div class="pp-head">
		<div>
			<div class="pp-title">{r.type}</div>
			<div class="pp-no">
				{r.no} · {r.paper === 'In-app receipt' ? 'in-app' : 'acknowledgement'} · {fmt.date(r.date!)}
			</div>
		</div>
		<span class="pp-stamp ok">{r.stamp}</span>
	</div>
	<div class="pp-parties">
		<div>
			<em>Donor</em><b>{r.donor}</b><span>through {r.via}, {r.from}</span><span class="pp-mono">FSSAI {r.fssai}</span>
		</div>
		<div>
			<em>Received by</em><b>{r.owner}</b><span>{dist.city}</span><span class="pp-mono">{r.paper}</span>
		</div>
	</div>
	<table class="pp-table">
		<thead><tr><th>Goods</th><th>Packs</th><th>Weight</th></tr></thead>
		<tbody
			><tr
				><td
					>{sku.brand}
					{sku.name}<br /><em>Batch {batch.id} · best before {fmt.date(batch.bestBefore)}</em></td
				><td>{fmt.num(r.units!)}</td><td>{fmt.kg(r.kg!)}</td></tr
			></tbody
		>
	</table>
	{@render line('Collected', `${fmt.day(r.date!)}, ${r.at}`, `by ${r.by}`)}
	{@render line('Served at', r.spot ?? '')}
	{@render line('Meals', fmt.num(r.meals!), r.mealsRule)}
	{#if r.value != null}<div class="pp-sub">For the donor's CSR records</div>
		{@render line("Value at the donor's cost", fmt.inr2(r.value), `${fmt.num(r.units!)} × ₹${sku.cost}, indicative`)}
		{@render line('CSR activity', r.csr ?? '')}{/if}
	<p class="pp-note">{r.note}</p>
</div>
