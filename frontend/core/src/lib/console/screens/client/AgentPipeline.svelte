<script lang="ts">
	import {
		summary,
		type Agent,
		type Autonomy,
		type Client,
		type Journey,
		type JourneyTrigger
	} from '@smart-clearance/api/console';
	import { Badge, cx, Icon, type IconName } from '../../../index';
	import { useConsole } from '../../console.svelte';
	import AutonomyControl from './AutonomyControl.svelte';
	import TrigRow from './TrigRow.svelte';

	type Props = {
		c: Client;
		sel: string | null;
		onselect: (id: string) => void;
		onautonomy: (a: Agent, v: Autonomy) => unknown;
		/** on phones each agent shows its level; elsewhere it can be changed in place */
		compact: boolean;
		/** the client's runs and timers, each under its agent (SC-79) */
		journey?: Journey;
		just?: Record<string, boolean>;
		onask?: (t: JourneyTrigger) => unknown;
	};
	let { c, sel, onselect, onautonomy, compact, journey, just = {}, onask = () => {} }: Props = $props();
	const k = useConsole();
	const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
</script>

<!-- a client's agents as the stops they work, in order: a vertical tracker whose node shows how far each may go, with the
     human approval as a locked amber gate -->
<ol class="cs-pipe" aria-label="{c.name}'s agents, in the order they work">
	{#each k.catalog.agents as a (a.id)}
		{@const cfg = c.agents[a.id]}
		{@const on = sel === a.id}
		{@const mine = journey?.triggers.filter((t) => t.agent === a.id) ?? []}
		<li class="cs-pipe-item">
			<div class={cx('cs-stop', a.gate && 'is-gate', on && 'on', !cfg.on && 'off', 'auto-' + cfg.autonomy)}>
				<span class="cs-node" aria-hidden="true"
					>{#if a.gate}<Icon name="lock" size={11} stroke={2.6} />{/if}</span
				>
				<div class="cs-card">
					<button type="button" class="cs-open" aria-pressed={on} onclick={() => onselect(a.id)}
						><span class={cx('icontile', a.gate ? 'amber' : 'soft')}
							><Icon name={a.icon as IconName} size={17} stroke={2} /></span
						><span class="cs-text"
							><span class="cs-name"
								><b>{a.name}</b><span class="cs-stage">{k.config.stageNames[a.stage]}</span
								>{#if !cfg.on && !a.gate}<Badge size="sm">Off</Badge>{/if}</span
							><span class="cs-sum"
								>{a.gate
									? summary('gate', cfg.settings, c)
									: lower(a.job) + ' · ' + summary(a.id, cfg.settings, c)}</span
							></span
						></button
					>
					<div class="cs-ctl">
						{#if a.gate}<Badge tone="amber" icon="lock">Always on</Badge>{:else if compact}<Badge
								size="sm"
								tone={cfg.autonomy === 'act' ? 'green' : undefined}>{k.level(cfg.autonomy).label}</Badge
							>{:else}<AutonomyControl class="sm" {c} {a} {onautonomy} />{/if}
					</div>
				</div>
			</div>
			{#if mine.length}<div class="cs-trigs" role="group" aria-label="{a.name}: scheduled runs and timers">
					{#each mine as t (t.id)}<TrigRow {c} {t} dense just={!!just[t.id]} {onask} />{/each}
				</div>{/if}
		</li>
	{/each}
</ol>
