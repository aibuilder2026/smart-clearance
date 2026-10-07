<script lang="ts">
	import {
		DAY_MINUTES,
		DAY_PRESETS,
		dayHead,
		dayMinutesError,
		dayReadouts,
		dayWords,
		possessive,
		type Client
	} from '@smart-clearance/api/console';
	import { Button, cx, Field, Icon, Input, List, ListRow, Sheet, useApp } from '@smart-clearance/core';
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';

	// the length of a journey day (SC-68, option A): presets or any whole number of minutes from 1 to 1,440, with what
	// the setting does to the agents, and a note when the client is live. Saving writes the audit line on the server
	let { open = $bindable(false), c }: { open?: boolean; c: Client } = $props();
	const app = useApp();
	const k = useConsole();
	let v = $state(DAY_MINUTES);
	let txt = $state(String(DAY_MINUTES));
	let err = $state('');
	let busy = $state(false);
	// each opening starts from the client's own length; a refreshed client does not reset what is being typed
	$effect.pre(() => {
		if (open)
			untrack(() => {
				v = c.dayMinutes;
				txt = String(c.dayMinutes);
				err = '';
			});
	});

	// a whole number of minutes, as typed; the readouts keep the last good one while the field says what is wrong
	function type(t: string) {
		txt = t;
		const n = /^\s*\d+\s*$/.test(t) ? Number(t) : Number.NaN;
		const problem = dayMinutesError(n);
		err = problem ?? '';
		if (!problem) v = n;
	}
	function pick(n: number) {
		v = n;
		txt = String(n);
		err = '';
	}
	async function save() {
		if (err) return;
		if (v === c.dayMinutes) return void (open = false);
		const to = v;
		busy = true;
		const done = await k.act(
			() => api.setDayMinutes(c.id, to),
			`${c.name}: ${to >= DAY_MINUTES ? 'back to real time' : 'a journey day now lasts ' + dayWords(to)}`
		);
		busy = false;
		if (done) open = false;
	}
</script>

<Sheet bind:open title="Length of a journey day" side={app.bp === 'phone' ? 'bottom' : 'center'} detent="large">
	{#snippet footer()}<Button variant="primary" size="lg" block disabled={!!err} loading={busy} onclick={save}
			>Save</Button
		><Button variant="ghost" block onclick={() => (open = false)}>Cancel</Button>{/snippet}
	<div class="stack">
		<p class="t-subhead muted" style="margin: 0">
			How many minutes of real time one day of {possessive(c.name)} journey lasts. The agents' schedules, the offer windows
			and every time in the workspace follow it.
		</p>
		<fieldset class="cs-jd-presets">
			<legend class="sr-only">Presets</legend>
			{#each DAY_PRESETS as p (p.id)}<label class={cx('cs-jd-preset', v === p.id && 'on')}
					><input type="radio" name="jd-preset" checked={v === p.id} onchange={() => pick(p.id)} /><span
						class="cs-jd-p-n">{p.label}</span
					><span class="cs-jd-p-v tnum">{p.id.toLocaleString('en-IN')} min</span><span class="cs-jd-p-s">{p.sub}</span
					>{#if v === p.id}<Icon name="check" size={16} stroke={2.4} />{/if}</label
				>{/each}
		</fieldset>
		<Field
			label="Or any number of minutes"
			htmlFor="jd-min"
			help={err ? null : 'From 1 to 1,440. 1,440 is real time.'}
			error={err || null}
			><span class="cs-jd-num"
				><Input
					id="jd-min"
					inputmode="numeric"
					autocomplete="off"
					value={txt}
					oninput={(e) => type(e.currentTarget.value)}
				/><span class="cs-jd-unit">minutes a day</span></span
			></Field
		>
		<List head={dayHead(v)}
			>{#each dayReadouts(v) as r (r.title)}<ListRow
					icon={r.icon}
					iconTone="soft"
					title={r.title}
					value={r.value}
				/>{/each}</List
		>
		<div aria-live="polite">
			{#if c.status === 'live' && v < DAY_MINUTES}<div class="cs-jd-note">
					<Icon name="info" size={18} /><span
						>{c.name} is live. Below real time its partners get less time to answer than a real day gives them, so keep short
						days for demos and rehearsals.</span
					>
				</div>{/if}
		</div>
	</div>
</Sheet>
