<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { batchViews, fmt } from '../../model';
	import { sumsOf } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { BatchView, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import OutcomeBadge from '../finance/OutcomeBadge.svelte';
	import DistBatch from './DistBatch.svelte';
	import SumCard from './SumCard.svelte';
	import SumLine from './SumLine.svelte';
	import { clearedOf, day, monthOf, phaseOfView, stopOf, worldOf } from './pt';

	// every batch of the client's the Watcher flagged at his godown (SC-130, screens/trade.jsx DistBatches): in a journey
	// now, everything he cleared by month under how its figures add up (SC-145: what they cost him = what he sold + what
	// the client credited him, each batch with its own sum), and the stock it is watching; each opening its own page
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const router = useRoute();
	const phone = $derived(app.bp === 'phone');
	const s = $derived(ws.state);
	const ref = $derived(router.route.params?.ref ?? null);
	const dist = $derived(
		Object.values(ws.data.distributors).find((d) => d.name === me.org) ??
			ws.case?.dist ??
			Object.values(ws.data.distributors)[0]
	);
	const cases = $derived(ws.partners?.cases ?? []);
	const phaseOf = (v: BatchView) => phaseOfView(ws, v);
	const views = $derived(batchViews(s, ws.data).filter((v) => v.distributor === dist.id));
	const journey = $derived(views.filter((v) => (phaseOf(v) ?? 'watching') !== 'watching'));
	const watching = $derived(views.filter((v) => (phaseOf(v) ?? 'watching') === 'watching'));
	const past = $derived(clearedOf(ws, dist.id));
	// the batches he cleared, summed (SC-145): what they cost him = what he sold + what the client credited him
	const sums = $derived(sumsOf(past, worldOf(ws)));
	const sumOf = (ref: string) => sums.batches.find((x) => x.ref === ref)!;
	const months = $derived.by(() => {
		const out: { m: string; label: string; items: typeof past }[] = [];
		for (const c of past) {
			const m = c.cleared!.slice(0, 7);
			let g = out.find((x) => x.m === m);
			if (!g) out.push((g = { m, label: monthOf(c.cleared!), items: [] }));
			g.items.push(c);
		}
		return out;
	});
	const unitsOf = (v: BatchView) =>
		v.hero && ws.case
			? ws.case.plan.units
			: v.second && ws.case
				? ws.case.donation.plan.units
				: (cases.find((c) => c.ref === v.id)?.plan.units ?? v.assess.atRisk);
	const flaggedOf = (v: BatchView) => cases.find((c) => c.ref === v.id)?.flagged ?? ws.data.day0;
	const W = $derived(ws.data.workspace);
</script>

{#if ref}<DistBatch {me} {dist} id={ref} />{:else}<Screen
		{me}
		title="Batches"
		sub={`${dist.name} · every batch of ${W.short}'s the Watcher flagged at your godown`}
	>
		<div class="stack" style="gap: 20px">
			{#if journey.length}<List head="In a journey now"
					>{#each journey as v (v.id)}<ListRow chevron onclick={() => router.go('batches', { ref: v.id })}
							>{#snippet leading()}<Product name={v.skuObj.img} size={40} />{/snippet}{#snippet title()}<span
									class="row tight"
									style="gap: 8px; flex-wrap: wrap"
									><span>{v.skuObj.name}</span><Badge size="sm" tone="blue" dot live>{stopOf(phaseOf(v))}</Badge></span
								>{/snippet}{#snippet sub()}{v.id} · flagged {day(flaggedOf(v))} · the agents act in your name{/snippet}{#snippet value()}{#if !phone}{fmt.num(
										unitsOf(v)
									)} packs{/if}{/snippet}</ListRow
						>{/each}</List
				>{/if}
			{#if past.length}<SumCard t={sums} page="batches" short={W.short} />{/if}
			{#each months as g (g.m)}<List head={`Cleared · ${g.label}`}
					>{#each g.items as c (c.ref)}{@const sku = ws.data.skus[c.sku]}<ListRow
							chevron
							onclick={() => router.go('batches', { ref: c.ref })}
							sub={`${c.ref} · flagged ${day(c.flagged)} · cleared ${day(c.cleared!)}`}
							>{#snippet leading()}<Product name={sku.img} size={40} />{/snippet}{#snippet title()}<span
									class="row tight"
									style="gap: 8px; flex-wrap: wrap"
									><span>{sku.name}</span>{#if !phone && c.outcome}<OutcomeBadge o={c.outcome} size="sm" />{/if}</span
								>{/snippet}{#snippet value()}<SumLine x={sumOf(c.ref)} lead="credit" />{/snippet}</ListRow
						>{/each}</List
				>{/each}
			{#if watching.length}<SectionTitle sub="From your nightly DMS export: nothing at risk">Watching</SectionTitle>
				<div class="list">
					{#each watching as v (v.id)}<BatchRow view={v} compact={phone} onopen={() => {}} />{/each}
				</div>{/if}
		</div>
	</Screen>{/if}
