<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from '@smart-clearance/core';

	// the route along the top of what is loading (SC-49), as the landing page's loader draws it: it eases most of the
	// way and waits there (1.2 s), then, once the read is in, completes (160 ms), lands its amber pin (420 ms) and fades
	let { done }: { done: boolean } = $props();
	const reduce = prefersReducedMotion.current;
	let started = $state(false);
	let gone = $state(false);
	onMount(() => {
		const f = requestAnimationFrame(() => (started = true));
		return () => cancelAnimationFrame(f);
	});
	$effect(() => {
		if (!done) return;
		const t = setTimeout(() => (gone = true), reduce ? 0 : 760);
		return () => clearTimeout(t);
	});
	const width = $derived(done ? 100 : started || reduce ? 88 : 0);
</script>

{#if !gone}<div class="cs-route" class:done class:reduce aria-hidden="true">
		<i class="line" style:width="{width}%"><b class="pin" class:landed={done}></b></i>
	</div>{/if}

<style>
	.cs-route {
		transition: opacity 240ms;
	}
	.cs-route.done:not(.reduce) {
		opacity: 0;
		transition-delay: 500ms;
	}
	.line {
		transition: width 1.2s cubic-bezier(0.3, 0.7, 0.4, 1);
	}
	.done .line {
		transition: width 160ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.reduce .line {
		transition: none;
	}
	.pin {
		transform: scale(0.6);
	}
	.pin.landed {
		transform: scale(1);
		animation: land 420ms cubic-bezier(0.22, 1, 0.36, 1) 120ms backwards;
	}
	.reduce .pin.landed {
		animation: none;
	}
	@keyframes land {
		0% {
			transform: scale(0);
		}
		60% {
			transform: scale(1.35);
		}
	}
</style>
