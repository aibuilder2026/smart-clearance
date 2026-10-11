<script lang="ts">
	import { WorkspaceMark } from '../../index';
	import { createQuery } from '@tanstack/svelte-query';
	import { useConsole } from '../console.svelte';
	import AuditList from './AuditList.svelte';
	import Screen from './Screen.svelte';

	// every change staff and client admins make, newest first; one client's, or everything
	const k = useConsole();
	const clients = createQuery(() => k.q.clients());
	let filter: string | null = $state(null);
</script>

<Screen title="Audit log" sub="Every change staff and client admins make, newest first">
	<div class="stack" style="gap: 14px">
		<div class="row tight wrap">
			<button type="button" class="chip" aria-pressed={!filter} onclick={() => (filter = null)}>Everything</button
			>{#each clients.data ?? [] as c (c.id)}<button
					type="button"
					class="chip"
					aria-pressed={filter === c.id}
					onclick={() => (filter = c.id)}><WorkspaceMark ws={c} size={18} />{c.name}</button
				>{/each}
		</div>
		<AuditList {filter} />
	</div>
</Screen>
