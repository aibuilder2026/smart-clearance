<script lang="ts">
	import { imgUrl } from '../../../assets';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Distributor, Sku, StaffReceipt } from '../../types';
	import Photo from '../common/Photo.svelte';
	import { recWhen } from '../record/record';
	import { possessive } from './ledger';

	// the staff sale's consolidated receipt as a paper of the pack (SC-174, option A; screens/finance.jsx
	// StaffReceiptPaper): the photo the distributor sent with the sale, his own, and its payments as Vision read them
	let { r, dist, sku, price }: { r: StaffReceipt; dist: Distributor; sku: Sku; price: number } = $props();
	const ws = useWorkspace();
	const src = $derived(r.url || (r.file ? imgUrl(r.file) : null) || null);
</script>

<div class="paper pp">
	<div class="pp-head">
		<div>
			<div class="pp-title">Staff sale receipt</div>
			<div class="pp-no">{r.no} · {dist.name}</div>
		</div>
		<span class="pp-stamp ok">READ</span>
	</div>
	<div class="pp-sub">The consolidated receipt {dist.short} sent with the staff sale, and what Vision read from it</div>
	{#if src}<div class="rcpt-photo">
			<Photo {src} alt="The consolidated receipt {r.no}, as {dist.short} sent it" />
		</div>{/if}
	<div class="pp-line">
		<span>UPI payments<em>{` ${recWhen(r.from)} to ${recWhen(r.to)}`}</em></span><span
			>{fmt.num(r.payments.length)}</span
		>
	</div>
	<div class="pp-line">
		<span>Packs sold to staff<em>{` ${sku.brand} ${sku.name} at ₹${price.toFixed(2)}`}</em></span><span
			>{fmt.num(r.units)}</span
		>
	</div>
	<div class="pp-line"><span>Received by UPI</span><span class="pp-strong">{fmt.inr2(r.paid)}</span></div>
	<table class="pp-table rcpt-table">
		<thead><tr><th>UPI Ref. No.</th><th>Paid by</th><th>When</th><th>Packs</th><th>₹</th></tr></thead>
		<tbody>
			{#each r.payments as x (x.rrn ?? x.n)}<tr
					><td class="pp-mono">{x.rrn}</td><td>{x.who}</td><td>{recWhen(x.at)}</td><td>{x.units}</td><td
						>{fmt.inr2(x.amount)}</td
					></tr
				>{/each}
		</tbody>
	</table>
	<p class="pp-note">
		Each payment's UPI reference is its receipt to the staff member who paid. {dist.short} signed the receipt; it is the staff
		sale's evidence among {possessive(ws.data.workspace.short)} papers.
	</p>
</div>
