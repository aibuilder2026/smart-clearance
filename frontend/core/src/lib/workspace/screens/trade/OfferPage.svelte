<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { PtOffer, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import OfferStatus from './OfferStatus.svelte';
	import PtHead from './PtHead.svelte';
	import PtLine from './PtLine.svelte';
	import { day, weekday, when } from './pt';
	import PaperSheet from './PaperSheet.svelte';

	// an offer's own page (SC-130, screens/trade.jsx OfferPage): what came of it, and what was offered; an order's figures
	// as its tax invoice has them, and the invoice itself (SC-153)
	let { me, o }: { me: User; o: PtOffer } = $props();
	const ws = useWorkspace();
	let open = $state(false);
	// the scheme and how long an offer stays open, as the workspace's rules have them
	const sc = $derived(ws.data.rules.scheme);
	const hours = $derived(ws.state.rules.offerWindowHours);
	const why = $derived(
		o.status === 'declined'
			? `You declined on ${when(o.declinedAt!)}`
			: o.why === 'filled'
				? `The scheme filled on ${when(o.closed)} before you ordered`
				: `Its ${hours} hours ended on ${when(o.closed)}`
	);
</script>

{#snippet badge()}<OfferStatus {o} size="sm" />{/snippet}
{#snippet head()}<PtHead
		sku={o.sku}
		id={o.ref}
		where={`From ${o.dist.short}`}
		{badge}
		line={`Sent ${when(o.sent)}`}
	/>{/snippet}
<Screen {me} title={o.sku.name} back="Offers" below={head} hideLarge>
	<div class="stack" style="gap: 16px; max-width: 620px">
		{#if o.status === 'ordered' && o.m}<Card class="stack snug">
				<div class="card-head">
					<span class="card-title">Your order</span><Badge tone="green" icon="check"
						>{o.van ? `delivered ${weekday(o.van)}` : 'on the round'}</Badge
					>
				</div>
				<div class="stack tight">
					<PtLine k={`You ordered ${o.units} packets`} sub={o.orderedAt ? when(o.orderedAt) : null} v="" />
					<PtLine
						k="Before GST"
						sub={`${o.units} × ₹${o.m.rate.toFixed(2)}, less the scheme's ${o.m.discountPct}%`}
						v={fmt.inr2(o.m.taxable)}
					/>
					<PtLine k="GST" sub={`CGST ${o.m.gstPct / 2}% + SGST ${o.m.gstPct / 2}%`} v={fmt.inr2(o.m.tax)} />
					<PtLine k="You paid" sub="the invoice, to the rupee" v={fmt.inr(o.m.pay)} />
					<PtLine k="You sell at MRP" sub={`${o.units} × ₹${o.mrp}`} v={fmt.inr(o.m.sell)} />
					<div class="hairline" style="margin: 4px 0"></div>
					<PtLine k="Your margin" v={fmt.inr2(o.m.margin)} strong />
				</div>
				{#if o.invoice}<div class="pt-papers">
						<button type="button" class="pt-paper" onclick={() => (open = true)}>
							<span class="icontile"><Icon name="receipt" size={17} stroke={2} /></span>
							<span class="grow"
								><b>Tax invoice</b><span class="t-footnote muted"
									><span class="mono">{o.invoice.no}</span> · {o.dist.short} issued it · paid on delivery</span
								></span
							>
							<span class="tnum strong">{fmt.inr(o.invoice.total)}</span><Icon
								name="chevron-right"
								size={16}
								class="subtle"
							/>
						</button>
					</div>{/if}
				{#if o.van}<span class="t-footnote subtle"
						>Delivered on {weekday(o.van)}'s van, {day(o.van)} · paid on delivery to {o.dist.short}</span
					>{/if}
			</Card>{:else}<Card class="row top" style="gap: 14px"
				><span class="icontile soft"><Icon name={o.status === 'declined' ? 'x' : 'clock'} size={18} /></span>
				<div class="grow">
					<b>{o.status === 'declined' ? 'You said not this time' : 'This offer expired'}</b>
					<div class="t-footnote muted">{why}. Nothing was ordered and nothing is owed.</div>
				</div></Card
			>{/if}
		<List head="What was offered">
			<ListRow title="Price" value={`₹${o.pack.toFixed(2)} a packet, before GST · MRP ₹${o.mrp}`} />
			<ListRow title="Scheme" value={`Buy ${sc.buy}, get ${sc.free} free, as a discount on the invoice`} />
			<ListRow title="Your share" value={`up to ${o.share} packets`} />
			<ListRow title="Open for" value={`${hours} hours`} />
			<ListRow title="Best before" value={fmt.date(o.bestBefore)} />
		</List>
	</div>
</Screen>
{#if o.invoice}<PaperSheet
		bind:open
		ref={o.ref}
		invoice={{ inv: o.invoice, batch: { id: o.ref, bestBefore: o.bestBefore }, sku: o.sku, dist: o.dist }}
	/>{/if}
