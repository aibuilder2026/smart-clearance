<script lang="ts">
	import { CH_ORDER, chColor } from '../channels';
	import type { ChannelRow } from '../workspace/types';

	type Props = {
		rows: ChannelRow[];
		/** the channels the plan uses: drawn in their full colour */
		chosen?: string[];
		height?: number;
	};
	let { rows, chosen = [], height }: Props = $props();

	// the kit's ChannelBars: net rupees a unit by channel, the write-off bar below zero, a channel's figures on hover;
	// drawn 1:1 at the box's own width, so its labels keep their size on a phone
	let measured = $state(0);
	let tip = $state<{ r: ChannelRow; y: number } | null>(null);
	const ordered = $derived(
		CH_ORDER.map((id) => rows.find((r) => r.id === id)).filter((r): r is ChannelRow => r !== undefined)
	);
	const min = $derived(Math.min(0, ...ordered.map((r) => r.net)));
	const max = $derived(Math.max(1, ...ordered.map((r) => r.net)));
	const W = $derived(Math.max(280, measured || 560));
	const rowH = 40,
		padR = 64;
	const padL = $derived(Math.min(130, Math.round(W * 0.3)));
	const H = $derived(ordered.length * rowH + 12);
	const x = (v: number) => padL + ((v - min) / (max - min)) * (W - padL - padR);
	const rupees = (v: number) => (v < 0 ? '−₹' : '₹') + Math.abs(v).toFixed(2);
	const fill = (r: ChannelRow) =>
		!r.eligible
			? 'var(--fill-3)'
			: r.id === 'writeoff'
				? chColor('writeoff')
				: chosen.includes(r.id)
					? chColor(r.id)
					: `color-mix(in oklab, ${chColor(r.id)} 45%, var(--surface))`;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (the hover only shows the tooltip; the bars carry their figures) -->
<div class="chart" bind:clientWidth={measured} onmouseleave={() => (tip = null)}>
	<svg viewBox="0 0 {W} {H}" width="100%" height={height || H} role="img" aria-label="Net rupees per unit by channel">
		<line class="zero" x1={x(0)} x2={x(0)} y1="0" y2={H - 6} />
		{#each ordered as r, i (r.id)}
			{@const y = 6 + i * rowH}
			{@const x0 = x(Math.min(0, r.net))}
			{@const x1 = x(Math.max(0, r.net))}
			{@const pick = chosen.includes(r.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions (the hover only shows the tooltip) -->
			<g onmouseenter={() => (tip = { r, y })} style="cursor: default">
				<rect x="0" {y} width={W} height={rowH - 4} fill="transparent" />
				<text
					x={padL - 12}
					y={y + rowH / 2 + 1}
					text-anchor="end"
					style="font-size: 13px; fill: {r.eligible ? 'var(--fg)' : 'var(--fg-3)'}; font-weight: {pick ? 650 : 500}"
					>{r.short}</text
				>
				<rect x={x0} y={y + 7} width={Math.max(2, x1 - x0)} height={rowH - 18} rx="4" fill={fill(r)} />
				<text
					x={x(0) + (r.net >= 0 ? x1 - x(0) + 8 : 8)}
					y={y + rowH / 2 + 1}
					text-anchor="start"
					style="font-size: 12.5px; font-weight: 600; fill: {r.net < 0
						? 'var(--red-text)'
						: 'var(--fg-2)'}; font-variant-numeric: tabular-nums">{rupees(r.net)}</text
				>
			</g>
		{/each}
	</svg>
	{#if tip}
		{@const r = tip.r}
		<div class="tip" style="left: {Math.min((x(Math.max(0, r.net)) / W) * 100, 60)}%; top: {tip.y + 36}px">
			<b>{r.name}</b>
			<div class="tr">
				<span>Price</span><span>{r.price ? '₹' + r.price.toFixed(2) + ' · ' + r.pricePctLabel + ' of MRP' : '—'}</span>
			</div>
			<div class="tr"><span>Net a unit</span><span>{rupees(r.net)}</span></div>
			<div class="tr">
				<span>Capacity</span><span>{r.capacity == null ? 'unlimited' : r.capacity.toLocaleString('en-IN')}</span>
			</div>
			<div class="tr"><span>Clears in</span><span>{r.clears}</span></div>
			<div class="tr"><span>GST credit</span><span>{r.itc}{r.indicative ? ' · indicative' : ''}</span></div>
			{#if !r.eligible}<div class="tr" style="color: var(--red-text)">
					<span>Not eligible</span><span>{r.reason}</span>
				</div>{/if}
		</div>
	{/if}
</div>
