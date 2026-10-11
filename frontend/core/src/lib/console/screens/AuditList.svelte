<script lang="ts">
	import { Card, Empty, List, ListRow, WorkspaceMark } from '../../index';
	import { createQuery } from '@tanstack/svelte-query';
	import { useConsole } from '../console.svelte';

	// the audit log, newest first: every client's, or one client's
	let { filter = null }: { filter?: string | null } = $props();
	const k = useConsole();
	const audit = createQuery(() => k.q.audit(filter));
	const clients = createQuery(() => k.q.clients());
	const client = (id: string | null) => clients.data?.find((c) => c.id === id);
</script>

{#if audit.data}
	{#if !audit.data.length}<Card><Empty icon="scroll-text" title="Nothing logged yet" /></Card>{:else}
		<List>
			{#each audit.data as a (a.id)}
				{@const c = client(a.client)}
				{#snippet mark()}{#if !filter && c}<WorkspaceMark ws={c} size={28} />{/if}{/snippet}
				<ListRow leading={mark} title={a.text} sub="{a.who} · {a.at}{!filter && c ? ' · ' + c.name : ''}" />
			{/each}
		</List>
	{/if}
{/if}
