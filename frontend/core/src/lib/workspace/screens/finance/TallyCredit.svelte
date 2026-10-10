<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fmt } from '../../model';
	import { dispatchOf, words } from '../../papers';
	import { useWorkspace } from '../../source';
	import type { CaseData } from '../../types';
	import { possessive } from './ledger';

	// Munchly's credit notes to the distributor (SC-148, option B; screens/finance.jsx TallyCredit): financial, so no GST
	// is adjusted and nothing goes to the IRP; against the invoice it billed the batch on (papers.ts dispatchOf)
	type Row = { k: string; units?: number; rate?: number | null; amount: number };
	let {
		c,
		no,
		date,
		amount,
		roundOff = 0,
		title,
		sub,
		reason,
		rows,
		note = null,
		after
	}: {
		c: CaseData;
		no: string;
		date?: string;
		amount: number;
		roundOff?: number;
		title: string;
		sub: string;
		reason: string;
		rows: Row[];
		note?: string | null;
		after?: Snippet;
	} = $props();
	const ws = useWorkspace();
	const C = $derived(ws.data.client);
	const R = $derived(c.dist);
	const against = $derived(dispatchOf(c.batch));
	const n2 = (n: number) =>
		(n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const dmy = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
</script>

<div class="paper tl">
	<div class="tl-title">{title}</div>
	<div class="tl-copy">({sub})</div>
	<div class="tl-grid tl-two">
		<div class="tl-cell">
			<b>{C.name}</b><br />{C.address}<br />GSTIN/UIN: {C.gstin}<br />State Name: {C.state}, Code: {C.stateCode}<br
			/>CIN:
			{C.cin}<br />FSSAI Lic. No.: {C.fssai}
		</div>
		<div class="tl-meta">
			<div class="tl-cell"><em>Credit Note No.</em><b>{no}</b></div>
			<div class="tl-cell"><em>Dated</em><b>{dmy(date)}</b></div>
			<div class="tl-cell tl-span">
				<em>Against our invoice</em><b>{against.no}</b> dated {dmy(against.date)}<br />Batch {c.batch.id}, {c.sku.brand}
				{c.sku.name}
			</div>
		</div>
	</div>
	<div class="tl-grid tl-two">
		<div class="tl-cell">
			<em>Issued to</em><b>{R.name}</b><br />{R.address}<br />GSTIN/UIN: {R.gstin}<br />State Name: {R.state}, Code: {R.stateCode}
		</div>
		<div class="tl-cell"><em>Reason</em>{reason}</div>
	</div>
	<table class="tl-table">
		<thead><tr><th>Sl</th><th>Particulars</th><th>Packs</th><th>Rate</th><th>Amount</th></tr></thead>
		<tbody>
			{#each rows as r, i (i)}<tr
					><td>{i + 1}</td><td>{r.k}</td><td class="tl-num">{r.units != null ? fmt.num(r.units) : ''}</td><td
						class="tl-num">{r.rate != null ? n2(r.rate) : ''}</td
					><td class="tl-num">{n2(r.amount)}</td></tr
				>{/each}
			{#if roundOff}<tr
					><td></td><td class="tl-num">Round off</td><td></td><td></td><td class="tl-num">{n2(roundOff)}</td></tr
				>{/if}
			<tr
				><td></td><td class="tl-num"><b>Credit to {R.name}</b></td><td></td><td></td><td class="tl-num"
					><b>₹ {n2(amount)}</b></td
				></tr
			>
			<tr><td colspan="5">Amount (in words): <b>{words(amount)}</b></td></tr>
		</tbody>
	</table>
	<div class="tl-grid tl-two">
		<div class="tl-cell tl-small">
			Financial credit note: not a GST credit note under section 34 of the CGST Act, so no tax is adjusted and it is not
			reported to the IRP. The output tax on the original sale stands.{#if note}<br /><br />{note}{/if}<br /><br
			/>Company's PAN: <b>{C.pan}</b>
		</div>
		<div class="tl-cell">
			<div class="tl-sign">for <b>{C.name}</b></div>
			<div class="tl-num">Authorised Signatory</div>
		</div>
	</div>
	{@render after?.()}
	<div class="tl-foot">Adjusted against {possessive(R.name)} account · This is a Computer Generated Document</div>
</div>
