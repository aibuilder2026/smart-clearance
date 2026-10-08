<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import AgentFeed from '../../../components/AgentFeed.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import Card from '../../../components/Card.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { batchViews } from '../../model';
	import { useWorkspace } from '../../source';
	import type { BatchView, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import QuietCard from './QuietCard.svelte';

	// S1 Command Center on a day with no batch at risk (screens/live.jsx Quiet, SC-68 option B; the live workspace with
	// no batch in a journey): what the Watcher checked and when it checks next, every batch clearing inside its date, and
	// the agents' last hand-offs. A batch in a journey (on a quiet day, the one going to a food bank) opens its Route
	// Room from the watchlist, as on the busy Command Center (SC-82)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const router = useRoute();
	const s = $derived(ws.state);
	const watch = $derived(s.rules.watchTime);
	const rows = $derived(ws.data.setup.dms.rows);
	const views = $derived(batchViews(s, ws.data).sort((a: BatchView, b: BatchView) => a.daysLeft - b.daysLeft));
</script>

{#snippet card()}<QuietCard
		img="sprout-box"
		title="Nothing at risk today"
		body={`The Watcher checked ${rows} batches at ${watch}. Every one sells through inside its date, so nothing needs you.`}
		{watch}
	/>{/snippet}
{#snippet list()}<div class="stack snug">
		<SectionTitle sub="Every batch clears inside its date at today's sell-through">Watchlist</SectionTitle>
		<div class="list">
			{#each views as v (v.id)}<BatchRow
					view={v}
					compact={app.bp === 'phone'}
					onopen={() => {
						if (v.phase) router.go('route', { ref: v.id });
					}}
				/>{/each}
		</div>
	</div>{/snippet}
{#snippet feed()}{#if s.feed.length}<div class="stack snug">
			<SectionTitle sub="Every hand-off, as it happens">Agent activity</SectionTitle><Card
				><AgentFeed events={s.feed} people={ws.data.people} live={-1} max={app.bp === 'phone' ? 3 : 6} /></Card
			>
		</div>{/if}{/snippet}
{#snippet main()}{@render card()}{@render list()}{/snippet}

<Screen {me} title="Command Center" sub={`Watcher checked ${rows} batches at ${watch} · nothing flagged`}>
	{#if app.bp === 'desktop'}<Columns sideWidth={340} {main} side={feed} />{:else}<div class="stack" style="gap: 20px">
			{@render card()}{@render feed()}{@render list()}
		</div>{/if}
</Screen>
