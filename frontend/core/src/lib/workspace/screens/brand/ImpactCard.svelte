<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { useRoute } from '../../context';
	import { dashboard, impactPeriod } from '../../impact';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import { kg } from '../finance/ledger';

	// the Impact card on the Command Center (SC-157; screens/brand.jsx ImpactCard): the quarter so far (or the latest
	// with a batch cleared), its kilos kept out of landfill, CO₂e and meals, with its weeks as a sparkline, opening the
	// Ledger on its Impact reading. Nothing until the source has the ledger
	const ws = useWorkspace();
	const router = useRoute();
	const book = $derived(ws.ledger);
	const p = $derived(book ? impactPeriod(book) : null);
	const d = $derived(book && p ? dashboard(book, p.id) : null);
	const line = $derived.by(() => {
		if (!d) return '';
		const max = Math.max(1, ...d.weeks.map((w) => w.kept)),
			n = d.weeks.length;
		return d.weeks
			.map(
				(w, i) =>
					(i ? 'L' : 'M') + (n > 1 ? (i / (n - 1)) * 120 : 60).toFixed(1) + ' ' + (26 - (w.kept / max) * 22).toFixed(1)
			)
			.join(' ');
	});
</script>

{#if book && p && d}{@const t = p.totals}
	<Card class="imc stack snug">
		<div class="card-head">
			<span class="row tight"
				><span class="icontile" style="border-radius: 9px"><Icon name="leaf" size={17} stroke={2} /></span><span
					class="card-title">Impact · {p.label}</span
				></span
			>{#if d.share != null}<Badge size="sm" tone="green">{d.share}% saved</Badge>{/if}
		</div>
		{#if t.batches}
			<div class="imc-figs">
				<div><b>{kg(t.kg)}</b><span>kept out of landfill</span></div>
				<div><b>{kg(t.co2)}</b><span>CO₂e avoided</span></div>
				<div><b>{fmt.num(t.meals)}</b><span>meals</span></div>
			</div>
			<svg class="imc-spark" viewBox="0 0 120 28" aria-hidden="true"
				><path class="a" d="{line} L120 28 L0 28 Z" /><path class="l" d={line} /></svg
			>
			<span class="t-footnote subtle"
				>{t.batches}
				{t.batches === 1 ? 'batch' : 'batches'} cleared{p.current ? ' so far' : ''} · {kg(t.destroyedKg)} destroyed · CO₂e
				indicative</span
			>
		{:else}<span class="t-footnote muted"
				>Nothing has cleared in {p.label} yet. Each batch joins the ledger when Impact posts it.</span
			>{/if}
		<Button variant="secondary" size="sm" icon="book-open" onclick={() => router.go('report', { reading: 'impact' })}
			>Open the ledger</Button
		>
	</Card>
{/if}
