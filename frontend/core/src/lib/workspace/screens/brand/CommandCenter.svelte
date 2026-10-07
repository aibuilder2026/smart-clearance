<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import AgentFeed from '../../../components/AgentFeed.svelte';
	import Badge from '../../../components/Badge.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import ClusterMap from '../../../components/ClusterMap.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Money from '../../../components/Money.svelte';
	import TrackerCard from '../../../components/TrackerCard.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { D, ES, KL, PLAN, SHOPS } from '../../data';
	import { batchViews, fmt, heroModel, isRouted } from '../../model';
	import { store } from '../../store.svelte';
	import type { BatchView, User } from '../../types';
	import PlayAs from '../common/PlayAs.svelte';
	import Screen from '../common/Screen.svelte';

	// S1 Command Center: the first viewport is the batch, tracked like an order: tracker first, the agents beside it, the
	// cluster under it (screens/brand.jsx CommandCenter)
	let { me }: { me: User } = $props();
	const router = useRoute();
	const app = useApp();
	const s = $derived(store.state);
	const hm = $derived(heroModel(s));
	const phone = $derived(app.bp === 'phone');
	let sel = $state<string | null>(null);

	const views = $derived(batchViews(s));
	const atRisk = (v: BatchView) => (v.phase === 'at-risk' || (!v.phase && v.assess.status === 'at-risk') ? -1 : 0);
	const watchlist = $derived(
		views
			.filter((v) => !(v.hero && s.hero.phase === 'watching'))
			.sort((a, b) => atRisk(a) - atRisk(b) || a.daysLeft - b.daysLeft)
	);
	const openRoute = () => router.go('route');
	const flagged = $derived(s.hero.phase !== 'watching' && s.setup.confirmed);
	const routed = $derived(isRouted(s.hero.phase));
	const perm = $derived(s.setup.permission);
	const paused = $derived(!!perm && perm.paused);
</script>

{#snippet primary()}{#if s.hero.phase === 'planned'}<Button variant="approve" icon="check" onclick={openRoute}
			>Review and approve</Button
		>{:else if ['approved', 'executing'].includes(s.hero.phase)}<Button
			variant="primary"
			iconRight="arrow-right"
			onclick={() => router.go('execution')}>Watch execution</Button
		>{:else}<Button variant="primary" iconRight="arrow-right" onclick={openRoute}>Open Route Room</Button
		>{/if}{/snippet}
{#snippet money()}<div class="stack tight" style="gap: 2px">
		<Money
			value={s.hero.posted ? D.actual.net : PLAN.net}
			size={phone ? 's' : 'm'}
			roll
			style="color: var(--primary-text)"
		/><span class="t-footnote subtle"
			>{s.hero.posted
				? 'recovered, after the negotiation'
				: routed
					? 'on plan · settles day 3–7'
					: 'net recovered on the plan'} · swing {fmt.inr(s.hero.posted ? D.actual.swing : PLAN.swing)}</span
		>
	</div>{/snippet}
{#snippet emptyAction()}{#if !s.setup.confirmed}<Button
			variant="primary"
			iconRight="arrow-right"
			onclick={() => router.go('setup')}>Open Setup</Button
		>{:else if !perm}<PlayAs who="rakesh" route="home">Give the permission as Rakesh bhai</PlayAs>{/if}{/snippet}
{#snippet tracker()}{#if flagged}<TrackerCard
			view={hm.view}
			done={hm.done}
			current={hm.current}
			eta={paused ? 'Paused by Rakesh bhai' : hm.eta}
			etaTone={paused ? 'amber' : hm.etaTone}
			agentLive={paused ? '' : hm.agentLive}
			{primary}
			money={s.hero.plan ? money : undefined}
			line={s.hero.phase === 'cleared'
				? `All ${fmt.num(PLAN.units)} units placed: ${KL.units} with ${SHOPS} kiranas, ${ES.units} with a ${D.buyer.city} wholesaler. Nothing went to the bin.`
				: undefined}
		/>{:else}<Card
			><Empty
				img="sprout-box"
				title={!s.setup.confirmed
					? 'Connect your stock data to start'
					: !perm
						? "Waiting for Rakesh Traders' permission"
						: 'Nothing at risk yet'}
				body={!s.setup.confirmed
					? 'Upload the distributor export once and set the guardrails. It takes about 15 minutes; the Watcher starts the next morning.'
					: !perm
						? "Rakesh bhai's stock is listed and offered in his name, so he gives a one-time permission in his app first. He can pause it at any time."
						: 'The Watcher checks every batch against the quick-commerce gates and sell-through at 09:00. You get a push the moment one cannot make it.'}
				action={!s.setup.confirmed || !perm ? emptyAction : undefined}
			/></Card
		>{/if}{/snippet}
{#snippet cluster()}{#if flagged}<Card pad={false} class="stack" style="overflow: hidden; gap: 0">
			<div class="card-head" style="padding: 14px 16px 10px">
				<span class="card-title">Nagpur cluster</span><Badge
					size="sm"
					tone={hm.ordered ? 'green' : undefined}
					dot={!!hm.ordered}
					live={hm.ordered > 0 && hm.ordered < SHOPS}
					>{hm.ordered
						? `${hm.ordered} of ${D.offered} kiranas ordered`
						: s.hero.offer
							? `${D.offered} kiranas messaged`
							: `${D.offered} kiranas`}</Badge
				>
			</div>
			<ClusterMap
				kiranas={D.kiranas}
				orderedCount={hm.ordered}
				route={routed}
				vanProgress={s.hero.van.status === 'done' ? 1 : (hm.ordered / SHOPS) * 0.6}
				height={phone ? 220 : 280}
			/>
		</Card>{/if}{/snippet}
{#snippet feed()}<div class="stack snug">
		<SectionTitle sub="Every hand-off, as it happens">Agent activity</SectionTitle><Card
			>{#if s.feed.length}<AgentFeed
					events={s.feed}
					people={D.people}
					live={hm.agentLive ? s.feed.length - 1 : -1}
					max={phone ? 3 : 6}
				/>{:else}<span class="t-footnote muted">The agents report here once the Watcher runs.</span>{/if}</Card
		>
	</div>{/snippet}
{#snippet list()}<div class="stack snug">
		<SectionTitle sub="Sorted by days to best-before; at-risk batches first">Watchlist</SectionTitle>
		<div class="list">
			{#each watchlist as v (v.id)}<BatchRow
					view={v}
					selected={sel === v.id}
					compact={phone}
					onopen={() => {
						sel = v.id;
						if (v.hero) openRoute();
					}}
				/>{/each}
		</div>
	</div>{/snippet}
{#snippet main()}{@render tracker()}{@render cluster()}{@render list()}{/snippet}

<Screen
	{me}
	title="Command Center"
	sub={flagged ? 'Fri 2 Oct · Watcher checked 312 batches at 09:00' : 'Watcher runs daily at 09:00 across 312 batches'}
>
	{#if app.bp === 'desktop'}<Columns sideWidth={340} {main} side={feed} />{:else}<div class="stack" style="gap: 20px">
			{@render tracker()}{@render feed()}{@render list()}{@render cluster()}
		</div>{/if}
</Screen>
