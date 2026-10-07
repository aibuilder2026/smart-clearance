<script lang="ts">
	import AgentFeed from '../../../components/AgentFeed.svelte';
	import Aura from '../../../components/Aura.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import ClusterMap from '../../../components/ClusterMap.svelte';
	import CodeBlock from '../../../components/CodeBlock.svelte';
	import Empty from '../../../components/Empty.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Mark from '../../../components/Mark.svelte';
	import Product from '../../../components/Product.svelte';
	import Progress from '../../../components/Progress.svelte';
	import Roll from '../../../components/Roll.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { castOf, first, fmt, heroModel, isRouted, productName } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import PlayAs from '../common/PlayAs.svelte';
	import Screen from '../common/Screen.svelte';
	import ListingView from '../trade/ListingView.svelte';
	import Chat from './Chat.svelte';
	import ShelfCheck from './ShelfCheck.svelte';

	// S3 Execution: day 0 to 14, four agents at work: the Lister's ExpireSoon lot, Outreach's scheme to the kiranas, the
	// Negotiator's thread and the Mango Drink donation (screens/brand.jsx Execution)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const s = $derived(ws.state);
	const h = $derived(s.hero);
	const hm = $derived(heroModel(s, ws.data, c));
	let sheet = $state(false);

	const started = $derived(isRouted(h.phase));
	const units = $derived(h.orders.reduce((t, o) => t + o.units, 0));
	const lastBid = $derived(h.bids[h.bids.length - 1]);
	const all = $derived(h.orders.length === c.kiranas.length);
	const ML = (id: string) => c.donation.plan.lines.find((l) => l.id === id) || { units: 0 };
	const cast = $derived(castOf(s, c));
	const W = $derived(ws.data.workspace);
	const es = $derived(c.lines.expiresoon);
	const reserve = $derived(ws.data.rules.negotiation.reservePerUnit);
	// the lot is hidden from buyers inside every distributor's territory, matched by pincode
	const pins = $derived(Object.values(ws.data.distributors).flatMap((d) => d.pins.split(', ')));
	const req = $derived(
		`POST /v1/listings\n{\n  "seller": "${c.dist.name}, ${c.dist.city}",\n  "on_behalf": "one-time permission · inside ${W.short} floors",\n  "sku": "${c.sku.code}",\n  "batch": "${c.batch.id}",\n  "units": ${es.units},\n  "price": ${es.price.toFixed(2)},\n  "reserve": ${reserve.toFixed(2)},\n  "mrp": ${c.sku.mrp.toFixed(2)},\n  "best_before": "${c.batch.bestBefore}",\n  "hide_from_pincodes": [${pins.map((p) => `"${p}"`).join(', ')}],\n  "label_photo": "gs://smart-clearance/labels/${c.batch.id}.jpg"\n}`
	);
	const res = $derived(
		h.listing
			? `HTTP/1.1 201 Created\n{\n  "id": "${c.listing.id}",\n  "status": "${h.listing.status}",\n  "url": "${c.listing.url}"\n}`
			: ''
	);
	const AWARD: [string, string, string][] = $derived([
		['ExpireSoon, planned', `${es.units} × ${fmt.rate(es.price)}`, fmt.inr(c.actual.esPlanned)],
		['ExpireSoon, actual', `${c.lines.expiresoon.units} × ₹${c.counter.price.toFixed(2)}`, fmt.inr(c.actual.esActual)],
		['Net, planned', '', fmt.inr(c.plan.net)],
		['Net, actual', `−${fmt.inr(c.actual.delta)} on the counter`, fmt.inr(c.actual.net)]
	]);
	const STAGES = ['approve', 'execute', 'settle', 'report'];
	const timeline = $derived(s.feed.filter((e) => STAGES.includes(e.stage)));
</script>

