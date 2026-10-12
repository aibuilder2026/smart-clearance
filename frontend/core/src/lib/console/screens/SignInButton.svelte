<script module lang="ts">
	export type Phase = 'idle' | 'busy' | 'done' | 'error';
</script>

<script lang="ts">
	import { ease, Icon, motionMs, prefersReducedMotion, SPRINGS, springCurve } from '../../index';
	import { fly } from 'svelte/transition';

	// Sign in keeps its label (SC-49): "Signing in…" while it checks, with the mark's S drawing in the icon's place and
	// a line along the foot; then a welcome and a tick. A wrong sign-in shakes it (360 ms). Screen readers hear each
	// phase once; under reduced motion every phase shows at once
	let { phase, name }: { phase: Phase; name: string } = $props();
	const reduce = prefersReducedMotion.current;
	const busy = $derived(phase === 'busy');
	const done = $derived(phase === 'done');
	const label = $derived(done ? `Welcome, ${name}` : busy ? 'Signing in…' : 'Sign in');
	// the wait (SC-194): the S draws once, then a stretch of it laps (the kit's .si-route, as the splash's route does)
	// until the check is done; past 3 s a line under the button says the connection is slow
	let lap = $state(false);
	let slow = $state(false);
	$effect(() => {
		if (!busy) {
			lap = false;
			slow = false;
			return;
		}
		const a = setTimeout(() => (lap = !reduce), 1100);
		const b = setTimeout(() => (slow = true), 3000);
		return () => {
			clearTimeout(a);
			clearTimeout(b);
		};
	});
	const S_PATH = 'M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5';
	const tick = springCurve(SPRINGS.tick);
</script>

<button
	type="submit"
	class="btn btn-primary btn-lg btn-block cs-si-btn"
	class:on={busy || done}
	class:shake={phase === 'error' && !reduce}
	class:still={reduce}
	aria-disabled={busy || done || undefined}
	style:--tick-ease={tick.linear}
	style:--tick-ms="{tick.duration}ms"
>
	<span class="cs-si-ic" aria-hidden="true"
		>{#if done}<svg class="tick" width="20" height="20" viewBox="0 0 24 24"
				><path
					d="M5 12.5l4.5 4.5L19 7.5"
					pathLength="1"
					fill="none"
					stroke="currentColor"
					stroke-width="2.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/></svg
			>{:else if busy}<svg class="si-route" width="20" height="20" viewBox="12 12 40 40"
				><circle
					cx="43.5"
					cy="19"
					r="4"
					fill="currentColor"
				/>{#each lap ? ['ghost', 'run'] : ['s'] as part (part)}<path
						class={part}
						d={S_PATH}
						pathLength="1"
						fill="none"
						stroke="currentColor"
						stroke-width="5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>{/each}</svg
			>{:else}<Icon name="log-in" size={18} />{/if}</span
	><span class="cs-si-lbl"
		>{#key label}<span
				in:fly={{ y: 12, duration: motionMs(240), easing: ease }}
				out:fly={{ y: -12, duration: motionMs(240), easing: ease }}>{label}</span
			>{/key}</span
	>{#if busy || done}<i class="cs-si-prog" class:full={done} aria-hidden="true"></i>{/if}<span
		class="sr-only"
		role="status">{busy ? 'Signing in' : done ? `Signed in. Welcome, ${name}.` : ''}</span
	>
</button>
{#if slow && busy}<p class="t-footnote si-slow" role="status">
		<Icon name="wifi" size={14} />Slow connection · still signing in
	</p>{/if}

<style>
	.shake {
		animation: shake 360ms ease-out;
	}
	@keyframes shake {
		16% {
			transform: translateX(-8px);
		}
		33% {
			transform: translateX(8px);
		}
		50% {
			transform: translateX(-5px);
		}
		66% {
			transform: translateX(5px);
		}
		83% {
			transform: translateX(-2px);
		}
	}
	.s {
		stroke-dasharray: 1;
		stroke-dashoffset: 0;
		animation: draw 1.1s cubic-bezier(0.65, 0, 0.35, 1) backwards;
	}
	.tick {
		animation: pop var(--tick-ms) var(--tick-ease) backwards;
	}
	.tick path {
		stroke-dasharray: 1;
		animation: draw 280ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}
	@keyframes draw {
		from {
			stroke-dashoffset: 1;
		}
	}
	@keyframes pop {
		from {
			transform: scale(0.4);
		}
	}
	/* the line along the foot fills to 0.82 in 1.1 s, then creeps on for as long as the check takes, never stopping
	   (SC-194) */
	.cs-si-prog {
		transform: scaleX(0.97);
		transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
		animation: fill 20s backwards;
	}
	.cs-si-prog.full {
		transform: scaleX(1);
		animation: none;
	}
	@keyframes fill {
		0% {
			transform: scaleX(0);
			animation-timing-function: cubic-bezier(0.3, 0.7, 0.4, 1);
		}
		5.5% {
			transform: scaleX(0.82);
			animation-timing-function: cubic-bezier(0.1, 0.6, 0.3, 1);
		}
	}
	.still .s,
	.still .tick,
	.still .tick path,
	.still .cs-si-prog {
		animation: none;
		transition: none;
	}
	.still .cs-si-prog {
		transform: scaleX(0.9);
	}
	.still .cs-si-prog.full {
		transform: scaleX(1);
	}
</style>
