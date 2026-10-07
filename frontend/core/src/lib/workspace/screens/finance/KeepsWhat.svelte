<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Money from '../../../components/Money.svelte';
	import { CHIPS, D, KL, PLAN } from '../../data';
	import { fmt } from '../../model';

	// the same batch read from each side: the distributor ends whole, and Munchly pays less than a claim
	// (screens/finance.jsx KeepsWhat)
	const dp = CHIPS.dp!;
	const recv = KL.gross + D.award.gross + D.support.total;
	const paid = PLAN.units * dp + D.support.van + D.support.fee;
</script>

<Card class="stack snug">
	<span class="card-title">Who keeps what</span>
	<div class="stack tight t-subhead">
		<div class="row between">
			<span>{D.distributors.rakesh.name} receives</span><span class="tnum">{fmt.inr(recv)}</span>
		</div>
		<div class="row between">
			<span>and paid {fmt.num(PLAN.units)} × ₹{dp}, the van and the fee</span><span class="tnum">{fmt.inr(-paid)}</span>
		</div>
		<div class="row between">
			<b>He ends whole</b><span class="tnum strong">{fmt.inr(Math.round(recv - paid))}</span>
		</div>
		<div class="hairline" style="margin: 4px 0"></div>
		<div class="row between">
			<span>Expiry claim Munchly avoids</span><span class="tnum">{fmt.inr(D.claim.total)}</span>
		</div>
		<div class="row between">
			<span>Price support it pays instead</span><span class="tnum neg">{fmt.inr(-D.support.total)}</span>
		</div>
		<div class="row between">
			<b>Better for Munchly</b><Money
				value={D.claim.total - D.support.total}
				size="s"
				style="color: var(--primary-text); font-size: 22px"
			/>
		</div>
	</div>
	<span class="t-caption subtle"
		>The same {fmt.inr(D.actual.swing)} swing as the ledger, seen from Munchly's cash: the ₹{dp} credit Rakesh would have
		claimed and the ₹{dp} he paid cancel out. At plan prices it is {fmt.inr(D.supportPlan.total)} of support and a {fmt.inr(
			PLAN.swing
		)} swing.</span
	>
</Card>
