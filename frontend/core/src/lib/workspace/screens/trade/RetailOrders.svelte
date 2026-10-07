<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Product from '../../../components/Product.svelte';
	import { kOf } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// his order from the scheme, and whether Tuesday's van has brought it
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const k = $derived(kOf(me, c));
	const h = $derived(ws.state.hero);
	const mine = $derived(h.orders.find((o) => o.id === k.id));
</script>

<Screen {me} title="Orders" sub={k.name}>
	{#if mine}<div class="list" style="max-width: 620px">
			<div class="list-row" style="grid-template-columns: 48px minmax(0,1fr) auto">
				<Product name="pack-chips" size={44} /><span class="stack tight" style="gap: 0"
					><b class="t-subhead">Masala Chips 150 g · {mine.units} packets</b><span class="t-caption subtle"
						>{mine.at} · buy 10 get 2 · Tuesday's van</span
					></span
				><Badge size="sm" tone={h.van.status === 'done' ? 'green' : undefined}
					>{h.van.status === 'done' ? 'delivered' : 'on the round'}</Badge
				>
			</div>
		</div>{:else}<Card style="max-width: 620px"
			><Empty
				icon="shopping-basket"
				title="No orders yet"
				body="Orders you place from an offer show here with the van day."
			/></Card
		>{/if}
</Screen>
