<script lang="ts">
	import { onMount } from 'svelte';
	import { cx } from '../../cx';
	import { AG_N, AG_T, agDraw, agField, agStep, type Field, type Star, type Walk } from './mesh';

	// the canvas of the agents at work (SC-195; design3's AgentField): over the whole sign-in on a desktop, the named
	// nodes where the stage's orbit is, or the band's own box. Frames run while the walk moves, the pointer is in the
	// field, a ripple spreads or the field is still settling. A click or a tap on a named node picks that agent; anywhere
	// else it sends a ripple through the field and lets the walk go on
	type Props = {
		walk: Walk;
		stars: Star[];
		band?: boolean;
		orbit?: HTMLElement | null;
		height?: number | null;
		/** the agents placed in the canvas's own box (round the card), and the field taking no room in the rows */
		local?: boolean;
	};
	let { walk, stars, band = false, orbit = null, height = null, local = false }: Props = $props();
	let box: HTMLDivElement | undefined = $state();
	let cv: HTMLCanvasElement | undefined = $state();
	let w = $state(0);
	let h = $state(0);
	type Live = Omit<
		Field,
		'w' | 'h' | 'band' | 'k' | 'done' | 'playing' | 'held' | 'moving' | 'reduce' | 'dark' | 'state'
	>;
	const f: Live & { raf: number; last: number; off: { x: number; y: number } } = {
		nodes: [],
		ripples: [],
		pointer: null,
		stars: [],
		stepAt: 0,
		resetAt: -1e9,
		raf: 0,
		last: 0,
		off: { x: 0, y: 0 }
	};
	const now = () => (typeof performance === 'undefined' ? 0 : performance.now());
	// a device preview scales the page (the guided demo): the screen's pixels are not the canvas's
	const scaleOf = () => (box && box.offsetWidth ? box.getBoundingClientRect().width / box.offsetWidth : 1);
	const isDark = () => box?.closest('[data-theme]')?.getAttribute('data-theme') === 'dark';

	function frame(t: number) {
		const ctx = cv && w && h ? cv.getContext('2d') : null;
		if (!cv || !ctx) {
			f.raf = 0;
			return;
		}
		const dt = f.last ? Math.min(3, (t - f.last) / (1000 / 60)) : 1;
		f.last = t;
		const field: Field = Object.assign(f, {
			w,
			h,
			band,
			k: walk.k,
			done: walk.done,
			playing: walk.playing,
			held: walk.held,
			moving: walk.moving,
			reduce: walk.reduce,
			state: walk.state,
			dark: isDark(),
			stars: stars.map((s) => ({ ...s, x: s.x + f.off.x, y: s.y + f.off.y }))
		});
		f.ripples = f.ripples
			.map((r) => {
				const u = Math.min(1, (t - r.born) / 900);
				return { ...r, t: (t - r.born) / 900, r: 6 + (band ? 150 : 260) * (1 - Math.pow(1 - u, 3)) };
			})
			.filter((r) => r.t < 1);
		field.ripples = f.ripples;
		const energy = walk.reduce ? 0 : agStep(field, dt);
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
			cv.width = Math.round(w * dpr);
			cv.height = Math.round(h * dpr);
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		agDraw(ctx, field, t);
		const live =
			walk.moving || !!f.pointer || f.ripples.length > 0 || energy > 0.05 || (walk.k < 0 && t - f.resetAt < AG_T.fade);
		f.raf = live ? requestAnimationFrame(frame) : 0;
		if (!live) f.last = 0;
	}
	const kick = () => {
		if (!f.raf && typeof requestAnimationFrame === 'function') f.raf = requestAnimationFrame(frame);
	};

	// a new stop starts its handoff drawing; the walk round again fades the last one's handoffs
	let prevK = -1;
	$effect(() => {
		const k = walk.k;
		if (k < 0 && prevK >= AG_N) f.resetAt = now();
		prevK = k;
		f.stepAt = now();
		kick();
	});
	// the field, and where the orbit sits in it (the band's canvas is the orbit)
	$effect(() => {
		if (!w || !h) return;
		f.nodes = agField(w, h, band);
		if (!band && !local && orbit && box) {
			const a = orbit.getBoundingClientRect(),
				b = box.getBoundingClientRect(),
				z = scaleOf();
			f.off = { x: (a.left - b.left) / z, y: (a.top - b.top) / z };
		}
		void stars;
		kick();
	});
	$effect(() => {
		void [walk.moving, walk.held, walk.reduce];
		kick();
	});
	onMount(() => {
		// a change of theme redraws the field, moving or not
		const o = new MutationObserver(kick);
		o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		const app = box?.closest('.app');
		if (app) o.observe(app, { attributes: true, attributeFilter: ['data-theme'] });
		return () => {
			o.disconnect();
			cancelAnimationFrame(f.raf);
			f.raf = 0;
		};
	});

	const at = (e: PointerEvent) => {
		const r = box!.getBoundingClientRect(),
			z = scaleOf();
		return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z };
	};
	let down: { x: number; y: number } | null = null;
	const onmove = (e: PointerEvent) => {
		f.pointer = at(e);
		kick();
	};
	const onleave = () => {
		f.pointer = null;
		kick();
	};
	const ondown = (e: PointerEvent) => {
		down = at(e);
		if (e.pointerType !== 'mouse') {
			f.pointer = down;
			kick();
		}
	};
	// a click or a tap: on a named node, that agent; anywhere else, a ripple, and the walk let go
	const onup = (e: PointerEvent) => {
		const p = at(e),
			d = down;
		down = null;
		if (e.pointerType !== 'mouse') f.pointer = null;
		if (!d || Math.hypot(p.x - d.x, p.y - d.y) > 10) return kick();
		const hit = f.stars
			.map((s) => ({ s, d: Math.hypot(s.x - p.x, s.y - p.y) }))
			.filter((x) => x.d < (band ? 24 : local ? 22 : 18))
			.sort((a, b) => a.d - b.d)[0];
		if (hit) walk.pick(hit.s.c);
		else {
			if (!walk.reduce) f.ripples.push({ x: p.x, y: p.y, born: now(), t: 0, r: 6 });
			walk.release();
		}
		kick();
	};
</script>

<div
	bind:this={box}
	bind:clientWidth={w}
	bind:clientHeight={h}
	class={cx('ag-field', band && 'band')}
	style:height={height ? `${height}px` : undefined}
	style:margin-bottom={height && local ? `-${height}px` : undefined}
	aria-hidden="true"
	onpointermove={onmove}
	onpointerleave={onleave}
	onpointercancel={onleave}
	onpointerdown={ondown}
	onpointerup={onup}
>
	<canvas bind:this={cv} class="ag-canvas"></canvas>
</div>
