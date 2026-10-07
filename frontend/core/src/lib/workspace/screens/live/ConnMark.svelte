<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { prefersReducedMotion } from '../../../motion';
	import type { Connection } from '../../types';

	// the connection, as one small mark (screens/live.jsx ConnMark): a still green dot when live, a turning loader while it
	// catches up or reconnects (a loading indicator, so it may turn until the stream is back), the wifi-off glyph when
	// offline. Never red or amber. Back to live, the dot pings twice and rests
	let { conn, size = 8 }: { conn: Connection; size?: number } = $props();
	let ping = $state(0);
	let was: Connection | null = null;
	$effect(() => {
		const c = conn;
		if (was && was !== c && c === 'live' && !prefersReducedMotion.current) ping += 1;
		was = c;
	});
	const pulse = (el: HTMLElement) => {
		const a = el.animate(
			[
				{ transform: 'scale(1)', opacity: 0.7 },
				{ transform: 'scale(2.8)', opacity: 0 }
			],
			{ duration: 900, iterations: 2, easing: 'ease-out', fill: 'forwards' }
		);
		return () => a.cancel();
	};
</script>

{#if conn === 'reconnecting' || conn === 'connecting'}<span class="lv-conn lv-conn-spin" aria-hidden="true"
		><Icon name="loader" size={size + 6} stroke={2.4} /></span
	>{:else if conn === 'offline'}<span class="lv-conn" aria-hidden="true"
		><Icon name="wifi-off" size={size + 6} stroke={2.2} /></span
	>{:else}<span class="lv-conn" aria-hidden="true"
		><i class="lv-dot" style="width: {size}px; height: {size}px"></i>{#if ping}{#key ping}<i
					class="lv-ping"
					style="width: {size}px; height: {size}px"
					{@attach pulse}
				></i>{/key}{/if}</span
	>{/if}
