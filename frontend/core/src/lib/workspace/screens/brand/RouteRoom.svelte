<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import AgentFeed from '../../../components/AgentFeed.svelte';
	import Avatar from '../../../components/Avatar.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import ChannelBars from '../../../components/ChannelBars.svelte';
	import ChannelTable from '../../../components/ChannelTable.svelte';
	import DaysNum from '../../../components/DaysNum.svelte';
	import GateChips from '../../../components/GateChips.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Money from '../../../components/Money.svelte';
	import MoneyPanel from '../../../components/MoneyPanel.svelte';
	import Product from '../../../components/Product.svelte';
	import Segmented from '../../../components/Segmented.svelte';
	import Skeleton from '../../../components/Skeleton.svelte';
	import SplitBar from '../../../components/SplitBar.svelte';
	import Tracker from '../../../components/Tracker.svelte';
	import TrackerCompact from '../../../components/TrackerCompact.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { D, ES, KL, PLAN, STAGE_TIMES, TRACK, TRACK_TIMED } from '../../data';
	import { fmt, isRouted } from '../../model';
	import { heroModel } from '../../legacy';
	import { store } from '../../store.svelte';
	import type { Phase, User } from '../../types';
	import Locked from '../common/Locked.svelte';
	import Screen from '../common/Screen.svelte';
	import ApproveSheet from './ApproveSheet.svelte';
	import LabelPhoto from './LabelPhoto.svelte';

	// S2 Route Room: the batch, its label read from the shelf, five channels priced, the recommended split and the one
	// yes (screens/brand.jsx RouteRoom)
	let { me }: { me: User } = $props();
	const router = useRoute();
	const app = useApp();
	const s = $derived(store.state);
	const hm = $derived(heroModel(s));
	const h = $derived(s.hero);
	let view = $state<'chart' | 'table'>('chart');
	let sheet = $state(false);

	const VALUED: Phase[] = ['valued', 'planned', 'approved', 'executing', 'dispatched', 'settled', 'cleared'];
	const PLANNED: Phase[] = ['planned', 'approved', 'executing', 'dispatched', 'settled', 'cleared'];
	const valued = $derived(VALUED.includes(h.phase));
	const planned = $derived(PLANNED.includes(h.phase));
	const approved = $derived(isRouted(h.phase));
	const v = $derived(hm.view);
	const sku = $derived(v.skuObj);
	const staff = PLAN.rows.find((r) => r.id === 'staff')!;
	const foodbank = PLAN.rows.find((r) => r.id === 'foodbank')!;
	const chosen = $derived(planned ? PLAN.lines.map((l) => l.id) : []);
	const approver = $derived(D.people[(h.plan && h.plan.by) || 'priya']);
	const timeline = $derived(s.feed.filter((e) => e.stage !== 'connect'));
	const LABEL: [string, string][] = $derived([
		['Batch', 'MF-2409-117'],
		['Manufactured', '18 May 2026'],
		['Best before', '18 Nov 2026'],
		['Shelf life', `${v.assess.life} days · ${v.assess.lifeUsedPct}% used`],
		['MRP', '₹30.00 · 24 × 150 g'],
		['Records', 'match']
	]);
	const BAR: [string, number, string][] = [
		['You get', PLAN.net, 'var(--primary-text)'],
		['Instead of', -PLAN.writeOff.total, 'var(--red-text)'],
		['GST credit safe', PLAN.itcRetained, 'var(--fg)']
	];

	// the demo opens the approval from its own controls
	$effect(() => {
		const f = () => (sheet = true);
		window.addEventListener('sc3:approve-open', f);
		return () => window.removeEventListener('sc3:approve-open', f);
	});
</script>

