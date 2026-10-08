<script lang="ts">
	import { cx } from '../../../cx';
	import { cartons, fmt, productName } from '../../model';
	import { useWorkspace } from '../../source';

	// a document of the pack, set on paper (screens/finance.jsx Paper): the invoice Rakesh Traders issues, the e-way bill
	// check, Munchly's price-support credit note, the ITC memo, the FSSAI checklist and the destruction certificate
	let { id }: { id: string } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);

	const DOC = (x: string) => c.docs.find((d) => d.id === x);
	const d = $derived(DOC(id));
	const inv = $derived(c.invoice);
	const R = $derived(c.dist);
	const B = $derived(c.buyer);
	const dp = $derived(c.sku.dp!);
	const sp = $derived(c.support);
	const kRow = $derived(sp.rows.find((r) => r.id === 'kirana'));
	// the note's lines: the lot first, then the scheme, then any other exit the batch took (SC-85)
	const ORDER = ['expiresoon', 'kirana', 'staff', 'foodbank'];
	const rows = $derived([...sp.rows].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)));
	// what was destroyed or given away, and so lost its input credit (SC-85: a batch with a food bank gives some away)
	const away = $derived((c.plan.donated ?? 0) + (c.plan.leftover ?? 0));
	const W = $derived(ws.data.workspace);
	const kl = $derived(c.lines.kirana);
</script>

