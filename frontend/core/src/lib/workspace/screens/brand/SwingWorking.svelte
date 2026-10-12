<script lang="ts">
	import { fmt } from '../../../format';
	import Icon from '../../../icons/Icon.svelte';
	import { useWorkspace } from '../../source';
	import { exitHow, type Swing } from '../../swing';
	import SwingBridge from './SwingBridge.svelte';

	// how the swing adds up (SC-195, option A; screens/brand.jsx SwingWorking): the swing, the bridge, the bin's cost
	// line by line, what each exit did, the P&L with the plan, the swing as a sum, and how the loss was kept small
	let { w }: { w: Swing } = $props();
	const ws = useWorkspace();
	const short = $derived((ws.publicInfo?.workspace ?? ws.data.workspace).short);
	const wo = $derived(w.wo);
	const first = $derived(w.exits.slice().sort((a, b) => b.perPack - a.perPack)[0]);
	const per = (v: number, u: number) => `₹${(v / u).toFixed(2)}`;
	const signed = (v: number) => (v < 0 ? '' : '+') + fmt.inr2(v);
</script>

{#snippet row(k: string, sub: string | null, v: string, strong = false, tone = '')}<div class="sw-row" class:strong>
		<span class="k"
			><span>{k}</span>{#if sub}<span class="sub">{sub}</span>{/if}</span
		><span class="v tnum {tone}">{v}</span>
	</div>{/snippet}

<div class="sw-work">
	<div class="sw-hero">
		<span class="t-caption subtle">The swing on {w.batch.id}</span>
		<span class="sw-big tnum">{fmt.inr2(w.swing)}</span>
		<p>
			Sending the batch to its exits left {short}
			<span class="nw">{fmt.inr2(w.swing)}</span> better off than destroying it: a P&amp;L of
			<span class="nw">{fmt.inr2(w.pnl)}</span> instead of <span class="nw">{fmt.inr2(-wo.total)}</span>.
		</p>
	</div>
	<SwingBridge {w} />
	<section>
		<h3>If it were destroyed</h3>
		{@render row('Stock written off at cost', `${fmt.num(wo.units)} × ₹${w.sku.cost.toFixed(2)}`, fmt.inr2(-wo.stock))}
		{@render row('GST input credit reversed', `${fmt.num(wo.units)} × ₹${wo.itcPerUnit.toFixed(2)}`, fmt.inr2(-wo.itc))}
		{@render row('Disposal', `${fmt.num(wo.units)} × ${per(wo.disposal, wo.units)}`, fmt.inr2(-wo.disposal))}
		{@render row('EPR', `${wo.kg.toLocaleString('en-IN')} kg × ${per(wo.epr, wo.kg)}`, fmt.inr2(-wo.epr))}
		{@render row('The bin would cost', `₹${wo.perUnit.toFixed(2)} a pack`, fmt.inr2(-wo.total), true, 'gone')}
	</section>
	<section>
		<h3>What the plan did</h3>
		{#each w.exits as e (e.id)}{@render row(e.name, exitHow(e), signed(e.net), false, e.net < 0 ? 'gone' : '')}{/each}
		{@render row('Recovered', null, fmt.inr2(w.net), true, 'kept')}
		{@render row(
			'The stock leaves the books at cost',
			`either way: ${fmt.num(w.units)} × ₹${w.sku.cost.toFixed(2)}`,
			fmt.inr2(-w.book)
		)}
		{#if Math.abs(w.leftCost) >= 0.01}{@render row(
				'The packs left at the godown',
				`${fmt.num(w.left)} packs no exit took: what destroying them cost`,
				fmt.inr2(w.leftCost),
				false,
				'gone'
			)}{/if}
		{@render row('The P&L with the plan', null, fmt.inr2(w.pnl), true)}
	</section>
	<section>
		<h3>The swing</h3>
		<p class="sw-sum tnum">{fmt.inr2(w.pnl)} − ({fmt.inr2(-wo.total)}) = <b>{fmt.inr2(w.swing)}</b></p>
		<p class="t-footnote muted">
			Put another way: {fmt.inr2(w.net)} recovered, plus the {fmt.inr2(w.notPaid)} destroying it would have cost beyond the
			stock (the GST credit, disposal and EPR), which nobody paid.
		</p>
	</section>
	<section>
		<h3>How the loss was kept small</h3>
		<ul class="sw-why">
			{#if first}<li>
					<Icon name="route" size={16} /><span
						>The Router filled the best-paying exit first: the {first.name.toLowerCase()} at
						<span class="nw">{fmt.inr2(first.perPack)}</span> a pack, net, against
						<span class="nw">{fmt.inr2(-wo.perUnit)}</span> a pack in the bin.</span
					>
				</li>{/if}
			{#each w.out.slice(0, 2) as r (r.id)}<li>
					<Icon name="circle-x" size={16} /><span>{r.short || r.name} was left out: {r.reason}.</span>
				</li>{/each}
			<li>
				<Icon name="receipt" size={16} /><span
					>The GST input credit stays on the {fmt.num(w.sold)} packs sold{w.given
						? `; only the ${fmt.num(w.given)} donated packs reverse theirs (${fmt.inr2(w.itcLost)})`
						: ''}.</span
				>
			</li>
			{#if w.left}<li>
					<Icon name="warehouse" size={16} /><span
						>{fmt.num(w.left)} packs no exit took were left at the godown and destroyed there; every other pack went somewhere.</span
					>
				</li>{:else}<li>
					<Icon name="recycle" size={16} /><span>No disposal or EPR to pay: every pack went somewhere.</span>
				</li>{/if}
		</ul>
	</section>
	<p class="t-caption subtle">
		Worked out from {short}'s cost sheet and the platform's rules, as the Valuer prices every exit.
	</p>
</div>
