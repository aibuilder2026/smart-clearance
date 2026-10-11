<script lang="ts">
	import { Card, Icon, WorkspaceMark } from '../../index';
	import { createQuery } from '@tanstack/svelte-query';
	import { useConsole } from '../console.svelte';
	import Screen from './Screen.svelte';

	// the plans, scoped by reach, and the clients on each
	const k = useConsole();
	const clients = createQuery(() => k.q.clients());
</script>

<Screen title="Plans" sub="Plans are scoped by reach, not seats; prices on request in this prototype">
	<div class="cs-plans">
		{#each k.catalog.plans as p (p.id)}
			{@const on = (clients.data ?? []).filter((c) => c.plan === p.id)}
			<Card class="stack" style="gap: 12px">
				<b class="t-title3">{p.name}</b>
				<ul class="cs-scope">
					{#each p.scope as x (x)}<li><Icon name="check" size={16} stroke={2.4} />{x}</li>{/each}
				</ul>
				<span class="t-footnote subtle">Prices on request</span>
				<div class="row tight wrap">
					{#each on as c (c.id)}<button
							type="button"
							class="chip"
							onclick={() => k.go({ screen: 'clients', id: c.id, tab: 'plan' })}
							><WorkspaceMark ws={c} size={18} />{c.name}</button
						>{:else}<span class="t-footnote subtle">No clients on this plan yet</span>{/each}
				</div>
			</Card>
		{/each}
	</div>
</Screen>
