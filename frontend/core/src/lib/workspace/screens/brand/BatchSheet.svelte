<script lang="ts">
	import DaysNum from '../../../components/DaysNum.svelte';
	import GateChips from '../../../components/GateChips.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import { first, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { BatchView } from '../../types';

	// a batch the Watcher sees, in a sheet (the Batches screen's; on the Command Center since SC-90, for a watchlist row
	// with no journey to open): its days, gates and figures, and what happens to it next. An at-risk batch the Watcher
	// has not flagged says when it will be (screens/brand.jsx BatchSheet)
	let { view: sel, onclose }: { view: BatchView | undefined; onclose: () => void } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case);
	const ML = (id: string) => c?.donation.plan.lines.find((l) => l.id === id) || { units: 0 };
	const facts = (b: BatchView): [string, string][] => [
		['Batch', b.id],
		['Distributor', `${b.dist.name}, ${b.dist.city}`],
		['Units', fmt.num(b.units)],
		['Sells', `${b.sellPerDay} a day`],
		['Will sell before the last week', fmt.num(b.assess.willSell)],
		['At risk', b.assess.atRisk ? fmt.num(b.assess.atRisk) : 'none']
	];
	const watch = $derived(ws.state.rules.watchTime);
	const next = $derived(
		!sel
			? ''
			: sel.phase === 'executing' && c
				? `Routed yesterday: ${fmt.num(ML('kirana').units)} packs to ${c.donation.dist.city} kiranas, ${ML('staff').units} to the staff sale at ${first(c.donation.dist.name)}'s godown, ${c.donation.units} to ${c.donation.partner.name}.`
				: sel.phase
					? 'In a journey: the agents are working it, and its Route Room shows where it stands.'
					: sel.assess.status === 'at-risk'
						? `At risk: ${fmt.num(sel.assess.atRisk)} packs will not sell before the last week. The Watcher checks every morning at ${watch}, and flags it once Setup is confirmed and ${sel.dist.name} has given ${ws.data.platform.name} permission to act.`
						: sel.assess.status === 'gated'
							? `Outside at least one quick-commerce gate, but real sell-through clears it in time. The Watcher checks again tomorrow at ${watch}.`
							: 'Inside every gate and selling through. Nothing to do.'
	);
</script>

<Sheet bind:open={() => !!sel, (o) => !o && onclose()} title={sel ? sel.skuObj.name : ''}>
	{#if sel}<div class="stack">
			<div class="row" style="gap: 14px">
				<Product name={sel.skuObj.img} size={88} />
				<div class="stack tight">
					<DaysNum days={sel.daysLeft} life={sel.skuObj.lifeDays} size="l" /><span class="t-footnote subtle"
						>days left · best before {fmt.date(sel.bestBefore)}</span
					>
				</div>
			</div>
			<GateChips gates={sel.assess.gates} />
			<List
				>{#each facts(sel) as [k, val] (k)}<ListRow title={k} value={val} />{/each}</List
			>
			<p class="t-footnote muted">{next}</p>
		</div>{/if}
</Sheet>
