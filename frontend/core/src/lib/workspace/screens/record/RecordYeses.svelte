<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import { useWorkspace } from '../../source';
	import type { RecordStep } from '../../types';
	import RecordActor from './RecordActor.svelte';
	import { recWhen, upFirst } from './record';

	// the yeses: what only a person at the client could let happen, in their name
	let { steps }: { steps: RecordStep[] } = $props();
	const ws = useWorkspace();
	const yes = $derived(steps.filter((x) => x.yes));
</script>

<Card class="stack snug"
	><span class="card-title">The yeses</span><span class="t-footnote muted"
		>What only a person at {ws.data.workspace.short} could let happen, in their name.</span
	>
	{#each yes as x (x.key + x.at)}<div class="rec-yes">
			<RecordActor who={x.who} size={32} />
			<div class="grow" style="min-width: 0">
				<b class="t-subhead">{x.who.name}</b>
				<div class="t-footnote muted">{upFirst(x.text)}</div>
			</div>
			<time class="t-caption subtle tnum">{recWhen(x.at)}</time>
		</div>{:else}<span class="t-footnote muted">No yes yet: the plan waits for one.</span>{/each}
</Card>
