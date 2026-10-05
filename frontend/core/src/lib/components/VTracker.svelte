<script lang="ts" module>
	/** a stage, down the page: with a line of what happens there, and its time */
	export type VTrackerItem = { id: string; title: string; human?: boolean; text?: string; time?: string };
</script>

<script lang="ts">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';

	let { items, current = -1, done = 0 }: { items: VTrackerItem[]; current?: number; done?: number } = $props();
	// the kit's VTracker: the stages down the page, each done one's text shown, the current one ringed
	const state = (i: number) => (i < done ? 'done' : i === current ? 'now' : '');
</script>

<div class="vtracker" role="list">
	{#each items as s, i (s.id)}<div
			role="listitem"
			class={cx('vstop', state(i), s.human && 'human')}
			aria-current={i === current ? 'step' : undefined}
		>
			<span class="dot"
				>{#if state(i) === 'done'}<Icon name="check" size={13} stroke={3} />{/if}</span
			>
			<div>
				<div class="vs-title">{s.title}</div>
				{#if s.text && (state(i) || i === current)}<div class="vs-text">{s.text}</div>{/if}
			</div>
			<span class="vs-time">{s.time || ''}</span>
		</div>{/each}
</div>
