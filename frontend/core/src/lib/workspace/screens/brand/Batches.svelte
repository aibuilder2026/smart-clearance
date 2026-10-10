<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import DataTable, { type Column } from '../../../components/DataTable.svelte';
	import GateChips from '../../../components/GateChips.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import StatusBadge from '../../../components/StatusBadge.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { useRoute } from '../../context';
	import { batchViews, fmt, journeysOf, partAt } from '../../model';
	import { istMonth } from '../../photos';
	import { useWorkspace } from '../../source';
	import type { BatchView, LedgerBatch, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import OutcomeBadge from '../finance/OutcomeBadge.svelte';

	// Batches: every lot the Watcher sees, from the DMS export (screens/brand.jsx Batches), the operator's (SC-127): each
	// row opens the batch's page, on the screen for where it stands (SC-112). Under them, every batch that has cleared and
	// passed its best-before (SC-126 took them off the table), by month, each opening its page on its Record (SC-142)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const router = useRoute();

	type Row = BatchView & { name: string };
	const views = $derived(batchViews(ws.state, ws.data));
	const rows = $derived<Row[]>(views.map((v) => ({ ...v, name: v.skuObj.name })));
	const journeys = $derived(journeysOf(ws.state, ws.data, ws.cases, ws.case));
	const openRow = (v: BatchView) => router.go(partAt(journeys.find((i) => i.ref === v.id)), { ref: v.id });
	const phone = $derived(app.bp === 'phone');
	const months = $derived.by(() => {
		const out: { m: string; label: string; items: LedgerBatch[] }[] = [];
		const past = (ws.ledger?.batches ?? [])
			.filter((b) => !views.some((v) => v.id === b.ref))
			.sort((a, z) => (a.cleared < z.cleared ? 1 : -1));
		for (const b of past) {
			const m = b.cleared.slice(0, 7);
			let g = out.find((x) => x.m === m);
			if (!g)
				out.push(
					(g = {
						m,
						label: istMonth(b.cleared),
						items: []
					})
				);
			g.items.push(b);
		}
		return out;
	});
	// the photos sent for a cleared batch: its label photo, and the destruction's two for one with packs left at the
	// godown
	const photos = (b: LedgerBatch) => 1 + (b.outcome === 'leftover' ? 2 : 0);
</script>

{#snippet product(v: Row)}<span class="row tight"
		><Product name={v.skuObj.img} size={36} /><span class="stack tight" style="gap: 0"
			><b>{v.skuObj.name}</b><span class="mono subtle t-caption">{v.id}</span></span
		></span
	>{/snippet}
{#snippet dist(v: Row)}<span
		>{v.dist.name}
		<div class="t-caption subtle">{v.dist.city}</div></span
	>{/snippet}
{#snippet unitsCell(v: Row)}{fmt.num(v.units)}{/snippet}
{#snippet risk(v: Row)}{#if v.assess.atRisk}<span class="neg strong">{fmt.num(v.assess.atRisk)}</span
		>{:else}—{/if}{/snippet}
{#snippet gates(v: Row)}<GateChips gates={v.assess.gates} size="sm" />{/snippet}
{#snippet status(v: Row)}<StatusBadge status={v.phase || v.assess.status} />{/snippet}

<Screen {me} title="Batches" sub="Every lot the Watcher sees, and every batch that has cleared">
	<div class="stack" style="gap: 20px">
		<div class="stack tight">
			<div class="list-head">In view · from the DMS export</div>
			{#if phone}<div class="list">
					{#each views as v (v.id)}<BatchRow view={v} compact onopen={() => openRow(v)} />{/each}
				</div>{:else}<DataTable
					label="Batches"
					{rows}
					onrow={openRow}
					initialSort={['daysLeft', 'asc']}
					columns={[
						{ key: 'name', label: 'Product', cell: product },
						{ key: 'dist', label: 'Distributor', sortValue: (v) => v.dist.name, cell: dist },
						{ key: 'daysLeft', label: 'Days left', num: true },
						{ key: 'units', label: 'Units', num: true, cell: unitsCell },
						{ key: 'risk', label: 'At risk', num: true, sortValue: (v) => v.assess.atRisk, cell: risk },
						{ key: 'gates', label: 'Quick-commerce gates', sortable: false, cell: gates },
						{ key: 'status', label: 'Status', sortValue: (v) => v.phase || v.assess.status, cell: status }
					] satisfies Column<Row>[]}
				/>{/if}
		</div>
		{#each months as g (g.m)}<List head="Cleared · {g.label}"
				>{#each g.items as b (b.ref)}{@const n = photos(b)}<ListRow
						chevron
						onclick={() => router.go('report', { ref: b.ref, tab: 'record' })}
						>{#snippet leading()}<Product name={b.img} size={40} />{/snippet}{#snippet title()}<span
								class="row tight"
								style="gap: 8px; flex-wrap: wrap"><span>{b.name}</span><OutcomeBadge o={b.outcome} size="sm" /></span
							>{/snippet}{#snippet sub()}{b.ref} · {b.distributorName} · flagged {fmt.day(b.flagged)} · cleared {fmt.day(
								b.cleared
							)}{phone ? ` · ${fmt.inr(b.figures.net)}` : ''}{/snippet}{#snippet value()}{#if !phone}<span
									class="row"
									style="gap: 16px"
									><span class="rec-count"><Icon name="camera" size={15} />{n} {n === 1 ? 'photo' : 'photos'}</span><b
										class="tnum">{fmt.inr(b.figures.net)}</b
									></span
								>{/if}{/snippet}</ListRow
					>{/each}</List
			>{/each}
	</div>
</Screen>
