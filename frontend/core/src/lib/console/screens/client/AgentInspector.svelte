<script lang="ts">
	import type { Agent, AgentSettings, Autonomy, Client, Journey, JourneyTrigger } from '@smart-clearance/api/console';
	import { Button, cx, Icon, List, ListRow, Switch, type IconName } from '../../../index';
	import { useConsole } from '../../console.svelte';
	import { Saving } from '../../saving.svelte';
	import SaveLine from '../SaveLine.svelte';
	import AutonomyControl from './AutonomyControl.svelte';
	import { EVENT_OF } from './journey.ts';
	import SettingField from './SettingField.svelte';
	import TrigRow from './TrigRow.svelte';

	type Props = {
		c: Client;
		id: string;
		onautonomy: (a: Agent, v: Autonomy) => unknown;
		/** the client's runs and timers (SC-79): this agent's own, fired from here too */
		journey?: Journey;
		just?: Record<string, boolean>;
		onask?: (t: JourneyTrigger) => unknown;
	};
	let { c, id, onautonomy, journey, just = {}, onask = () => {} }: Props = $props();
	const mine = $derived(journey?.triggers.filter((t) => t.agent === id) ?? []);
	const k = useConsole();
	const a = $derived(k.agent(id));
	const cfg = $derived(c.agents[id]);
	const fields = $derived(k.config.fields[id] ?? []);

	// the settings are edited as a draft and saved together; the draft starts again whenever the saved ones change
	const saved = $derived(JSON.stringify(cfg.settings));
	let draft: AgentSettings = $derived(JSON.parse(saved));
	const dirty = $derived(JSON.stringify(draft) !== saved);

	// Save waits on the platform and says Saved; the switch keeps its place while it saves and says so (SC-152)
	const save = () =>
		k.act(() => k.api.updateAgent(c.id, id, { settings: $state.snapshot(draft) }), `${a.name} saved for ${c.name}`);
	const on = new Saving(
		() => cfg.on,
		(v: boolean) => k.act(() => k.api.updateAgent(c.id, id, { on: v }))
	);
</script>

{#snippet onSwitch()}<span class="row tight"
		><SaveLine wait={on.wait} /><Switch
			checked={on.value}
			onchange={on.change}
			label="{a.name} on for {c.name}"
		/></span
	>{/snippet}

<!-- the selected agent: what it does, whether it runs, how far it goes, its limits and schedule, its last run -->
<div class="stack cs-insp" style="gap: 16px">
	<div class="row" style="gap: 12px">
		<span class={cx('icontile', a.gate ? 'amber' : '')} style="width: 42px; height: 42px; border-radius: 12px"
			><Icon name={a.icon as IconName} size={21} stroke={2} /></span
		>
		<div class="stack tight" style="gap: 2px">
			<b class="t-title3">{a.name}</b><span class="t-footnote subtle"
				>{k.config.stageNames[a.stage]} · {a.gate ? 'a person, always' : a.model + ' on Vertex AI'}</span
			>
		</div>
	</div>
	<p class="t-subhead muted" style="margin: 0">{a.job}.</p>
	{#if a.gate}<div class="cs-gate-note">
			<Icon name="lock" size={16} stroke={2.2} /><span
				>Every plan waits for one person's approval, with the money on screen, for every client. It can't be switched
				off.</span
			>
		</div>
	{:else}
		<List
			><ListRow
				title="On"
				sub={on.value ? 'Runs for this client' : 'Skipped; the stops around it carry on'}
				value={onSwitch}
			/></List
		>
		<div class="stack tight" style="gap: 8px">
			<span class="t-footnote strong">Autonomy</span><AutonomyControl {c} {a} {onautonomy} /><span
				class="t-footnote subtle">{k.level(cfg.autonomy).text}.</span
			>
		</div>
	{/if}
	{#if fields.length}<div class="stack" style="gap: 12px">
			{#each fields as f (f.key)}<SettingField
					{f}
					{c}
					agent={a}
					value={draft[f.key]}
					onchange={(v) => (draft = { ...draft, [f.key]: v })}
				/>{/each}
		</div>{/if}
	{#if !a.gate && journey}{#if mine.length}<div class="stack tight" style="gap: 8px">
				<span class="t-footnote strong">Scheduled runs and timers</span>{#each mine as t (t.id)}<TrigRow
						{c}
						{t}
						just={!!just[t.id]}
						{onask}
					/>{/each}
			</div>{:else}<List
				><ListRow
					title="When it runs"
					sub={EVENT_OF[id] ? `When ${EVENT_OF[id]}; nothing to run now` : 'On its own events'}
				/></List
			>{/if}{/if}
	<List><ListRow title="Last run" sub={cfg.last || 'not run yet'} /></List>
	<div class="row tight wrap">
		<span class="grow"></span><Button
			variant="primary"
			size="sm"
			disabled={!dirty}
			action={save}
			busy="Saving…"
			done="Saved">Save</Button
		>
	</div>
</div>
