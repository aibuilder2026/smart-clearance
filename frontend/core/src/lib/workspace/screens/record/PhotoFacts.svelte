<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import type { RecordPhoto } from '../../types';
	import { recWhen } from './record';

	// what a photo shows and what was made of it: who sent it and when, what Vision read, its checks; for the staff sale's
	// consolidated receipt, its payments and whether they match the count (SC-174)
	let { p }: { p: RecordPhoto } = $props();
	const r = $derived(p.read);
	const read = $derived(
		r
			? [
					r.batch ? `batch ${r.batch}` : null,
					r.mfg ? `made ${fmt.date(r.mfg)}` : null,
					r.bestBefore ? `best before ${fmt.date(r.bestBefore)}` : null,
					r.mrp != null ? `MRP ₹${Number(r.mrp).toFixed(2)}` : null
				]
					.filter(Boolean)
					.join(', ')
			: ''
	);
</script>

<div class="stack tight">
	<span class="t-footnote muted">Sent by {p.by || 'the distributor'} · {recWhen(p.at)}</span>
	{#if r}<div class="row tight t-footnote rec-check">
			<Icon name="circle-check" size={15} class="rec-ok" />Vision read {read}{r.at ? ` · ${recWhen(r.at)}` : ''}
		</div>
		<div class="row tight t-footnote rec-check">
			<Icon
				name={r.matches !== false ? 'circle-check' : 'circle-alert'}
				size={15}
				class={r.matches !== false ? 'rec-ok' : 'rec-warn'}
			/>{r.matches !== false ? 'Matches the export' : 'Does not match the export'}
		</div>{/if}
	{#each p.checks ?? [] as x (x.id)}<div class="row tight t-footnote rec-check">
			<Icon name={x.ok ? 'circle-check' : 'circle-alert'} size={15} class={x.ok ? 'rec-ok' : 'rec-warn'} />{x.label}
		</div>{/each}
	<!-- the staff sale's consolidated receipt (SC-174): what Vision read from it, and whether it matches the count -->
	{#if p.receipt}{@const x = p.receipt}
		<div class="row tight t-footnote rec-check">
			<Icon name="circle-check" size={15} class="rec-ok" />Vision read {x.no}: {x.payments} UPI payments, {fmt.inr2(
				x.paid
			)}
		</div>
		<div class="row tight t-footnote rec-check">
			<Icon
				name={x.matches !== false ? 'circle-check' : 'circle-alert'}
				size={15}
				class={x.matches !== false ? 'rec-ok' : 'rec-warn'}
			/>{x.matches !== false ? `Matches the ${fmt.num(x.units)} packs recorded` : 'Does not match the count'}
		</div>{/if}
</div>
