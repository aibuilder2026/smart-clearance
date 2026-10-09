<script lang="ts">
	import Sheet from '../../../components/Sheet.svelte';
	import type { BatchView } from '../../types';
	import BatchFacts from './BatchFacts.svelte';

	// a batch the Watcher sees, in a sheet (the Batches screen's, for finance and sustainability): its facts and what
	// happens to it next (screens/brand.jsx BatchSheet). The operator opens a batch's page instead (SC-112)
	let { view: sel, onclose }: { view: BatchView | undefined; onclose: () => void } = $props();
</script>

<Sheet bind:open={() => !!sel, (o) => !o && onclose()} title={sel ? sel.skuObj.name : ''}>
	{#if sel}<BatchFacts view={sel} />{/if}
</Sheet>
