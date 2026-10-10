<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Skeleton from '../../../components/Skeleton.svelte';
	import type { BatchRecord } from '../../types';
	import RecordPhotos from './RecordPhotos.svelte';
	import RecordTrail from './RecordTrail.svelte';
	import RecordYeses from './RecordYeses.svelte';

	// a batch's Record (SC-142, option A; screens/finance.jsx RecordTab): the photos sent for it first, then the audit
	// trail beside the yeses; placeholders while the live workspace reads it
	let { batch, rec }: { batch: string; rec: BatchRecord | null } = $props();
</script>

{#if !rec}<div class="stack" style="gap: 16px" aria-busy="true">
		<Card class="stack" style="gap: 14px"
			>{#each [0, 1, 2] as i (i)}<Skeleton h={i ? 18 : 160} r={i ? 6 : 16} />{/each}</Card
		><Card class="stack" style="gap: 14px"
			>{#each [0, 1, 2, 3] as i (i)}<Skeleton h={18} r={6} />{/each}</Card
		>
	</div>
{:else}<div class="stack" style="gap: 16px">
		<RecordPhotos
			photos={rec.photos}
			title="Photos sent for this batch"
			empty="No photo yet: Vision asks the distributor for the carton's label once the Watcher flags the batch."
		/>
		<div class="rec-cols"><RecordTrail steps={rec.steps} {batch} /><RecordYeses steps={rec.steps} /></div>
	</div>{/if}
