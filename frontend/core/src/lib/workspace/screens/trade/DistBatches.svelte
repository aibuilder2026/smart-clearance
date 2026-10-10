<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Money from '../../../components/Money.svelte';
	import Product from '../../../components/Product.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { batchViews, fmt } from '../../model';
	import { creditOf, distPapers, distPast, whole } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { BatchView, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import OutcomeBadge from '../finance/OutcomeBadge.svelte';
	import DistBatch from './DistBatch.svelte';
	import { day, monthOf, stopOf, worldOf } from './pt';

	// every batch of the client's the Watcher flagged at his godown (SC-130, screens/trade.jsx DistBatches): in a journey
	// now, everything he cleared by month under the one figure (what the client credited him), and the stock it is
	// watching; each opening its own page
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
	// a batch is in a journey from the Watcher's flag on: the batch in focus by the journey's state, the batch the same
	// agents donate (the stub's second) by its own, any other by the phase backend-api sends with it
	const phaseOf = (v: BatchView) => (v.hero ? s.hero.phase : v.second ? s.mango.phase || null : (v.journey ?? null));
	const views = $derived(batchViews(s, ws.data).filter((v) => v.distributor === dist.id));
	const journey = $derived(views.filter((v) => (phaseOf(v) ?? 'watching') !== 'watching'));
	const watching = $derived(views.filter((v) => (phaseOf(v) ?? 'watching') === 'watching'));
	const past = $derived(distPast(cases, dist.id).filter((c) => !journey.some((v) => v.id === c.ref)));
	const credit = $derived(past.reduce((t, c) => t + creditOf(c), 0));
	// what the cleared batches cost him, and what he sold from them: the sales and the credit add up to the cost (SC-141)
	const wholes = $derived(past.map((c) => whole(c, worldOf(ws))));
	const cost = $derived(wholes.reduce((t, w) => t + w.paid, 0));
	const sold = $derived(wholes.reduce((t, w) => t + w.rows.filter((r) => !r.paper).reduce((u, r) => u + r.v, 0), 0));
	const notes = $derived(
		past.reduce(
			(t, c) =>
				t + c.docs.filter((d) => (d.id === 'support' || d.id === 'expiry') && d.status !== 'not required').length,
			0
		)
	);
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
			{#if past.length}<Card class="stack" style="gap: 10px">
					<div class="lg-fig">
						<Money value={credit} size="l" /><span class="lg-what">credited by {W.short} since July</span>
					</div>
					<p class="lg-working">
						{past.length} batches cleared at your godown. They cost you {fmt.inr(cost)}; you sold {fmt.inr(sold)} from them
						(on Orders), and the price support, with the expiry credit where packs expired, made up the rest, so you ended
						whole: <b>{notes} credit notes</b>, each in its batch's papers.
					</p>
				</Card>{/if}
			{#each months as g (g.m)}<List head={`Cleared · ${g.label}`}
					>{#each g.items as c (c.ref)}{@const sku = ws.data.skus[c.sku]}{@const p = distPapers(c)}<ListRow
							chevron
							onclick={() => router.go('batches', { ref: c.ref })}
							sub={`${c.ref} · flagged ${day(c.flagged)} · cleared ${day(c.cleared!)}`}
							>{#snippet leading()}<Product name={sku.img} size={40} />{/snippet}{#snippet title()}<span
									class="row tight"
									style="gap: 8px; flex-wrap: wrap"
									><span>{sku.name}</span>{#if !phone && c.outcome}<OutcomeBadge o={c.outcome} size="sm" />{/if}</span
								>{/snippet}{#snippet value()}<span class="lg-val"
									><b class="tnum">{fmt.inr(creditOf(c))}</b><em
										>{p.mine.filter((d) => d.status !== 'not required').length + p.copies.length} papers</em
									></span
								>{/snippet}</ListRow
						>{/each}</List
				>{/each}
			{#if watching.length}<SectionTitle sub="From your nightly DMS export: nothing at risk">Watching</SectionTitle>
				<div class="list">
					{#each watching as v (v.id)}<BatchRow view={v} compact={phone} onopen={() => {}} />{/each}
				</div>{/if}
		</div>
	</Screen>{/if}
