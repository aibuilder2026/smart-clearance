<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useApp } from '../app.svelte';

	type Props = { main: Snippet; side: Snippet; sideWidth?: number; gap?: number };
	let { main, side, sideWidth = 360, gap = 20 }: Props = $props();

	// two columns on desktops, the side one kept in view under the bar; one column on phones and tablets
	// (screens/common.jsx Columns)
	const app = useApp();
</script>

{#if app.bp !== 'desktop'}
	<div class="stack" style="gap: {gap}px">{@render main()}{@render side()}</div>
{:else}
	<div style="display: grid; grid-template-columns: minmax(0, 1fr) {sideWidth}px; gap: {gap}px; align-items: start">
		<div class="stack" style="gap: {gap}px">{@render main()}</div>
		<div class="stack" style="gap: {gap}px; position: sticky; top: 72px">{@render side()}</div>
	</div>
{/if}
