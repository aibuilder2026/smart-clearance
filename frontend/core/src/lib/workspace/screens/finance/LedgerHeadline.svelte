<script lang="ts">
	import Money from '../../../components/Money.svelte';
	import Roll from '../../../components/Roll.svelte';
	import { fmt } from '../../model';
	import type { LedgerPeriod } from '../../types';
	import { kg, type Reading } from './ledger';

	// the period's one figure for a reading, with its working under it (screens/finance.jsx Headline): rupees read in
	// lakh, as an Indian finance team says them; kilos in tonnes once they run past a thousand
	let { p, reading }: { p: LedgerPeriod; reading: Reading } = $props();
	const t = $derived(p.totals);
	const tonnes = $derived(t.kg >= 1000);
</script>

<div class="lg-head">
	{#if reading === 'money'}
		<div class="lg-fig">
			<span class="num l money"
				><span class="sr-only">{'₹' + (t.net / 1e5).toFixed(2) + ' lakh'}</span><span class="cur" aria-hidden="true"
					>₹</span
				><Roll value={t.net / 1e5} format={(v) => v.toFixed(2)} hidden /><span aria-hidden="true" class="lg-unit"
					>lakh</span
				></span
			><span class="lg-what">recovered</span>
		</div>
		<p class="lg-working">
			From {t.batches}
			{t.batches === 1 ? 'batch' : 'batches'} that would have cost {fmt.lakh(t.writeOff)} to destroy:
			<b>{fmt.lakh(t.swing)}</b>
			better than the bin, after {fmt.lakh(t.support)} of price support to the distributors{t.credit
				? ` and ${fmt.inr(t.credit)} of expiry credit`
				: ''}.
		</p>
	{:else if reading === 'gst'}
		<div class="lg-fig">
			<Money value={t.itcKept} size="l" roll /><span class="lg-what">of input credit kept</span>
		</div>
		<p class="lg-working">
			Sold under tax invoices, so the credit stands. <b>{fmt.inr(t.itcReversed)}</b> reversed under s.17(5)(h) on packs
			destroyed or given away (GSTR-3B Table 4(B)(1)). {t.invoices} distributors' invoices, {t.creditNotes} credit notes,
			{t.reviewed === t.batches ? 'every pack reviewed' : `${t.reviewed} of ${t.batches} packs reviewed`}.
		</p>
	{:else}
		<div class="lg-fig">
			<span class="num l"
				><span class="sr-only">{kg(t.kg)}</span><Roll
					value={tonnes ? t.kg / 1000 : t.kg}
					format={(v) => (tonnes ? v.toFixed(2) : Math.round(v).toLocaleString('en-IN'))}
					hidden
				/><span aria-hidden="true" class="lg-unit">{tonnes ? 't' : 'kg'}</span></span
			><span class="lg-what">kept out of landfill</span>
		</div>
		<p class="lg-working">
			{kg(t.resoldKg)} resold and {kg(t.donatedKg)} donated, {fmt.num(t.meals)} meals. <b>{kg(t.destroyedKg)}</b>
			destroyed when it expired at the godown. {kg(t.co2)} CO₂e avoided, indicative. {p.long}.
		</p>
	{/if}
</div>
