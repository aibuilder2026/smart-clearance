<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		checked = $bindable(false),
		onchange,
		children
	}: { checked?: boolean; onchange?: (v: boolean) => void; children?: Snippet } = $props();
</script>

<label class="check"
	><input type="checkbox" bind:checked onchange={() => onchange?.(checked)} /><span>{@render children?.()}</span></label
>
