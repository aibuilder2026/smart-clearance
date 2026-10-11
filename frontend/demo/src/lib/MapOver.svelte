<script lang="ts">
	import { IconButton, motionMs } from '@smart-clearance/core';
	import { onMount } from 'svelte';
	import RouteMap from './RouteMap.svelte';
	import { lineName } from './map.ts';
	import type { Player } from './player.svelte.ts';
	import type { Line } from './types.ts';

	// the map over the stage (director.jsx MapOver): between lines, the token hopping to the next one under "Next line";
	// on Map, the route to jump anywhere. A dialog: it takes focus, Escape closes it, and focus goes back where it was
	type Props = { p: Player; outs: Record<Line, string>; hop?: boolean; onclose: () => void };
	let { p, outs, hop, onclose }: Props = $props();
	let el: HTMLElement | undefined = $state();
	onMount(() => {
		const prev = document.activeElement as HTMLElement | null;
		el?.querySelector('button')?.focus();
		const f = (e: KeyboardEvent) => e.key === 'Escape' && onclose();
		window.addEventListener('keydown', f);
		return () => {
			window.removeEventListener('keydown', f);
			prev?.focus?.();
		};
	});
	const fadeIn = (_n: Element) => ({ duration: motionMs(240), css: (t: number) => `opacity: ${t}` });
</script>

<div bind:this={el} class="rb-over" role="dialog" aria-modal="true" aria-label="The route map" transition:fadeIn>
	<div class="rb-over-in">
		<div class="rb-over-head">
			<div class="rb-over-copy">
				{#if hop}<span class="rb-eyebrow">Next line</span>{/if}
				<h2 class="rb-over-title">
					{#if hop}{lineName(p.act)}<span> · {p.act.place}</span>{:else}The route{/if}
				</h2>
			</div>
			<IconButton icon="x" label="Close the map" onclick={onclose} />
		</div>
		<div class="rb-over-map">
			<RouteMap
				acts={p.acts}
				{outs}
				active={p.act.id}
				pos={p.pos}
				onpick={(a, s) => {
					p.go(a, s, 0);
					onclose();
				}}
			/>
		</div>
	</div>
</div>
