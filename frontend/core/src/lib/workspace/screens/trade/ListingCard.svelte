<script lang="ts" module>
	import type { MarketLot } from '../../types';

	/** a lot on ExpireSoon */
	export type EsListing = MarketLot;
</script>

<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Product from '../../../components/Product.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import EsDate from './EsDate.svelte';

	// a lot in the marketplace's grid: its picture, price against MRP, dates, units and seller
	type Props = { l: Omit<EsListing, 'id'>; onopen?: () => void; hero?: boolean };
	let { l, onopen, hero }: Props = $props();
</script>

<button type="button" class="es-card" onclick={onopen}>
	<div class="es-thumb">
		{#if hero}<Product name="pack-chips" size={92} />{:else}<Icon
				name={l.icon ?? 'package'}
				size={38}
				stroke={1.5}
			/>{/if}
	</div>
	<div class="stack tight" style="gap: 4px; padding: 12px 14px 14px">
		<b class="t-subhead" style="line-height: 1.25">{l.name}</b>
		<span class="row base" style="gap: 6px"
			><span class="es-price">₹{l.price}</span><span class="t-caption subtle"
				>MRP ₹{l.mrp} · {Math.round((1 - l.price / l.mrp) * 100)}% off</span
			></span
		>
		<span class="row tight wrap"
			><EsDate days={l.days} />{#if hero}<Badge size="sm" tone="violet" icon="badge-check">label verified</Badge
				>{/if}</span
		>
		<span class="t-caption subtle">{fmt.num(l.units)} units · {l.seller}</span>
	</div>
</button>
