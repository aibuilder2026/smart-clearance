<script lang="ts">
	import type { DayFigures } from '@smart-clearance/api/console';
	import { ease, fmt, motionMs, prefersReducedMotion, SPRINGS, springCurve } from '@smart-clearance/core';
	import { Tween } from 'svelte/motion';
	import { fly } from 'svelte/transition';

	// recovered a day: an area chart, one series, with a crosshair and a tooltip on hover (SC-48). The line draws itself
	// once (900 ms), the wash follows and today's dot lands; a reading moves the line (420 ms), and when today gains,
	// what it gained shows beside its dot for a moment (SC-49)
	let { byDay, height }: { byDay: DayFigures[]; height: number } = $props();
	const reduce = prefersReducedMotion.current;
	const dot = springCurve(SPRINGS.dot);
	const values = $derived(byDay.map((d) => d.recovered));
	// svelte-ignore state_referenced_locally (the tween starts from the first reading, then follows each new one)
	const shown = new Tween(values, { duration: reduce ? 0 : 420, easing: ease });
	$effect(() => {
		void shown.set(values, shown.target.length === values.length ? undefined : { duration: 0 });
	});
	const v = $derived(shown.current.length === values.length ? shown.current : values);
	// what today gained since the last reading
	let gain = $state<{ v: number; at: number } | null>(null);
	let was: number | null = null;
	$effect(() => {
		const now = values[values.length - 1] ?? 0,
			before = was;
		was = now;
		if (before == null || now <= before) return;
		gain = { v: now - before, at: Date.now() };
		const t = setTimeout(() => (gain = null), 2600);
		return () => clearTimeout(t);
	});
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
	const line = $derived(v.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x).toFixed(1)}`).join(' '));
	const tx = $derived(X(n - 1)),
		ty = $derived(Y(v[n - 1] ?? 0));
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

<div
	class="cs-ov-chart"
	class:still={reduce}
	bind:clientWidth={cw}
	role="presentation"
	onmouseleave={() => (hover = null)}
	style:--dot-ease={dot.linear}
	style:--dot-ms="{dot.duration}ms"
>
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
		{#key n}<path class="wash" d="{line} L{X(n - 1)} {Y(0)} L{X(0)} {Y(0)} Z" fill="var(--primary)" /><path
				class="ln"
				d={line}
				pathLength="1"
				fill="none"
				stroke="var(--primary)"
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
			/><g transform="translate({tx} {ty})"
				><g class="today"
					>{#if gain && !reduce}{#key gain.at}<circle
								class="ring"
								r="5"
								fill="none"
								stroke="var(--primary)"
								stroke-width="2"
							/>{/key}{/if}<circle r="4.5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" /></g
				></g
			>{/key}
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
	{#if gain}{#key gain.at}<span
				class="cs-ov-gain"
				style:left="{(tx / w) * 100}%"
				style:top="{ty - 36}px"
				in:fly={{ y: 8, duration: motionMs(240), easing: ease }}
				out:fly={{ y: -6, duration: motionMs(240), easing: ease }}>+{fmt.inr(gain.v)}</span
			>{/key}{/if}
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

<style>
	.wash {
		opacity: 0.1;
		animation: fade 420ms 700ms backwards;
	}
	.ln {
		stroke-dasharray: 1;
		animation: draw 900ms cubic-bezier(0.45, 0, 0.25, 1) backwards;
	}
	.today {
		transform-box: fill-box;
		transform-origin: center;
		animation: pop var(--dot-ms) var(--dot-ease) 900ms backwards;
	}
	.ring {
		transform-box: fill-box;
		transform-origin: center;
		animation: ring 1.2s ease-out forwards;
	}
	.cs-ov-gain {
		translate: -100% 0;
	}
	.still .wash,
	.still .ln,
	.still .today {
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
	@keyframes pop {
		from {
			transform: scale(0);
			opacity: 0;
		}
	}
	@keyframes ring {
		from {
			transform: scale(1);
			opacity: 0.7;
		}
		to {
			transform: scale(3);
			opacity: 0;
		}
	}
</style>
