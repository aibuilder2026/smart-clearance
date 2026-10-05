<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { children: Snippet; right?: Snippet; sub?: string | null };
	let { children, right, sub }: Props = $props();
</script>

<!-- a section's title, a line under it, and an action at its right (screens/common.jsx SectionTitle) -->
<div class="row between wrap" style="gap: 8px; margin-top: 6px">
	<div>
		<div class="t-title3">{@render children()}</div>
		{#if sub}<div class="t-footnote subtle" style="margin-top: 2px">{sub}</div>{/if}
	</div>
	{@render right?.()}
</div>
