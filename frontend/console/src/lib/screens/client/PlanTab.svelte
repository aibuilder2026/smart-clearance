<script lang="ts">
	import type { Client } from '@smart-clearance/api/console';
	import { Button, Card, Columns, fmt, List, ListRow, SectionTitle, Segmented } from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import PlanScope from '../PlanScope.svelte';

	// a client's plan, what it covers, and how much of it the client uses; a client not yet live goes live from here
	let { c, onlive }: { c: Client; onlive: () => void } = $props();
	const k = useConsole();
	const plans = k.catalog.plans.map((p) => ({ id: p.id, label: p.name }));
	const scope = $derived((k.catalog.plans.find((p) => p.id === c.plan) ?? k.catalog.plans[0]).scope);
	function setPlan(id: string) {
		if (id === c.plan) return;
		void k.act(() => api.setPlan(c.id, id), `${c.name} on ${k.planName(id)}`);
	}
</script>

{#snippet main()}
	<SectionTitle sub="Prices on request in this prototype">Plan</SectionTitle>
	<Segmented label="Plan" options={plans} value={c.plan} onchange={setPlan} class="lg" />
	<PlanScope {scope} />
	{#if c.status !== 'live'}<Card class="row wrap" style="gap: 12px"
			><div class="stack tight grow" style="gap: 2px">
				<b class="t-subhead">Not live yet</b><span class="t-footnote subtle"
					>Go live once the admin has accepted and the first stock export has arrived.</span
				>
			</div>
			<Button variant="primary" icon="circle-play" onclick={onlive}>Go live</Button></Card
		>{/if}
{/snippet}
{#snippet side()}
	<SectionTitle>Usage</SectionTitle>
	<List>
		<ListRow title="Distributors" value={c.distributors.length} />
		<ListRow title="SKUs" value={c.skus.length} />
		<ListRow title="Batches tracked" value={c.batches} />
		<ListRow title="Recovered so far" value={c.recovered ? fmt.inr(c.recovered) : 'none yet'} />
		<ListRow title="People" value="{c.people.filter((p) => p.status === 'active').length} active" />
	</List>
{/snippet}

<Columns sideWidth={420} {main} {side} />
