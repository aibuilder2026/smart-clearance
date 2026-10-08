<script lang="ts">
	import type { Client, JourneyTrigger } from '@smart-clearance/api/console';
	import { Button, cx, Icon } from '@smart-clearance/core';
	import { useConsole } from '#lib/console.svelte.ts';
	import { everyOf, fromNow, journeyTime, TRIG } from './journey.ts';

	// a scheduled run or a pending timer: what it is, when it falls due (journey time), how long that is from now, and
	// the button that fires it now; one that can't fire yet says why (SC-79)
	type Props = { c: Client; t: JourneyTrigger; dense?: boolean; just?: boolean; onask: (t: JourneyTrigger) => void };
	let { c, t, dense = false, just = false, onask }: Props = $props();
	const k = useConsole();
	const words = $derived(TRIG[t.key]);
	const a = $derived(k.agent(t.agent));
	const blocked = $derived(t.blocked ?? (c.agents[t.agent]?.on === false ? `The ${a.name} agent is off` : null));
	const sub = $derived(
		!t.due
			? "Not scheduled: its workspace isn't live · runs on request"
			: `${just ? 'Ran just now · next ' : ''}${journeyTime(t.due)} · ${fromNow(t.dueWall ?? t.due)} · ${everyOf(t, c)}`
	);
</script>

<div class={cx('cs-trig', dense && 'dense', just && 'fired')}>
	<span class="cs-trig-txt"
		><span class="cs-trig-t"
			><b>{words.title}</b>{#if t.ref}<span class="mono cs-trig-ref">{t.ref}</span>{/if}</span
		><span class="cs-trig-s">{sub}</span>{#if blocked}<span class="cs-trig-s cs-trig-why"
				><Icon name="hourglass" size={12} stroke={2.2} />{blocked}</span
			>{/if}</span
	><span class="cs-trig-act"
		><Button
			variant="secondary"
			size="sm"
			icon={words.icon}
			disabled={!!blocked}
			onclick={() => onask(t)}
			aria-label="{words.act}: {a.name}, {words.title.toLowerCase()}{t.ref ? ', ' + t.ref : ''}">{words.act}</Button
		></span
	>
</div>
