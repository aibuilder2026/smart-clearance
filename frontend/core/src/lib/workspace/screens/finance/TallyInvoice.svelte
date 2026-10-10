<script lang="ts">
	import { fmt } from '../../model';
	import { einvoice, qr, qrPath, words } from '../../papers';
	import { useWorkspace } from '../../source';
	import type { CaseData, Doc } from '../../types';

	// the tax invoice the distributor issues from Tally for the ExpireSoon lot (SC-148, option B; screens/finance.jsx
	// TallyInvoice): inter-state, so IGST; once issued, its e-invoice block, the IRN, acknowledgement and signed QR code
	// worked out from it and its parties (papers.ts). Bordered blocks side by side where there is room, stacked on a phone
	let { c, inv, issuedAt }: { c: CaseData; inv: Doc; issuedAt: string | null } = $props();
	const ws = useWorkspace();
	const R = $derived(c.dist);
	const B = $derived(c.buyer);
	const sku = $derived(c.sku);
	const inter = $derived(R.stateCode !== B.stateCode);
	const lot = $derived(c.listing?.id ?? '');
	const e = $derived(
		issuedAt ? einvoice({ no: inv.no, date: inv.date!, issuedAt, total: inv.total!, hsn: sku.hsn }, R, B) : null
	);
	const code = $derived(e ? qrPath(qr(e.signed, 'L')) : null);
	const igst = $derived(inv.igst ?? 0);
	const tax = $derived(
		inter
			? [[`IGST @ ${inv.gstPct}%`, igst] as const]
			: [[`CGST @ ${inv.gstPct! / 2}%`, igst / 2] as const, [`SGST @ ${inv.gstPct! / 2}%`, igst / 2] as const]
	);
	const token = $derived(c.award?.token);
	const hours = $derived(ws.data.market.balanceHours);
	const n2 = (n: number) =>
		(n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const dmy = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
	const threshold = $derived(ws.data.rules.ewayThreshold);
</script>

{#snippet party(
	k: string | null,
	p: { name: string; address?: string; gstin?: string; state: string; stateCode?: string }
)}
	<div class="tl-cell">
		{#if k}<em>{k}</em>{/if}<b>{p.name}</b><br />{p.address}<br />GSTIN/UIN: {p.gstin || 'Unregistered'}<br />State
		Name: {p.state}, Code: {p.stateCode}
		{#if p === R}{#if R.fssai}<br />FSSAI Lic. No.: {R.fssai}{/if}{#if R.email}<br />E-Mail: {R.email}{/if}{/if}{#if k === 'Buyer (Bill to)'}<br
			/>Place of Supply: {B.state} ({B.stateCode}){/if}
	</div>
{/snippet}

<div class="paper tl">
	<div class="tl-title">Tax Invoice</div>
	<div class="tl-copy">{e ? '(ORIGINAL FOR RECIPIENT)' : `(DRAFT, for ${R.short || R.name} to issue from Tally)`}</div>
	{#if e && code}<div class="tl-grid">
			<div class="tl-cell tl-einv">
				<div>
					<b>e-Invoice</b><br /><span class="tl-small">IRN:</span>
					<span class="tl-mono">{e.irn}</span><br /><b>Ack No.:</b>
					{e.ackNo} &nbsp; <b>Ack Date:</b>
					{dmy(e.ackDate.slice(0, 10))}
					{e.ackDate.slice(11, 16)}<br /><span class="tl-small"
						>Signed QR code from the Invoice Registration Portal (its signature illustrative)</span
					>
				</div>
				<svg viewBox={code.viewBox} role="img" aria-label="The e-invoice's signed QR code" shape-rendering="crispEdges"
					><rect width="100%" height="100%" fill="#fff" /><path d={code.d} fill="#111" /></svg
				>
			</div>
		</div>{:else}<div class="tl-grid">
			<div class="tl-cell">
				<b>e-Invoice</b>
				<span class="tl-small"
					>· the IRN and the signed QR code come from the Invoice Registration Portal once {R.short || R.name} issues it</span
				>
			</div>
		</div>{/if}
	<div class="tl-grid tl-two">
		{@render party(null, R)}
		<div class="tl-meta">
			<div class="tl-cell"><em>Invoice No.</em><b>{inv.no}</b></div>
			<div class="tl-cell"><em>Dated</em><b>{dmy(inv.date)}</b></div>
			<div class="tl-cell"><em>Delivery Note</em>{lot}</div>
			<div class="tl-cell">
				<em>Mode/Terms of Payment</em>{token
					? `Token ₹${fmt.num(token)} paid; balance in ${hours} h`
					: `Balance in ${hours} h`}
			</div>
			<div class="tl-cell"><em>Buyer's Order No.</em>ExpireSoon lot {lot}</div>
			<div class="tl-cell"><em>Dated</em>{dmy(inv.date)}</div>
			<div class="tl-cell"><em>Dispatched through</em>Buyer's own truck</div>
			<div class="tl-cell"><em>Destination</em>{B.city}</div>
		</div>
	</div>
	<div class="tl-grid tl-two">
		{@render party('Consignee (Ship to)', B)}
		<div class="tl-cell tl-tall">
			<em>Terms of Delivery</em>Ex-godown, {R.godown}, {R.city}<em style="margin-top: 8px">Reverse charge</em>No<em
				style="margin-top: 8px">E-way bill</em
			>{(inv.total ?? 0) < threshold
				? `Not required: the consignment is under ₹${fmt.num(threshold)}`
				: 'Generated with the dispatch'}
		</div>
		{@render party('Buyer (Bill to)', B)}
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
			<tr>
				<td>1</td>
				<td
					><b>{sku.brand} {sku.name}</b><br /><span class="tl-small"
						>Batch {c.batch.id} · best before {dmy(c.batch.bestBefore)} · MRP ₹{sku.mrp.toFixed(2)} a pack, incl. of all taxes</span
					>{#each tax as [k] (k)}<div class="tl-num" style="margin-top: 6px"><b>{k}</b></div>{/each}
					<div class="tl-num">Round off</div></td
				>
				<td>{sku.hsn}</td><td class="tl-num"><b>{fmt.num(inv.units ?? 0)} PCS</b></td><td class="tl-num"
					>{inv.price!.toFixed(2)}</td
				><td>PCS</td>
				<td class="tl-num"
					>{n2(inv.taxable ?? 0)}{#each tax as [k, v] (k)}<div style="margin-top: 6px"><b>{n2(v)}</b></div>{/each}
					<div>
						{n2(inv.roundOff ?? 0)}
					</div></td
				>
			</tr>
			<tr
				><td></td><td class="tl-num"><b>Total</b></td><td></td><td class="tl-num"
					><b>{fmt.num(inv.units ?? 0)} PCS</b></td
				><td></td><td></td><td class="tl-num"><b>₹ {n2(inv.total ?? 0)}</b></td></tr
			>
			<tr><td colspan="7">Amount Chargeable (in words)<br /><b>{words(inv.total ?? 0)}</b></td></tr>
		</tbody>
	</table>
	<table class="tl-table">
		<thead
			><tr
				><th>HSN/SAC</th><th>Taxable Value</th>{#each tax as [k] (k)}<th>{k.split(' @')[0]} · Rate</th
					>{/each}{#each tax as [k] (k)}<th>Amount</th>{/each}<th>Total Tax</th></tr
			></thead
		>
		<tbody>
			<tr
				><td>{sku.hsn}</td><td class="tl-num">{n2(inv.taxable ?? 0)}</td>{#each tax as [k] (k)}<td class="tl-num"
						>{k.split('@ ')[1]}</td
					>{/each}{#each tax as [k, v] (k)}<td class="tl-num">{n2(v)}</td>{/each}<td class="tl-num">{n2(igst)}</td></tr
			>
			<tr><td colspan={3 + tax.length * 2}>Tax Amount (in words): <b>{words(igst)}</b></td></tr>
		</tbody>
	</table>
	<div class="tl-grid tl-two">
		<div class="tl-cell">
			Company's PAN: <b>{R.pan}</b><em style="margin-top: 8px">Declaration</em>We declare that this invoice shows the
			actual price of the goods described and that all particulars are true and correct. Goods sold within their
			best-before date, under the brand's one-time permission.
		</div>
		<div class="tl-cell">
			<em>Company's Bank Details</em>{#if R.bank}Bank Name: {R.bank.name}<br />A/c No.: {R.bank.account}<br />Branch
				&amp; IFS Code: {R.bank.ifsc}{/if}
			<div class="tl-sign">for <b>{R.name}</b></div>
			<div class="tl-num">Authorised Signatory</div>
		</div>
	</div>
	<div class="tl-foot">
		SUBJECT TO {(R.city || '').toUpperCase()} JURISDICTION · This is a Computer Generated Invoice
	</div>
</div>
