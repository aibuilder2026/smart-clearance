<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import { cx } from '../../../cx';
	import { fmt } from '../../model';
	import type { Dashboard } from '../../impact';
	import type { LedgerPeriod } from '../../types';
	import { kg } from './ledger';

	// where the kilos went (SC-157, screens/finance.jsx MixCard): one bar of the channels, in their fixed order, destroyed
	// hatched at the end, and a row for each with its kilos and share
	let { d, p }: { d: Dashboard; p: LedgerPeriod } = $props();
	const INK: Record<string, string> = {
		kirana: 'var(--ch-kirana)',
		expiresoon: 'var(--ch-expiresoon)',
		staff: 'var(--ch-staff)',
		d2c: 'var(--ch-d2c)',
		foodbank: 'var(--ch-foodbank)'
	};
	const NAMES = $derived(p.mixNames);
	const total = $derived(d.mixKg.reduce((t, m) => t + m[1], 0) || 1);
	const segs = $derived.by(() => {
		let acc = 0;
		return d.mixKg.map(([id, v]) => {
			const w = (v / total) * 600,
				x = acc;
			acc += w;
			return { id, v, x, w };
		});
	});
	const subOf = (id: string) =>
		id === 'writeoff'
			? 'expired at the godown; destroyed on your yes'
			: id === 'foodbank'
				? `${fmt.num(p.totals.meals)} meals, on the food banks' receipts`
				: 'sold under tax invoices and order logs';
</script>

<Card class="stack" style="gap: 12px">
	<div class="card-head">
		<span class="card-title">Where the kilos went</span><span class="t-caption subtle">{kg(total)} flagged at risk</span
		>
	</div>
	<div class="chart stack snug">
		<svg
			viewBox="0 0 600 28"
			width="100%"
			height="28"
			preserveAspectRatio="none"
			role="img"
			aria-label="Where the kilos went, by channel"
		>
			<defs
				><pattern id="fw-hatch-mix" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"
					><rect width="5" height="5" fill="var(--viz-gone-soft)" /><line
						x1="0"
						y1="0"
						x2="0"
						y2="5"
						stroke="var(--viz-gone)"
						stroke-width="2.6"
					/></pattern
				></defs
			>
			{#each segs as s (s.id)}<rect
					x={s.x + 1}
					y="0"
					width={Math.max(0, s.w - 2)}
					height="28"
					rx="5"
					fill={s.id === 'writeoff' ? 'url(#fw-hatch-mix)' : INK[s.id]}
					stroke={s.id === 'writeoff' ? 'var(--viz-gone)' : 'none'}><title>{NAMES[s.id]}: {kg(s.v)}</title></rect
				>{/each}
		</svg>
	</div>
	<List>
		{#each d.mixKg as [id, v] (id)}
			{#snippet lead()}<i
					class={cx('im-sw', id === 'writeoff' && 'gone')}
					style={id === 'writeoff' ? undefined : `background: ${INK[id]}`}
					aria-hidden="true"
				></i>{/snippet}
			{#snippet value()}<span class="tnum strong"
					>{kg(v)} <span class="subtle t-caption">{Math.round((v / total) * 100)}%</span></span
				>{/snippet}
			<ListRow leading={lead} title={NAMES[id] ?? id} sub={subOf(id)} {value} />
		{/each}
	</List>
</Card>
