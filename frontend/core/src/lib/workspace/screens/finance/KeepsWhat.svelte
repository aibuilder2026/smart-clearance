<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Money from '../../../components/Money.svelte';
	import { first, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { CaseData } from '../../types';

	// the batch in focus, or the batch named (`c`, a batch's page in the ledger, SC-121)
	let { c: named }: { c?: CaseData } = $props();
	const ws = useWorkspace();
	const c = $derived(named ?? ws.case!);

	// the same batch read from each side: the distributor ends whole, and Munchly pays less than a claim. What the
	// distributor receives is what each channel took, at its price (the credit note's rows), so a line that took less
	// counts less; on expiry day the packs left at the godown add their settlement on both sides (SC-94)
	// (screens/finance.jsx KeepsWhat)
	const dp = $derived(c.sku.dp!);
	const x = $derived(c.expiry && c.expiry.units > 0 ? c.expiry : null);
	const credit = $derived(x?.credit ?? 0);
	const settled = $derived(x?.total ?? 0);
	const recv = $derived(c.support.rows.reduce((t, r) => t + r.units * r.price, 0) + c.support.total);
	// a donation costs the client its handling and the credit given away with it, which the ledger's swing counts too
	// (SC-122: the Mango Drink's ₹60.90)
	const gift = $derived(c.plan.lines.find((l) => l.id === 'foodbank' && l.units > 0));
	const given = $derived(gift ? gift.cost + gift.itcLoss : 0);
	const paid = $derived(c.plan.units * dp + c.support.van + c.support.fee);
	const W = $derived(ws.data.workspace);
</script>

<Card class="stack snug">
	<span class="card-title">Who keeps what</span>
	<div class="stack tight t-subhead">
		<div class="row between">
			<span>{c.dist.name} receives</span><span class="tnum">{fmt.inr(recv)}</span>
		</div>
		{#if x && credit > 0}<div class="row between">
				<span>and the expiry credit for {fmt.num(x.units)} packs</span><span class="tnum">{fmt.inr(credit)}</span>
			</div>{/if}
		<div class="row between">
			<span>and paid {fmt.num(c.plan.units)} × ₹{dp}, the van and the fee</span><span class="tnum"
				>{fmt.inr(-paid)}</span
			>
		</div>
		<div class="row between">
			<b>{x && !credit ? 'Its loss on the expired packs' : 'He ends whole'}</b><span class="tnum strong"
				>{fmt.inr(Math.round(recv + credit - paid))}</span
			>
		</div>
		<div class="hairline" style="margin: 4px 0"></div>
		<div class="row between">
			<span>Expiry claim {W.short} avoids</span><span class="tnum">{fmt.inr(c.claim.total)}</span>
		</div>
		<div class="row between">
			<span>Price support it pays instead</span><span class="tnum neg">{fmt.inr(-c.support.total)}</span>
		</div>
		{#if x && settled > 0}<div class="row between">
				<span>and the expiry settlement for {fmt.num(x.units)} packs</span><span class="tnum neg"
					>{fmt.inr(-settled)}</span
				>
			</div>{/if}
		{#if gift && given > 0}<div class="row between">
				<span>and the donation's handling and credit, {fmt.num(gift.units)} packs</span><span class="tnum neg"
					>{fmt.inr(-given)}</span
				>
			</div>{/if}
		<div class="row between">
			<b>Better for {W.short}</b><Money
				value={c.claim.total - c.support.total - settled - given}
				size="s"
				style="color: var(--primary-text); font-size: 22px"
			/>
		</div>
	</div>
	<span class="t-caption subtle"
		>The same {fmt.inr(c.actual.swing)} swing as the ledger, seen from {W.short}'s cash: the ₹{dp} credit {first(
			c.dist.short
		)} would have claimed and the ₹{dp} he paid cancel out. At plan prices it is {fmt.inr(c.supportPlan.total)} of support
		and a {fmt.inr(c.plan.swing)} swing.</span
	>
</Card>
