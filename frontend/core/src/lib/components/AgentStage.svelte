<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { useApp } from '../app.svelte';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import { prefersReducedMotion } from '../motion';
	import AgentAround from './agents/AgentAround.svelte';
	import AgentCaption from './agents/AgentCaption.svelte';
	import AgentField from './agents/AgentField.svelte';
	import {
		AG_CREW,
		AG_KEY,
		AG_N,
		AG_STOPS,
		agAt,
		agNames,
		agNext,
		agOrbit,
		agState,
		agWait,
		type Crew,
		type Star,
		type Walk
	} from './agents/mesh';

	// the agents at work, the sign-ins' stage (SC-195, round 2, option A, The agent mesh; the kit's AgentStage).
	// ThreeUI's constellation field (adapted, MIT; agents/THIRD_PARTY_NOTICES.md) drifts behind the whole sign-in, under
	// the card's glass. Eleven of its nodes are named: the platform's ten agents and the one person, on an orbit in the
	// stage, in the order they work a batch through the nine stops. As the batch walks, each lights in turn and the
	// handoff from the one before draws; at Approve the thread turns amber, and at Execute sparks run from the yes to the
	// three agents that work the exits at once. It holds on the result, then walks again. It loops, so it has Pause and
	// Play (WCAG 2.2.2), remembered in the browser; under reduced motion it is drawn at rest, every agent lit. It is live:
	// the field gives way to the pointer and draws its links to it, a click or a tap sends a ripple through it (and lets
	// go of an agent), and each agent, pressed, holds the walk at its stop and says what it does. No client's data, so a
	// live workspace shows it before anyone signs in. Below desktops the agents stand round the card instead (SC-196,
	// Around the card: agents/AgentAround.svelte).
	type Props = { children?: Snippet; band?: boolean };
	let { children, band }: Props = $props();
	const app = useApp();
	const reduce = $derived(prefersReducedMotion.current);
	let paused = $state(false);
	let held: Crew | null = $state(null);
	let k = $state(prefersReducedMotion.current ? AG_N : -1);
	const moving = $derived(!reduce && !paused && !held);
	onMount(() => {
		try {
			paused = localStorage.getItem(AG_KEY) === 'paused';
		} catch {
			/* no storage: it plays */
		}
	});
	// the walk: set off, a stop at a time, hold on the result, then round again; at rest, every agent lit, under
	// reduced motion
	$effect(() => {
		if (reduce) {
			if (!held) k = AG_N;
			return;
		}
		if (!moving) return;
		const at = k;
		const t = setTimeout(() => (k = agNext(at)), agWait(at));
		return () => clearTimeout(t);
	});
	const setPaused = (v: boolean) => {
		paused = v;
		try {
			localStorage.setItem(AG_KEY, v ? 'paused' : 'playing');
		} catch {
			/* remembered for this visit only */
		}
	};
	// an agent pressed holds the walk at its stop; pressed again, or Play, or a click in the field lets it go on
	const pick = (c: Crew) => {
		if (held?.id === c.id) {
			held = null;
			return;
		}
		held = c;
		k = c.stop;
	};
	const walk: Walk = {
		get k() {
			return k;
		},
		get reduce() {
			return reduce;
		},
		get held() {
			return held;
		},
		get moving() {
			return moving;
		},
		get playing() {
			return !held && k >= 0 && k < AG_N;
		},
		get done() {
			return k >= AG_N;
		},
		state: (c) => agState(c, k, held),
		pick,
		release: () => (held = null),
		toggle: () => {
			if (held) {
				held = null;
				if (paused) setPaused(false);
				return;
			}
			setPaused(!paused);
		}
	};

	const isBand = $derived(band ?? app.bp !== 'desktop');
	// none on a phone held upright (SC-198): too tight to see the agents at work, so the sign-in is the form alone
	const none = $derived(band == null && app.bp === 'phone' && app.h > app.w);
	let ow = $state(0);
	let oh = $state(0);
	const stars: Star[] = $derived(ow && oh && !isBand ? agOrbit(ow, oh, false) : []);
	let orbit: HTMLElement | null = $state(null);
	// on a desktop the stage and the field keep to the sign-in's visible height, pinned while a long card scrolls by
	let stage: HTMLElement | undefined = $state();
	let height: number | null = $state(null);
	$effect(() => {
		const host = stage?.parentElement;
		if (!host || typeof ResizeObserver === 'undefined') return;
		const f = () => (height = host.clientHeight);
		f();
		const o = new ResizeObserver(f);
		o.observe(host);
		return () => o.disconnect();
	});
	// a chip sits off its node, outward from the orbit's middle; the agents are one stop in a tab, arrows between them
	const place = (n: Star) =>
		`left: ${n.x}px; top: ${n.y}px; transform: ${
			Math.abs(n.ox) < 0.2
				? n.oy < 0
					? 'translate(-50%, calc(-100% - 12px))'
					: 'translate(-50%, 12px)'
				: n.ox < 0
					? 'translate(calc(-100% - 12px), -50%)'
					: 'translate(12px, -50%)'
		}`;
	let rove = $state(0);
	const chips: HTMLButtonElement[] = $state([]);
	const key = (e: KeyboardEvent) => {
		const n = AG_CREW.length;
		if (e.key === 'Escape' && held) return void (held = null);
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
		chips[rove]?.focus();
	};
