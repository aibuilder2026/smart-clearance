<script lang="ts">
	import { fmt } from '../format';

	type Props = {
		/** [week, recovered, would-be write-off] */
		weeks: [string, number, number][];
		height?: number;
	};
	let { weeks, height = 220 }: Props = $props();

	// the kit's TrendChart: recovered a week against the would-be write-off, one axis, two series, a crosshair and a
	// tooltip on hover; drawn 1:1 at the box's own width
	let measured = $state(0);
	let hover = $state<number | null>(null);
	const W = $derived(Math.max(300, measured || 640));
	const H = $derived(height);
	const pl = 52,
		pr = 12,
		pt = 12,
		pb = 26;
	const max = $derived(Math.ceil(Math.max(...weeks.map((w) => Math.max(w[1], w[2]))) / 10000) * 10000);
	const X = (i: number) => pl + (i / (weeks.length - 1)) * (W - pl - pr);
	const Y = (v: number) => pt + (1 - v / max) * (H - pt - pb);
	const line = (k: 1 | 2) =>
		weeks.map((w, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(w[k]).toFixed(1)).join(' ');
	const area = $derived(line(1) + ` L${X(weeks.length - 1)} ${Y(0)} L${X(0)} ${Y(0)} Z`);
	const ticks = $derived([0, max / 2, max]);
	function onmove(e: MouseEvent) {
		const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
		const px = ((e.clientX - r.left) / r.width) * W;
		const i = Math.round(((px - pl) / (W - pl - pr)) * (weeks.length - 1));
		hover = Math.max(0, Math.min(weeks.length - 1, i));
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (the hover only shows the tooltip; the chart is labelled) -->
<div class="chart" bind:clientWidth={measured} onmouseleave={() => (hover = null)}>
	<div class="legend" style="margin-bottom: 8px">
		<span><i style="background: var(--primary)"></i>Recovered</span><span
			><i style="background: var(--red)"></i>Would-be write-off</span
		>
	</div>
	<svg
		viewBox="0 0 {W} {H}"
		width="100%"
		height={H}
		onmousemove={onmove}
		role="img"
		aria-label="Weekly recovered against would-be write-off"
	>
		<g class="grid"
			>{#each ticks as t, i (i)}<line x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} />{/each}</g
		>
		<g class="axis"
			>{#each ticks as t, i (i)}<text x={pl - 8} y={Y(t) + 4} text-anchor="end"
					>{t ? '₹' + Math.round(t / 1000) + 'k' : '0'}</text
				>{/each}{#each weeks as w, i (i)}{#if i % (W < 460 ? 3 : 2) === 0}<text x={X(i)} y={H - 6} text-anchor="middle"
						>{w[0]}</text
					>{/if}{/each}</g
		>
		<path d={area} fill="var(--primary)" opacity="0.1" />
		<path d={line(2)} fill="none" stroke="var(--red)" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round" />
		<path
			d={line(1)}
			fill="none"
			stroke="var(--primary)"
			stroke-width="2.5"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		{#if hover != null}<g
				><line x1={X(hover)} x2={X(hover)} y1={pt} y2={H - pb} stroke="var(--line-2)" /><circle
					cx={X(hover)}
					cy={Y(weeks[hover][1])}
					r="5"
					fill="var(--primary)"
					stroke="var(--surface)"
					stroke-width="2"
				/><circle
					cx={X(hover)}
					cy={Y(weeks[hover][2])}
					r="5"
					fill="var(--red)"
					stroke="var(--surface)"
					stroke-width="2"
				/></g
			>{/if}
	</svg>
	{#if hover != null}<div
			class="tip"
			style="left: calc({(X(hover) / W) * 100}% {hover > weeks.length / 2 ? '- 170px' : '+ 12px'}); top: 40px"
		>
			<b>{weeks[hover][0]}</b>
			<div class="tr"><span>Recovered</span><span>{fmt.inr(weeks[hover][1])}</span></div>
			<div class="tr"><span>Would-be write-off</span><span>{fmt.inr(-weeks[hover][2])}</span></div>
		</div>{/if}
</div>
