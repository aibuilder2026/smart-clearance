<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { D } from '../../data';
	import { fmt } from '../../model';
	import { kOf } from '../../legacy';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import OfferCard from './OfferCard.svelte';

	// Ganesh ji's offers: the scheme from Rakesh Traders until he orders, then his order; and his shop's details
	let { me }: { me: User } = $props();
	const { go } = useRoute();
	const h = $derived(store.state.hero);
	const k = $derived(kOf(me));
	const mine = $derived(h.orders.find((o) => o.id === k.id));
	const shop: [string, string][] = [
		['Distributor', 'Rakesh Traders, Nagpur'],
		['Van day', 'Tuesday'],
		['Unsold scheme packs', `back to the salesman until ${fmt.day(D.returnBy)}`],
		['Language', 'हिन्दी · English']
	];
</script>

<Screen {me} title="Offers" sub={`${k.name} · ${k.area}, Nagpur`}>
	<div class="stack" style="gap: 16px; max-width: 620px">
		{#if h.offer}{#if mine}<Card class="stack snug"
					><div class="row" style="gap: 14px">
						<Product name="pack-chips" size={64} />
						<div class="grow">
							<b>Ordered · {mine.units} packets</b>
							<div class="t-footnote muted">Masala Chips 150 g · placed {mine.at} · comes on Tuesday's van</div>
						</div>
						<Badge tone="green" icon="check">confirmed</Badge>
					</div></Card
				>{:else}<OfferCard shop={k.name} onopen={() => go('offer')} />{/if}{:else}<Card
				><Empty
					img="kirana"
					title="No offers today"
					body="Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap."
				/></Card
			>{/if}
		<SectionTitle>Your shop</SectionTitle>
		<List
			>{#each shop as [t, v] (t)}{#if t === 'Language'}<ListRow title={t}
						>{#snippet value()}<span lang="hi">{v}</span>{/snippet}</ListRow
					>{:else}<ListRow title={t} value={v} />{/if}{/each}</List
		>
	</div>
</Screen>
