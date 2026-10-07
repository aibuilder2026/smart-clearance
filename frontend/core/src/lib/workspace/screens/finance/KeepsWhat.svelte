<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Money from '../../../components/Money.svelte';
	import { castOf, first, fmt } from '../../model';
	import { useWorkspace } from '../../source';

	const ws = useWorkspace();
	const c = $derived(ws.case!);

	// the same batch read from each side: the distributor ends whole, and Munchly pays less than a claim
	// (screens/finance.jsx KeepsWhat)
	const dp = $derived(c.sku.dp!);
	const recv = $derived(c.lines.kirana.gross + c.award.gross + c.support.total);
	const paid = $derived(c.plan.units * dp + c.support.van + c.support.fee);
	const W = $derived(ws.data.workspace);
</script>

<Card class="stack snug">
	<span class="card-title">Who keeps what</span>
	<div class="stack tight t-subhead">
		<div class="row between">
			<span>{c.dist.name} receives</span><span class="tnum">{fmt.inr(recv)}</span>
		</div>
		<div class="row between">
			<span>and paid {fmt.num(c.plan.units)} × ₹{dp}, the van and the fee</span><span class="tnum"
				>{fmt.inr(-paid)}</span
			>
		</div>
		<div class="row between">
			<b>He ends whole</b><span class="tnum strong">{fmt.inr(Math.round(recv - paid))}</span>
		</div>
		<div class="hairline" style="margin: 4px 0"></div>
		<div class="row between">
			<span>Expiry claim {W.short} avoids</span><span class="tnum">{fmt.inr(c.claim.total)}</span>
		</div>
		<div class="row between">
			<span>Price support it pays instead</span><span class="tnum neg">{fmt.inr(-c.support.total)}</span>
		</div>
		<div class="row between">
			<b>Better for {W.short}</b><Money
				value={c.claim.total - c.support.total}
				size="s"
				style="color: var(--primary-text); font-size: 22px"
			/>
		</div>
	</div>
	<span class="t-caption subtle"
		>The same {fmt.inr(c.actual.swing)} swing as the ledger, seen from {W.short}'s cash: the ₹{dp} credit {first(
			castOf(ws.state, c).distributor.short
		)} would have claimed and the ₹{dp} he paid cancel out. At plan prices it is {fmt.inr(c.supportPlan.total)} of support
		and a {fmt.inr(c.plan.swing)} swing.</span
	>
</Card>
