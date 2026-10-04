<script lang="ts">
	import type { Snippet } from 'svelte';

	let { id, title, intro, children }: { id: string; title: string; intro?: string; children?: Snippet } = $props();
</script>

<section class="ds-sec" {id}>
	<header>
		<h2>{title}</h2>
		{#if intro}<p>{intro}</p>{/if}
	</header>
	{@render children?.()}
</section>
