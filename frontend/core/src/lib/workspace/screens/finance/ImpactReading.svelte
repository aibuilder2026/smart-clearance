<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import { dashboard } from '../../impact';
	import { useWorkspace } from '../../source';
	import type { Ledger, LedgerPeriod } from '../../types';
	import ByCard from './ByCard.svelte';
	import FoodCard from './FoodCard.svelte';
	import ImpactTiles from './ImpactTiles.svelte';
	import LedgerHeadline from './LedgerHeadline.svelte';
	import MixCard from './MixCard.svelte';

	// the Impact reading, grown into the dashboard (SC-157, option B; screens/finance.jsx ImpactReading): the headline
	// and its working, the tiles and food by week in the same card, then where the kilos went and by distributor or
	// product. Every figure is the period's rows (ledger.ts dashboard, held to design3's ledger.js)
	let { book, p }: { book: Ledger; p: LedgerPeriod } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const d = $derived(dashboard(book, p.id));
	const prev = $derived(d.prev ? (book.periods.find((x) => x.id === d.prev) ?? null) : null);
</script>

<Card class="stack" style="gap: 18px">
	<LedgerHeadline {p} reading="impact" />
	{#if p.totals.batches}<ImpactTiles {d} {p} {prev} co2PerKg={book.co2PerKg} /><FoodCard
			{d}
			{p}
			{prev}
			height={app.bp === 'phone' ? 200 : 220}
			since={book.since}
			client={ws.data.workspace.short}
		/>{:else}<Empty
			icon="book-open"
			title="Nothing cleared in {p.label} yet"
			body="Each batch joins the ledger when Impact posts it, after its return window closes."
		/>{/if}
</Card>
{#if p.totals.batches}<div class="im-grid two"><MixCard {d} {p} /><ByCard {d} /></div>{/if}
