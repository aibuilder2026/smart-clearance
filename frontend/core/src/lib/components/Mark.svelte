<script lang="ts">
	import { onMount } from 'svelte';
	import { cx } from '../cx';
	import { prefersReducedMotion } from '../motion';
	import { curveFrames, springFrames } from '../motion/frames';

	// the mark: an S drawn as a route, from the godown dot to the amber pin. With `play` it draws itself: squircle,
	// route, godown dot, amber pin (the kit's Mark); reduced motion shows it drawn.
	type Props = { size?: number; class?: string; play?: boolean; ondone?: () => void };
	let { size = 40, class: className, play = false, ondone }: Props = $props();
	const uid = $props.id();
	const gid = 'mk' + uid;
	const S = 'M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5';
	// svelte-ignore state_referenced_locally (a mark plays once, as it mounts)
	const animate = play && !prefersReducedMotion.current;

	let squircle: SVGPathElement | undefined = $state();
	let route: SVGPathElement | undefined = $state();
	let dot: SVGCircleElement | undefined = $state();
	let ping: SVGCircleElement | undefined = $state();
	let pin: SVGCircleElement | undefined = $state();

	onMount(() => {
		const t = ondone ? setTimeout(ondone, animate ? 1500 : 10) : undefined;
		if (animate) {
			const sq = springFrames({ stiffness: 260, damping: 18 }, (v) => ({
				transform: `scale(${0.55 + 0.45 * v})`,
				opacity: Math.min(1, v)
			}));
			squircle?.animate(sq.frames, { duration: sq.duration, fill: 'backwards' });
			route?.animate(
				curveFrames([0.65, 0, 0.35, 1], (v) => ({ strokeDasharray: '1 1', strokeDashoffset: 1 - v })),
				{ duration: 750, delay: 250, fill: 'backwards' }
			);
			const d = springFrames({ stiffness: 500, damping: 20 }, (v) => ({ transform: `scale(${v})` }));
			dot?.animate(d.frames, { duration: d.duration, delay: 180, fill: 'backwards' });
			ping?.animate(
				[
					{ transform: 'scale(0.6)', opacity: 0.9 },
					{ transform: 'scale(2.2)', opacity: 0 }
				],
				{ duration: 900, delay: 1100, easing: 'ease-out', fill: 'both' }
			);
			const p = springFrames({ stiffness: 520, damping: 14 }, (v) => ({
				transform: `translateY(${-16 * (1 - v)}px) scale(${0.6 + 0.4 * v})`,
				opacity: Math.min(1, v)
			}));
			pin?.animate(p.frames, { duration: p.duration, delay: 950, fill: 'backwards' });
		}
		return () => clearTimeout(t);
	});
</script>

<svg class={cx('mark', className)} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"
	><defs
		><linearGradient id="{gid}g" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"
			><stop offset="0" stop-color="#2fbf7f" /><stop offset="0.55" stop-color="#178258" /><stop
				offset="1"
				stop-color="#0d5a3e"
			/></linearGradient
		><linearGradient id="{gid}h" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"
			><stop offset="0" stop-color="#fff" stop-opacity="0.28" /><stop
				offset="1"
				stop-color="#fff"
				stop-opacity="0"
			/></linearGradient
		></defs
	><path
		bind:this={squircle}
		d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z"
		fill="url(#{gid}g)"
		style="transform-origin: 32px 32px"
	/><path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#{gid}h)" /><path
		bind:this={route}
		d={S}
		pathLength={animate ? 1 : undefined}
		fill="none"
		stroke="#fff"
		stroke-width="6"
		stroke-linecap="round"
		stroke-linejoin="round"
	/><circle
		bind:this={dot}
		cx="43.5"
		cy="19"
		r="3.4"
		fill="#0d5a3e"
		stroke="#fff"
		stroke-width="2.6"
		style="transform-origin: 43.5px 19px"
	/>{#if animate}<circle
			bind:this={ping}
			cx="20.5"
			cy="47"
			r="5"
			fill="none"
			stroke="#f7c04a"
			stroke-width="2"
			opacity="0"
			style="transform-origin: 20.5px 47px"
		/>{/if}<circle
		bind:this={pin}
		cx="20.5"
		cy="47"
		r="5.2"
		fill="#f7c04a"
		stroke="#fff"
		stroke-width="2.2"
		style="transform-origin: 20.5px 47px"
	/></svg
>
