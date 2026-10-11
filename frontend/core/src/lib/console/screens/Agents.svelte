<script lang="ts">
	import { Card, cx, Icon, WorkspaceMark, type IconName } from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { clientsQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import { href } from '#lib/links.ts';
	import Screen from '#lib/screens/Screen.svelte';

	// the agents every workspace runs, in the order they work, and how far each client lets each one go
	const k = useConsole();
	const clients = createQuery(() => clientsQuery());
</script>

<Screen title="Agents" sub="The agents every workspace runs, in the order they work. Each client sets how far they go.">
	<div class="cs-catalog">
		{#each k.catalog.agents as a (a.id)}<Card class={cx('cs-agentcard', a.gate && 'is-gate')}>
				<div class="row" style="gap: 12px">
					<span class={cx('icontile', a.gate ? 'amber' : '')}
						><Icon name={a.icon as IconName} size={17} stroke={2} /></span
					>
					<div class="stack tight" style="gap: 0">
						<b class="t-subhead">{a.name}</b><span class="t-caption subtle"
							>{k.config.stageNames[a.stage]} · {a.gate ? 'a person, always' : a.model}</span
						>
					</div>
				</div>
				<p class="t-footnote muted" style="margin: 0">{a.job}.</p>
				<div class="row tight wrap">
					{#each clients.data ?? [] as c (c.id)}
						{@const cfg = c.agents[a.id]}
						<button type="button" class="chip" onclick={() => goto(href('clients', c.id, 'agents'))}
							><WorkspaceMark ws={c} size={18} />{c.name}: {a.gate
								? 'on'
								: !cfg.on
									? 'off'
									: k.level(cfg.autonomy).label}</button
						>
					{/each}
				</div>
			</Card>{/each}
	</div>
</Screen>
