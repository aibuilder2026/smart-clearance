<script lang="ts">
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from '../motion';

	// the workspace's route line (SC-152), the console's RouteBar (SC-49): while a screen reads what it needs, a line
	// runs along the top of the app, eases most of the way and waits there (1.2 s); once the read is in, it completes
	// (160 ms), lands its amber pin (420 ms) and fades. Under reduced motion it stands at 88%, then goes
	let { on }: { on: boolean } = $props();
	const reduce = prefersReducedMotion.current;
	let shown = $state(false);
	let started = $state(false);
	let done = $state(false);
	$effect(() => {
		if (on) {
			untrack(() => (shown = true));
			done = false;
			started = false;
			const f = requestAnimationFrame(() => (started = true));
			return () => cancelAnimationFrame(f);
		}
		if (!untrack(() => shown)) return;
		done = true;
		const t = setTimeout(() => (shown = false), reduce ? 0 : 760);
		return () => clearTimeout(t);
	});
	// the line slides in from the left (a transform, never its width), its pin riding its end
	const left = $derived(done ? 0 : started || reduce ? 12 : 100);
</script>

{#if shown}<div class="ws-route" class:done class:reduce aria-hidden="true">
		<i class="line" style:transform="translateX(-{left}%)"><b class="pin" class:landed={done}></b></i>
	</div>{/if}

<style>
	.ws-route {
		clip-path: inset(-8px 0 -8px 0);
		transition: opacity 240ms;
	}
	.ws-route.done:not(.reduce) {
		opacity: 0;
		transition-delay: 500ms;
	}
	.line {
		transition: transform 1.2s cubic-bezier(0.3, 0.7, 0.4, 1);
	}
	.done .line {
		transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.reduce .line {
		transition: none;
	}
	.pin {
		transform: scale(0.6);
	}
	.pin.landed {
		transform: scale(1);
		animation: land 420ms cubic-bezier(0.22, 1, 0.36, 1) 120ms backwards;
	}
	.reduce .pin.landed {
		animation: none;
	}
	@keyframes land {
		0% {
			transform: scale(0);
		}
		60% {
			transform: scale(1.35);
		}
	}
</style>
