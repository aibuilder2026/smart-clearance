<script lang="ts">
	import { CH_ORDER, chColor } from '../channels';

	type Props = {
		/** [channel id, units] */
		mix: [string, number][];
		/** a channel's name by its id; the id otherwise */
		names?: Record<string, string>;
	};
	let { mix, names }: Props = $props();

	// the kit's MixBar: where the units went, one 100% bar with direct labels and a 2px surface gap between segments
	const total = $derived(mix.reduce((t, m) => t + m[1], 0));
	const segments = $derived.by(() => {
		let acc = 0;
		return CH_ORDER.map((id) => mix.find((m) => m[0] === id))
			.filter((m): m is [string, number] => m !== undefined)
			.map(([id, v]) => {
				const w = (v / total) * 600;
				const x = acc;
				acc += w;
				return { id, x, w, name: (names && names[id]) || id, pct: Math.round((v / total) * 100) };
			});
	});
</script>

<div class="chart stack snug">
	<svg viewBox="0 0 600 28" width="100%" height="28" preserveAspectRatio="none" role="img" aria-label="Channel mix"
		>{#each segments as s (s.id)}<rect
				x={s.x + 1}
				y="0"
				width={Math.max(0, s.w - 2)}
				height="28"
				rx="5"
				fill={chColor(s.id)}><title>{s.name}: {s.pct}%</title></rect
			>{/each}</svg
	>
	<div class="legend">
		{#each segments as s (s.id)}<span
				><i style="background: {chColor(s.id)}"></i>{s.name} <b class="tnum" style="color: var(--fg)">{s.pct}%</b></span
			>{/each}
	</div>
</div>
