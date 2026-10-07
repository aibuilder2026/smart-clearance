<script module lang="ts">
	export type Phase = 'idle' | 'busy' | 'done' | 'error';
</script>

<script lang="ts">
	import { fly } from 'svelte/transition';
	import Icon from '../../../icons/Icon.svelte';
	import { ease, motionMs, prefersReducedMotion } from '../../../motion';

	// Sign in keeps its label (the console's, SC-46 and SC-49; screens/live.jsx SignInButton): "Signing in…" while it
	// checks, with the mark's S drawing in the icon's place and a line along the foot; then a welcome and a tick. A wrong
	// sign-in shakes it (360 ms). Screen readers hear each phase once; under reduced motion every phase shows at once
	let { phase, name }: { phase: Phase; name: string } = $props();
	const reduce = $derived(prefersReducedMotion.current);
	const busy = $derived(phase === 'busy');
	const done = $derived(phase === 'done');
	const label = $derived(done ? `Welcome, ${name}` : busy ? 'Signing in…' : 'Sign in');
</script>

<button
	type="submit"
	class="btn btn-primary btn-lg btn-block si-btn"
	class:on={busy || done}
	class:shake={phase === 'error' && !reduce}
	class:still={reduce}
	aria-disabled={busy || done || undefined}
>
	<span class="si-btn-ic" aria-hidden="true"
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
			>{:else if busy}<svg width="20" height="20" viewBox="12 12 40 40"
				><circle cx="43.5" cy="19" r="4" fill="currentColor" /><path
					class="s"
					d="M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5"
					pathLength="1"
					fill="none"
					stroke="currentColor"
					stroke-width="5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/></svg
			>{:else}<Icon name="log-in" size={18} />{/if}</span
	><span class="si-btn-lbl"
		>{#key label}<span
				in:fly={{ y: 12, duration: motionMs(240), easing: ease }}
				out:fly={{ y: -12, duration: motionMs(240), easing: ease }}>{label}</span
			>{/key}</span
	>{#if busy || done}<i class="si-btn-prog" class:full={done} aria-hidden="true"></i>{/if}<span
		class="sr-only"
		role="status">{busy ? 'Signing in' : done ? `Signed in. Welcome, ${name}.` : ''}</span
	>
</button>

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
	.tick path {
		stroke-dasharray: 1;
		animation: draw 280ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}
	@keyframes draw {
		from {
			stroke-dashoffset: 1;
		}
	}
	.si-btn-prog {
		transform: scaleX(0.9);
		transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
		animation: fill 1.1s cubic-bezier(0.3, 0.7, 0.4, 1) backwards;
	}
	.si-btn-prog.full {
		transform: scaleX(1);
	}
	@keyframes fill {
		from {
			transform: scaleX(0);
		}
	}
	.still .s,
	.still .tick path,
	.still .si-btn-prog {
		animation: none;
		transition: none;
	}
</style>
