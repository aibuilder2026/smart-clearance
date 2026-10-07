<script lang="ts">
	import { imgUrl } from '../assets';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import { rise } from '../motion/transitions';
	import type { FeedEvent } from '../workspace/types';
	import Aura from './Aura.svelte';
	import Badge from './Badge.svelte';

	type Props = {
		events: FeedEvent[];
		/** the people in the story by id: the name and portrait a person's entry shows */
		people?: Record<string, { short: string; img?: string }>;
		/** the index in `events` of the entry at work, or -1 */
		live?: number;
		/** the entry at work shows the typing dots in place of its text */
		typing?: boolean;
		/** only the last `max` entries */
		max?: number;
	};
	let { events, people = {}, live = -1, typing = false, max }: Props = $props();

	// the kit's AgentFeed: the hand-offs streamed in, each rising into place, the gap under each drawn to the minutes
	// until the next; the agent at work wears the aura
	const gapFor = (m: number) => Math.round(12 + Math.min(44, Math.log2(1 + (m || 0)) * 4.6));
	const list = $derived(max ? events.slice(-max) : events);
</script>

<div class="feed" aria-live="polite">
	{#each list as e, i ((e.id || e.at) + i + (e.agent || e.person))}
		{@const next = list[i + 1]}
		{@const isLive = events.indexOf(e) === live}
		{@const person = e.person ? people[e.person] : undefined}
		<div
			class={cx('ev', isLive && 'live')}
			style="--gap: {next ? gapFor(next.min) + 'px' : '0px'}"
			in:rise|global={{ y: 8 }}
		>
			{#if person}<span class="ag person"><img src={person.img ? imgUrl(person.img) : undefined} alt="" /></span
				>{:else}<Aura on={isLive} class="ag" style="border-radius: 11px"><Icon name={e.icon || 'bot'} size={18} /></Aura
				>{/if}
			<div style="min-width: 0">
				<div class="ev-head">
					<span class="ev-who">{person ? person.short : e.agent}</span>{#if e.human || person}<Badge
							size="sm"
							tone="amber">person</Badge
						>{:else}<Badge size="sm">agent</Badge>{/if}<span class="ev-time">{e.at}</span>
				</div>
				{#if isLive && typing}<div class="ev-text">
						<span class="typing" role="img" aria-label="Working"><i></i><i></i><i></i></span>
					</div>{:else}<div class="ev-text">{e.text}</div>{/if}
				{#if e.calls && !(isLive && typing)}<div class="ev-calls">
						{#each e.calls as [fn, res, tone], j (j)}<span class={cx('toolcall', tone)} title="{fn} → {res}"
								><Icon name="zap" />{fn}<span style="opacity: 0.6">→</span>{res}</span
							>{/each}
					</div>{/if}
			</div>
		</div>
	{/each}
</div>
