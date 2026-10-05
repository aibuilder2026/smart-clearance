<script lang="ts">
	import { Money, cx, fmt, prefersReducedMotion } from '@smart-clearance/core';

	let { id, net }: { id: string; net: number } = $props();

	// the batch walks its stops once, about two and a half seconds, and holds on the result (WCAG 2.2.2)
	let k = $state(prefersReducedMotion.current ? 8 : 0);
	$effect(() => {
		if (prefersReducedMotion.current) {
			k = 8;
			return;
		}
		if (k >= 8) return;
		const t = setTimeout(() => (k += 1), k === 0 ? 500 : 260);
		return () => clearTimeout(t);
	});
</script>

<div class="hero-card" role="group" aria-label="Batch {id}: eight of nine stops done, {fmt.inr(net)} recovered">
	<span class="hc-id mono">{id}</span>
	<span class="hc-dots" aria-hidden="true"
		>{#each { length: 9 } as _, i (i)}<i class={cx(i < k && 'on')}></i>{/each}</span
	>
	<Money
		value={k >= 8 ? net : Math.round((net * k) / 8)}
		roll={!prefersReducedMotion.current}
		from={0}
		class="hc-money"
	/>
	<span class="hc-cap">recovered</span>
</div>
