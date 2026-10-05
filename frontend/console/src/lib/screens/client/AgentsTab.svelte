<script lang="ts">
	import type { Agent, Autonomy, Client } from '@smart-clearance/api/console';
	import { cx, Empty, Sheet, useApp } from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import AgentInspector from './AgentInspector.svelte';
	import AgentPipeline from './AgentPipeline.svelte';

	// a client's agents: the pipeline, and the selected agent's settings beside it on desktops or in a sheet elsewhere
	let { c }: { c: Client } = $props();
	const app = useApp();
	const k = useConsole();
	// a desktop opens on the Negotiator, as the prototype does
	let sel: string | null = $state(app.bp === 'desktop' ? 'negotiator' : null);
	const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

	function setAutonomy(a: Agent, v: Autonomy) {
		if (c.agents[a.id].autonomy === v) return;
		void k.act(() => api.updateAgent(c.id, a.id, { autonomy: v }), `${a.name}: ${k.level(v).label}, for ${c.name}`);
	}
</script>

{#snippet legend()}<p class="t-footnote subtle cs-legend">
		{#each k.config.autonomy as l (l.id)}<span
				><span class={cx('cs-key', 'auto-' + l.id)} aria-hidden="true"></span><b>{l.label}</b> {lower(l.text)}</span
			>{/each}
	</p>{/snippet}
{#snippet pipe()}<AgentPipeline
		{c}
		{sel}
		onselect={(id) => (sel = id)}
		onautonomy={setAutonomy}
		compact={app.bp === 'phone'}
	/>{/snippet}

{#if app.bp === 'desktop'}
	<div class="cs-agents">
		<div class="stack" style="gap: 12px; min-width: 0">{@render legend()}{@render pipe()}</div>
		<aside class="cs-inspector card" aria-label="Selected agent">
			{#if sel}{#key c.id + sel}<AgentInspector {c} id={sel} onautonomy={setAutonomy} />{/key}{:else}<Empty
					icon="mouse-pointer-click"
					title="Choose an agent"
					body="Its limits, schedule and last run open here."
				/>{/if}
		</aside>
	</div>
{:else}
	<div class="stack" style="gap: 12px">
		{@render legend()}{@render pipe()}<Sheet
			open={!!sel}
			onclose={() => (sel = null)}
			title={sel ? k.agent(sel).name : ''}
			side={app.bp === 'phone' ? 'bottom' : 'side'}
			detent="large"
			>{#if sel}{#key c.id + sel}<AgentInspector {c} id={sel} onautonomy={setAutonomy} />{/key}{/if}</Sheet
		>
	</div>
{/if}
