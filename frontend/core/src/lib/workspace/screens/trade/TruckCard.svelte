<script lang="ts">
	import { useNotice } from '../../../notice.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import HaulLine from '../../../components/HaulLine.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import type { DistJourney, DistNow, DistWorld } from '../../dist';
	import { cartons, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import DistChan from './DistChan.svelte';

	// a batch's ExpireSoon lot and the buyer's truck (SC-133, screens/trade.jsx TruckCard): it loads once the buyer has
	// won the lot and the kirana scheme is over (SC-118)
	let { j, n, w }: { j: DistJourney; n: DistNow; w: DistWorld } = $props();
	const ws = useWorkspace();
	const { toast } = useNotice();
	const es = $derived(n.lines.find((l) => l.id === 'expiresoon')!);
	const schemeOpen = $derived(n.lines.some((l) => l.id === 'kirana') && (!n.offer || n.offer.open));
	const per = $derived(j.sku.perCarton);
	const balance = $derived(n.award ? Math.round((es.units * n.award.price - n.award.token) * 100) / 100 : 0);
	const dispatch = () => {
		void ws.act('dispatch', undefined, { ref: n.ref });
		toast({ text: `${w.buyer.city} lot on the buyer's truck · invoice draft next`, tone: 'ok' });
	};
	const rows = $derived<[string, string][]>([
		['Buyer', n.award ? `${w.buyer.name}, ${w.buyer.city}` : 'whoever takes the lot'],
		['Lot', `${n.listing ? `${n.listing.id} · ` : ''}${fmt.num(es.units)} packs · ${cartons(es.units, per)}`],
		['Price', n.award ? `${fmt.rate(n.award.price)} a pack, the counter he took` : `${fmt.rate(es.price)} asked`],
		['Token', n.award ? `${fmt.inr(n.award.token)} received` : 'paid when a buyer takes it'],
		['Balance', n.award ? `${fmt.inr(balance)} before loading` : 'paid before loading'],
		['Freight', "the buyer's own truck"]
	]);
</script>

<div data-anchor="lot"></div>
<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><DistChan id="expiresoon" icon="truck" /><span class="card-title">The buyer's truck · ExpireSoon</span></span
		><Badge tone={n.truck ? 'blue' : n.award ? 'green' : 'violet'}
			>{n.truck ? 'collected' : n.award ? 'sold' : n.listing ? 'listed' : 'not listed yet'}</Badge
		>
	</div>
	<HaulLine progress={n.truck ? (n.phase === 'settled' || n.phase === 'cleared' ? 1 : 0.55) : 0} />
	<List
		>{#each rows as [k, v] (k)}<ListRow title={k} value={v} />{/each}</List
	>
	{#if !n.truck}<Button variant="primary" size="lg" icon="truck" disabled={!n.award || schemeOpen} onclick={dispatch}
			>{!n.award
				? 'Load after the award'
				: schemeOpen
					? 'Load once the scheme closes'
					: "Load the buyer's truck"}</Button
		>{/if}
	<span class="t-caption subtle">Your staff load it as normal godown work, once the balance lands.</span>
</Card>
