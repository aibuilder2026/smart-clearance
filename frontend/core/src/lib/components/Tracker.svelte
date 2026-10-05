<script lang="ts" module>
	/** a stage of the batch's journey; `human` marks the one a person acts at */
	export type TrackerStage = { id: string; title: string; human?: boolean };
</script>

<script lang="ts">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';

	type Props = {
		stages: TrackerStage[];
		/** the stage the batch is at, or -1 */
		current?: number;
		/** how many stages are done */
		done?: number;
		/** a time under each stage, by its id */
		times?: Record<string, string>;
		onstop?: (i: number) => void;
		label?: string;
	};
	let { stages, current = -1, done = 0, times = {}, onstop, label = 'Stages' }: Props = $props();

	// the kit's Tracker: the stages in a row, a rail filling to where the batch is, the stage it is at ringed (amber at
	// a person's stage)
	const n = $derived(stages.length);
	const pos = $derived(current >= 0 ? current : Math.max(0, done - 1));
	const state = (i: number) => (i < done ? 'done' : i === current ? 'now' : '');
</script>

{#snippet stop(s: TrackerStage, i: number)}<span class="dot"
		>{#if state(i) === 'done'}<Icon name="check" size={12} stroke={3.2} />{/if}</span
	><span class="st-label">{s.title}</span>{#if times[s.id]}<span class="st-time">{times[s.id]}</span>{/if}{/snippet}

<div class="tracker" style="--stops: {n}" role="list" aria-label={label}>
	<div class="rail" aria-hidden="true"><i style="--p: {n > 1 ? pos / (n - 1) : 0}"></i></div>
	{#each stages as s, i (s.id)}<div
			role="listitem"
			class={cx('stop', state(i), s.human && 'human')}
			aria-current={i === current ? 'step' : undefined}
		>
			{#if onstop}<button type="button" class="stop-btn" onclick={() => onstop(i)}>{@render stop(s, i)}</button
				>{:else}{@render stop(s, i)}{/if}
		</div>{/each}
</div>
