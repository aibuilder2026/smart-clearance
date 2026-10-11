<script lang="ts">
	import type { Connector } from '@smart-clearance/api/console';
	import { Badge, Icon, List, ListRow, Sheet, useApp, WorkspaceMark, type IconName } from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { clientsQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import { href } from '#lib/links.ts';
	import Screen from '#lib/screens/Screen.svelte';
	import { STATUS } from '#lib/status.ts';

	// what a workspace can connect to, by kind, and which clients use each
	const app = useApp();
	const k = useConsole();
	const clients = createQuery(() => clientsQuery());
	const kinds = [...new Set(k.catalog.connectors.map((x) => x.kind))];
	let open: Connector | null = $state(null);
	const users = (id: string) => (clients.data ?? []).filter((c) => c.integrations.some((i) => i.id === id));
</script>

<Screen title="Connectors" sub="What a workspace can connect to; mocked ones stand in for partner APIs">
	<div class="cs-connectors">
		{#each kinds as kind (kind)}<List head={kind}>
				{#each k.catalog.connectors.filter((y) => y.kind === kind) as y (y.id)}
					{@const [tone, label] = STATUS[y.status]}
					{@const u = users(y.id)}
					{#snippet badge()}<Badge size="sm" {tone} dot={!!tone}>{label}</Badge>{/snippet}
					<ListRow
						icon={y.icon as IconName}
						iconTone="soft"
						title={y.name}
						sub="{y.note}{u.length ? ' · used by ' + u.map((c) => c.name).join(', ') : ''}"
						value={badge}
						chevron
						onclick={() => (open = y)}
					/>
				{/each}
			</List>{/each}
	</div>
	<Sheet
		open={!!open}
		onclose={() => (open = null)}
		title={open?.name ?? ''}
		side={app.bp === 'phone' ? 'bottom' : 'center'}
		detent="medium"
	>
		{#if open}{@const x = open}{@const xu = users(x.id)}
			<div class="stack">
				<div class="row" style="gap: 12px">
					<span class="icontile soft" style="width: 40px; height: 40px; border-radius: 12px"
						><Icon name={x.icon as IconName} size={20} /></span
					>
					<div class="stack tight" style="gap: 2px">
						<b class="t-headline">{x.name}</b><span class="t-footnote subtle">{x.kind} · {STATUS[x.status][1]}</span>
					</div>
				</div>
				<p class="t-subhead muted" style="margin: 0">
					{x.note}.{x.status === 'mock'
						? ' In this prototype it is mocked: the agents call it, and it answers as the partner would.'
						: x.status === 'soon'
							? ' Not available yet.'
							: ''}
				</p>
				<List head="Used by">
					{#each xu as c (c.id)}
						{#snippet mark()}<WorkspaceMark ws={c} size={28} />{/snippet}
						<ListRow
							leading={mark}
							title={c.name}
							sub={c.domain}
							chevron
							onclick={() => {
								open = null;
								void goto(href('clients', c.id, 'integrations'));
							}}
						/>
					{:else}<ListRow title="No client yet" />{/each}
				</List>
			</div>{/if}
	</Sheet>
</Screen>
