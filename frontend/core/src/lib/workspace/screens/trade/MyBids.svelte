<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Product from '../../../components/Product.svelte';
	import { useRoute } from '../../context';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import EsBar from './EsBar.svelte';

	// Agrawal ji's bids, each with the seller's reply; a bid opens its lot
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const { go } = useRoute();
	const h = $derived(ws.state.hero);
</script>

<div class="esw">
	<Screen {me} title="My bids" sub={`${c.buyer.name} · ${c.buyer.city}`}
		><div class="stack" style="gap: 16px">
			<EsBar />
			{#if h.bids.length}<div class="list" data-x="bids">
					{#each h.bids as b (b.id)}<button
							type="button"
							class="list-row"
							onclick={() => go('listing')}
							style="grid-template-columns: 48px minmax(0,1fr) auto; text-align: left; width: 100%"
							><Product name="pack-chips" size={44} /><span class="stack tight" style="gap: 0"
								><b class="t-subhead">ES-24117 · Masala Chips 150 g · {c.lines.expiresoon.units} units</b><span
									class="t-caption subtle"
									>bid ₹{b.price.toFixed(2)} · {b.at}{b.counter ? ` · counter ₹${b.counter.toFixed(2)}` : ''}</span
								></span
							><Badge size="sm" tone={b.status === 'accepted' ? 'green' : 'violet'}
								>{b.status === 'accepted' ? 'won' : b.status}</Badge
							></button
						>{/each}
				</div>{:else}<Card
					><Empty
						img="marketplace-bag"
						title="No bids yet"
						body="Bids you place show here with the seller's reply."
					/></Card
				>{/if}
		</div></Screen
	>
</div>
