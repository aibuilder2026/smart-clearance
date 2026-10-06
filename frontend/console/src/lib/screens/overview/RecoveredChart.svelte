<script lang="ts">
	import type { DayFigures } from '@smart-clearance/api/console';
	import { fmt } from '@smart-clearance/core';

	// recovered a day: an area chart, one series, with a crosshair and a tooltip on hover (SC-48)
	let { byDay, height }: { byDay: DayFigures[]; height: number } = $props();
	let cw = $state(640);
	let hover: number | null = $state(null);
	const w = $derived(Math.max(280, Math.round(cw)));
	const pl = 46,
		pr = 8,
		pt = 10,
		pb = 24;
	const n = $derived(byDay.length);
	const top = $derived.by(() => {
		const peak = Math.max(0, ...byDay.map((d) => d.recovered));
		if (peak <= 0) return 100_000;
		const raw = peak / 4,
			mag = Math.pow(10, Math.floor(Math.log10(raw)));
		const step = mag * ([1, 2, 2.5, 5, 10].find((m) => raw / mag <= m) || 10);
		return Math.max(step * 4, step * Math.ceil(peak / step));
	});
	const X = (i: number) => pl + (n > 1 ? (i / (n - 1)) * (w - pl - pr) : (w - pl - pr) / 2);
	const Y = (v: number) => pt + (1 - v / top) * (height - pt - pb);
	const line = $derived(
		byDay.map((d, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(d.recovered).toFixed(1)}`).join(' ')
	);
	const ticks = $derived([0, 1, 2, 3, 4].map((k) => (top / 4) * k));
	const every = $derived(n <= 7 ? 1 : n <= 30 ? 7 : 14);
	const kAxis = (v: number) =>
		v >= 100_000 ? '₹' + (v / 100_000).toFixed(v % 100_000 ? 1 : 0) + 'L' : v ? '₹' + Math.round(v / 1000) + 'k' : '0';
	const best = $derived(byDay.reduce((a, d) => (d.recovered > a.recovered ? d : a), byDay[0]));
	const total = $derived(byDay.reduce((t, d) => t + d.recovered, 0));
	function move(e: MouseEvent) {
		const r = (e.currentTarget as SVGElement).getBoundingClientRect();
		const px = ((e.clientX - r.left) / r.width) * w;
		hover = Math.max(0, Math.min(n - 1, Math.round(((px - pl) / (w - pl - pr)) * (n - 1))));
	}
</script>

<div class="cs-ov-chart" bind:clientWidth={cw} role="presentation" onmouseleave={() => (hover = null)}>
	<svg
		viewBox="0 0 {w} {height}"
		{height}
		onmousemove={move}
		role="img"
		aria-label="Recovered a day, the last {n} days: {fmt.inr(total)} in all{best?.recovered
			? `, highest ${fmt.inr(best.recovered)} on ${best.label}`
			: ''}"
	>
		{#each ticks as t (t)}<line class={t ? 'gl' : 'base'} x1={pl} x2={w - pr} y1={Y(t)} y2={Y(t)} />{/each}
		{#each ticks as t (t)}<text class="ax" x={pl - 8} y={Y(t) + 4} text-anchor="end">{kAxis(t)}</text>{/each}
		{#each byDay as d, i (d.date)}{#if (i % every === 0 && i < n - Math.ceil(every / 2)) || i === n - 1}<text
					class="ax"
					x={X(i)}
					y={height - 6}
					text-anchor={i === n - 1 ? 'end' : 'middle'}>{i === n - 1 ? 'Today' : d.label}</text
				>{/if}{/each}
		<path d="{line} L{X(n - 1)} {Y(0)} L{X(0)} {Y(0)} Z" fill="var(--primary)" opacity="0.1" />
		<path
			d={line}
			fill="none"
			stroke="var(--primary)"
			stroke-width="2"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		{#if hover != null}<g
				><line x1={X(hover)} x2={X(hover)} y1={pt} y2={height - pb} stroke="var(--line-2)" /><circle
					cx={X(hover)}
					cy={Y(byDay[hover].recovered)}
					r="5"
					fill="var(--primary)"
					stroke="var(--surface)"
					stroke-width="2"
				/></g
			>{/if}
	</svg>
	{#if hover != null}
		{@const d = byDay[hover]}
		<div
			class="tip"
			style="left: {hover > n / 2
				? `calc(${(X(hover) / w) * 100}% - 184px)`
				: `calc(${(X(hover) / w) * 100}% + 12px)`}; top: 8px"
		>
			<b>{hover === n - 1 ? 'Today' : d.label}</b>
			<div class="tr"><span>Recovered</span><span>{fmt.inr(d.recovered)}</span></div>
			<div class="tr"><span>Batches closed</span><span>{d.closed}</span></div>
			<div class="tr"><span>Packs closed</span><span>{d.units.toLocaleString('en-IN')}</span></div>
			<div class="tr"><span>Agent runs</span><span>{d.runs}</span></div>
		</div>
	{/if}
</div>
