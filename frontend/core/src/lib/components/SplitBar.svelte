<script lang="ts">
	import { onMount } from 'svelte';
	import { fmt } from '../format';
	import { motionMs } from '../motion';
	import type { Plan } from '../workspace/types';

	// the recommended split as one bar of the at-risk units, each channel growing to its share in channel order
	// (the kit's SplitBar)
	type Props = { plan: Plan };
	let { plan }: Props = $props();

	let grown = $state(false);
	onMount(() => {
		const raf = requestAnimationFrame(() => (grown = true));
		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="stack snug">
	<div style="display: flex; height: 44px; border-radius: 14px; overflow: hidden; gap: 3px; background: var(--surface)">
		{#each plan.lines as l (l.id)}<div
				style="flex-basis: 0; flex-grow: {grown ? l.units : 0.001}; transition: flex-grow {motionMs(
					900
				)}ms var(--ease); background: var(--ch-{l.id}); color: #fff; display: flex; align-items: center; padding: 0 12px; font-weight: 650; font-size: 13.5px; white-space: nowrap; overflow: hidden"
			>
				{fmt.num(l.units)} · {l.short}
			</div>{/each}
	</div>
	<div class="row between t-caption subtle">
		<span>0</span><span class="tnum">{fmt.num(plan.units)} units at risk</span>
	</div>
</div>
