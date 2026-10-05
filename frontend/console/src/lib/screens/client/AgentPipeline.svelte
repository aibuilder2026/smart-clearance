<script lang="ts">
	import { summary, type Agent, type Autonomy, type Client } from '@smart-clearance/api/console';
	import { Badge, cx, Icon, Segmented, type IconName } from '@smart-clearance/core';
	import { useConsole } from '#lib/console.svelte.ts';

	type Props = {
		c: Client;
		sel: string | null;
		onselect: (id: string) => void;
		onautonomy: (a: Agent, v: Autonomy) => void;
		/** on phones each agent shows its level; elsewhere it can be changed in place */
		compact: boolean;
	};
	let { c, sel, onselect, onautonomy, compact }: Props = $props();
	const k = useConsole();
	const levels = k.config.autonomy.map((x) => ({ id: x.id, label: x.label }));
	const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
</script>

<!-- a client's agents as the stops they work, in order: a vertical tracker whose node shows how far each may go, with the
     human approval as a locked amber gate -->
<ol class="cs-pipe" aria-label="{c.name}'s agents, in the order they work">
	{#each k.catalog.agents as a (a.id)}
		{@const cfg = c.agents[a.id]}
		{@const on = sel === a.id}
		<li class={cx('cs-stop', a.gate && 'is-gate', on && 'on', !cfg.on && 'off', 'auto-' + cfg.autonomy)}>
			<span class="cs-node" aria-hidden="true"
				>{#if a.gate}<Icon name="lock" size={11} stroke={2.6} />{/if}</span
			>
			<div class="cs-card">
				<button type="button" class="cs-open" aria-pressed={on} onclick={() => onselect(a.id)}
					><span class={cx('icontile', a.gate ? 'amber' : 'soft')}
						><Icon name={a.icon as IconName} size={17} stroke={2} /></span
					><span class="cs-text"
						><span class="cs-name"
							><b>{a.name}</b><span class="cs-stage">{k.config.stageNames[a.stage]}</span>{#if !cfg.on && !a.gate}<Badge
									size="sm">Off</Badge
								>{/if}</span
						><span class="cs-sum"
							>{a.gate ? summary('gate', cfg.settings, c) : lower(a.job) + ' · ' + summary(a.id, cfg.settings, c)}</span
						></span
					></button
				>
				<div class="cs-ctl">
					{#if a.gate}<Badge tone="amber" icon="lock">Always on</Badge>{:else if compact}<Badge
							size="sm"
							tone={cfg.autonomy === 'act' ? 'green' : undefined}>{k.level(cfg.autonomy).label}</Badge
						>{:else}<Segmented
							class="sm"
							label="{a.name}: autonomy"
							options={levels}
							value={cfg.autonomy as Autonomy}
							onchange={(v) => onautonomy(a, v)}
						/>{/if}
				</div>
			</div>
		</li>
	{/each}
</ol>