{#snippet head(title: string, no: string, stamp: string, ok = false)}<div class="pp-head">
		<div>
			<div class="pp-title">{title}</div>
			<div class="pp-no">{no}</div>
		</div>
		<span class={cx('pp-stamp', ok && 'ok')}>{stamp}</span>
	</div>{/snippet}
{#snippet line(key: string, v: string, strong = false, sub?: string)}<div class="pp-line">
		<span
			>{key}{#if sub}<em>{` ${sub}`}</em>{/if}</span
		><span class={strong ? 'pp-strong' : ''}>{v}</span>
	</div>{/snippet}

{#if id === 'invoice'}
	<div class="paper pp">
		{@render head('Tax invoice', `${inv.no} · draft · ${fmt.date(inv.date!)}`, 'IGST')}
		<div class="pp-parties">
			<div>
				<em>From</em><b>{R.name}</b><span>{R.address}</span><span class="pp-mono">GSTIN {R.gstin}</span>
			</div>
			<div>
				<em>To</em><b>{B.name}</b><span>{B.address} · place of supply {B.stateCode}</span><span class="pp-mono"
					>GSTIN {B.gstin}</span
				>
			</div>
		</div>
		<table class="pp-table">
			<thead><tr><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Taxable</th></tr></thead>
			<tbody
				><tr
					><td
						>{c.sku.brand}
						{c.sku.name}<br /><em>Batch {c.batch.id} · best before {fmt.date(c.batch.bestBefore)}</em></td
					><td>{c.sku.hsn}</td><td>{inv.units}</td><td>₹{inv.price!.toFixed(2)}</td><td>{fmt.inr2(inv.taxable!)}</td
					></tr
				></tbody
			>
		</table>
		{@render line('Taxable value', fmt.inr2(inv.taxable!))}{@render line(
			`IGST ${inv.gstPct}%`,
			fmt.inr2(inv.igst!),
			false,
			`${R.state} → ${B.state}`
		)}{@render line('Round off', fmt.inr2(inv.roundOff!))}{@render line('Invoice total', fmt.inr2(inv.total!), true)}
		<p class="pp-note">
			Drafted by the Paperwork agent for {R.name} to issue from Tally. {c.sku.gstNote} The MRP of {fmt.rate(c.sku.mrp)} stays
			printed on every pack: a discounted sale is fine, a second MRP is not (Legal Metrology).
		</p>
	</div>
{:else if id === 'eway'}
	<div class="paper pp">
		{@render head('E-way bill check', `${c.batch.id} · ${c.listing.id}`, 'NOT REQUIRED', true)}{@render line(
			'Consignment value with GST',
			fmt.inr2(inv.total!)
		)}{@render line('Threshold, inter-state', fmt.inr2(ws.data.rules.ewayThreshold))}{@render line(
			'E-way bill',
			'not required',
			true
		)}
		<p class="pp-note">
			{d?.note} A transporter note travels with the {cartons(c.lines.expiresoon.units, c.sku.perCarton)} on the buyer's truck
			instead.
		</p>
	</div>
{:else if id === 'support'}
	<div class="paper pp">
		{@render head('Price-support credit note', `${d?.no} · ${ws.data.client.short} → ${R.name}`, 'NO GST ADJ.', true)}
		{#each rows as r (r.id)}{#if r.id === 'expiresoon'}{@render line(
					`${r.units} sold on ExpireSoon at ₹${r.price.toFixed(2)}`,
					fmt.inr2(r.amount),
					false,
					`₹${dp} − ₹${r.price.toFixed(2)} = ₹${r.gap.toFixed(2)} a pack`
				)}{:else if r.id === 'kirana'}{@render line(
					`${r.units} sold to ${c.kiranas.length} kiranas at ₹${kl.price} effective`,
					fmt.inr2(r.amount),
					false,
					`₹${dp} − ₹${kl.price} = ₹${r.gap.toFixed(2)}, free packs included`
				)}{:else}{@render line(
					`${r.units} to the ${r.short} at ₹${r.price.toFixed(2)}`,
					fmt.inr2(r.amount),
					false,
					`₹${dp} − ₹${r.price.toFixed(2)} = ₹${r.gap.toFixed(2)} a pack`
				)}{/if}
			<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a space Svelte would trim at the block's edge, between one line and the next -->
			{' '}{/each}
		{#if kRow}{@render line(
				'Van delivery',
				fmt.inr2(sp.van),
				false,
				`${kRow.units} × ₹${ws.data.rules.vanPerUnit.toFixed(2)}`
			)}{/if}{#if sp.fee}{@render line('ExpireSoon listing fee', fmt.inr2(sp.fee))}{/if}{@render line(
			'Round off',
			fmt.inr2(d?.roundOff ?? 0)
		)}
		{@render line(`Credit to ${R.name}`, fmt.inr2(d?.amount ?? 0), true)}
		<p class="pp-note">
			A financial credit note, with no GST adjustment, so {R.name} ends whole at the ₹{dp} it paid. It covers the buy-{c
				.scheme.buy}-get-{c.scheme.free} scheme too, so no separate scheme note is needed. {W.short} pays this instead of
			an expiry claim of {fmt.inr(c.claim.total)}. Trued up after the return window closes on {fmt.day(c.returnBy)}.
		</p>
	</div>
{:else if id === 'itc'}
	<div class="paper pp">
		{@render head(
			'GST ITC memo',
			`Section 17(5)(h) · ${ws.data.client.short}`,
			away ? 'ITC PART REVERSED' : 'ITC KEPT',
			!away
		)}{@render line('Packets sold under tax invoices', fmt.num(c.plan.soldUnits))}{@render line(
			'Destroyed, gifted or lost',
			fmt.num(away)
		)}{@render line(
			'Input GST on the stock',
			fmt.inr2(d?.amount ?? 0),
			true,
			`₹${c.sku.itcPerUnit!.toFixed(2)} a pack, from the cost sheet`
		)}{@render line('Reversal in GSTR-3B, Table 4(B)(1)', away ? fmt.inr2(c.plan.itcReversed) : 'none')}
		<p class="pp-note">
			Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free. These packs were sold
			under tax invoices, so it does not apply. The credit would be reversed only if the stock came back under the
			expiry claim and {W.short} destroyed it. Credit on donated units is reversed: 17(5)(h) blocks it on gifts and, since
			1 October 2023, 17(5)(fa) on CSR donations.
		</p>
	</div>
{:else if id === 'fssai'}
	<div class="paper pp">
		{#if d?.status === 'generated'}{@render head('FSSAI surplus-food checklist', c.batch.id, 'GENERATED', true)}
			{@render line('Packs donated', fmt.num(c.plan.donated))}{@render line('Food bank', c.donation.partner.name)}
			<p class="pp-note">
				The batch's own checklist for the surplus food: {c.donation.units} packs from {c.donation.from || c.dist.godown}
				to {c.donation.partner.name}, inside their best-before, with the label photo attached.
			</p>
		{:else}{@render head('FSSAI surplus-food checklist', c.batch.id, 'NOT REQUIRED')}
			<p class="pp-note">
				Nothing from this batch was donated. The {productName(c.donation.sku)} batch {c.donation.batch.id} has its own checklist:
				{c.donation.units} packs to {c.donation.partner.name}, {c.donation.dist.city}.
			</p>{/if}
	</div>
{:else}
	<div class="paper pp">
		{@render head(
			'Destruction certificate',
			c.batch.id,
			d?.status === 'generated' ? 'GENERATED' : 'NOT REQUIRED',
			d?.status === 'generated'
		)}{@render line('Units left to destroy', fmt.num(c.plan.leftover ?? 0), true)}
		<p class="pp-note">
			Issued only when units remain, with the ITC reversal entry pre-filled so finance is never surprised.
		</p>
	</div>
{/if}
