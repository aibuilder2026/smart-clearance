<script lang="ts">
	import { cx } from '../cx';
	import { prefersReducedMotion } from '../motion';
	import { springFrames } from '../motion/frames';

	// the name; with `play`, its letters rise into place one after another (the kit's Wordmark). A non-breaking hyphen
	// (U+2011) keeps it on one line.
	let { size = 20, class: className, play = false }: { size?: number; class?: string; play?: boolean } = $props();
	// svelte-ignore state_referenced_locally (a wordmark plays once, as it mounts)
	const animate = play && !prefersReducedMotion.current;
	const letters = 'Smart-Clearance'.split('');
	const rise = (i: number) => (el: HTMLElement) => {
		const s = springFrames({ stiffness: 380, damping: 28 }, (v) => ({
			transform: `translateY(${105 * (1 - v)}%)`,
			opacity: Math.min(1, v)
		}));
		el.animate(s.frames, { duration: s.duration, delay: 550 + i * 28, fill: 'backwards' });
	};
</script>

{#if !animate}<span class={cx('wordmark', className)} style="font-size: {size}px">Smart‑Clearance</span>{:else}<span
		class={cx('wordmark', className)}
		style="font-size: {size}px; display: inline-flex; overflow: hidden"
		role="img"
		aria-label="Smart-Clearance"
		>{#each letters as ch, i (i)}<span aria-hidden="true" style="display: inline-block" {@attach rise(i)}
				>{ch === '-' ? '‑' : ch}</span
			>{/each}</span
	>{/if}
