<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Support } from '../../types';

	// what he receives and what he paid: the price support makes the two equal
	let { settled }: { settled?: boolean } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	// what each line brings him (SC-85): the kiranas, the buyer, his staff sale; then the credit note. On the plan, the
	// plan's lines (a distributor is not sent the plan: the plan's credit note rows, which he is); once settled, what
	// each line took, at its price (the credit note's rows), and on expiry day the expiry credit for the packs left at
	// the godown (SC-94). What he paid is for every pack the plan routed
	type Took = { id: string; units: number; gross: number };
	const priced = (rows: Support['rows']): Took[] =>
		rows.map((r) => ({ id: r.id, units: r.units, gross: r.units * r.price }));
	const lines = $derived.by((): Took[] => {
		if (settled) return priced(c.support.rows);
		if (!c.plan.lines.length) return priced(c.supportPlan.rows);
		return c.plan.lines.map((l) =>
			l.id === 'kirana'
				? { id: l.id, units: c.lines.kirana.units, gross: c.lines.kirana.gross }
				: l.id === 'expiresoon'
					? { id: l.id, units: c.lines.expiresoon.units, gross: c.award.gross }
					: { id: l.id, units: l.units, gross: l.gross }
		);
	});
	const writeoff = $derived(c.plan.lines.find((l) => l.id === 'writeoff')?.units ?? 0);
	const units = $derived(
		settled || !c.plan.lines.length
			? lines.reduce((t, l) => t + l.units, 0) + (settled ? (c.realised?.godown ?? 0) : 0) + writeoff
			: c.plan.units
	);
	const paid = $derived(units * c.sku.dp! + c.support.van + c.support.fee);
	const x = $derived(settled && c.expiry && c.expiry.units > 0 && c.expiry.credit ? c.expiry : null);
	const W = $derived(ws.data.workspace.short);
	const rows: [string, number][] = $derived.by(() => {
		const label: Record<string, (n: number) => string> = {
			kirana: (n) => `From ${c.kiranas.length} kiranas (${n} packets)`,
			expiresoon: (n) => `From ${c.buyer.name} (${n} packets)`,
			staff: (n) => `From your staff sale (${n} packets)`
		};
		const out: [string, number][] = lines.filter((l) => label[l.id]).map((l) => [label[l.id](l.units), l.gross]);
		const support = settled || c.support.rows.length ? c.support : c.supportPlan;
		out.push([`Price-support credit note from ${W}`, support.total]);
		if (x) out.push([`Expiry credit note for ${fmt.num(x.units)} packs from ${W}`, x.credit!]);
		return out;
	});
	const recv = $derived(rows.reduce((t, [, v]) => t + v, 0));
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
			<span>What you paid: {fmt.num(units)} × ₹{c.sku.dp}, the van and the listing fee</span><span class="tnum"
				>{fmt.inr(-paid)}</span
			>
		</div>
		<div class="row between">
			<b>Your gain or loss</b><span class="tnum strong">{fmt.inr(Math.round(recv - paid))}</span>
		</div>
	</div>
	<span class="t-caption subtle">Instead of waiting weeks for an expiry claim, with no claim paperwork.</span>
</Card>
