<script lang="ts">
	import { ease, prefersReducedMotion } from '@smart-clearance/core';
	import { Tween } from 'svelte/motion';

	// a sparkline: one series, a 10% wash under a 2 px line (SC-48). The line draws itself once (700 ms) and the wash
	// follows; a reading moves both (420 ms), and a new range draws afresh (SC-49)
	let { values, tone }: { values: number[]; tone?: 'amber' } = $props();
	const reduce = prefersReducedMotion.current;
	let cw = $state(220);
	const W = $derived(Math.max(120, Math.round(cw)));
	const H = 36;
	// svelte-ignore state_referenced_locally (the tween starts from the first series, then follows each new one)
	const shown = new Tween(values, { duration: reduce ? 0 : 420, easing: ease });
	$effect(() => {
		void shown.set(values, shown.target.length === values.length ? undefined : { duration: 0 });
	});
	const line = $derived.by(() => {
		const v = shown.current.length === values.length ? shown.current : values;
		const max = Math.max(1, ...v),
			n = v.length;
		const X = (i: number) => (n > 1 ? (i / (n - 1)) * W : W / 2),
			Y = (x: number) => H - 3 - (x / max) * (H - 8);
		return v.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x).toFixed(1)}`).join(' ');
	});
	const col = $derived(tone === 'amber' ? 'var(--amber)' : 'var(--primary)');
</script>

<div class="cs-ov-sparkbox" bind:clientWidth={cw}>
	<svg class="cs-ov-spark" class:still={reduce} viewBox="0 0 {W} {H}" aria-hidden="true"
		>{#key values.length}<path class="wash" d="{line} L{W} {H} L0 {H} Z" fill={col} /><path
				class="ln"
				d={line}
				pathLength="1"
				fill="none"
				stroke={col}
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>{/key}</svg
	>
</div>

<style>
	.wash {
		opacity: 0.1;
		animation: fade 420ms 450ms backwards;
	}
	.ln {
		stroke-dasharray: 1;
		animation: draw 700ms cubic-bezier(0.22, 1, 0.36, 1) 150ms backwards;
	}
	.still .wash,
	.still .ln {
		animation: none;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	@keyframes draw {
		from {
			stroke-dashoffset: 1;
		}
	}
</style>