{#snippet matches()}<Badge size="sm" tone="green">matches</Badge>{/snippet}
{#snippet short()}<Badge size="sm">{c.donation.units} units</Badge>{/snippet}
{#snippet main()}<div
		style="display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); align-items: start"
	>
		<Card class="stack snug">
			<div class="card-head">
				<span class="row tight"
					><Aura on={!h.listing} class="icontile violet" style="border-radius: 9px"
						><Icon name="shopping-bag" size={17} stroke={2} /></Aura
					><span class="card-title">Lister · ExpireSoon</span></span
				>{#if h.listing}<Badge
						tone={h.listing.status === 'awarded' ? 'green' : 'violet'}
						dot
						live={h.listing.status === 'live'}>{h.listing.status}</Badge
					>{:else}<Badge>queued</Badge>{/if}
			</div>
			<CodeBlock code={req} label="ExpireSoon request" />{#if h.listing}<CodeBlock
					code={res}
					label="ExpireSoon response"
				/>{/if}
			<span class="t-footnote subtle"
				>The marketplace is mocked; the request and response are what a partner API returns. Buyers in {W.short}'s
				territories never see the lot.</span
			>
			{#if h.listing}<Button variant="outline" icon="external-link" onclick={() => (sheet = true)}
					>Open on ExpireSoon</Button
				>{/if}
		</Card>
		<Card class="stack snug">
			<div class="card-head">
				<span class="row tight"
					><Aura on={!!h.offer && units < c.lines.kirana.units} class="icontile" style="border-radius: 9px"
						><Icon name="send" size={17} stroke={2} /></Aura
					><span class="card-title">Outreach · {c.offered} kiranas</span></span
				><Badge tone="blue" icon="bell">push · Hindi</Badge>
			</div>
			{#if h.offer}<div
					class="banner"
					style="box-shadow: none; background: var(--fill); grid-template-columns: 28px minmax(0,1fr)"
				>
					<Mark size={28} /><span class="hi t-subhead" lang="hi" style="line-height: 1.45">{c.push.offer.body}</span>
				</div>{/if}
			<div class="row wrap" style="gap: 18px">
				<div class="stack tight" style="gap: 0">
					<span class="num m"
						><Roll value={h.orders.length} /><span class="subtle" style="font-size: 0.45em">{` / ${c.offered}`}</span
						></span
					><span class="t-footnote subtle">kiranas ordered</span>
				</div>
				<div class="stack tight" style="gap: 0">
					<span class="num m"
						><Roll value={units} /><span class="subtle" style="font-size: 0.45em">{` / ${c.lines.kirana.units}`}</span
						></span
					><span class="t-footnote subtle">units</span>
				</div>
			</div>
			<Progress value={units / c.lines.kirana.units} label="Units ordered" />
			{#if h.offer && !h.orders.some((o) => o.id === c.kiranas[0].id)}<PlayAs who={cast.kirana.id} route="offer"
					>Order as {cast.kirana.short}</PlayAs
				>{/if}
			<ClusterMap kiranas={c.kiranas} orderedCount={h.orders.length} route height={200} />
			<div class="stack tight">
				{#each h.orders.slice(-3).reverse() as o (o.id)}{@const k = c.kiranas.find((x) => x.id === o.id)!}
					<div class="row between t-subhead">
						<span>{k.name} <span class="subtle t-footnote">{k.area}</span></span><span class="tnum strong"
							>{o.units} <span class="subtle t-caption">{o.at}</span></span
						>
					</div>{/each}{#if !h.orders.length}<span class="t-footnote muted"
						>Orders arrive as shops tap the offer. No shop can order more than {ws.data.rules.shopCapTimes}× its own
						{ws.data.rules.kiranaWindowDays}-day sales.</span
					>{/if}
			</div>
		</Card>
		<Card class="stack snug">
			<div class="card-head">
				<span class="row tight"
					><Aura on={!!lastBid && lastBid.status === 'placed'} class="icontile gray" style="border-radius: 9px"
						><Icon name="messages-square" size={17} stroke={2} /></Aura
					><span class="card-title">Negotiator</span></span
				>{#if h.award}<Badge tone="green" icon="check">awarded · ₹{c.counter.price.toFixed(2)}</Badge>{:else}<Badge
						>reserve {fmt.rate(reserve)} · hidden</Badge
					>{/if}
			</div>
			{#if h.chat.length}<Chat chat={h.chat} typing={!!lastBid && lastBid.status === 'placed'} />{:else}<span
					class="t-footnote muted"
					>Waiting for a bid from outside {W.short}'s territories. The agent counters anything under the reserve and
					promises only what {first(cast.distributor.short)}'s calendar can keep.</span
				>{/if}
			{#if h.listing && !h.award && (!lastBid || lastBid.status === 'countered')}<PlayAs
					who={cast.buyer.id}
					route="listing"
					>{lastBid ? `Answer the counter as ${cast.buyer.short}` : `Bid as ${cast.buyer.short} on ExpireSoon`}</PlayAs
				>{/if}
			{#if h.award}<List
					>{#each AWARD as [k, sub, val] (k)}{#snippet value()}<span class="tnum strong">{val}</span>{/snippet}<ListRow
							title={k}
							sub={sub || undefined}
							{value}
						/>{/each}</List
				>{/if}
			{#if h.award}<Badge tone="green" icon="badge-check"
					>Token {fmt.inr(c.award.token)} received · balance {fmt.inr(c.award.balance)} plus IGST in {ws.data.market
						.balanceHours} h</Badge
				>{/if}
			{#if h.award && all && h.truck.status !== 'dispatched'}<PlayAs who={cast.distributor.id} route="van"
					>Load the buyer's truck as {cast.distributor.short}</PlayAs
				>{/if}
		</Card>
		<Card class="stack snug">
			<div class="card-head">
				<span class="row tight"
					><Aura on={!s.mango.donation} class="icontile red" style="border-radius: 9px"
						><Icon name="heart-handshake" size={17} stroke={2} /></Aura
					><span class="card-title">Donation · {productName(c.donation.sku)}</span></span
				>{#if s.mango.donation}<Badge tone="green" icon="check"
						>{s.mango.donation === 'collected'
							? 'collected'
							: s.mango.donation === 'confirmed'
								? 'pickup confirmed'
								: 'pickup booked'}</Badge
					>{:else}<Badge>matching partners</Badge>{/if}
			</div>
			<div class="row" style="gap: 14px">
				<Product name={c.donation.sku.img} size={72} />
				<div class="stack tight" style="gap: 2px">
					<b>{c.donation.batch.id} · {c.donation.batch.daysLeft} days left</b><span class="t-footnote muted"
						>{c.donation.dist.name}, {c.donation.dist.city}: {fmt.num(ML('kirana').units)} packs to her kiranas, {ML(
							'staff'
						).units} to her staff sale, {c.donation.units} left for a food bank. Too few days for ExpireSoon.</span
					>
				</div>
			</div>
			<List
				>{#each ws.data.setup.partners as p (p.name)}{@const fits =
						c.donation.batch.daysLeft >= p.minDays && c.donation.units >= p.minUnits}<ListRow
						icon={fits ? 'circle-check' : 'circle-x'}
						iconTone={fits ? undefined : 'gray'}
						title={p.name}
						sub={fits
							? `${p.minDays}+ days, ${p.minUnits}+ units · ${p.pickup}`
							: `needs ${p.minDays}+ days and ${p.minUnits}+ units`}
						value={fits ? matches : short}
					/>{/each}</List
			>
			<span class="t-footnote subtle"
				>The GST credit on donated packs is reversed: section 17(5)(h) blocks it on gifts, and since 1 October 2023
				section 17(5)(fa) blocks it on CSR donations too.</span
			>
			{#if s.mango.donation === 'booked'}<PlayAs who={cast.foodbank.id} route="pickups"
					>Confirm as {cast.foodbank.short}</PlayAs
				>{/if}
		</Card>
		{#if h.van.status === 'done' || h.shelf}<ShelfCheck shelf={h.shelf} />{/if}
	</div>{/snippet}
{#snippet side()}<SectionTitle>Agent timeline</SectionTitle><Card
		><AgentFeed events={timeline} people={ws.data.people} live={hm.agentLive ? timeline.length - 1 : -1} /></Card
	>{/snippet}

<Screen
	{me}
	title="Execution"
	sub={`${c.batch.id} · day 0 to ${ws.data.rules.kiranaWindowDays} · four agents`}
	back="Route Room"
>
	{#if !started}<Card
			><Empty
				icon="sparkles"
				title="Nothing is executing yet"
				body="Listing, outreach, negotiation and the food-bank booking start the moment the plan is approved."
			/></Card
		>{:else}<Columns sideWidth={340} {main} {side} />{/if}
	<Sheet bind:open={sheet} title="ExpireSoon · as buyers see it"><ListingView readOnly /></Sheet>
</Screen>
