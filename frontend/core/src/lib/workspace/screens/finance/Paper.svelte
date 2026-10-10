<script lang="ts">
	import { cx } from '../../../cx';
	import { cartons, fmt, productName } from '../../model';
	import { useWorkspace } from '../../source';
	import type { CaseData } from '../../types';
	import { issuedWhen, possessive } from './ledger';
	import Receipt from './Receipt.svelte';
	import TallyCredit from './TallyCredit.svelte';
	import TallyInvoice from './TallyInvoice.svelte';

	// a document of the pack, set on paper (screens/finance.jsx Paper): the invoice Rakesh Traders issues, the e-way bill
	// check, Munchly's price-support credit note, the ITC memo, the FSSAI checklist, the food bank's receipt (SC-110) and
	// the destruction certificate
	// a batch's paper: the batch in focus's, or the batch named (`c`, a batch's page in the ledger, SC-121)
	let { id, c: given }: { id: string; c?: CaseData } = $props();
	const ws = useWorkspace();
	const c = $derived(given ?? ws.case!);

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
	// what was destroyed or given away, and so lost its input credit (SC-85: a batch with a food bank gives some away),
	// as the memo records it once the lines are done (SC-122: the packs that came back for full credit and were
	// destroyed included); a memo drafted before then reads the plan's
	const memo = $derived(DOC('itc'));
	const away = $derived(memo?.away ?? (c.plan.donated ?? 0) + (c.plan.leftover ?? 0));
	const sold = $derived(memo?.units ?? c.plan.soldUnits);
	const reversed = $derived(memo?.reversed ?? (away ? c.plan.itcReversed : 0));
	// an SKU with no cost sheet of its own has its credit worked out as cost × GST: estimated (SC-122, the Mango Drink)
	const itcFrom = $derived(
		c.sku.itcPerUnit == null ? 'estimated from the cost and the GST rate' : 'from the cost sheet'
	);
	const destroyed = $derived(d?.units ?? c.plan.leftover ?? 0);
	// a time on a paper: 15 Sept, 13:20 for a date and time, else as it is
	const stamp = (t?: string) => (!t ? '' : t.length > 5 ? `${fmt.day(t.slice(0, 10))}, ${t.slice(11, 16)}` : t);
	const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
	const W = $derived(ws.data.workspace);
	const kl = $derived(c.lines.kirana);
	// issued from Tally: its e-invoice comes with it (SC-148); the hero is the batch in focus's
	const issuedAt = $derived(issuedWhen(c, inv, !given || given.batch.id === ws.case?.batch.id ? ws.state.hero : null));
	const n2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	// the price-support note's lines (SC-148: Tally's layout): what each exit sold under the dealer price, the van, the fee
	const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
	const supportRows = $derived([
		...rows.map((r) =>
			r.id === 'expiresoon'
				? {
						k: `ExpireSoon: ${fmt.num(r.units)} packs sold at ₹${r.price.toFixed(2)}, ₹${r.gap.toFixed(2)} under the dealer price`,
						units: r.units,
						rate: r.gap,
						amount: r.amount
					}
				: r.id === 'kirana'
					? {
							k: `Kirana scheme: ${fmt.num(r.units)} packs to ${c.kiranas.length} kiranas at ₹${kl.price} effective, free packs included`,
							units: r.units,
							rate: r.gap,
							amount: r.amount
						}
					: {
							k: `${cap(r.short)}: ${fmt.num(r.units)} packs at ₹${r.price.toFixed(2)}, ₹${r.gap.toFixed(2)} under the dealer price`,
							units: r.units,
							rate: r.gap,
							amount: r.amount
						}
		),
		...(kRow
			? [{ k: "Van round, the scheme's deliveries", units: kRow.units, rate: ws.data.rules.vanPerUnit, amount: sp.van }]
			: []),
		...(sp.fee ? [{ k: 'ExpireSoon listing fee', amount: sp.fee }] : [])
	]);
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
	<TallyInvoice {c} {inv} {issuedAt} />
{:else if id === 'eway'}
	<div class="paper pp">
		{@render head('E-way bill check', `${c.batch.id} · ${c.listing.id}`, 'NOT REQUIRED', true)}{@render line(
			'Supplier',
			R.name,
			false,
			`GSTIN ${R.gstin}`
		)}{@render line('Recipient', B.name, false, `GSTIN ${B.gstin}`)}{@render line(
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
	<TallyCredit
		{c}
		no={d?.no ?? ''}
		date={d?.date ?? inv?.date}
		amount={d?.amount ?? 0}
		roundOff={d?.roundOff ?? 0}
		title="Credit Note"
		sub="Price support · financial, no GST adjusted"
		rows={supportRows}
		reason={`Price support on the batch's clearance: the gap to the dealer price of ₹${dp} a pack on what each exit sold, and the costs ${R.short || R.name} met. It covers the buy-${c.scheme.buy}-get-${c.scheme.free} scheme too, instead of an expiry claim of ${fmt.inr(c.claim.total)}.`}
	/>
{:else if id === 'itc'}
	<div class="paper pp">
		{@render head(
			'GST ITC memo',
			`Section 17(5)(h) · ${ws.data.client.short} · GSTIN ${ws.data.client.gstin}`,
			away ? 'ITC PART REVERSED' : 'ITC KEPT',
			!away
		)}{@render line('Packets sold under tax invoices', fmt.num(sold))}{@render line(
			'Destroyed, gifted or lost',
			fmt.num(away)
		)}{#if memo?.atGodown}{@render line(
				`Destroyed at ${possessive(R.name)} godown`,
				fmt.num(memo.atGodown),
				false,
				'his stock: he reverses their credit'
			)}{/if}{@render line(
			'Input GST kept',
			fmt.inr2(d?.amount ?? 0),
			true,
			// the plan's own figure: an SKU with no itcPerUnit of its own (the Mango Drink) has cost × GST worked out by
			// money.js and backend-api (SC-105), so it is estimated (SC-122)
			`₹${c.plan.writeOff.itcPerUnit.toFixed(2)} a pack, ${itcFrom}`
		)}{@render line('Reversal in GSTR-3B, Table 4(B)(1)', reversed ? fmt.inr2(reversed) : 'none')}
		<p class="pp-note">
			{#if reversed}Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free. The {fmt.num(
					away
				)} packs of this batch given away or destroyed have their credit reversed; the {fmt.num(sold)} sold under tax invoices
				keep theirs. Credit on donated units is reversed: 17(5)(h) blocks it on gifts and, since 1 October 2023, 17(5)(fa)
				on CSR donations.{:else}Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free.
				These packs were sold under tax invoices, so it does not apply. The credit would be reversed only if the stock
				came back under the expiry claim and {W.short} destroyed it. Credit on donated units is reversed: 17(5)(h) blocks
				it on gifts and, since 1 October 2023, 17(5)(fa) on CSR donations.{/if}{#if memo?.atGodown}
				The {fmt.num(memo.atGodown)} packs destroyed at {possessive(R.name)} godown were his stock, bought under tax invoice:
				he reverses their input credit, and {ws.data.client.short} keeps its own.{/if}
		</p>
	</div>
{:else if id === 'expiry' && d}
	{@const C = ws.data.client.short}
	{#if d.policy === 'none'}<div class="paper pp">
			{@render head('Expiry notice', `${c.batch.id} · ${R.name}`, 'NO RETURNS')}
			{@render line('Packs expired at the godown', fmt.num(d.units ?? 0), true)}
			{@render line(`Credit from ${C}`, 'none')}
			<p class="pp-note">{d.note}</p>
		</div>
	{:else if d.policy === 'godown'}<!-- destroyed at his godown (SC-139): a financial note against the agency's
		certificate: the dealer price, the input GST he reverses on them (grossed up) and the agency's charges -->
		<TallyCredit
			{c}
			no={d.no}
			date={d.date}
			amount={d.amount}
			title="Credit Note"
			sub="Expiry, destroyed at the godown · financial, no GST adjusted"
			reason={`The ${fmt.num(d.units ?? 0)} packs left at the godown on the best-before, destroyed there${d.agency ? ` by ${d.agency}` : ''}${d.certificate ? ` under certificate ${d.certificate}` : ''}.`}
			note={d.certificate
				? `Issued against destruction certificate ${d.certificate}, on ${possessive(W.short)} approval of the evidence.`
				: null}
			rows={[
				{
					k: `${fmt.num(d.units ?? 0)} packs destroyed at the godown, at the dealer price`,
					units: d.units,
					rate: d.dp ?? dp,
					amount: d.credit ?? 0
				},
				...(d.gst
					? [
							{
								k: `Input GST he reverses on them, ${d.gstPct ?? Math.round(c.sku.gst * 100)}%, section 17(5)(h)`,
								amount: d.gst
							}
						]
					: []),
				...(d.charges
					? [
							{
								k: `Destruction charges, ${d.agency || 'the agency'}`,
								units: d.units,
								rate: d.charges / (d.units || 1),
								amount: d.charges
							}
						]
					: [])
			]}
		/>
	{:else}
		<TallyCredit
			{c}
			no={d.no}
			date={d.date}
			amount={d.amount ?? 0}
			title="Credit Note"
			sub={`Expiry · ${d.policy === 'full-credit' ? 'full credit' : 'price support'} · financial, no GST adjusted`}
			reason={`The ${fmt.num(d.units ?? 0)} packs left at the godown on the best-before${d.policy === 'full-credit' ? `, taken back at the dealer price; ${C} destroys them` : `: the gap to the dealer price paid, and ${R.short || R.name} destroys them`}.`}
			rows={[
				{
					k: `${fmt.num(d.units ?? 0)} packs expired at the godown${d.policy === 'full-credit' ? ', at the dealer price' : ', price support'}`,
					units: d.units,
					rate: d.amount != null && d.units ? d.amount / d.units : null,
					amount: d.amount ?? 0
				}
			]}
		>
			{#snippet after()}{#if d.policy === 'full-credit'}<div class="tl-grid">
						<div class="tl-cell tl-small">
							{possessive(C)} own costs on destroying them, not on this note: disposal ₹{n2(d.disposal ?? 0)}, EPR on
							the packaging ₹{n2(d.epr ?? 0)}, input GST reversed under section 17(5)(h) ₹{n2(d.itc ?? 0)}; the expiry,
							all in, ₹{n2((d.amount ?? 0) + (d.disposal ?? 0) + (d.epr ?? 0) + (d.itc ?? 0))}.
						</div>
					</div>{/if}{/snippet}
		</TallyCredit>
	{/if}
{:else if id === 'receipt' && d}
	<Receipt doc={d} batch={c.batch} sku={c.sku} dist={c.dist} />
{:else if id === 'fssai'}
	<div class="paper pp">
		{#if d?.status === 'generated'}{@render head(
				'FSSAI surplus-food checklist',
				`${c.batch.id} · FSSAI Lic. No. ${ws.data.client.fssai}`,
				'GENERATED',
				true
			)}
			{@render line('Packs donated', fmt.num(c.plan.donated))}{@render line('Food bank', c.donation.partner.name)}
			<p class="pp-note">
				The batch's own checklist for the surplus food: {c.donation.units} packs from {c.donation.from || c.dist.godown}
				to {c.donation.partner.name}, inside their best-before, with the label photo attached.
			</p>
		{:else}{@render head('FSSAI surplus-food checklist', c.batch.id, 'NOT REQUIRED')}
			<!-- another batch's donation is pointed at only when there is one: on the live workspace a batch with no
			donation of its own has nothing to point at (SC-98) -->
			<p class="pp-note">
				Nothing from this batch was donated.
				{#if c.donation.batch.id !== c.batch.id && c.donation.units > 0}The {productName(c.donation.sku)} batch {c
						.donation.batch.id} has its own checklist:
					{c.donation.units} packs to {c.donation.partner.name}, {c.donation.dist.city}.{/if}
			</p>{/if}
	</div>
{:else if d && d.at === 'godown'}
	<!-- destroyed at his godown (SC-139): the authorised agency's certificate, for him, once the evidence is approved: the
	batch, the packs and kilos, the method, the agency and its authorisation, the evidence and who approved it, and the
	input GST he reverses; until then it waits -->
	{@const done = d.status === 'generated'}
	<div class="paper pp">
		{@render head(
			'Destruction certificate',
			done ? `${d.no} · ${d.agency}` : `${c.batch.id} · ${R.name}`,
			done ? 'DESTROYED' : 'AWAITING',
			done
		)}
		<div class="pp-sub">For {R.name}, {R.address} · GSTIN {R.gstin}</div>
		{@render line(
			`${c.sku.brand} ${c.sku.name}`,
			`${fmt.num(d.units ?? 0)} packs`,
			true,
			`HSN ${c.sku.hsn} · batch ${c.batch.id} · best before ${fmt.date(c.batch.bestBefore)}`
		)}
		{#if done}{@render line('Weight', fmt.kg(d.kg ?? 0), false, 'food and packaging')}
			{@render line('Method', stamp(d.destroyedAt), false, lower(d.method ?? ''))}
			{@render line('Agency', d.agency ?? '', false, `authorisation ${d.auth}`)}
			{@render line(
				'Evidence',
				`approved by ${d.approvedBy}`,
				false,
				`two photos · Vision's checks ${d.evidence?.checks ?? 0} of ${d.evidence?.of ?? 0}`
			)}
			{@render line(
				'Input GST he reverses',
				fmt.inr2(d.reversed ?? 0),
				false,
				'section 17(5)(h), GSTR-3B Table 4(B)(1)'
			)}{:else}{@render line('Input GST he will reverse', fmt.inr2(d.reversed ?? 0), false, 'section 17(5)(h)')}{/if}
		<p class="pp-note">
			{done
				? d.note
				: `Issued by the authorised agency once ${W.short} approves the destruction's evidence: two photos and the agency's certificate number.`}
		</p>
	</div>
{:else}
	<div class="paper pp">
		{@render head(
			'Destruction certificate',
			c.batch.id,
			d?.status === 'generated' ? 'GENERATED' : 'NOT REQUIRED',
			d?.status === 'generated'
		)}{@render line(
			destroyed ? 'Units destroyed' : 'Units left to destroy',
			fmt.num(destroyed),
			true
		)}{#if destroyed}{@render line(
				'Input GST reversed',
				fmt.inr2(d?.reversed ?? destroyed * c.plan.writeOff.itcPerUnit),
				false,
				'section 17(5)(h), GSTR-3B Table 4(B)(1)'
			)}{/if}
		<p class="pp-note">
			Issued only when units remain, with the ITC reversal entry pre-filled so finance is never surprised.
		</p>
	</div>
{/if}
