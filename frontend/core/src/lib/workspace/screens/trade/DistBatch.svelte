<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import type { IconName } from '../../../icons/registry';
	import { rise } from '../../../motion/transitions';
	import { batchViews } from '../../model';
	import { feedOfSteps, moments, storyMoments } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { Distributor, User } from '../../types';
	import Locked from '../common/Locked.svelte';
	import Screen from '../common/Screen.svelte';
	import OutcomeBadge from '../finance/OutcomeBadge.svelte';
	import DistPapers from './DistPapers.svelte';
	import PaperSheet from './PaperSheet.svelte';
	import PtHead from './PtHead.svelte';
	import PtMoments from './PtMoments.svelte';
	import PtTabs from './PtTabs.svelte';
	import WholeCard from './WholeCard.svelte';
	import { day, stopOf, worldOf } from './pt';

	// a batch's own page (SC-130, screens/trade.jsx DistBatch): its head, then What happened, Money (how he ended whole)
	// and Papers. A batch he cleared reads its facts; the batch in a journey, the journey's own state; another batch
	// still in a journey says the agents act on it and fills in once it settles
	let { me, dist, id }: { me: User; dist: Distributor; id: string } = $props();
	const ws = useWorkspace();
	const s = $derived(ws.state);
	const TABS: { id: string; label: string; icon: IconName }[] = [
		{ id: 'what', label: 'What happened', icon: 'history' },
		{ id: 'money', label: 'Money', icon: 'coins' },
		{ id: 'papers', label: 'Papers', icon: 'file-text' }
	];
	let tab = $state('what');
	let paper = $state<string | null>(null);
	let sheet = $state(false);
	const w = $derived(worldOf(ws));
	const v = $derived(batchViews(s, ws.data).find((x) => x.id === id && x.distributor === dist.id) ?? null);
	const phase = $derived(v ? (v.hero ? s.hero.phase : v.second ? s.mango.phase || null : (v.journey ?? null)) : null);
	const inJourney = $derived(!!phase && phase !== 'watching');
	const pc = $derived(ws.partners?.cases.find((x) => x.ref === id && x.dist === dist.id) ?? null);
	// a batch he cleared: its facts, and its case for the papers (the live workspace reads it as the page opens). The
	// journey's own batch reads them too once it has cleared (SC-135): they carry every moment (the staff sale, the
	// pickup, the packets not ordered, what expired at his godown), which the journey's state does not
	const past = $derived(pc?.cleared && (!inJourney || phase === 'cleared') ? pc : null);
	$effect(() => {
		if (past) ws.openPage?.(id);
	});
	const page = $derived(past ? ws.ledgerPage(id) : null);
	// the batch in a journey that is in focus: the journey's own state
	const story = $derived(!past && inJourney && ws.case?.batch.id === id ? ws.case : null);
	const sku = $derived(past ? ws.data.skus[past.sku] : (v?.skuObj ?? null));
	// what has happened: the journey's feed, or (a partner on the live workspace, sent none) the steps of the batch
	const items = $derived(
		past
			? moments(past, w)
			: story
				? s.feed.length
					? storyMoments(s.feed, story, s.hero, w, true)
					: storyMoments(pc ? feedOfSteps(pc) : [], story, s.hero, w, false)
				: []
	);
	const open = (pid: string) => {
		paper = pid;
		sheet = true;
	};
</script>

{#if !sku || (!past && !inJourney)}<Screen {me} title="Batches" back="Batches"
		><Card><Empty icon="boxes" title="Not one of your batches" body="This batch is not at your godown." /></Card
		></Screen
	>{:else}
	{#snippet badge()}{#if past && past.outcome}<OutcomeBadge o={past.outcome} size="sm" />{:else}<Badge
				size="sm"
				tone="blue"
				dot
				live>{stopOf(phase)}</Badge
			>{/if}{/snippet}
	{#snippet head()}<PtHead
			sku={sku!}
			{id}
			where={`${dist.godown}, ${dist.city}`}
			{badge}
			line={past
				? `Flagged ${day(past.flagged)} · cleared ${day(past.cleared!)}`
				: `Flagged ${day(pc?.flagged ?? ws.data.day0)} · the agents act in your name`}
			><PtTabs tabs={TABS} value={tab} onchange={(t) => (tab = t)} label={`${sku!.name}, ${id}`} /></PtHead
		>{/snippet}
	<Screen {me} title={sku.name} back="Batches" hideLarge below={head}>
		{#key tab}<div class="pt-body" in:rise={{ y: 6, duration: 220 }}>
				{#if !past && !story}<Locked
						icon="history"
						agent="Smart-Clearance"
						text={`The agents act in your name on ${sku.name}: its moments, its money and its papers show here once it settles.`}
					/>{:else if tab === 'what'}<Card><PtMoments {items} /></Card>{:else if tab === 'money'}<WholeCard
						c={past}
						{story}
						onpaper={open}
					/>{:else}<DistPapers
						c={past ?? { partner: null, docs: story!.docs }}
						ready={!!past || !!s.hero.docs}
						onopen={open}
					/>{/if}
			</div>{/key}
	</Screen>
	<!-- a cleared batch's paper is read from its case, which the live workspace reads as the page opens -->
	{#if past && page}<PaperSheet bind:open={sheet} ref={id} c={page.c} id={paper} />{:else if story}<PaperSheet
			bind:open={sheet}
			ref={id}
			c={story}
			id={paper}
		/>{/if}
{/if}
