<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Money from '../../../components/Money.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { D, ES, INVOICE } from '../../data';
	import { fmt } from '../../model';
	import { cartons, distOf } from '../../legacy';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import InvoiceDraft from './InvoiceDraft.svelte';

	// his orders: the ExpireSoon sale, the invoice draft, and each kirana's scheme order, newest first
	let { me }: { me: User } = $props();
	const h = $derived(store.state.hero);
	const hero = $derived(distOf(me).id === 'rakesh');
	const rows = $derived(
		h.orders
			.slice()
			.reverse()
			.map((o) => ({ ...o, k: D.kiranas.find((k) => k.id === o.id)! }))
	);
</script>

{#if !hero}<Screen {me} title="Orders" sub="Scheme orders and marketplace sales"
		><Card style="max-width: 560px"
			><Empty
				img="van"
				title="No orders yet"
				body="Kirana orders from offers and marketplace awards for your stock appear here."
			/></Card
		></Screen
	>{:else}<Screen {me} title="Orders" sub="Scheme orders and marketplace sales">
		<div class="stack" style="gap: 16px">
			{#if h.award}<Card class="row wrap" style="gap: 14px"
					><span class="icontile violet"><Icon name="shopping-bag" size={17} stroke={2} /></span>
					<div class="grow">
						<b>{D.buyer.name}, {D.buyer.city} · ExpireSoon</b>
						<div class="t-footnote muted">
							{ES.units} × ₹{D.counter.price.toFixed(2)} · token {fmt.inr(D.award.token)} · balance {fmt.inr(
								D.award.balance
							)}, plus {fmt.inr(INVOICE.igst!)} IGST on your invoice
						</div>
					</div>
					<Money value={D.award.gross} size="s" decimals /></Card
				>{/if}
			{#if h.docs}<InvoiceDraft {h} />{/if}
			{#if rows.length}<div class="list">
					{#each rows as o (o.id)}<div class="list-row" style="grid-template-columns: minmax(0,1fr) auto">
							<span class="stack tight" style="gap: 0"
								><b class="t-subhead">{o.k.name}</b><span class="t-caption subtle"
									>{o.k.area} · {o.at} · buy 10 get 2</span
								></span
							><span class="stack tight" style="gap: 0; justify-items: end"
								><span class="tnum strong">{o.units} packets</span><span class="t-caption subtle"
									>{cartons(o.units)}</span
								></span
							>
						</div>{/each}
				</div>{:else}<Card
					><Empty
						img="van"
						title="No scheme orders yet"
						body="When a kirana taps the offer, the order lands here and joins your next van round."
					/></Card
				>{/if}
		</div>
	</Screen>{/if}
