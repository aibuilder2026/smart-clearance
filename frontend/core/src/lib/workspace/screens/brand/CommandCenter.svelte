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
	import Skeleton from '../../../components/Skeleton.svelte';
	import { useRoute } from '../../context';
	import { useLive } from '../../live.svelte';
	import { batchViews, castOf, fmt, heroModel, isRouted } from '../../model';
	import { useWorkspace } from '../../source';
	import type { BatchView, User } from '../../types';
	import PlayAs from '../common/PlayAs.svelte';
	import Screen from '../common/Screen.svelte';
	import BatchTabs, { tabsOf } from '../live/BatchTabs.svelte';
	import CommandQuiet from '../live/CommandQuiet.svelte';

	// S1 Command Center: the first viewport is the batch, tracked like an order: tracker first, the agents beside it, the
	// cluster under it (screens/brand.jsx CommandCenter). On the live workspace (SC-73, SC-68 option B) the batches in a
	// journey are tabs over the tracker card, the card goes grey while updates are paused, approving waits for a
	// connection, and a day with none is a quiet day
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const router = useRoute();
	const app = useApp();
	const s = $derived(ws.state);
	const hm = $derived(heroModel(s, ws.data, c));
	const phone = $derived(app.bp === 'phone');
	let sel = $state<string | null>(null);

	const views = $derived(batchViews(s, ws.data));
	const atRisk = (v: BatchView) => (v.phase === 'at-risk' || (!v.phase && v.assess.status === 'at-risk') ? -1 : 0);
	const watchlist = $derived(
		views
			.filter((v) => !(v.hero && s.hero.phase === 'watching'))
			.sort((a, b) => atRisk(a) - atRisk(b) || a.daysLeft - b.daysLeft)
	);
	// the Route Room, on the batch in focus
	const openRoute = () => router.go('route', { ref: c.batch.id });
	const flagged = $derived(s.hero.phase !== 'watching' && s.setup.confirmed);
	const routed = $derived(isRouted(s.hero.phase));
	const perm = $derived(s.setup.permission);
	const paused = $derived(!!perm && perm.paused);
	const cast = $derived(castOf(s, c));
	const watch = $derived(s.rules.watchTime);
	const rows = $derived(ws.data.setup.dms.rows);

	const live = useLive();
	const on = $derived(!!live?.on);
	const dim = $derived(on && !!live?.down);
	const offline = $derived(on && !!live?.offline);
	// the batches in a journey, as tabs, when there is more than one; a batch picked is read before its card shows
	const tabs = $derived(on ? tabsOf(ws.cases ?? [], ws.data, 'Cleared') : []);
	const open = $derived(tabs.filter((t) => (ws.cases ?? []).find((x) => x.ref === t.ref)!.stage < 9));
	const asked = $derived(ws.focus && tabs.some((t) => t.ref === ws.focus) ? ws.focus : c.batch.id);
	const switching = $derived(asked !== c.batch.id);
	const waiting = $derived(open.filter((t) => t.human).length);
</script>

