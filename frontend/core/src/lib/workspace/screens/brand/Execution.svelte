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
	import { fmt, heroModel, isRouted } from '../../model';
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
	const req = $derived(
		`POST /v1/listings\n{\n  "seller": "Rakesh Traders, Nagpur",\n  "on_behalf": "one-time permission · inside Munchly floors",\n  "sku": "MF-MC-150",\n  "batch": "MF-2409-117",\n  "units": ${c.lines.expiresoon.units},\n  "price": 15.00,\n  "reserve": 13.50,\n  "mrp": 30.00,\n  "best_before": "2026-11-18",\n  "hide_from_pincodes": ["440", "441", "442", "411", "412", "452", "453", "500", "501"],\n  "label_photo": "gs://smart-clearance/labels/MF-2409-117.jpg"\n}`
	);
	const res = $derived(
		h.listing
			? `HTTP/1.1 201 Created\n{\n  "id": "ES-24117",\n  "status": "${h.listing.status}",\n  "url": "https://expiresoon.example/l/ES-24117"\n}`
			: ''
	);
	const AWARD: [string, string, string][] = $derived([
		['ExpireSoon, planned', `${c.lines.expiresoon.units} × ₹15.00`, fmt.inr(c.actual.esPlanned)],
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
				>The marketplace is mocked; the request and response are what a partner API returns. Buyers in Munchly's
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
			{#if h.offer && !h.orders.some((o) => o.id === 'k0')}<PlayAs who="ganesh" route="offer">Order as Ganesh ji</PlayAs
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
						14-day sales.</span
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
						>reserve ₹13.50 · hidden</Badge
					>{/if}
			</div>
			{#if h.chat.length}<Chat chat={h.chat} typing={!!lastBid && lastBid.status === 'placed'} />{:else}<span
					class="t-footnote muted"
					>Waiting for a bid from outside Munchly's territories. The agent counters anything under the reserve and
					promises only what Rakesh's calendar can keep.</span
				>{/if}
			{#if h.listing && !h.award && (!lastBid || lastBid.status === 'countered')}<PlayAs who="agrawal" route="listing"
					>{lastBid ? 'Answer the counter as Agrawal ji' : 'Bid as Agrawal ji on ExpireSoon'}</PlayAs
				>{/if}
			{#if h.award}<List
					>{#each AWARD as [k, sub, val] (k)}{#snippet value()}<span class="tnum strong">{val}</span>{/snippet}<ListRow
							title={k}
							sub={sub || undefined}
							{value}
						/>{/each}</List
				>{/if}
			{#if h.award}<Badge tone="green" icon="badge-check"
					>Token {fmt.inr(c.award.token)} received · balance {fmt.inr(c.award.balance)} plus IGST in 48 h</Badge
				>{/if}
			{#if h.award && all && h.truck.status !== 'dispatched'}<PlayAs who="rakesh" route="van"
					>Load the buyer's truck as Rakesh bhai</PlayAs
				>{/if}
		</Card>
		<Card class="stack snug">
			<div class="card-head">
				<span class="row tight"
					><Aura on={!s.mango.donation} class="icontile red" style="border-radius: 9px"
						><Icon name="heart-handshake" size={17} stroke={2} /></Aura
					><span class="card-title">Donation · Mango Drink</span></span
				>{#if s.mango.donation}<Badge tone="green" icon="check"
						>{s.mango.donation === 'collected'
							? 'collected'
							: s.mango.donation === 'confirmed'
								? 'pickup confirmed'
								: 'pickup booked'}</Badge
					>{:else}<Badge>matching partners</Badge>{/if}
			</div>
			<div class="row" style="gap: 14px">
				<Product name="pack-mango" size={72} />
				<div class="stack tight" style="gap: 2px">
					<b>MF-2410-118 · 22 days left</b><span class="t-footnote muted"
						>Lakshmi Agencies, Hyderabad: {fmt.num(ML('kirana').units)} packs to her kiranas, {ML('staff').units} to her staff
						sale, {c.donation.units} left for a food bank. Too few days for ExpireSoon.</span
					>
				</div>
			</div>
			<List
				><ListRow
					icon="circle-check"
					title="Feeding India"
					sub="15+ days, 50+ units · volunteer pickup in 48 h"
					value={matches}
				/><ListRow
					icon="circle-x"
					iconTone="gray"
					title="India FoodBanking Network"
					sub="needs 21+ days and 100+ units"
					value={short}
				/></List
			>
			<span class="t-footnote subtle"
				>The GST credit on donated packs is reversed: section 17(5)(h) blocks it on gifts, and since 1 October 2023
				section 17(5)(fa) blocks it on CSR donations too.</span
			>
			{#if s.mango.donation === 'booked'}<PlayAs who="meera" route="pickups">Confirm as Meera</PlayAs>{/if}
		</Card>
		{#if h.van.status === 'done' || h.shelf}<ShelfCheck shelf={h.shelf} />{/if}
	</div>{/snippet}
{#snippet side()}<SectionTitle>Agent timeline</SectionTitle><Card
		><AgentFeed events={timeline} people={ws.data.people} live={hm.agentLive ? timeline.length - 1 : -1} /></Card
	>{/snippet}

<Screen {me} title="Execution" sub="MF-2409-117 · day 0 to 14 · four agents" back="Route Room">
	{#if !started}<Card
			><Empty
				icon="sparkles"
				title="Nothing is executing yet"
				body="Listing, outreach, negotiation and the food-bank booking start the moment the plan is approved."
			/></Card
		>{:else}<Columns sideWidth={340} {main} {side} />{/if}
	<Sheet bind:open={sheet} title="ExpireSoon · as buyers see it"><ListingView readOnly /></Sheet>
</Screen>
