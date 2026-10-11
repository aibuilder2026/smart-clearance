<script lang="ts">
	import { cx } from '../cx';
	import { prefersReducedMotion } from '../motion';
	import { inkPath } from './SignPad.svelte';

	// a signature as drawn (SC-183; the kit's InkStrokes), at a height: fitted to its own strokes, the pen a steady
	// width on screen. `play` draws it once as it was signed (1.6 s a signature, one pen speed for the whole name), at
	// once under reduced motion. A typed signature is the name, set in italic
	type Ink = { typed?: boolean; strokes?: [number, number][][] | null };
	type Props = {
		ink: Ink | null | undefined;
		name: string;
		h?: number;
		play?: boolean;
		delay?: number;
		class?: string;
	};
	let { ink, name, h = 44, play = false, delay = 0, class: klass }: Props = $props();
	const strokes = $derived(ink && !ink.typed ? (ink.strokes ?? []) : []);
	const fit = $derived.by(() => {
		const pts = strokes.flat();
		const xs = pts.map((p) => p[0]);
		const ys = pts.map((p) => p[1]);
		const m = 6;
		const x0 = Math.min(...xs) - m;
		const y0 = Math.min(...ys) - m;
		const w = Math.max(...xs) - x0 + m;
		const hh = Math.max(...ys) - y0 + m;
		const px = h >= 90 ? 2.4 : h >= 50 ? 1.9 : h >= 24 ? 1.45 : 1.1;
		const lens = strokes.map(
			(st) => st.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - st[i - 1][0], p[1] - st[i - 1][1]) : 0), 0) || 1
		);
		const total = lens.reduce((a, b) => a + b, 0);
		let acc = 0;
		const timing = lens.map((l) => {
			const t = { start: acc / total, frac: l / total };
			acc += l;
			return t;
		});
		return { x0, y0, w, hh, sw: (px * hh) / h, timing };
	});
	// drawn once, each stroke as the pen made it; a path waits hidden until its turn
	const write = (el: SVGPathElement, i: number) => {
		if (!play || prefersReducedMotion.current) return;
		const { start, frac } = fit.timing[i];
		el.style.strokeDasharray = '1 1';
		el.style.strokeDashoffset = '1';
		const a = el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
			duration: Math.max(30, 1600 * frac),
			delay: (delay + 1.6 * start) * 1000,
			easing: 'linear',
			fill: 'forwards'
		});
		return { destroy: () => a.cancel() };
	};
</script>

{#if ink && (ink.typed || !strokes.length)}<span
		class={cx('ink-typed', klass)}
		style="--h: {h}px"
		role="img"
		aria-label="Typed by {name}">{name}</span
	>{:else if ink}<svg
		class={cx('inkstrokes', klass)}
		viewBox="{fit.x0} {fit.y0} {fit.w} {fit.hh}"
		style="height: {h}px; width: {(h * fit.w) / fit.hh}px"
		role="img"
		aria-label="Signed by {name}"
		><g stroke-width={fit.sw}
			>{#each strokes as st, i (i)}<path d={inkPath(st)} pathLength={play ? 1 : undefined} use:write={i} />{/each}</g
		></svg
	>{/if}
