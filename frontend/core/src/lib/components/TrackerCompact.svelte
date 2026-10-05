<script lang="ts">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import Sheet from './Sheet.svelte';
	import VTracker, { type VTrackerItem } from './VTracker.svelte';

	type Props = {
		/** the stages, each with its time and who acts there */
		stages: VTrackerItem[];
		done: number;
		current: number;
		label?: string;
	};
	let { stages, done, current, label = 'Where the batch is' }: Props = $props();

	// the kit's TrackerCompact: on a phone the stages fold into one row, where the batch is now; it opens a sheet with
	// every stage and its time
	let open = $state(false);
	const now = $derived(current >= 0 ? stages[current] : null);
	const n = $derived(stages.length);
</script>

<button
	type="button"
	class={cx('tk-compact', now?.human && 'human')}
	onclick={() => (open = true)}
	aria-label="{label}: {now
		? `${now.title}, stage ${current + 1} of ${n}`
		: `all ${n === 9 ? 'nine' : n} stages done`}. Show every stage"
>
	<span class="tk-seg" aria-hidden="true"
		>{#each stages as s, i (s.id)}<i class={cx(i < done && 'done', i === current && 'now', s.human && 'human')}
			></i>{/each}</span
	>
	<span class="tk-label"
		><b>{now ? now.title : 'Cleared'}</b><span
			>{now ? `${current + 1} of ${n} · ${now.time}` : `${n} of ${n} · done`}</span
		></span
	>
	<Icon name="chevron-right" size={18} class="subtle" />
</button>
<Sheet bind:open title={label} detent="medium"><VTracker items={stages} {done} {current} /></Sheet>
