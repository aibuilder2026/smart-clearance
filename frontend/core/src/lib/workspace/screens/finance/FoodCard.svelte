<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import { cx } from '../../../cx';
	import { prefersReducedMotion } from '../../../motion';
	import { fmt } from '../../model';
	import { weekLabel, type Dashboard, type DashWeek } from '../../impact';
	import type { LedgerPeriod } from '../../types';
	import { kg } from './ledger';

	// food by week (SC-157, screens/finance.jsx FoodCard; the console's form, SC-149): the kilos each week's cleared
	// batches kept out of landfill rise from one baseline, the kilos destroyed hang under it, hatched, on one scale; a
	// crosshair tooltip, and the same figures as a table. The bars grow once (420 ms); still under reduced motion
	let {
		d,
		p,
		prev,
		height = 220,
		since,
		client
	}: {
		d: Dashboard;
		p: LedgerPeriod;
		prev: LedgerPeriod | null;
		height?: number;
		since: string;
		client: string;
	} = $props();
	const reduce = prefersReducedMotion.current;
	let table = $state(false);
	let hover = $state<number | null>(null);
	let cw = $state(640);
	const weeks = $derived(d.weeks);
	const t = $derived(p.totals);
	const W = $derived(Math.max(300, Math.round(cw)));
	const pl = 52,
		pr = 8,
		pt = 12,
		pb = 26;
	const n = $derived(weeks.length);
	const nice = (x: number) => {
		const mag = Math.pow(10, Math.floor(Math.log10(x)));
		return mag * ([1, 2, 2.5, 5, 10].find((m) => x / mag <= m) || 10);
	};
	const scale = $derived.by(() => {
		const up = Math.max(0, ...weeks.map((w) => w.kept)),
			down = Math.max(0, ...weeks.map((w) => w.destroyed));
		const step = up || down ? nice(Math.max(up, down * 2) / 4) : 100;
		return {
			step,
			top: Math.max(step * 2, step * Math.ceil(up / step)),
			bottom: Math.max(step, step * Math.ceil(down / step))
		};
	});
	const Y = (x: number) => pt + ((scale.top - x) / (scale.top + scale.bottom)) * (height - pt - pb);
	const y0 = $derived(Y(0));
	const slot = $derived((W - pl - pr) / n);
	const bw = $derived(Math.max(3, Math.min(26, slot - 6)));
	const X = (i: number) => pl + slot * (i + 0.5);
	const ticks = $derived.by(() => {
		const out: number[] = [];
		for (let x = -scale.bottom; x <= scale.top + scale.step / 2; x += scale.step) out.push(Math.round(x));
		return out;
	});
	const every = $derived(Math.max(1, Math.ceil(64 / slot)));
	const kgAxis = (v: number) =>
		v >= 1000 ? (v / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' t' : Math.round(v) + ' kg';
	// a bar from the baseline, its far end rounded
	function bar(x: number, y1: number, from: number) {
		const h = Math.abs(y1 - from),
			r = Math.min(3, bw / 2, h),
			k = y1 < from ? 1 : -1;
		if (h < 0.5) return `M${x} ${from} h${bw} h${-bw} Z`;
		return `M${x} ${from} V${y1 + k * r} Q${x} ${y1} ${x + r} ${y1} H${x + bw - r} Q${x + bw} ${y1} ${x + bw} ${y1 + k * r} V${from} Z`;
	}
	function move(e: MouseEvent) {
		const r = (e.currentTarget as SVGElement).getBoundingClientRect();
		const px = ((e.clientX - r.left) / r.width) * W;
		hover = Math.max(0, Math.min(n - 1, Math.floor((px - pl) / slot)));
	}
	const kept = $derived(weeks.reduce((a, w) => a + w.kept, 0));
	const gone = $derived(weeks.reduce((a, w) => a + w.destroyed, 0));
	const w = $derived<DashWeek | null>(hover != null ? weeks[hover] : null);
</script>

<div class="fw-card stack" style="gap: 14px">
	<div class="card-head">
		<span class="card-title">Food, by week</span><Button
			variant="secondary"
			size="sm"
			icon={table ? 'activity' : 'file-spreadsheet'}
			aria-pressed={table}
			onclick={() => (table = !table)}>{table ? 'Show as a chart' : 'Show as a table'}</Button
		>
	</div>
	<div class="fw-head">
		<span class="fig"><b>{kg(t.kg)}</b><span>kept out of landfill in {p.label}</span></span>{#if d.share != null}<span
				class="share">{d.share}% saved</span
			>{/if}<span class="fig gone"><b>{kg(t.destroyedKg)}</b><span>destroyed</span></span>
	</div>
	<ul class="fw-legend">
		<li><i class="im-sw kept" aria-hidden="true"></i>Kept out of landfill (sold or given)</li>
		<li><i class="im-sw gone" aria-hidden="true"></i>Destroyed (no channel took it)</li>
	</ul>
	{#if table}<div style="overflow-x: auto">
			<table class="fw-table">
				<thead
					><tr
						><th>Week of</th><th>Kept out (kg)</th><th>Resold</th><th>Donated</th><th>Destroyed</th><th>Batches</th><th
							>Recovered</th
						></tr
					></thead
				><tbody
					>{#each weeks as wk (wk.from)}<tr
							><td>{weekLabel(wk.from)}</td><td>{wk.kept}</td><td>{wk.resold}</td><td>{wk.donated}</td><td
								>{wk.destroyed}</td
							><td>{wk.closed}</td><td>{fmt.inr(wk.net)}</td></tr
						>{/each}</tbody
				>
			</table>
		</div>{:else}<div
			class={cx('fw', reduce && 'still')}
			bind:clientWidth={cw}
			role="presentation"
			onmouseleave={() => (hover = null)}
		>
			<svg
				viewBox="0 0 {W} {height}"
				{height}
				onmousemove={move}
				role="img"
				aria-label="Food a week: {kg(kept)} kept out of landfill and {kg(gone)} destroyed"
			>
				<defs
					><pattern id="fw-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"
						><rect width="5" height="5" class="hatch-bg" /><line
							x1="0"
							y1="0"
							x2="0"
							y2="5"
							class="hatch-ln"
						/></pattern
					></defs
				>
				{#each ticks as x (x)}<line class={x ? 'gl' : 'base'} x1={pl} x2={W - pr} y1={Y(x)} y2={Y(x)} />{/each}
				{#each ticks as x (x)}<text class="ax" x={pl - 8} y={Y(x) + 4} text-anchor="end"
						>{x < 0 ? '−' + kgAxis(-x) : kgAxis(x)}</text
					>{/each}
				{#each weeks as wk, i (wk.from)}{#if (i % every === 0 && i < n - 1) || i === n - 1}<text
							class="ax"
							x={X(i)}
							y={height - 6}
							text-anchor={i === n - 1 ? 'end' : 'middle'}
							>{i === n - 1 && p.current ? 'this week' : weekLabel(wk.from)}</text
						>{/if}{/each}
				{#if hover != null}<rect
						class="col"
						x={X(hover) - slot / 2}
						y={pt}
						width={slot}
						height={height - pt - pb}
					/>{/if}
				{#each weeks as wk, i (wk.from)}<path
						class="kept"
						style:animation-delay="{Math.min(6 * i, 300)}ms"
						d={bar(X(i) - bw / 2, Y(wk.kept), y0)}
					/>{#if wk.destroyed > 0}<path
							class="gone"
							style:animation-delay="{Math.min(6 * i, 300) + 120}ms"
							d={bar(X(i) - bw / 2, Y(-wk.destroyed) + 1, y0 + 1)}
						/>{/if}{/each}
			</svg>
			{#if w && hover != null}
				<div
					class="tip"
					style="left: {hover > n / 2
						? `calc(${(X(hover) / W) * 100}% - 204px)`
						: `calc(${(X(hover) / W) * 100}% + 12px)`}; top: 8px"
				>
					<b>Week of {weekLabel(w.from)}</b>
					<div class="tr">
						<span><i class="im-sw kept" aria-hidden="true"></i>Kept out of landfill</span><span>{kg(w.kept)}</span>
					</div>
					<div class="tr">
						<span><i class="im-sw gone" aria-hidden="true"></i>Destroyed</span><span
							>{w.destroyed ? kg(w.destroyed) : 'none'}</span
						>
					</div>
					<div class="tr"><span>Batches cleared</span><span>{w.closed}</span></div>
					<div class="tr"><span>Recovered</span><span>{fmt.inr(w.net)}</span></div>
				</div>
			{/if}
		</div>{/if}
	<span class="im-note"
		>{prev
			? `${kg(prev.totals.kg)} kept out and ${kg(prev.totals.destroyedKg)} destroyed in ${prev.label}.`
			: `Every batch ${client} has cleared since ${since}; a week is counted when its batches clear.`} CO₂e, disposal and
		EPR are indicative.</span
	>
</div>