{#snippet matches()}{#if h.photo.status === 'verified'}<Badge tone="green" icon="check">matches the DMS record</Badge
		>{/if}{/snippet}
{#snippet viewSwitch()}{#if valued}<Segmented
			options={[
				{ id: 'chart', label: 'Chart' },
				{ id: 'table', label: 'Table' }
			]}
			bind:value={view}
			label="View"
		/>{/if}{/snippet}
{#snippet main()}
	<div data-anchor="label"></div>
	<SectionTitle sub="Vision · 09:20" right={matches}>Label, read from the shelf</SectionTitle>
	<Card class="stack" style="gap: 16px">
		<div style="container-type: inline-size">
			<div class="labelgrid">
				<LabelPhoto status={h.photo.status} />
				<div class="stack snug">
					{#if h.photo.status === 'verified'}<List
							>{#each LABEL as [k, val] (k)}<ListRow title={k} value={val} />{/each}</List
						>{:else}<Locked
							icon="scan-line"
							agent="Vision Agent"
							live={h.photo.status !== 'none'}
							text={h.photo.status === 'reading'
								? 'Reading batch, MFG, best-before and MRP from the photo.'
								: 'Prices nothing until a person photographs one carton label on the shelf.'}
						/>{#each [0, 1, 2, 3] as i (i)}<Skeleton h={44} r={12} />{/each}{/if}
				</div>
			</div>
		</div>
	</Card>
	<div data-anchor="channels"></div>
	<SectionTitle sub="Valuer · 09:21 · per unit, after costs" right={viewSwitch}>Five channels, priced</SectionTitle>
	{#if valued}{#if view === 'chart'}<Card
				><ChannelBars rows={PLAN.rows} {chosen} />
				<p class="t-footnote subtle" style="margin-top: 6px">
					Hover a bar for price, capacity, time to clear and what happens to the GST credit. Destroying costs {fmt.inr2(
						-PLAN.writeOff.perUnit
					)} a unit; a donation costs {fmt.inr2(-foodbank.net)}, because the credit on a gift is reversed.
				</p></Card
			>{:else}<ChannelTable rows={PLAN.rows} {chosen} />{/if}{:else}<Locked
			icon="scale"
			agent="Valuer Agent"
			live={h.photo.status === 'verified'}
			text={h.photo.status === 'verified'
				? `Pricing five channels against ${v.daysLeft} days left, capacities and the floor.`
				: 'Prices five channels once the label is verified.'}
		/>{/if}
	<div data-anchor="split"></div>
	<SectionTitle sub="Router · 09:22">Recommended split</SectionTitle>
	{#if planned}<div class="stack" style="gap: 16px">
			<Card class="stack snug"
				><SplitBar plan={PLAN} />
				<div class="stack tight t-subhead" style="margin-top: 4px">
					<div class="row top" style="gap: 10px">
						<span class="dotmark" style="background: var(--ch-kirana)"></span><span
							><b>{KL.units} units to the kirana cluster at ₹18 effective</b> (₹{KL.packPrice!.toFixed(2)} a pack, 2 free
							with every 10). The best price, and it keeps stock inside Munchly's own trade. Capped by what {D.offered}
							kiranas can move in 14 days with the scheme, on top of the {v.sellPerDay} a day they already sell.</span
						>
					</div>
					<div class="row top" style="gap: 10px">
						<span class="dotmark" style="background: var(--ch-expiresoon)"></span><span
							><b>{ES.units} units to ExpireSoon at ₹15</b> (reserve ₹13.50), listed in Rakesh Traders' name and hidden from
							buyers inside Munchly's territories: unlimited depth, 5 to 9 days, the buyer pays freight.</span
						>
					</div>
					<div class="row top muted" style="gap: 10px">
						<span class="dotmark" style="background: var(--fill-3)"></span><span
							>The {staff.name} is eligible but pays less a unit than ExpireSoon, so it gets nothing this time.</span
						>
					</div>
				</div>
			</Card>
			<Card class="row wrap" style="gap: 14px; background: var(--surface-2)"
				><span class="icontile soft"><Icon name="git-branch" size={17} /></span>
				<div class="grow">
					<b>Alternative considered: {PLAN.alt.label}</b>
					<div class="t-footnote muted">
						Net {fmt.inr(PLAN.alt.net)}: {fmt.inr(PLAN.net - PLAN.alt.net)} less, and nothing stays in Munchly's own trade.
					</div>
				</div>
				<Badge>not chosen</Badge></Card
			>
			<MoneyPanel plan={PLAN} compact={app.bp !== 'desktop'} />
		</div>{:else}<Locked
			icon="split"
			agent="Router Agent"
			live={h.phase === 'valued'}
			text={h.phase === 'valued'
				? 'Filling the best-paying channel to its cap, then the next.'
				: 'Proposes a split once the channels are priced.'}
		/>{/if}
	{#if approved}<Card class="row wrap" style="gap: 14px"
			><Avatar person={approver} size="lg" />
			<div class="grow">
				<b>Approved by {approver.short} · 09:40 · phone</b>
				<div class="t-footnote muted">
					Logged with who, when and device. The agents are executing; Rakesh bhai has the same plan in his app.
				</div>
			</div>
			<Button variant="primary" iconRight="arrow-right" onclick={() => router.go('execution')}>Watch execution</Button
			></Card
		>{/if}
{/snippet}
{#snippet side()}<SectionTitle sub="Gaps drawn to the clock">Agent timeline</SectionTitle><Card
		><AgentFeed events={timeline} people={D.people} live={hm.agentLive ? timeline.length - 1 : -1} /></Card
	>{/snippet}

<Screen
	{me}
	title="Route Room"
	sub={`${v.id} · ${sku.brand} ${sku.name} · ${v.dist.name}, ${v.dist.city}`}
	back="Command Center"
>
	<div class="stack" style="gap: 20px; padding-bottom: {h.phase === 'planned' ? 96 : 0}px">
		<Card class="stack" style="gap: 16px">
			<div class="row wrap" style="gap: 16px">
				<Product name={sku.img} size={app.bp === 'phone' ? 64 : 84} />
				<div class="grow">
					<div class="row base" style="gap: 10px">
						<DaysNum
							days={v.daysLeft}
							life={sku.lifeDays}
							size="l"
							style="color: {approved ? 'var(--fg)' : 'var(--red-text)'}"
						/><span class="stack tight" style="gap: 0"
							><b>days left</b><span class="t-footnote subtle">best before {fmt.date(v.bestBefore)}</span></span
						>
					</div>
				</div>
				<div class="stack tight" style="justify-items: {app.bp === 'phone' ? 'start' : 'end'}">
					<GateChips gates={v.assess.gates} /><span class="t-footnote subtle"
						>{fmt.num(v.assess.atRisk)} of {fmt.num(v.units)} units at risk · sells {v.sellPerDay} a day</span
					>
				</div>
			</div>
			{#if app.bp === 'phone'}<TrackerCompact stages={TRACK_TIMED} done={hm.done} current={hm.current} />{:else}<Tracker
					stages={TRACK}
					done={hm.done}
					current={hm.current}
					times={STAGE_TIMES}
				/>{/if}
		</Card>
		<Columns sideWidth={340} {main} {side} />
	</div>
	{#if h.phase === 'planned'}<div
			style="position: sticky; bottom: 0; z-index: 5; padding: 12px 0 16px; background: linear-gradient(180deg, transparent, var(--bg) 35%)"
		>
			<div class="card raised row wrap" style="padding: 14px 16px; gap: 14px">
				<div class="row wrap grow" style="gap: 18px">
					{#each BAR as [k, val, c] (k)}<div class="stack tight" style="gap: 0">
							<span class="t-caption subtle strong">{k}</span><Money
								value={val}
								size="s"
								style="color: {c}; font-size: 26px"
							/>
						</div>{/each}
				</div>
				<Button variant="approve" size="lg" icon="check" onclick={() => (sheet = true)}>Review and approve</Button>
			</div>
		</div>{/if}
	<ApproveSheet bind:open={sheet} {me} />
</Screen>
