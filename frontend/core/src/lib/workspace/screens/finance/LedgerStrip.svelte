<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import { cx } from '../../../cx';
	import { ease, motionMs } from '../../../motion';
	import type { LedgerBatch } from '../../types';
	import { binShare, figure, monthOf, OUTCOME, valueOf, type Reading } from './ledger';

	// the period as its batches (screens/finance.jsx Strip): one segment a batch, in the order they cleared, as wide as its
	// figure in the reading; the share that went to the bin is hatched. Each grows into place, one after another
	let { list, reading, onopen }: { list: LedgerBatch[]; reading: Reading; onopen: (r: LedgerBatch) => void } = $props();
	const app = useApp();
	const total = $derived(list.reduce((t, r) => t + valueOf(r, reading), 0) || 1);
	const starts = $derived.by(() => {
		let at = 0;
		return list.map((r) => {
			const s = at;
			at += valueOf(r, reading);
			return s / total;
		});
	});
	const months = $derived.by(() => {
		const out: { m: string; i: number; label: string }[] = [];
		list.forEach((r, i) => {
			const m = r.cleared.slice(0, 7);
			if (!out.length || out[out.length - 1].m !== m) out.push({ m, i, label: monthOf(r.cleared) });
		});
		return out;
	});
	const grow = (_n: Element, { i }: { i: number }) => ({
		delay: motionMs(i * 35),
		duration: motionMs(420),
		easing: ease,
		css: (t: number) => `opacity: ${t}; transform: scaleX(${t})`
	});
</script>

<div class="lg-stripwrap">
	<div class="lg-strip" role="group" aria-label="The period's batches, each as wide as its figure">
		{#each list as r, i (r.ref + reading)}{@const share = binShare(r, reading)}<button
				type="button"
				class={cx('lg-seg', r.outcome)}
				style="flex-grow: {Math.max(valueOf(r, reading), total * 0.012)}"
				onclick={() => onopen(r)}
				in:grow={{ i }}
				aria-label="{r.name}, {r.ref}: {figure(r, reading)}, {OUTCOME[r.outcome].label}"
				title="{r.name} · {figure(r, reading)}"
				>{#if share > 0.004}<i class="lg-bin" style="width: {Math.max(4, share * 100)}%" aria-hidden="true"
					></i>{/if}{#if app.bp !== 'phone'}<span class="lg-seglabel" aria-hidden="true">{r.name.split(' ')[0]}</span
					>{/if}</button
			>{/each}
	</div>
	<div class="lg-ticks" aria-hidden="true">
		{#each months as m (m.m)}<span style="left: {starts[m.i] * 100}%">{m.label}</span>{/each}
	</div>
	<div class="lg-legend">
		<span><i class="sold"></i>Sold through</span><span><i class="leftover"></i>Left at the godown</span><span
			><i class="donation"></i>Donated</span
		><span
			><i class="bin"></i>{reading === 'gst'
				? 'Credit reversed'
				: reading === 'impact'
					? 'Destroyed'
					: 'Packs destroyed'}</span
		>
	</div>
</div>
