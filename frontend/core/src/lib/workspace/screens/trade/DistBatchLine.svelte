<script lang="ts">
	import type { Snippet } from 'svelte';
	import Product from '../../../components/Product.svelte';
	import type { Sku } from '../../types';

	// a batch as one line: its pack, its name and id, and where it stands (SC-133, screens/trade.jsx BatchLine)
	type Props = { sku: Sku; id: string; badge?: Snippet; sub?: string; size?: number };
	let { sku, id, badge, sub, size = 48 }: Props = $props();
</script>

<div class="row dist-bl" style="gap: 12px">
	<Product name={sku.img} {size} alt="" />
	<div class="grow stack tight" style="gap: 2px; min-width: 0">
		<span class="row tight wrap" style="gap: 8px"><b class="t-headline">{sku.name}</b>{@render badge?.()}</span>
		<span class="t-footnote subtle"><span class="mono">{id}</span>{sub ? ` · ${sub}` : ''}</span>
	</div>
</div>
