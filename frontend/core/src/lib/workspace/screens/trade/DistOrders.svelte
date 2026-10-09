<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Money from '../../../components/Money.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { cartons, distOf, fmt, shopById } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import InvoiceDraft from './InvoiceDraft.svelte';

	// his orders: the ExpireSoon sale, the invoice draft, and each kirana's scheme order, newest first
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const h = $derived(ws.state.hero);
	const hero = $derived(distOf(me, ws.data, c).id === c.dist.id);
	const rows = $derived(
		h.orders
			.slice()
			.reverse()
			.map((o) => ({ ...o, k: shopById(o.id, c, ws.data.shops) }))
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
						<b>{c.buyer.name}, {c.buyer.city} · ExpireSoon</b>
						<div class="t-footnote muted">
							{c.lines.expiresoon.units} × ₹{c.counter.price.toFixed(2)} · token {fmt.inr(c.award.token)} · balance {fmt.inr(
								c.award.balance
							)}, plus {fmt.inr(c.invoice.igst!)} IGST on your invoice
						</div>
					</div>
					<Money value={c.award.gross} size="s" decimals /></Card
				>{/if}
			{#if h.docs && c.docs.some((d) => d.id === 'invoice')}<InvoiceDraft {h} />{/if}
			{#if rows.length}<div class="list">
					{#each rows as o (o.id)}<div class="list-row" style="grid-template-columns: minmax(0,1fr) auto">
							<span class="stack tight" style="gap: 0"
								><b class="t-subhead">{o.k.name}</b><span class="t-caption subtle"
									>{o.k.area} · {o.at} · buy {c.scheme.buy} get {c.scheme.free}</span
								></span
							><span class="stack tight" style="gap: 0; justify-items: end"
								><span class="tnum strong">{o.units} packets</span><span class="t-caption subtle"
									>{cartons(o.units, c.sku.perCarton)}</span
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
