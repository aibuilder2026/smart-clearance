<script lang="ts">
	import { cx } from '../../cx';
	import { AG_STOPS, agAt, agNames, type Walk } from './mesh';

	// what the batch is doing: before it sets off, at each stop, when it is done, or the agent the visitor picked
	// (SC-195; design3's AgentCaption). Hidden from a screen reader, which hears the stops and the agent picked instead
	type Props = { walk: Walk; class?: string };
	let { walk, class: className }: Props = $props();
	const h = $derived(walk.held);
	const s = $derived(h ? AG_STOPS[h.stop] : walk.playing ? AG_STOPS[walk.k] : null);
</script>

<div class={cx('ag-caption', s?.human && 'human', h && 'held', className)} aria-hidden="true">
	{#if h && s}
		<span class="n">{h.stop + 1} of 9 · {s.t}</span><b>{h.name}</b><span class="did">{h.did}</span><code>{h.call}</code>
	{:else if walk.k < 0}
		<span class="n">A batch the gates will refuse</span><b>Ten agents and one person take it from here.</b>
	{:else if s}
		<span class="n">{walk.k + 1} of 9 · {s.t}</span><b>{agNames(walk.k)}</b><span class="did"
			>{agAt(walk.k).length > 1
				? 'Work the exits at once: the kiranas, the marketplace, a bid'
				: agAt(walk.k)[0].did}</span
		>
	{:else}
		<span class="n">9 of 9 · Report</span><b>Sold, not binned.</b><span class="did"
			>Ten agents worked the batch. One person said yes.</span
		>
	{/if}
</div>
