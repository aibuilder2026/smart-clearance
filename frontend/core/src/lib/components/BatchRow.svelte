<script lang="ts">
	import Icon from '../icons/Icon.svelte';
	import { fmt } from '../format';
	import type { BatchView } from '../workspace/types';
	import Countdown from './Countdown.svelte';
	import GateChips from './GateChips.svelte';
	import Product from './Product.svelte';
	import SellBar from './SellBar.svelte';
	import StatusBadge from './StatusBadge.svelte';

	// a batch as a row of the watchlist: its pack, state, days left and the gates; list and map share the selection
	// (the kit's BatchRow)
	type Props = { view: BatchView; onopen?: () => void; selected?: boolean; compact?: boolean };
	let { view, onopen, selected, compact }: Props = $props();
	const a = $derived(view.assess);
	const sku = $derived(view.skuObj);
	const phase = $derived(view.phase);
	// a gated batch that sells through (SC-83, option C): the days its packs take to sell at today's rate against the
	// days retailers still take it (money.js's usable days), and how many days that leaves
	const st = $derived.by(() => {
		if (phase || a.status !== 'gated' || a.atRisk > 0) return null;
		const sell = Math.ceil(view.units / view.sellPerDay);
		const spare = a.usableDays - sell;
		const words =
			spare > 0
				? `Sells out ${spare} ${spare === 1 ? 'day' : 'days'} before retailers stop`
				: 'Sells out the day retailers stop';
		return { sell, usable: a.usableDays, words };
	});
</script>

<button
	type="button"
	class="list-row batchrow"
	onclick={onopen}
	aria-current={selected ? 'true' : undefined}
	style:background={selected ? 'var(--fill)' : undefined}
>
	<Product name={sku.img} size={compact ? 46 : 54} alt="" />
	<span class="br-main">
		<span class="br-line"
			><span class="lr-title br-name">{sku.name}</span><StatusBadge
				status={phase || a.status}
				live={phase === 'executing' || (!phase && a.status === 'at-risk')}
			/></span
		>
		<span class="lr-sub br-name"
			>{view.dist.name} · {view.dist.city}{#if !compact}<span class="mono br-id"> · {view.id}</span>{/if}</span
		>
		<span class="br-bar"
			>{#if st}<SellBar days={view.daysLeft} sell={st.sell} usable={st.usable} />{:else}<Countdown
					days={view.daysLeft}
					life={sku.lifeDays}
					status={phase ? '' : a.status}
				/>{/if}<span class="t-caption subtle tnum">{view.daysLeft} days left</span>{#if st}<span
					class="t-caption br-ok tnum">{st.words}</span
				>{:else if a.atRisk > 0 && !phase}<span class="t-caption neg strong tnum">{fmt.num(a.atRisk)} at risk</span
				>{/if}</span
		>
	</span>
	{#if !compact}<span class="not-phone br-gates"
			><GateChips gates={a.gates} size="sm" quiet={(phase || a.status) !== 'at-risk'} /></span
		>{/if}
	<Icon name="chevron-right" size={18} class="chev" />
</button>
