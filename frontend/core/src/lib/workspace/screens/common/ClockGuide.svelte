<script lang="ts" module>
	/** the journey's date and time, and how long its day lasts, as the guide shows them */
	export type GuideClock = { date: string; long?: string; time: string; dayMinutes: number };
	export const CONSOLE_URL = 'https://smartclearance-console.web.app';
</script>

<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import Icon from '../../../icons/Icon.svelte';

	// the journey clock explained (SC-176, option B; screens/common.jsx ClockGuide). A synthetic workspace replays the
	// story's own calendar, so its batches keep their best-before dates and every figure holds. The guide says why, gives
	// the journey time now, and how Smart-Clearance staff start the journey again or move it forward in the console.
	// client: the workspace's name; here: opened in the console, which needs no way to the console
	type Props = { open?: boolean; client: string; clock?: GuideClock | null; here?: boolean };
	let { open = $bindable(false), client, clock, here }: Props = $props();
	const pace = (m: number) =>
		m >= 1440 ? 'real time' : m >= 60 ? `1 day = ${Math.round(m / 6) / 10} h` : `1 day = ${m} min`;
</script>

{#snippet step(n: string, body: import('svelte').Snippet)}<li class="jc-step">
		<span class="jc-n" aria-hidden="true">{n}</span><span>{@render body()}</span>
	</li>{/snippet}

<Sheet bind:open onclose={() => (open = false)} title="Prototype time" detent="large">
	<div class="jc-body">
		<p class="jc-lede">
			This is a prototype. {client}' workspace runs on a <b>fixed dataset</b>: its SKUs and their batches, each batch
			with its own best-before date. So that the gates, the sell-through and every figure come out as the story has
			them, the workspace keeps <b>its own journey clock</b>. It starts on the story's day 0, not on today's date, and a
			journey day can be shorter than a real one.
		</p>
		{#if clock}<div class="jc-now">
				<Icon name="calendar-clock" size={18} /><span class="jc-now-t"
					><span class="jc-now-k">Journey time now</span><span class="jc-now-v tnum"
						>{clock.long || clock.date}, {clock.time}</span
					></span
				><span class="jc-now-p"
					><Icon name={clock.dayMinutes >= 1440 ? 'clock' : 'fast-forward'} size={13} stroke={2.2} />{pace(
						clock.dayMinutes
					)}</span
				>
			</div>{/if}
		<section class="jc-sec" aria-labelledby="jc-reset">
			<h3 id="jc-reset" class="jc-h"><Icon name="rotate-ccw" size={16} />Start the journey again</h3>
			<p class="jc-where">
				{#if here}Here in the console:{:else}In the staff console (<span class="jc-url"
						>smartclearance-console.web.app</span
					>), signed in as Smart-Clearance staff:{/if}
			</p>
			<ol class="jc-steps">
				{#snippet s1()}<b class="jc-ui">Clients</b>, then <b class="jc-ui">{client}</b>.{/snippet}
				{#snippet s2()}The client's actions menu <span class="jc-key" aria-hidden="true">⋯</span><span class="sr-only"
						>(More)</span
					>, then <b class="jc-ui">Reset journey…</b>{/snippet}
				{#snippet s3()}Pick how long a journey day lasts, such as <b class="jc-ui">Demo</b> (five minutes a day), then
					<b class="jc-ui">Reset journey</b>.{/snippet}
				{@render step('1', s1)}{@render step('2', s2)}{@render step('3', s3)}
			</ol>
			<p class="jc-foot">
				Back to day 0 with the story's batches. The client's setup stays: gates, overrides, guardrails, agents and
				people.
			</p>
		</section>
		<section class="jc-sec" aria-labelledby="jc-ff">
			<h3 id="jc-ff" class="jc-h"><Icon name="fast-forward" size={16} />Move it forward</h3>
			<ol class="jc-steps">
				{#snippet f1()}<b>Shorter days.</b> The badge in the client's head (<b class="jc-ui">Real time</b>), then
					<b class="jc-ui">Rehearsal</b> (an hour a day), <b class="jc-ui">Demo</b> (five minutes) or
					<b class="jc-ui">Fast</b> (a minute).{/snippet}
				{#snippet f2()}<b>What falls due, now.</b> The <b class="jc-ui">Agents</b> tab lists each agent's scheduled runs
					and timers with their journey time: <b class="jc-ui">Run now</b> for the daily load and the Watcher's check,
					<b class="jc-ui">Close now</b> for a kirana offer or an unsold lot, <b class="jc-ui">Report now</b> for expiry day.{/snippet}
				{@render step('1', f1)}{@render step('2', f2)}
			</ol>
			<p class="jc-foot">
				Afterwards, set the badge back to <b class="jc-ui">Real time</b>, so the journey waits for the next demo.
			</p>
		</section>
	</div>
	{#snippet footer()}{#if here}<Button variant="secondary" size="lg" block onclick={() => (open = false)}>Close</Button
			>{:else}<Button
				variant="primary"
				size="lg"
				block
				icon="external-link"
				onclick={() => window.open(CONSOLE_URL, '_blank', 'noopener')}>Open the console</Button
			><Button variant="ghost" block onclick={() => (open = false)}>Close</Button>{/if}{/snippet}
</Sheet>
