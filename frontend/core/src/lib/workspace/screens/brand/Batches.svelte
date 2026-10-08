<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import DataTable, { type Column } from '../../../components/DataTable.svelte';
	import GateChips from '../../../components/GateChips.svelte';
	import Product from '../../../components/Product.svelte';
	import StatusBadge from '../../../components/StatusBadge.svelte';
	import { useRoute } from '../../context';
	import { batchViews, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { BatchView, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import BatchSheet from './BatchSheet.svelte';

	// Batches: every lot the Watcher sees, from the DMS export; the hero opens the Route Room, any other its sheet
	// (screens/brand.jsx Batches)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const router = useRoute();
	let openId = $state<string | null>(null);

	type Row = BatchView & { name: string };
	const views = $derived(batchViews(ws.state, ws.data));
	const rows = $derived<Row[]>(views.map((v) => ({ ...v, name: v.skuObj.name })));
	const sel = $derived(openId ? views.find((v) => v.id === openId) : undefined);
	const openRow = (v: BatchView) => (v.hero ? router.go('route', { ref: v.id }) : (openId = v.id));
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
	<BatchSheet view={sel} onclose={() => (openId = null)} />
</Screen>
