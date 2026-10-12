<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useApp } from '../../app.svelte';
	import { cx } from '../../cx';
	import Icon from '../../icons/Icon.svelte';
	import Mark from '../Mark.svelte';
	import AgentField from './AgentField.svelte';
	import { AG_N, AG_STOPS, agAround, agAt, agNames, type Walk } from './mesh';

	// below desktops, phones and tablets either way up (SC-196, option C, Around the card; design3's AgentAround): the
	// field behind the whole sign-in, as on a desktop, and the eleven on a loop round the card's edges, from the top,
	// clockwise, the handoffs passing under its glass. A pill at the top says who is at work, with the nine stops as a rail
	// and Pause. A tap on an agent's tile holds the walk on it; a tap on the field sends a ripple and lets go. By keyboard
	// the rail's stops are one stop in a tab, the arrows between them, Enter holding the walk on a stop's agent
	type Props = { walk: Walk; play: Snippet<[boolean]>; words: Snippet };
	let { walk, play, words }: Props = $props();
	const app = useApp();
	const tab = $derived(app.bp === 'tablet');
	let pill: HTMLDivElement | undefined = $state();
	// the sign-in's visible box, and where the pill ends: the loop fills the box below it
	type Box = { w: number; h: number; top: number };
	let host = $state<Box | null>(null);
	$effect(() => {
		const p = pill,
			el = p?.parentElement;
		if (!p || !el || typeof ResizeObserver === 'undefined') return;
		const f = () => (host = { w: el.clientWidth, h: el.clientHeight, top: p.offsetTop + p.offsetHeight });
		f();
		const o = new ResizeObserver(f);
		o.observe(el);
		o.observe(p);
		return () => o.disconnect();
	});
	const stars = $derived(host ? agAround(host.w, host.h, tab, host.top) : []);
	const now = $derived(walk.held ? [walk.held] : walk.playing ? agAt(walk.k) : []);
	const k = $derived(walk.held ? walk.held.stop : walk.done ? AG_N : walk.k);
	const did = $derived(
		walk.held
			? walk.held.did
			: walk.playing
				? now.length > 1
					? 'Work the exits at once: the kiranas, the marketplace, a bid'
					: now[0].did
				: walk.k < 0
					? 'Ten agents and one person take it from here.'
					: 'Ten agents worked the batch. One person said yes.'
	);
	let rove = $state(0);
	const stops: HTMLButtonElement[] = $state([]);
	const key = (e: KeyboardEvent) => {
		const n = AG_N;
		if (e.key === 'Escape' && walk.held) return void walk.release();
		const to = (
			{
				ArrowRight: rove + 1,
				ArrowDown: rove + 1,
				ArrowLeft: rove - 1,
				ArrowUp: rove - 1,
				Home: 0,
				End: n - 1
			} as Record<string, number>
		)[e.key];
		if (to == null) return;
		e.preventDefault();
		rove = (to + n) % n;
		stops[rove]?.focus();
	};
</script>

<AgentField {walk} {stars} local height={host?.h ?? null} />
<!-- around the card the agents take no room in the sign-in's rows: an equal negative margin cancels their height -->
<div class="ag-around" aria-hidden="true" style={host ? `height: ${host.h}px; margin-bottom: -${host.h}px` : undefined}>
	{#each stars as n (n.c.id)}
		{@const st = walk.state(n.c)}
		<span
			class={cx(
				'ag-ptile',
				n.c.human && 'human',
				st,
				walk.held?.id === n.c.id && 'held',
				st === 'now' && !walk.reduce && 'aura'
			)}
			style="left: {n.x}px; top: {n.y}px"><Icon name={n.c.icon} size={tab ? 15 : 13} stroke={2.2} /></span
		>
	{/each}
</div>
<div bind:this={pill} class="ag-pill">
	<div class="ag-pill-row"><Mark size={22} /><b>Ten agents. <span>One yes.</span></b>{@render play(true)}</div>
	<div class="ag-pill-now" aria-hidden="true">
		{#if now.length}
			{#each now as c (c.id)}<span class={cx('ag-who', c.human && 'human')}
					><i><Icon name={c.icon} size={12} stroke={2.2} /></i>{c.name}</span
				>{/each}
		{:else}<span class="ag-who rest">{walk.k < 0 ? 'A batch the gates will refuse' : 'Sold, not binned'}</span>{/if}
		<span class="ag-did">{did}</span>
	</div>
	<div class="ag-rail" role="toolbar" aria-label="The nine stops">
		{#each AG_STOPS as s, i (s.id)}<button
				bind:this={stops[i]}
				type="button"
				tabindex={i === rove ? 0 : -1}
				aria-label="{s.t}: {agNames(i)}"
				aria-pressed={walk.held?.stop === i}
				class={cx(i < k && 'done', i === k && 'now', s.human && 'human')}
				onfocus={() => (rove = i)}
				onkeydown={key}
				onclick={() => walk.pick(agAt(i)[0])}><i></i></button
			>{/each}
	</div>
	{@render words()}
</div>