{#snippet primary()}{#if s.hero.phase === 'planned'}<Button
			variant="approve"
			icon="check"
			disabled={offline}
			onclick={openRoute}>Review and approve</Button
		>{:else if ['approved', 'executing'].includes(s.hero.phase)}<Button
			variant="primary"
			iconRight="arrow-right"
			onclick={() => router.go('execution')}>Watch execution</Button
		>{:else}<Button variant="primary" iconRight="arrow-right" onclick={openRoute}>Open Route Room</Button
		>{/if}{/snippet}
{#snippet money()}<div class="stack tight" style="gap: 2px">
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
	</div>{/snippet}
{#snippet emptyAction()}{#if !s.setup.confirmed}<Button
			variant="primary"
			iconRight="arrow-right"
			onclick={() => router.go('setup')}>Open Setup</Button
		>{:else if !perm}<PlayAs who={cast.distributor.id} route="home"
			>Give the permission as {cast.distributor.short}</PlayAs
		>{/if}{/snippet}
{#snippet tracker()}{#if on && tabs.length > 1}<div class="stack" style="gap: 10px">
			<div class="row between wrap lv-qhead">
				<b class="t-subhead">Flagged batches</b><span class="t-footnote subtle"
					>{tabs.length} batches{waiting ? ` · ${waiting === 1 ? 'one needs' : waiting + ' need'} a yes` : ''}</span
				>
			</div>
			<BatchTabs
				{tabs}
				current={asked}
				onpick={(ref) => ws.setFocus(ref)}
				asTabs
				label="Flagged batches"
				panel="lv-flagged"
			/>
			<div role="tabpanel" id="lv-flagged" aria-labelledby="lv-tab-{asked}">{@render panel()}</div>
		</div>{:else}{@render panel()}{/if}{/snippet}
{#snippet panel()}{#if switching}<div class="bezel">
			<div class="card raised stack" style="gap: 14px" aria-busy="true">
				{#each [0, 1, 2, 3] as i (i)}<Skeleton h={i ? 18 : 120} r={i ? 6 : 14} />{/each}
			</div>
		</div>{:else if on}<div class={dim ? 'lv-dim' : undefined}>
			{@render hero()}
		</div>{:else}{@render hero()}{/if}{/snippet}
{#snippet hero()}{#if flagged}<TrackerCard
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
		/>{:else}<Card
			><Empty
				img="sprout-box"
				title={!s.setup.confirmed
					? 'Connect your stock data to start'
					: !perm
						? `Waiting for ${c.dist.name}' permission`
						: 'Nothing at risk yet'}
				body={!s.setup.confirmed
					? `Upload the distributor export once and set the guardrails. It takes about ${ws.data.setup.minutes} minutes; the Watcher starts the next morning.`
					: !perm
						? `${cast.distributor.short}'s stock is listed and offered in his name, so he gives a one-time permission in his app first. He can pause it at any time.`
						: `The Watcher checks every batch against the quick-commerce gates and sell-through at ${watch}. You get a push the moment one cannot make it.`}
				action={!s.setup.confirmed || !perm ? emptyAction : undefined}
			/></Card
		>{/if}{/snippet}
{#snippet cluster()}{#if flagged}<Card pad={false} class="stack" style="overflow: hidden; gap: 0">
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
				kiranas={c.kiranas}
				orderedCount={hm.ordered}
				route={routed}
				vanProgress={s.hero.van.status === 'done' ? 1 : (hm.ordered / c.kiranas.length) * 0.6}
				height={phone ? 220 : 280}
			/>
		</Card>{/if}{/snippet}
{#snippet feed()}<div class="stack snug">
		<SectionTitle sub="Every hand-off, as it happens">Agent activity</SectionTitle><Card
			>{#if s.feed.length && on}<div class={dim ? 'lv-dim' : undefined}>
					<AgentFeed
						events={s.feed}
						people={ws.data.people}
						live={hm.agentLive && !dim ? s.feed.length - 1 : -1}
						max={phone ? 3 : 6}
					/>
				</div>{:else if s.feed.length}<AgentFeed
					events={s.feed}
					people={ws.data.people}
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
						else if (tabs.some((t) => t.ref === v.id)) router.go('route', { ref: v.id });
					}}
				/>{/each}
		</div>
	</div>{/snippet}
{#snippet main()}{@render tracker()}{@render cluster()}{@render list()}{/snippet}

{#if !ws.case}<CommandQuiet {me} />{:else}<Screen
		{me}
		title="Command Center"
		sub={on
			? `Watcher checked ${rows} batches at ${watch} · ${open.length ? open.length + ' flagged' : 'nothing flagged'}`
			: flagged
				? `${c.today} · Watcher checked ${rows} batches at ${watch}`
				: `Watcher runs daily at ${watch} across ${rows} batches`}
	>
		{#if app.bp === 'desktop'}<Columns sideWidth={340} {main} side={feed} />{:else}<div class="stack" style="gap: 20px">
				{@render tracker()}{@render feed()}{@render list()}{@render cluster()}
			</div>{/if}
	</Screen>{/if}
