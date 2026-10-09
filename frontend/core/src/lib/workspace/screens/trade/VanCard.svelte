<script lang="ts">
	import { untrack } from 'svelte';
	import { useApp } from '../../../app.svelte';
	import { useNotice } from '../../../notice.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import ClusterMap from '../../../components/ClusterMap.svelte';
	import Roll from '../../../components/Roll.svelte';
	import { prefersReducedMotion } from '../../../motion';
	import type { DistJourney, DistNow } from '../../dist';
	import { cartons, clusterOf } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Kirana } from '../../types';
	import DistChan from './DistChan.svelte';

	// a batch's van round, the kirana scheme's (SC-133, screens/trade.jsx VanCard): the batch's own cluster with the
	// shops that ordered, the van on its way, and Start the round once the papers are drafted (the van runs once the
	// batch is settled, SC-97)
	let { j, n }: { j: DistJourney; n: DistNow } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const { toast } = useNotice();
	const c = $derived(ws.case);
	// the batch in focus has its shops; the stub's second batch draws every shop its distributor's scheme goes to
	const kiranas = $derived<Kirana[]>(
		n.from === 'focus' && c
			? c.kiranas
			: (ws.data.shops ?? [])
					.filter((k) => k.distributor === j.dist.id)
					.map((k) => ({ id: k.id, name: k.name, area: k.area, units: k.sales14 * ws.data.rules.shopCapTimes, at: '' }))
	);
	const o = $derived(n.offer ?? { open: false, offered: kiranas.length, shops: 0, units: 0 });
	const can = $derived(n.papers && o.shops > 0 && !n.van);
	let p = $state(untrack(() => (n.van ? 1 : 0)));
	let running = $state(false);
	$effect(() => {
		if (n.van && !untrack(() => running)) p = 1;
	});
	const per = $derived(j.sku.perCarton);
	// the van drives the round on the map, then the round is done
	const start = () => {
		running = true;
		const t0 = performance.now();
		const dur = prefersReducedMotion.current ? 10 : 3600;
		const step = (now: number) => {
			const k = Math.min(1, (now - t0) / dur);
			p = k;
			if (k < 1) requestAnimationFrame(step);
			else {
				running = false;
				void ws.act('vanRound', undefined, { ref: n.ref });
				toast({ text: `Round done · ${o.shops} shops, ${cartons(o.units, per)}`, tone: 'ok' });
			}
		};
		requestAnimationFrame(step);
	};
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><DistChan id="kirana" icon="route" /><span class="card-title"
				>{n.round ? `${n.round.day} van round` : 'Van round'}</span
			></span
		><Badge tone={n.van ? 'green' : undefined} icon={n.van ? 'check' : 'calendar'}
			>{n.van
				? 'delivered'
				: n.round
					? `${n.round.date} · from ${n.round.leaves}`
					: o.open
						? 'once the scheme closes'
						: 'once the papers are drafted'}</Badge
		>
	</div>
	<div class="dist-map">
		<ClusterMap
			{...clusterOf(j.dist)}
			total={o.offered}
			{kiranas}
			orderedCount={o.shops}
			route={o.shops > 0}
			vanProgress={p}
			height={app.bp === 'phone' ? 220 : 320}
		/>
	</div>
	<div class="row wrap" style="gap: 24px">
		<div class="stack tight" style="gap: 0">
			<span class="num m"
				><Roll value={o.shops} /><span class="subtle" style="font-size: 0.45em"> / {o.offered}</span></span
			><span class="t-footnote subtle">shops on the round</span>
		</div>
		<div class="stack tight" style="gap: 0">
			<span class="num m"><Roll value={o.units} /></span><span class="t-footnote subtle"
				>packets · {cartons(o.units, per)}</span
			>
		</div>
	</div>
	{#if !n.van}<Button
			variant="primary"
			size="lg"
			icon="navigation"
			loading={running}
			disabled={!can || running}
			onclick={start}
			>{can
				? 'Start the round'
				: o.open
					? `Waiting for orders · ${o.shops} of ${o.offered}`
					: !o.shops
						? 'No shop ordered'
						: 'Runs once the papers are drafted'}</Button
		>{/if}
	<span class="t-caption subtle"
		>₹{ws.data.rules.vanPerUnit.toFixed(2)} a packet for the van, repaid by {ws.data.workspace.short} in the price support.</span
	>
</Card>
