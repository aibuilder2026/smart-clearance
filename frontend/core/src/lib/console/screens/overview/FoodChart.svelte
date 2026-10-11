<script lang="ts">
	import type { DayFigures } from '@smart-clearance/api/console';
	import { ease, fmt, motionMs, prefersReducedMotion } from '../../../index';
	import { Tween } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	import { kg, kgAxis, savedShare } from '../../overview';

	// the food a day (SC-149): the kilos closed batches kept out of landfill (sold or given) rise from one baseline, and
	// the kilos they destroyed (no channel took them) hang under it, hatched in clay, on one scale; the space under the
	// baseline is at least one step deep, so a day with little destroyed still reads. The bars grow once (420 ms, a few
	// ms apart); a reading moves them (420 ms), and when today keeps more, what it kept shows over its bar for a moment
	let { byDay, height }: { byDay: DayFigures[]; height: number } = $props();
	const reduce = prefersReducedMotion.current;
	const values = $derived(byDay.flatMap((d) => [d.keptKg, d.destroyedKg]));
	// svelte-ignore state_referenced_locally (the tween starts from the first reading, then follows each new one)
	const shown = new Tween(values, { duration: reduce ? 0 : 420, easing: ease });
	$effect(() => {
		void shown.set(values, shown.target.length === values.length ? undefined : { duration: 0 });
	});
	const v = $derived(shown.current.length === values.length ? shown.current : values);
	// what today kept since the last reading
	let gain = $state<{ v: number; at: number } | null>(null);
	let was: number | null = null;
	$effect(() => {
		const now = byDay[byDay.length - 1]?.keptKg ?? 0,
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
	const pl = 50,
		pr = 8,
		pt = 10,
		pb = 24;
	const n = $derived(byDay.length);
	const nice = (x: number) => {
		const mag = Math.pow(10, Math.floor(Math.log10(x)));
		return mag * ([1, 2, 2.5, 5, 10].find((m) => x / mag <= m) || 10);
	};
	const scale = $derived.by(() => {
		const up = Math.max(0, ...byDay.map((d) => d.keptKg)),
			down = Math.max(0, ...byDay.map((d) => d.destroyedKg));
		const step = up || down ? nice(Math.max(up, down * 2) / 4) : 250;
		return {
			step,
			top: Math.max(step * 2, step * Math.ceil(up / step)),
			bottom: Math.max(step, step * Math.ceil(down / step))
		};
	});
	const Y = (x: number) => pt + ((scale.top - x) / (scale.top + scale.bottom)) * (height - pt - pb);
	const y0 = $derived(Y(0));
	const slot = $derived((w - pl - pr) / n);
	const bw = $derived(Math.max(2, Math.min(16, slot - 2)));
	const X = (i: number) => pl + slot * (i + 0.5);
	const ticks = $derived.by(() => {
		const out: number[] = [];
		for (let t = -scale.bottom; t <= scale.top + scale.step / 2; t += scale.step) out.push(Math.round(t * 100) / 100);
		return out;
	});
	const every = $derived(n <= 7 ? 1 : n <= 30 ? 7 : 14);
	// a bar from the baseline, its far end rounded (3 px, less on a thin bar)
	function bar(x: number, y1: number, from: number) {
		const h = Math.abs(y1 - from),
			r = Math.min(3, bw / 2, h),
			k = y1 < from ? 1 : -1;
		if (h < 0.5) return `M${x} ${from} h${bw} h${-bw} Z`;
		return `M${x} ${from} V${y1 + k * r} Q${x} ${y1} ${x + r} ${y1} H${x + bw - r} Q${x + bw} ${y1} ${x + bw} ${y1 + k * r} V${from} Z`;
	}
	const kept = $derived(byDay.reduce((t, d) => t + d.keptKg, 0));
	const gone = $derived(byDay.reduce((t, d) => t + d.destroyedKg, 0));
	const share = $derived(savedShare(kept, gone));
	function move(e: MouseEvent) {
		const r = (e.currentTarget as SVGElement).getBoundingClientRect();
		const px = ((e.clientX - r.left) / r.width) * w;
		hover = Math.max(0, Math.min(n - 1, Math.floor((px - pl) / slot)));
	}
	const lag = (i: number) => Math.min(6 * i, 300);
</script>

<div
	class="cs-ov-chart cs-ov-food"
	class:still={reduce}
	bind:clientWidth={cw}
	role="presentation"
	onmouseleave={() => (hover = null)}
>
	<svg
		viewBox="0 0 {w} {height}"
		{height}
		onmousemove={move}
		role="img"
		aria-label="Food a day, the last {n} days: {kg(kept)} kept out of landfill and {kg(gone)} destroyed{share == null
			? ''
			: `, ${share}% saved`}"
	>
		<defs
			><pattern id="cs-ov-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"
				><rect width="5" height="5" class="hatch-bg" /><line x1="0" y1="0" x2="0" y2="5" class="hatch-ln" /></pattern
			></defs
		>
		{#each ticks as t (t)}<line class={t ? 'gl' : 'base'} x1={pl} x2={w - pr} y1={Y(t)} y2={Y(t)} />{/each}
		{#each ticks as t (t)}<text class="ax" x={pl - 8} y={Y(t) + 4} text-anchor="end"
				>{t < 0 ? '−' + kgAxis(-t) : kgAxis(t)}</text
			>{/each}
		{#each byDay as d, i (d.date)}{#if (i % every === 0 && i < n - Math.ceil(every / 2)) || i === n - 1}<text
					class="ax"
					x={X(i)}
					y={height - 6}
					text-anchor={i === n - 1 ? 'end' : 'middle'}>{i === n - 1 ? 'Today' : d.label}</text
				>{/if}{/each}
		{#if hover != null}<rect class="col" x={X(hover) - slot / 2} y={pt} width={slot} height={height - pt - pb} />{/if}
		{#key n}{#each byDay as d, i (d.date)}<path
					class="kept"
					style:animation-delay="{lag(i)}ms"
					d={bar(X(i) - bw / 2, Y(v[i * 2] ?? 0), y0)}
				/>{#if d.destroyedKg > 0}<path
						class="gone"
						style:animation-delay="{lag(i) + 120}ms"
						d={bar(X(i) - bw / 2, Y(-(v[i * 2 + 1] ?? 0)) + 1, y0 + 1)}
					/>{/if}{/each}{/key}
	</svg>
	{#if gain}{#key gain.at}<span
				class="cs-ov-gain"
				style:left="{(X(n - 1) / w) * 100}%"
				style:top="{Y(byDay[n - 1]?.keptKg ?? 0) - 36}px"
				in:fly={{ y: 8, duration: motionMs(240), easing: ease }}
				out:fly={{ y: -6, duration: motionMs(240), easing: ease }}>+{kg(gain.v)}</span
			>{/key}{/if}
	{#if hover != null}
		{@const d = byDay[hover]}
		<div
			class="tip"
			style="left: {hover > n / 2
				? `calc(${(X(hover) / w) * 100}% - 204px)`
				: `calc(${(X(hover) / w) * 100}% + 12px)`}; top: 8px"
		>
			<b>{hover === n - 1 ? 'Today' : d.label}</b>
			<div class="tr">
				<span><i class="sw kept" aria-hidden="true"></i>Kept out of landfill</span><span>{kg(d.keptKg)}</span>
			</div>
			<div class="tr">
				<span><i class="sw gone" aria-hidden="true"></i>Destroyed</span><span
					>{d.destroyed ? `${kg(d.destroyedKg)} · ${d.destroyed.toLocaleString('en-IN')} packs` : 'none'}</span
				>
			</div>
			<div class="tr"><span>Recovered</span><span>{fmt.inr(d.recovered)}</span></div>
			<div class="tr"><span>Batches closed</span><span>{d.closed}</span></div>
		</div>
	{/if}
</div>

<style>
	.kept,
	.gone {
		transform-box: fill-box;
		animation: grow 420ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}
	.kept {
		transform-origin: bottom;
	}
	.gone {
		transform-origin: top;
	}
	.cs-ov-gain {
		translate: -100% 0;
	}
	.still .kept,
	.still .gone {
		animation: none;
	}
	@keyframes grow {
		from {
			transform: scaleY(0);
		}
	}
</style>
