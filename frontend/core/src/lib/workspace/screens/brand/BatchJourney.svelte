<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import AgentFeed from '../../../components/AgentFeed.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import ClusterMap from '../../../components/ClusterMap.svelte';
	import Money from '../../../components/Money.svelte';
	import Skeleton from '../../../components/Skeleton.svelte';
	import TrackerCard from '../../../components/TrackerCard.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { useLive } from '../../live.svelte';
	import { castOf, clusterOf, fmt, heroModel, isRouted, type JourneyItem } from '../../model';
	import { useWorkspace } from '../../source';
	import type { BatchView, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import BatchFacts from './BatchFacts.svelte';

	// a batch's Journey (screens/brand.jsx BatchJourney, SC-112): the Command Center's pieces for this batch alone, its
	// tracker card, its cluster and its agents. A batch in no journey shows what the Watcher sees of it and what happens
	// next; on the live workspace a batch asked for is read before its card shows
	let { me, it, v }: { me: User; it: JourneyItem | null; v: BatchView } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const router = useRoute();
	const live = useLive();
	const phone = $derived(app.bp === 'phone');
	const c = $derived(it && ws.case?.batch.id === it.ref ? ws.case : null);
	const s = $derived(ws.state);
	const hm = $derived(c ? heroModel(s, ws.data, c) : null);
	const routed = $derived(isRouted(s.hero.phase));
	const on = $derived(!!live?.on);
	const dim = $derived(on && !!live?.down);
	const offline = $derived(on && !!live?.offline);
	const paused = $derived(!!s.setup.permission?.paused);
	const cast = $derived(c ? castOf(s, c) : null);
</script>

{#snippet primary()}{#if c}{#if s.hero.phase === 'planned'}<Button
				variant="approve"
				icon="check"
				disabled={offline}
				onclick={() => router.go('route', { ref: c.batch.id })}>Review and approve</Button
			>{:else if ['approved', 'executing'].includes(s.hero.phase)}<Button
				variant="primary"
				iconRight="arrow-right"
				onclick={() => router.go('execution', { ref: c.batch.id })}>Watch execution</Button
			>{:else}<Button variant="primary" iconRight="arrow-right" onclick={() => router.go('route', { ref: c.batch.id })}
				>Open Route Room</Button
			>{/if}{/if}{/snippet}
{#snippet money()}{#if c}<div class="stack tight" style="gap: 2px">
			<Money
				value={s.hero.posted ? c.actual.net : c.plan.net}
				size={phone ? 's' : 'm'}
				roll
				style="color: var(--primary-text)"
			/><span class="t-footnote subtle"
				>{s.hero.posted
					? 'recovered, after the negotiation'
					: routed
						? 'on plan · settles day 3–7'
						: 'net recovered on the plan'} · swing {fmt.inr(s.hero.posted ? c.actual.swing : c.plan.swing)}</span
			>
		</div>{/if}{/snippet}
{#snippet card()}{#if c && hm && cast}<div class={dim ? 'lv-dim' : undefined}>
			<TrackerCard
				view={hm.view}
				stages={ws.data.stages}
				writeOff={c.plan.writeOff.total}
				done={hm.done}
				current={hm.current}
				eta={dim
					? live?.offline
						? `Offline · as of ${live.since}`
						: `Updates paused at ${live?.since}`
					: paused
						? `Paused by ${cast.distributor.short}`
						: hm.eta}
				etaTone={dim ? 'neutral' : paused ? 'amber' : hm.etaTone}
				agentLive={paused || dim ? '' : hm.agentLive}
				{primary}
				money={s.hero.plan ? money : undefined}
				line={s.hero.phase === 'cleared'
					? `All ${fmt.num(c.plan.units)} units placed: ${c.lines.kirana.units} with ${c.kiranas.length} kiranas, ${c.lines.expiresoon.units} with a ${c.buyer.city} wholesaler. Nothing went to the bin.`
					: undefined}
			/>
		</div>{:else}<div class="bezel">
			<div class="card raised stack" style="gap: 14px" aria-busy="true">
				{#each [0, 1, 2, 3] as i (i)}<Skeleton h={i ? 18 : 120} r={i ? 6 : 14} />{/each}
			</div>
		</div>{/if}{/snippet}
{#snippet cluster()}{#if c && hm && c.kiranas.length}<Card pad={false} class="stack" style="overflow: hidden; gap: 0">
			<div class="card-head" style="padding: 14px 16px 10px">
				<span class="card-title">{c.dist.city} cluster</span><Badge
					size="sm"
					tone={hm.ordered ? 'green' : undefined}
					dot={!!hm.ordered}
					live={hm.ordered > 0 && hm.ordered < c.kiranas.length}
					>{hm.ordered
						? `${hm.ordered} of ${c.offered} kiranas ordered`
						: s.hero.offer
							? `${c.offered} kiranas messaged`
							: `${c.offered} kiranas`}</Badge
				>
			</div>
			<ClusterMap
				{...clusterOf(c.dist)}
				kiranas={c.kiranas}
				orderedCount={hm.ordered}
				route={routed}
				vanProgress={s.hero.van.status === 'done' ? 1 : c.kiranas.length ? (hm.ordered / c.kiranas.length) * 0.6 : 0}
				height={phone ? 220 : 280}
			/>
		</Card>{/if}{/snippet}
{#snippet feed()}<div class="stack snug">
		<SectionTitle sub="Every hand-off on this batch, as it happens">Agent activity</SectionTitle><Card
			>{#if c && hm && s.feed.length}<div class={dim ? 'lv-dim' : undefined}>
					<AgentFeed
						events={s.feed}
						people={ws.data.people}
						live={hm.agentLive && !dim ? s.feed.length - 1 : -1}
						max={phone ? 4 : 8}
					/>
				</div>{:else}<span class="t-footnote muted"
					>{it
						? 'The agents report here as they work this batch.'
						: 'The agents report here once the Watcher flags this batch.'}</span
				>{/if}</Card
		>
	</div>{/snippet}
{#snippet watched()}<Card class="stack"><BatchFacts view={v} /></Card>{/snippet}
{#snippet main()}{#if it}{@render card()}{@render cluster()}{:else}{@render watched()}{/if}{/snippet}

<Screen {me} title="Journey">
	{#if app.bp === 'desktop'}<Columns sideWidth={340} {main} side={feed} />{:else}<div class="stack" style="gap: 20px">
			{@render main()}{@render feed()}
		</div>{/if}
</Screen>
