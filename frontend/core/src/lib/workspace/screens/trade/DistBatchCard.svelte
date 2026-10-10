<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Aura from '../../../components/Aura.svelte';
	import Button from '../../../components/Button.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { rise } from '../../../motion/transitions';
	import { useRoute } from '../../context';
	import type { DistJourney } from '../../dist';
	import { fmt } from '../../model';
	import DistBatchLine from './DistBatchLine.svelte';
	import DistLineRow from './DistLineRow.svelte';
	import DistStep from './DistStep.svelte';
	import DistStopBadge from './DistStopBadge.svelte';
	import { day } from './pt';

	// a batch in a journey, as one card: the batch, its next step for him, its lines (SC-133, screens/trade.jsx
	// BatchCard)
	let { j }: { j: DistJourney } = $props();
	const { go } = useRoute();
	const app = useApp();
	const cleared = $derived(j.phase === 'cleared');
</script>

<section
	id="batch-{j.ref}"
	tabindex="-1"
	aria-label="{j.sku.name}, batch {j.ref}"
	class="card dist-batch"
	in:rise|global={{ y: 8 }}
>
	<div class="row between wrap" style="gap: 12px">
		<DistBatchLine
			sku={j.sku}
			id={j.ref}
			sub="{fmt.num(j.units)} packs at risk · flagged {day(j.flagged)}"
			size={app.bp === 'phone' ? 44 : 56}>{#snippet badge()}<DistStopBadge {j} />{/snippet}</DistBatchLine
		>
		<Button variant="ghost" size="sm" iconRight="chevron-right" onclick={() => go('batches', { ref: j.ref })}
			>The batch</Button
		>
	</div>
	{#if j.todo.length}<div class="stack" style="gap: 8px">
			{#each j.todo as t, i (t.id)}<DistStep {t} {j} primary={i === 0} />{/each}
		</div>{:else}<div class="dist-wait">
			<Aura on={!cleared} class="icontile soft" style="width: 36px; height: 36px; border-radius: 11px"
				><Icon name={cleared ? 'badge-check' : 'sparkles'} size={17} /></Aura
			><span class="t-subhead">{j.waiting}</span><span class="t-footnote subtle">Nothing for you now</span>
		</div>{/if}
	{#if j.lines.length}<div class="dist-lines">
			{#each j.lines as l (l.id)}<DistLineRow
					line={l}
					onopen={() => go(l.id === 'destroy' ? 'destroy' : 'van', { ref: j.ref })}
				/>{/each}
		</div>{/if}
</section>
