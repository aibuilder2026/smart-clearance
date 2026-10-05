<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, style, children }: { label?: string; style?: string; children?: Snippet } = $props();
</script>

<div class="ds-specimen" {style}>
	{#if label}<span class="lbl">{label}</span>{/if}{@render children?.()}
</div>
