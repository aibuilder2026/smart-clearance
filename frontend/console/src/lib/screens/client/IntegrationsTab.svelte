<script lang="ts">
	import type { Client } from '@smart-clearance/api/console';
	import { Badge, Button, Card, Empty, List, ListRow, type IconName } from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import { STATUS } from '#lib/status.ts';

	// what a client's workspace is connected to; a new client starts with its distributors' first stock export
	let { c }: { c: Client } = $props();
	const k = useConsole();
	const connect = () => k.act(() => api.requestFirstExport(c.id), 'Upload link sent');
</script>

{#snippet ask()}<Button variant="primary" icon="file-spreadsheet" onclick={connect}>Ask for the first export</Button
	>{/snippet}

<div class="stack" style="gap: 14px">
	{#if c.integrations.length}
		<List>
			{#each c.integrations as i (i.id)}
				{@const [tone, label] = STATUS[i.status] ?? [undefined, i.status]}
				{#snippet badge()}<Badge size="sm" {tone} dot={!!tone}>{label}</Badge>{/snippet}
				<ListRow
					icon={(k.catalog.connectors.find((x) => x.id === i.id)?.icon ?? 'plug') as IconName}
					iconTone="soft"
					title={i.name}
					sub="{i.kind} · {i.note}"
					value={badge}
				/>
			{/each}
		</List>
	{:else}<Card
			><Empty
				icon="plug"
				title="Nothing connected yet"
				body="Start with the distributors' stock exports; everything else follows the first file."
				action={ask}
			/></Card
		>{/if}
	<p class="t-footnote subtle" style="margin: 0">Mocked connectors stand in for partner APIs in this prototype.</p>
</div>
