<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import DataTable, { type Column } from '../../../components/DataTable.svelte';
	import DaysNum from '../../../components/DaysNum.svelte';
	import GateChips from '../../../components/GateChips.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import StatusBadge from '../../../components/StatusBadge.svelte';
	import { useRoute } from '../../context';
	import { D } from '../../data';
	import { fmt } from '../../model';
	import { batchViews } from '../../legacy';
	import { store } from '../../store.svelte';
	import type { BatchView, User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// Batches: every lot the Watcher sees, from the DMS export; the hero opens the Route Room, any other its sheet
	// (screens/brand.jsx Batches)
	let { me }: { me: User } = $props();
	const app = useApp();
	const router = useRoute();
	let openId = $state<string | null>(null);

	type Row = BatchView & { name: string };
	const views = $derived(batchViews(store.state));
	const rows = $derived<Row[]>(views.map((v) => ({ ...v, name: v.skuObj.name })));
	const sel = $derived(openId ? views.find((v) => v.id === openId) : undefined);
	const ML = (id: string) => D.mangoPlan.lines.find((l) => l.id === id) || { units: 0 };
	const openRow = (v: BatchView) => (v.hero ? router.go('route') : (openId = v.id));
	const facts = (b: BatchView): [string, string][] => [
		['Batch', b.id],
		['Distributor', `${b.dist.name}, ${b.dist.city}`],
		['Units', fmt.num(b.units)],
		['Sells', `${b.sellPerDay} a day`],
		['Will sell before the last week', fmt.num(b.assess.willSell)],
		['At risk', b.assess.atRisk ? fmt.num(b.assess.atRisk) : 'none']
	];
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

<Screen {me} title="Batches" sub="Every lot the Watcher sees, from the DMS export">
	{#if app.bp === 'phone'}<div class="list">
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
	<Sheet bind:open={() => !!sel, (o) => !o && (openId = null)} title={sel ? sel.skuObj.name : ''}>
		{#if sel}<div class="stack">
				<div class="row" style="gap: 14px">
					<Product name={sel.skuObj.img} size={88} />
					<div class="stack tight">
						<DaysNum days={sel.daysLeft} life={sel.skuObj.lifeDays} size="l" /><span class="t-footnote subtle"
							>days left · best before {fmt.date(sel.bestBefore)}</span
						>
					</div>
				</div>
				<GateChips gates={sel.assess.gates} />
				<List
					>{#each facts(sel) as [k, val] (k)}<ListRow title={k} value={val} />{/each}</List
				>
				<p class="t-footnote muted">
					{sel.phase === 'executing'
						? `Routed yesterday: ${fmt.num(ML('kirana').units)} packs to Hyderabad kiranas, ${ML('staff').units} to the staff sale at Lakshmi's godown, ${D.mangoFb} to Feeding India.`
						: sel.assess.status === 'gated'
							? 'Outside at least one quick-commerce gate, but real sell-through clears it in time. The Watcher checks again tomorrow at 09:00.'
							: 'Inside every gate and selling through. Nothing to do.'}
				</p>
			</div>{/if}
	</Sheet>
</Screen>
