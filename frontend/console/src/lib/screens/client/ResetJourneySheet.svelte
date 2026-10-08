<script lang="ts">
	import { DAY_MINUTES, DAY_PRESETS, dayBadge, dayWords, possessive, type Client } from '@smart-clearance/api/console';
	import { Button, cx, Icon, Sheet, useApp } from '@smart-clearance/core';
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';

	// starting a client's journey again (SC-79): what the reset does, and the length of a journey day it starts at (the
	// client's own, unless another is picked). The server writes both audit lines
	let { open = $bindable(false), c }: { open?: boolean; c: Client } = $props();
	const app = useApp();
	const k = useConsole();
	let v = $state(DAY_MINUTES);
	let busy = $state(false);
	$effect.pre(() => {
		if (open) untrack(() => (v = c.dayMinutes));
	});
	async function go() {
		const to = v;
		busy = true;
		const done = await k.act(
			() => api.resetJourney(c.id, { dayMinutes: to }),
			`${possessive(c.name)} journey starts again: day 0, at ${to >= DAY_MINUTES ? 'real time' : dayBadge(to).toLowerCase()}`
		);
		busy = false;
		if (done) open = false;
	}
</script>

<Sheet
	bind:open
	title="Start {possessive(c.name)} journey again?"
	side={app.bp === 'phone' ? 'bottom' : 'center'}
	detent="large"
>
	{#snippet footer()}<Button variant="destructive" size="lg" block icon="rotate-ccw" loading={busy} onclick={go}
			>Reset journey</Button
		><Button variant="ghost" block onclick={() => (open = false)}>Cancel</Button>{/snippet}
	<div class="stack">
		<p class="t-subhead muted" style="margin: 0">
			Its open batches close as reset, and the story's batches start again on day 0 at 08:00. The Data agent runs at
			08:30 and the Watcher at 09:00. Nothing is deleted: the audit log keeps the journey that was.
		</p>
		<fieldset class="cs-jd-presets">
			<legend class="t-footnote strong" style="margin-bottom: 8px">Length of a journey day</legend>
			{#each DAY_PRESETS as p (p.id)}<label class={cx('cs-jd-preset', v === p.id && 'on')}
					><input type="radio" name="reset-day" checked={v === p.id} onchange={() => (v = p.id)} /><span
						class="cs-jd-p-n">{p.label}{p.id === c.dayMinutes ? ' · now' : ''}</span
					><span class="cs-jd-p-v tnum">{p.id.toLocaleString('en-IN')} min</span><span class="cs-jd-p-s">{p.sub}</span
					>{#if v === p.id}<Icon name="check" size={16} stroke={2.4} />{/if}</label
				>{/each}
		</fieldset>
		{#if !DAY_PRESETS.some((p) => p.id === c.dayMinutes)}<span class="t-footnote subtle"
				>Now {dayWords(c.dayMinutes)} a day; pick one to change it.</span
			>{/if}
	</div>
</Sheet>
