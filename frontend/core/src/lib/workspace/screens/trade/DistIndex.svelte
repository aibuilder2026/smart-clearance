<script lang="ts">
	import Product from '../../../components/Product.svelte';
	import { prefersReducedMotion } from '../../../motion';
	import type { DistJourney } from '../../dist';
	import { productName } from '../../model';
	import DistStopBadge from './DistStopBadge.svelte';

	// more than one batch in a journey: each by its pack and what it asks, a tap away (SC-133, screens/trade.jsx
	// BatchIndex)
	let { js }: { js: DistJourney[] } = $props();
	const jump = (ref: string) => {
		const el = document.getElementById(`batch-${ref}`);
		if (!el) return;
		el.scrollIntoView({ behavior: prefersReducedMotion.current ? 'auto' : 'smooth', block: 'start' });
		el.focus({ preventScroll: true });
	};
</script>

<nav class="dist-index" aria-label="Your batches in a journey">
	{#each js as j (j.ref)}<button type="button" onclick={() => jump(j.ref)}
			><Product name={j.sku.img} size={32} alt="" /><span class="grow stack tight" style="gap: 0; min-width: 0"
				><b>{productName(j.sku)}</b><span class="mono">{j.ref}</span></span
			><DistStopBadge {j} /></button
		>{/each}
</nav>
