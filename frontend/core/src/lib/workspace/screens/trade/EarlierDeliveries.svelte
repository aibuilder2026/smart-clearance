<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { deliveriesPast } from '../../dist';
	import { distPast } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { Distributor } from '../../types';
	import OutcomeBadge from '../finance/OutcomeBadge.svelte';
	import DistBatchLine from './DistBatchLine.svelte';
	import DistChan from './DistChan.svelte';
	import { day, distWorldOf, when } from './pt';

	// what left his godown for the batches he cleared, batch by batch, newest first (SC-133, screens/trade.jsx
	// EarlierDeliveries): the van round, the buyer's truck, the staff sale, the pickup, each with its day
	let { dist, skip = [] }: { dist: Distributor; skip?: string[] } = $props();
	const ws = useWorkspace();
	const { go } = useRoute();
	const w = $derived(distWorldOf(ws));
	const past = $derived(
		distPast(ws.partners?.cases ?? [], dist.id)
			.filter((c) => !skip.includes(c.ref))
			.map((c) => ({ c, rows: deliveriesPast(c, w) }))
			.filter((x) => x.rows.length)
	);
</script>

{#if past.length}<section class="stack snug" aria-label="Earlier deliveries">
		<SectionTitle sub="What left your godown for the batches you cleared, newest first">Earlier deliveries</SectionTitle
		>
		<div class="stack" style="gap: 12px">
			{#each past as { c, rows } (c.ref)}<Card class="stack snug">
					<div class="row between wrap" style="gap: 12px">
						<DistBatchLine sku={w.skus[c.sku]} id={c.ref} size={40} sub="cleared {day(c.cleared!)}"
							>{#snippet badge()}{#if c.outcome}<OutcomeBadge o={c.outcome} size="sm" />{/if}{/snippet}</DistBatchLine
						>
						<Button variant="ghost" size="sm" iconRight="chevron-right" onclick={() => go('batches', { ref: c.ref })}
							>The batch</Button
						>
					</div>
					<div class="dist-rows">
						{#each rows as r (r.id)}<div class="dist-row">
								<DistChan
									id={r.id}
									icon={r.id === 'kirana' ? 'route' : r.id === 'expiresoon' ? 'truck' : undefined}
								/><span class="grow stack tight" style="gap: 1px; min-width: 0"
									><b class="t-subhead">{r.title}</b><span class="t-footnote muted">{r.sub}</span></span
								><time class="t-footnote subtle">{when(r.at)}</time>
							</div>{/each}
					</div>
				</Card>{/each}
		</div>
	</section>{/if}
