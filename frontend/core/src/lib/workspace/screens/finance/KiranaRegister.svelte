<script lang="ts">
	import { fmt } from '../../model';
	import type { Distributor, KiranaInvoice, Sku } from '../../types';

	// a batch's invoices to its shops as Tally's sales register (SC-153, option A; screens/finance.jsx KiranaRegister): a
	// row each, its number opening the invoice, and the totals; the taxable value is what the scheme sold. A narrow paper
	// leaves out the CGST and SGST columns, which each invoice carries
	let {
		list,
		batch,
		sku,
		dist,
		price,
		onOpen
	}: {
		list: KiranaInvoice[];
		batch: { id: string };
		sku: Sku;
		dist: Distributor;
		price: number;
		onOpen?: (x: KiranaInvoice) => void;
	} = $props();
	const add = (k: 'units' | 'taxable' | 'cgst' | 'sgst' | 'total') =>
		Math.round(list.reduce((t, x) => t + x[k], 0) * 100) / 100;
	const n2 = (n: number) =>
		(n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const dmy = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
</script>

<div class="paper tl tl-reg">
	<div class="tl-title">Sales Register</div>
	<div class="tl-copy">{dist.name} · tax invoices to kiranas · {sku.brand} {sku.name}, batch {batch.id}</div>
	<table class="tl-table">
		<thead
			><tr
				><th>Date</th><th>Invoice No.</th><th>Particulars</th><th>Packs</th><th>Taxable</th><th class="tl-gst">CGST</th
				><th class="tl-gst">SGST</th><th>Total</th></tr
			></thead
		>
		<tbody>
			{#each list as x (x.no)}<tr
					><td class="tl-num">{dmy(x.date).slice(0, 5)}</td><td
						>{#if onOpen}<button type="button" class="tl-link" onclick={() => onOpen(x)}>{x.no}</button
							>{:else}{x.no}{/if}</td
					><td>{x.shop.name}</td><td class="tl-num">{x.units}</td><td class="tl-num">{n2(x.taxable)}</td><td
						class="tl-num tl-gst">{n2(x.cgst)}</td
					><td class="tl-num tl-gst">{n2(x.sgst)}</td><td class="tl-num">{n2(x.total)}</td></tr
				>{/each}
			<tr
				><td colspan="3"><b>{list.length} {list.length === 1 ? 'invoice' : 'invoices'}</b></td><td class="tl-num"
					><b>{fmt.num(add('units'))}</b></td
				><td class="tl-num"><b>{n2(add('taxable'))}</b></td><td class="tl-num tl-gst"><b>{n2(add('cgst'))}</b></td><td
					class="tl-num tl-gst"><b>{n2(add('sgst'))}</b></td
				><td class="tl-num"><b>{n2(add('total'))}</b></td></tr
			>
		</tbody>
	</table>
	<div class="tl-foot">
		The taxable value is what the scheme sold: {fmt.num(add('units'))} packets at ₹{price.toFixed(2)} effective
	</div>
</div>
