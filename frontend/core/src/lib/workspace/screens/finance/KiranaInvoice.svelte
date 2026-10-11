<script lang="ts">
	import { fmt } from '../../model';
	import { words } from '../../papers';
	import { useWorkspace } from '../../source';
	import type { Distributor, KiranaInvoice, Sku } from '../../types';
	import TallySign from './TallySign.svelte';

	// the tax invoice the distributor issues from Tally for one shop's scheme order (SC-153, option A; screens/finance.jsx
	// KiranaInvoice): a B2C supply within the state, so CGST and SGST and no IRN; every packet at the pack price, less the
	// scheme's discount (model.ts kiranaInvoice). The discount, the taxes and the round-off are rows of their own
	let {
		inv,
		batch,
		sku,
		dist
	}: { inv: KiranaInvoice; batch: { id: string; bestBefore?: string | null }; sku: Sku; dist: Distributor } = $props();
	const ws = useWorkspace();
	const R = $derived(dist);
	const k = $derived(inv.shop);
	const half = $derived(inv.gstPct / 2);
	const sc = $derived(ws.data.rules.scheme);
	const threshold = $derived(ws.data.rules.ewayThreshold);
	const short = $derived(ws.data.workspace.short);
	const rows = $derived<[string, string, number][]>([
		[`Less: Scheme discount, buy ${sc.buy} get ${sc.free} free`, `${n2(inv.discountPct)}%`, -inv.discount],
		[`CGST @ ${half}%`, '', inv.cgst],
		[`SGST @ ${half}%`, '', inv.sgst],
		['Round off', '', inv.roundOff]
	]);
	function n2(n: number) {
		return (
			(n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
		);
	}
	const dmy = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
</script>

<div class="paper tl">
	<div class="tl-title">Tax Invoice</div>
	<div class="tl-copy">(ORIGINAL FOR RECIPIENT)</div>
	<div class="tl-grid tl-two">
		<div class="tl-cell">
			<b>{R.name}</b><br />{R.address}<br />GSTIN/UIN: {R.gstin || 'Unregistered'}<br />State Name: {R.state}, Code: {R.stateCode}{#if R.fssai}<br
				/>FSSAI Lic. No.: {R.fssai}{/if}{#if R.email}<br />E-Mail: {R.email}{/if}
		</div>
		<div class="tl-meta">
			<div class="tl-cell"><em>Invoice No.</em><b>{inv.no}</b></div>
			<div class="tl-cell"><em>Dated</em><b>{dmy(inv.date)}</b></div>
			<div class="tl-cell"><em>Buyer's Order No.</em>Scheme order, {inv.at.slice(11, 16)}</div>
			<div class="tl-cell"><em>Mode/Terms of Payment</em>Cash on delivery</div>
			<div class="tl-cell"><em>Dispatched through</em>Own van, the scheme's round</div>
			<div class="tl-cell"><em>Destination</em>{k.area}</div>
		</div>
	</div>
	<div class="tl-grid tl-two">
		<div class="tl-cell">
			<em>Buyer (Bill to and Ship to)</em><b>{k.name}</b><br />{k.area}, {R.city}{k.pincode ? ` ${k.pincode}` : ''}, {R.state}<br
			/>GSTIN/UIN: Unregistered<br />State Name: {R.state}, Code: {R.stateCode}<br />Place of Supply: {R.state} ({R.stateCode})
		</div>
		<div class="tl-cell">
			<em>Terms of Delivery</em>Door delivery on the van round<em style="margin-top: 8px">Reverse charge</em>No<em
				style="margin-top: 8px">E-way bill</em
			>Not required: within {R.city}, under ₹{fmt.num(threshold)}
		</div>
	</div>
	<table class="tl-table tl-items">
		<thead
			><tr
				><th>Sl</th><th>Description of Goods</th><th>HSN/SAC</th><th>Quantity</th><th>Rate</th><th>per</th><th
					>Amount</th
				></tr
			></thead
		>
		<tbody>
			<tr
				><td>1</td><td
					><b>{sku.brand} {sku.name}</b><br /><span class="tl-small"
						>Batch {batch.id} · best before {dmy(batch.bestBefore)} · MRP ₹{sku.mrp.toFixed(2)} a pack, incl. of all taxes</span
					></td
				><td>{inv.hsn || sku.hsn}</td><td class="tl-num"><b>{fmt.num(inv.units)} PCS</b></td><td class="tl-num"
					>{inv.rate.toFixed(2)}</td
				><td>PCS</td><td class="tl-num">{n2(inv.gross)}</td></tr
			>
			{#each rows as [t, pct, v] (t)}<tr class="tl-sub"
					><td></td><td class="tl-right"><b>{t}</b></td><td></td><td></td><td class="tl-num">{pct}</td><td></td><td
						class="tl-num">{n2(v)}</td
					></tr
				>{/each}
			<tr
				><td></td><td class="tl-num"><b>Total</b></td><td></td><td class="tl-num"><b>{fmt.num(inv.units)} PCS</b></td
				><td></td><td></td><td class="tl-num"><b>₹ {n2(inv.total)}</b></td></tr
			>
			<tr><td colspan="7">Amount Chargeable (in words)<br /><b>{words(inv.total)}</b></td></tr>
		</tbody>
	</table>
	<table class="tl-table">
		<thead
			><tr
				><th>HSN/SAC</th><th>Taxable Value</th><th>CGST · Rate</th><th>Amount</th><th>SGST · Rate</th><th>Amount</th><th
					>Total Tax</th
				></tr
			></thead
		>
		<tbody>
			<tr
				><td>{inv.hsn || sku.hsn}</td><td class="tl-num">{n2(inv.taxable)}</td><td class="tl-num">{half}%</td><td
					class="tl-num">{n2(inv.cgst)}</td
				><td class="tl-num">{half}%</td><td class="tl-num">{n2(inv.sgst)}</td><td class="tl-num">{n2(inv.tax)}</td></tr
			>
			<tr><td colspan="7">Tax Amount (in words): <b>{words(inv.tax)}</b></td></tr>
		</tbody>
	</table>
	<div class="tl-grid tl-two">
		<div class="tl-cell">
			Company's PAN: <b>{R.pan}</b><em style="margin-top: 8px">Declaration</em>We declare that this invoice shows the
			actual price of the goods described and that all particulars are true and correct. Sold under {short}'s scheme,
			within the best-before date.
		</div>
		<div class="tl-cell">
			<em>Company's Bank Details</em>{#if R.bank}Bank Name: {R.bank.name}<br />A/c No.: {R.bank.account}<br />Branch
				&amp; IFS Code: {R.bank.ifsc}{/if}
			<!-- signed by its distributor over his stamp (SC-174) -->
			<TallySign firm={R.name} who={R.signatory} seal={R.signatory?.seal} stamp="rect" />
		</div>
	</div>
	<div class="tl-foot">SUBJECT TO {(R.city || '').toUpperCase()} JURISDICTION</div>
</div>
