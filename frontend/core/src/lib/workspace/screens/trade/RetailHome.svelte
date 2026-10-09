<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import { useNotice } from '../../../notice.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { fmt, kOf } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import OfferCard from './OfferCard.svelte';
	import OfferStatus from './OfferStatus.svelte';
	import { day, offersOf, shopOf, when } from './pt';

	// a kirana's offers (SC-130, option A; screens/trade.jsx RetailHome): the open one first, with Not this time, then
	// every earlier offer, ordered, declined or expired, each opening on what was offered and what came of it; and the
	// shop's details
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case);
	const { go } = useRoute();
	const { toast } = useNotice();
	const shop = $derived(shopOf(ws, me));
	const dist = $derived(shop ? ws.data.distributors[shop.distributor] : c?.dist);
	const k = $derived(
		c ? kOf(me, c, shop, ws.data.rules.shopCapTimes) : { name: shop?.name ?? me.org, area: shop?.area ?? '' }
	);
	const list = $derived(offersOf(ws, me));
	const now = $derived(list.find((o) => o.story));
	// the offer at the top: one still open (declined or not), or his order while it is on its way
	const top = $derived(now && (now.status === 'ordered' || now.open) ? now : null);
	const earlier = $derived(list.filter((o) => o !== top));
	const no = async () => {
		if (!shop) return;
		await ws.act('decline', shop.id);
		toast({ text: `Declined · ${dist?.short}'s next scheme still comes to you` });
	};
	const rows = $derived<[string, string][]>([
		['Distributor', dist ? `${dist.name}, ${dist.city}` : ''],
		...(c
			? ([
					['Van day', c.van.day],
					['Unsold scheme packs', `back to the salesman until ${fmt.day(c.returnBy)}`]
				] as [string, string][])
			: []),
		['Language', 'हिन्दी · English']
	]);
</script>

<Screen {me} title="Offers" sub={dist ? `${k.name} · ${k.area}, ${dist.city}` : me.org}>
	<div class="stack" style="gap: 16px; max-width: 620px">
		{#if top && top.status === 'open'}<OfferCard shop={k.name} onopen={() => go('offer')} /><Button
				variant="ghost"
				size="lg"
				block
				onclick={no}>Not this time</Button
			>{:else if top && top.status === 'ordered'}<Card class="stack snug"
				><div class="row" style="gap: 14px">
					<Product name={top.sku.img} size={64} />
					<div class="grow">
						<b>Ordered · {top.units} packets</b>
						<div class="t-footnote muted">
							{top.sku.name} · placed {top.orderedAt?.slice(11)} · comes on {c?.van.day}'s van
						</div>
					</div>
					<Badge tone="green" icon="check">confirmed</Badge>
				</div></Card
			>{:else if top && top.status === 'declined'}<Card class="stack snug"
				><div class="row" style="gap: 14px">
					<Product name={top.sku.img} size={64} />
					<div class="grow">
						<b>You said not this time</b>
						<div class="t-footnote muted">
							{top.sku.name} · declined {when(top.declinedAt!)}. The offer stays open until {when(top.closed)} if you change
							your mind.
						</div>
					</div>
				</div>
				<Button variant="secondary" block onclick={() => go('offer')}>Order after all</Button></Card
			>{:else}<Card
				><Empty
					img="kirana"
					title="No open offer"
					body={`${dist?.short ?? 'Your distributor'}'s schemes arrive here as a notification, in Hindi, ready to order in one tap.`}
				/></Card
			>{/if}
		{#if earlier.length}<List head="Earlier offers"
				>{#each earlier as o (o.ref)}<ListRow
						chevron
						onclick={() => go('offer', { ref: o.ref })}
						title={o.sku.name}
						sub={`${day(o.sent)} · ${o.dist.short} · ₹${o.pack.toFixed(2)} a packet`}
						>{#snippet leading()}<Product name={o.sku.img} size={40} />{/snippet}{#snippet value()}<OfferStatus
								{o}
								size="sm"
							/>{/snippet}</ListRow
					>{/each}</List
			>{/if}
		<SectionTitle>Your shop</SectionTitle>
		<List
			>{#each rows as [t, v] (t)}{#if t === 'Language'}<ListRow title={t}
						>{#snippet value()}<span lang="hi">{v}</span>{/snippet}</ListRow
					>{:else}<ListRow title={t} value={v} />{/if}{/each}</List
		>
	</div>
</Screen>
