<script lang="ts">
	import type { Snippet } from 'svelte';
	import { LINKS, linkProps } from './links';
	import { DEMO_FILM } from './media';

	// the way into the demo film (SC-164): a button that opens its theatre, or, until the film's id is set, the guided
	// demo's link, as every Watch was before
	let {
		onwatch,
		class: className,
		label,
		children
	}: { onwatch: () => void; class?: string; label?: string; children: Snippet } = $props();
</script>

{#if DEMO_FILM.youtube}
	<button type="button" class={className} aria-label={label} aria-haspopup="dialog" onclick={() => onwatch()}
		>{@render children()}</button
	>
{:else}
	<a class={className} aria-label={label} {...linkProps(LINKS.demo)}>{@render children()}</a>
{/if}
