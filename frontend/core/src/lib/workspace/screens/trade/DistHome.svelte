<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { batchViews } from '../../model';
	import { distPast } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import ActingFor from './ActingFor.svelte';
	import DistBatchCard from './DistBatchCard.svelte';
	import DistIndex from './DistIndex.svelte';
	import PermissionCard from './PermissionCard.svelte';
	import { distJourneysOf, distOfMe } from './pt';

	// his Today, batch by batch (SC-133, option A; screens/trade.jsx DistHome): a card for each batch of the client's at
	// his godown in a journey, its next step for him with its one button, and its lines (the scheme, the lot, the staff
	// sale, the pickup), each where it stands; an index over them when there is more than one; and the way to the rest
	// of his stock and the batches he cleared, on Batches. A cleared batch stays only while something is left for him
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const { go } = useRoute();
	const s = $derived(ws.state);
	const dist = $derived(distOfMe(ws, me));
	const W = $derived(ws.data.workspace);
	const perm = $derived(s.setup.permission);
	// the one-time permission is the distributor's whose batch is in focus, or his own once given
	const asked = $derived(ws.case ? ws.case.dist.id === dist.id : !!perm);
	const js = $derived(
		distJourneysOf(ws, dist.id)
			.map((x) => x.j)
			.filter((j) => j.phase !== 'cleared' || j.todo.length)
	);
	const all = $derived(distJourneysOf(ws, dist.id).map((x) => x.j.ref));
	const watching = $derived(
		batchViews(s, ws.data).filter((v) => v.distributor === dist.id && !all.includes(v.id)).length
	);
	const past = $derived(distPast(ws.partners?.cases ?? [], dist.id).filter((c) => !all.includes(c.ref)).length);
</script>

<Screen {me} title="Today" sub="{dist.name} · {dist.godown}, {dist.city}">
	<div class="stack" style="gap: 16px; max-width: 960px">
		{#if asked}{#if perm}<ActingFor p={perm} />{:else}<PermissionCard {dist} />{/if}{/if}
		<SectionTitle sub="{W.short}'s batches at your godown: what each needs from you, and where each line stands"
			>{js.length
				? `${js.length} ${js.length === 1 ? 'batch' : 'batches'} in a journey`
				: 'No batch in a journey'}</SectionTitle
		>
		{#if js.length > 1}<DistIndex {js} />{/if}
		{#each js as j (j.ref)}<DistBatchCard {j} />{:else}<Card
				><Empty
					img="godown"
					title="Nothing asks for you today"
					body="When the Watcher flags a batch at {dist.godown}, it opens here with what it needs from you. It checks your stock every morning at {s
						.rules.watchTime}."
				/></Card
			>{/each}
		<button type="button" class="dist-more" onclick={() => go('batches')}
			><Icon name="boxes" size={17} /><span class="grow"
				>Your other stock and the batches you cleared are on <b>Batches</b>: {watching} the Watcher reads, {past} cleared
				since {W.since}</span
			><Icon name="chevron-right" size={16} class="subtle" /></button
		>
	</div>
</Screen>
