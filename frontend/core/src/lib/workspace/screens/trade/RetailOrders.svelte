<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Money from '../../../components/Money.svelte';
	import Product from '../../../components/Product.svelte';
	import { useRoute } from '../../context';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import { offersOf, shopOf, weekday, when } from './pt';

	// a kirana's orders (SC-130, screens/trade.jsx RetailOrders): what each order earned, each naming its tax invoice
	// (SC-153) and opening its offer's page
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const { go } = useRoute();
	const list = $derived(offersOf(ws, me).filter((o) => o.status === 'ordered'));
	const margin = $derived(list.reduce((t, o) => t + (o.m?.margin ?? 0), 0));
	const packets = $derived(list.reduce((t, o) => t + o.units, 0));
	const paid = $derived(list.reduce((t, o) => t + (o.m?.pay ?? 0), 0));
</script>

<Screen {me} title="Orders" sub={shopOf(ws, me)?.name ?? me.org}>
	<div class="stack" style="gap: 16px; max-width: 620px">
		{#if list.length}<Card class="stack" style="gap: 8px"
				><div class="lg-fig"><Money value={margin} size="l" /><span class="lg-what">your margin at MRP</span></div>
				<p class="lg-working">
					{list.length}
					{list.length === 1 ? 'order' : 'orders'} since July, {fmt.num(packets)} packets, {fmt.inr(paid)} paid on {list.length}
					tax {list.length === 1 ? 'invoice' : 'invoices'} from {list[0].dist.short}, GST included.
				</p></Card
			>
			<List
				>{#each list as o (o.ref)}<ListRow
						chevron
						onclick={() => go('offer', { ref: o.ref })}
						title={`${o.sku.name} · ${o.units} packets`}
						>{#snippet sub()}{#if o.invoice}<span class="mono">{o.invoice.no}</span> ·
							{/if}ordered {o.orderedAt ? when(o.orderedAt) : ''}{o.van
								? ` · ${weekday(o.van)}'s van`
								: ' · on the round'}{/snippet}{#snippet leading()}<Product
								name={o.sku.img}
								size={40}
							/>{/snippet}{#snippet value()}<span class="lg-val"
								><b class="tnum">{fmt.inr2(o.m?.margin ?? 0)}</b><em>margin</em></span
							>{/snippet}</ListRow
					>{/each}</List
			>{:else}<Card
				><Empty
					icon="shopping-basket"
					title="No orders yet"
					body="Orders you place from an offer show here with the van day."
				/></Card
			>{/if}
	</div>
</Screen>
