<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';

	// what he receives and what he paid: the price support makes the two equal
	let { settled }: { settled?: boolean } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const recv = $derived(c.lines.kirana.gross + c.award.gross + c.support.total);
	const paid = $derived(c.plan.units * c.sku.dp! + c.support.van + c.support.fee);
	const rows: [string, number][] = $derived([
		[`From ${c.kiranas.length} kiranas (${c.lines.kirana.units} packets)`, c.lines.kirana.gross],
		[`From ${c.buyer.name} (${c.lines.expiresoon.units} packets)`, c.award.gross],
		['Price-support credit note from Munchly', c.support.total]
	]);
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="card-title">You end whole</span><Badge
			tone={settled ? 'green' : undefined}
			icon={settled ? 'check' : 'clock'}>{settled ? 'credit note issued' : 'on the plan'}</Badge
		>
	</div>
	<div class="stack tight t-subhead">
		{#each rows as [k, v] (k)}<div class="row between">
				<span>{k}</span><span class="tnum">{fmt.inr(v)}</span>
			</div>{/each}
		<div class="hairline" style="margin: 4px 0"></div>
		<div class="row between"><b>What you receive</b><span class="tnum strong">{fmt.inr(recv)}</span></div>
		<div class="row between">
			<span>What you paid: {fmt.num(c.plan.units)} × ₹{c.sku.dp}, the van and the listing fee</span><span class="tnum"
				>{fmt.inr(-paid)}</span
			>
		</div>
		<div class="row between">
			<b>Your gain or loss</b><span class="tnum strong">{fmt.inr(Math.round(recv - paid))}</span>
		</div>
	</div>
	<span class="t-caption subtle">Instead of waiting weeks for an expiry claim, with no claim paperwork.</span>
</Card>
