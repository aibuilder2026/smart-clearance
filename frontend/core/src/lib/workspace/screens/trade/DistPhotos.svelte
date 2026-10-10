<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import { factsPhotos, factsYes } from '../../photos';
	import { useWorkspace } from '../../source';
	import type { Distributor, PartnerCase } from '../../types';
	import RecordActor from '../record/RecordActor.svelte';
	import RecordPhotos from '../record/RecordPhotos.svelte';
	import { recWhen, upFirst } from '../record/record';

	// the photos he sent for a batch (SC-142, screens/trade.jsx DistPhotos): its label photo, with what Vision read, and
	// the destruction's two, with Vision's checks and the client's yes on them. On the live workspace every batch reads
	// his facts (pc), which carry the photos' links; on the stub the batch's record, a cleared batch's from the history
	// and the journey's own batch's from the journey's state
	let { pc, past, dist }: { pc: PartnerCase | null; past: PartnerCase | null; dist: Distributor } = $props();
	const ws = useWorkspace();
	const by = $derived(ws.me?.name ?? dist.name);
	const facts = $derived(pc ? factsPhotos(pc, by) : null);
	const rec = $derived(facts ? null : ws.record(pc?.ref ?? past?.ref ?? ws.case?.batch.id ?? ''));
	const photos = $derived(facts ?? rec?.photos ?? []);
	const yes = $derived(
		!past
			? null
			: facts
				? factsYes(pc!, dist.godown, ws.data.people)
				: (rec?.steps.find((x) => x.key === 'destruction.approve') ?? null)
	);
	const note = $derived(past?.docs.find((d) => d.id === 'expiry' && d.status !== 'not required') ?? null);
</script>

<div class="stack" style="gap: 16px">
	<RecordPhotos
		{photos}
		title="Your photos for this batch"
		empty="No photo yet: Vision asks for the carton's label once the Watcher flags the batch."
	/>
	{#if yes}<Card class="stack snug"
			><span class="card-title">Approved</span>
			<div class="rec-yes">
				<RecordActor who={yes.who} size={32} />
				<div class="grow" style="min-width: 0">
					<b class="t-subhead">{yes.who.name}</b>
					<div class="t-footnote muted">{upFirst(yes.text)}</div>
				</div>
				<time class="t-caption subtle tnum">{recWhen(yes.at)}</time>
			</div>
			{#if note}<span class="t-footnote muted"
					>{ws.data.workspace.short} credited you on {note.no} once it approved.</span
				>{/if}</Card
		>{/if}
</div>
