<script lang="ts">
	import type { Agent, Autonomy, Client, JourneyStandIn, JourneyTrigger } from '@smart-clearance/api/console';
	import { Alert, cx, Empty, Sheet, useApp } from '../../../index';
	import { createQuery } from '@tanstack/svelte-query';
	import { useConsole } from '../../console.svelte';
	import AgentInspector from './AgentInspector.svelte';
	import AgentPipeline from './AgentPipeline.svelte';
	import StandIns from './StandIns.svelte';
	import { journeyTime, STANDIN, TRIG } from './journey.ts';

	// a client's agents: the pipeline, and the selected agent's settings beside it on desktops or in a sheet elsewhere
	let { c }: { c: Client } = $props();
	const app = useApp();
	const k = useConsole();
	// a desktop opens on the Negotiator, as the prototype does
	let sel: string | null = $state(app.bp === 'desktop' ? 'negotiator' : null);
	const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

	// the client's runs and timers (SC-79): fired now from under each agent; a timer asks first
	const journey = createQuery(() => k.q.journey(c.id));
	let just = $state<Record<string, boolean>>({});
	let asking = $state<JourneyTrigger | null>(null);
	// a stand-in for the client's partners (SC-215) asks first too: it acts for people, and can't be undone
	let standing = $state<JourneyStandIn | null>(null);
	const question = $derived(
		standing ? STANDIN.ask(standing) : asking?.due ? TRIG[asking.key].ask?.(asking, journeyTime(asking.due)) : undefined
	);
	// a run's button and a timer's alert each wait on the platform (SC-152); the alert closes once it has fired
	async function fire(t: JourneyTrigger) {
		const a = k.agent(t.agent);
		const what = TRIG[t.key].title.toLowerCase();
		await k.act(
			() => k.api.fireTrigger(c.id, t.id),
			t.kind === 'run' ? `${a.name} · ${what} running for ${c.name}` : `${a.name} · ${what}: fired for ${t.ref}`
		);
		just = { ...just, [t.id]: true };
	}
	const ask = (t: JourneyTrigger) => (t.kind === 'timer' ? void (asking = t) : fire(t));
	// the shops' orders placed as the story has them, in the staff member's name; the alert waits on it
	const fill = (x: JourneyStandIn) => k.act(() => k.api.standIn(c.id, x.id), STANDIN.done(x));

	// the pipeline's and the inspector's autonomy each keep the level pressed and say Saving…, Saved, or why it went
	// back (SC-152): they wait on this
	const setAutonomy = (a: Agent, v: Autonomy) =>
		k.act(() => k.api.updateAgent(c.id, a.id, { autonomy: v }), `${a.name}: ${k.level(v).label}, for ${c.name}`);
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
		journey={journey.data}
		{just}
		onask={ask}
	/>{/snippet}

{#snippet standins()}<StandIns standIns={journey.data?.standIns ?? []} onask={(x) => (standing = x)} />{/snippet}

{#if app.bp === 'desktop'}
	<div class="cs-agents">
		<div class="stack" style="gap: 12px; min-width: 0">{@render standins()}{@render legend()}{@render pipe()}</div>
		<aside class="cs-inspector card" aria-label="Selected agent">
			{#if sel}{#key c.id + sel}<AgentInspector
						{c}
						id={sel}
						onautonomy={setAutonomy}
						journey={journey.data}
						{just}
						onask={ask}
					/>{/key}{:else}<Empty
					icon="mouse-pointer-click"
					title="Choose an agent"
					body="Its limits, schedule and last run open here."
				/>{/if}
		</aside>
	</div>
{:else}
	<div class="stack" style="gap: 12px">
		{@render standins()}{@render legend()}{@render pipe()}<Sheet
			open={!!sel}
			onclose={() => (sel = null)}
			title={sel ? k.agent(sel).name : ''}
			side={app.bp === 'phone' ? 'bottom' : 'side'}
			detent="large"
			>{#if sel}{#key c.id + sel}<AgentInspector
						{c}
						id={sel}
						onautonomy={setAutonomy}
						journey={journey.data}
						{just}
						onask={ask}
					/>{/key}{/if}</Sheet
		>
	</div>
{/if}
<Alert
	open={!!asking || !!standing}
	onclose={() => ((asking = null), (standing = null))}
	title={question?.title ?? ''}
	message={question?.message ?? ''}
	actions={[
		{ label: 'Cancel' },
		{
			label: standing ? STANDIN.act : asking ? TRIG[asking.key].act : '',
			busy: standing ? STANDIN.busy : asking ? TRIG[asking.key].busy : undefined,
			strong: true,
			onclick: () => (standing ? fill(standing) : asking && fire(asking))
		}
	]}
/>
