<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useApp } from '../../../app.svelte';
	import Product from '../../../components/Product.svelte';
	import type { Sku } from '../../types';

	// the head of a partner's batch, offer or pickup page (SC-130, screens/trade.jsx PtHead): the pack, the name, the id
	// and where, and how it stands; the page's tabs under it
	type Props = { sku: Sku; id: string; where: string; badge?: Snippet; line?: string; children?: Snippet };
	let { sku, id, where, badge, line, children }: Props = $props();
	const app = useApp();
</script>

<div class="bhead">
	<div class="bh-id">
		<span class="bh-pic" aria-hidden="true"><Product name={sku.img} size={app.bp === 'phone' ? 46 : 72} alt="" /></span>
		<div class="bh-tt">
			<h1>{sku.name}</h1>
			<div class="bh-meta">
				<span class="mono">{id}</span><span class="sep" aria-hidden="true">·</span><span>{where}</span>
			</div>
			<div class="bh-meta">
				{@render badge?.()}{#if line}<span>{line}</span>{/if}
			</div>
		</div>
	</div>
	{@render children?.()}
</div>