</script>

{#snippet play(compact: boolean)}
	{#if !reduce}
		{#if compact}<button
				type="button"
				class="btn btn-ghost btn-sm btn-icon ag-play"
				aria-label="{moving ? 'Pause' : 'Play'} the agents"
				onclick={walk.toggle}><Icon name={moving ? 'pause' : 'play'} size={16} /></button
			>{:else}<button
				type="button"
				class="btn btn-ghost btn-sm ag-play"
				aria-label="{moving ? 'Pause' : 'Play'} the agents"
				onclick={walk.toggle}><Icon name={moving ? 'pause' : 'play'} size={15} />{moving ? 'Pause' : 'Play'}</button
			>{/if}
	{/if}
{/snippet}
{#snippet words()}
	<!-- for a screen reader: the nine stops in words (the picture is hidden from it), and the agent picked -->
	<ol class="sr-only" aria-label="How Smart-Clearance's agents work a batch">
		{#each AG_STOPS as s, i (s.id)}<li>
				{s.t}: {agNames(i)}. {agAt(i)
					.map((c) => c.did)
					.join('. ')}.
			</li>{/each}
	</ol>
	<p class="sr-only" role="status">{held ? `${held.name}, ${AG_STOPS[held.stop].t}: ${held.did}.` : ''}</p>
{/snippet}

{#if none}
	<!-- a phone held upright: the form alone -->
{:else if isBand}
	<AgentAround {walk} {play} {words} />
{:else}
	<AgentField {walk} {stars} {orbit} {height} />
	<div bind:this={stage} class="ag-stage" style:height={height ? `${height}px` : undefined}>
		<div class="ag-head">{@render children?.()}</div>
		<div bind:this={orbit} class="ag-orbit" bind:clientWidth={ow} bind:clientHeight={oh}>
			<div class="ag-crew" role="toolbar" aria-label="The agents, in the order they work">
				{#each stars as n, i (n.c.id)}
					{@const st = walk.state(n.c)}
					<button
						bind:this={chips[i]}
						type="button"
						tabindex={i === rove ? 0 : -1}
						aria-pressed={held?.id === n.c.id}
						class={cx('ag-chip', n.c.human && 'human', st, st === 'now' && !reduce && 'aura')}
						style={place(n)}
						onfocus={() => (rove = i)}
						onkeydown={key}
						onclick={() => pick(n.c)}
						><i><Icon name={n.c.icon} size={14} stroke={2.2} /></i>{n.c.name}<span class="sr-only"
							>, {AG_STOPS[n.c.stop].t}</span
						></button
					>
				{/each}
			</div>
			<AgentCaption {walk} class="centre" />
		</div>
		<div class="ag-foot">{@render play(false)}<span class="ag-hint">Pick an agent to see its work</span></div>
		{@render words()}
	</div>
{/if}
