<script lang="ts">
	import type { Agent, AgentSettings, Autonomy, Client } from '@smart-clearance/api/console';
	import { Button, cx, Icon, List, ListRow, Segmented, Switch, type IconName } from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import SettingField from './SettingField.svelte';

	type Props = { c: Client; id: string; onautonomy: (a: Agent, v: Autonomy) => void };
	let { c, id, onautonomy }: Props = $props();
	const k = useConsole();
	const a = $derived(k.agent(id));
	const cfg = $derived(c.agents[id]);
	const fields = $derived(k.config.fields[id] ?? []);
	const levels = k.config.autonomy.map((x) => ({ id: x.id, label: x.label }));

	// the settings are edited as a draft and saved together; the draft starts again whenever the saved ones change
	const saved = $derived(JSON.stringify(cfg.settings));
	let draft: AgentSettings = $derived(JSON.parse(saved));
	const dirty = $derived(JSON.stringify(draft) !== saved);

	const save = () =>
		k.act(() => api.updateAgent(c.id, id, { settings: $state.snapshot(draft) }), `${a.name} saved for ${c.name}`);
	const toggle = (on: boolean) => k.act(() => api.updateAgent(c.id, id, { on }));
	const runNow = () => k.act(() => api.runAgent(c.id, id), `${a.name} ran for ${c.name}: nothing new`);
</script>

{#snippet onSwitch()}<Switch checked={cfg.on} onchange={toggle} label="{a.name} on for {c.name}" />{/snippet}

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
				sub={cfg.on ? 'Runs for this client' : 'Skipped; the stops around it carry on'}
				value={onSwitch}
			/></List
		>
		<div class="stack tight" style="gap: 8px">
			<span class="t-footnote strong">Autonomy</span><Segmented
				label="{a.name}: autonomy"
				options={levels}
				value={cfg.autonomy as Autonomy}
				onchange={(v) => onautonomy(a, v)}
			/><span class="t-footnote subtle">{k.level(cfg.autonomy).text}.</span>
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
	<List
		><ListRow title="Last run" sub={cfg.last || 'not run yet'} /><ListRow
			title="Next run"
			sub={cfg.next || 'not scheduled'}
		/></List
	>
	<div class="row tight wrap">
		{#if !a.gate}<Button variant="secondary" size="sm" icon="play" disabled={!cfg.on} onclick={runNow}>Run now</Button
			>{/if}<span class="grow"></span><Button variant="primary" size="sm" disabled={!dirty} onclick={save}>Save</Button>
	</div>
</div>
