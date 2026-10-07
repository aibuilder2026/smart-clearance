<script lang="ts">
	import { Badge, Icon, Mark, Money, cx, fmt } from '@smart-clearance/core';
	import type { Figures } from './figures';
	import { BEFORE } from './scene';

	/** the phone's screen on the table: the plan being built while the first agents work, the plan waiting for the yes,
	 *  then placed, with the agents the yes released lighting as they work (design3/site PhoneScreen) */
	let { f, phase, lit }: { f: Figures; phase: 'building' | 'plan' | 'placed'; lit: number } = $props();
	const sc = $derived(f.scene);
	const before = $derived(BEFORE.map((id) => f.agents[id]));
</script>

<div class="ps" aria-hidden="true">
	<div class="top">
		<span class="who"><Mark size={24} /><b>Route Room</b></span>{#if phase === 'placed'}<Badge tone="green" icon="check"
				>Placed · 09:40</Badge
			>{:else if phase === 'plan'}<Badge tone="amber" dot>Waiting for you</Badge>{:else}<Badge tone="red" dot
				>At risk</Badge
			>{/if}
	</div>
	{#if phase === 'placed'}
		<div class="placed">
			<span class="t">Plan placed</span><Money value={sc.swing} />
			<p>better than the bin, on one batch of chips.</p>
		</div>
		<div class="work">
			{#each sc.after as a, i (a.id)}<span class={cx('w', i < lit && 'on')}
					><i><Icon name={a.icon} size={11} stroke={2.4} /></i><b>{a.name}</b><span>· {a.did}</span></span
				>{/each}
		</div>
	{:else if phase === 'building'}
		<h4>{sc.product}</h4>
		<div class="big">
			<span class="num red">{fmt.num(sc.atRisk)}</span><span>packs won't sell in the {sc.daysLeft} days left</span>
		</div>
		<div class="work">
			{#each before as a, i (a.id)}<span class={cx('w', i < lit && 'on')}
					><i><Icon name={a.icon} size={11} stroke={2.4} /></i><b>{a.name}</b><span
						>· {i < lit ? a.did : 'waiting'}</span
					></span
				>{/each}
		</div>
	{:else}
		<h4>Approve the plan</h4>
		<div class="big"><Money value={sc.planNet} /><span>net recovered, {sc.pctMRP}% of MRP</span></div>
		<div>
			<div class="r"><span>Instead of destroying</span><b class="red">{fmt.inr(-sc.bin)}</b></div>
			<div class="r"><span>{fmt.num(sc.kiranas)} packs to {sc.shops} kiranas</span><b>{fmt.inr(sc.kiranaNet)}</b></div>
			<div class="r"><span>{fmt.num(sc.buyer)} packs on ExpireSoon</span><b>{fmt.inr(sc.buyerNet)}</b></div>
		</div>
		<span class="btn btn-approve btn-lg"><Icon name="check" size={18} />Approve · release the agents</span>
	{/if}
</div>
