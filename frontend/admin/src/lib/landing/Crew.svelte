<script lang="ts">
	import { Icon, cx, fmt, prefersReducedMotion, useApp, type IconName } from '@smart-clearance/core';
	import { animate } from 'motion';
	import type { Figures } from './figures';

	// The carton's crew (design3/site Crew, SC-30). The ten agents and the person ride a ring around the giant carton,
	// passing behind it. The batch walks its nine stops once, as soon as the plate has loaded, since the hero is the
	// first viewport. The ring turns each stop's agent to the front, where it wears the aura while it works and the
	// caption under the carton says what it did; a thread draws from each agent to the next. 430 ms a stop, 980 ms on the
	// person's yes and 700 ms on the report while the money rolls in: 4.69 s in all, so every motion is over within five
	// seconds (WCAG 2.2.2). It holds on the result and offers Replay; under reduced motion it is at its result from the
	// start. The server sends it before it sets off; the ring needs the plate's measured fit, so it is drawn in the browser.
	let { f }: { f: Figures } = $props();
	const app = useApp();
	const NS = $derived(f.stops.length);
	const N = $derived(f.crew.length);
	const T = $derived((2 * Math.PI) / N);

	// the carton's outline on the plate, as fractions of it (the day and night plates are composed alike)
	const CARTON = [
		[0.393, 0.334],
		[0.466, 0.316],
		[0.65, 0.346],
		[0.651, 0.75],
		[0.525, 0.805],
		[0.393, 0.746]
	];
	const STEP = 430;
	const YES = 980;
	const LAST = 700;
	const stays = (k: number) => (f.stops[k].human ? YES : k === NS - 1 ? LAST : STEP);

	// The plate is cover-fitted in its box at its own object-position (50% 50% on desktops, 50% 64% below), so a point
	// of the plate lands where at(p) says, in the layer's pixels. The layer is laid exactly over the plate's box and
	// measured again as the page resizes or the night plate comes in.
	type Fit = {
		left: number;
		top: number;
		w: number;
		h: number;
		s: number;
		ox: number;
		oy: number;
		nw: number;
		nh: number;
	};
	let layer: HTMLElement | undefined = $state();
	let g = $state<Fit | null>(null);
	let ready = $state(false);
	$effect(() => {
		const el = layer;
		if (!el) return;
		const hero = el.closest('.hero') as HTMLElement;
		const img = hero.querySelector('.hero-scene img') as HTMLImageElement;
		const measure = () => {
			const host = el.offsetParent;
			if (!host) return;
			const r = img.getBoundingClientRect();
			const p = host.getBoundingClientRect();
			const nw = img.naturalWidth || +(img.getAttribute('width') ?? 0);
			const nh = img.naturalHeight || +(img.getAttribute('height') ?? 0);
			const [px, py] = (getComputedStyle(img).objectPosition || '50% 50%').split(' ').map((v) => parseFloat(v) / 100);
			const s = Math.max(r.width / nw, r.height / nh);
			g = {
				left: r.left - p.left,
				top: r.top - p.top,
				w: r.width,
				h: r.height,
				s,
				ox: (r.width - nw * s) * px,
				oy: (r.height - nh * s) * py,
				nw,
				nh
			};
		};
		const loaded = () => {
			measure();
			ready = true;
		};
		measure();
		if (img.complete && img.naturalWidth) ready = true;
		img.addEventListener('load', loaded);
		const ro = new ResizeObserver(measure);
		ro.observe(img);
		ro.observe(hero);
		return () => {
			ro.disconnect();
			img.removeEventListener('load', loaded);
		};
	});
	const at = (p: number[]): [number, number] => (g ? [g.ox + p[0] * g.nw * g.s, g.oy + p[1] * g.nh * g.s] : [0, 0]);
	// wide: the desktop frame, where the plate is the hero's whole picture and the copy sits in its sky
	const wide = $derived(!!g && g.w >= 900);

	// where the batch is: -1 before it sets off, 0 to 8 at a stop, 9 when it is done (how it rests, and how it is from
	// the start under reduced motion). It sets off half a second after the plate has loaded, so it never plays over an
	// empty frame; Replay sets it off again
	let k = $state(-1);
	let run = $state(0);
	const playing = $derived(k >= 0 && k < NS);
	const done = $derived(k >= NS);
	$effect(() => {
		void run;
		if (prefersReducedMotion.current) {
			k = NS;
			return;
		}
		if (!ready) return;
		k = -1;
		const t = setTimeout(() => (k = 0), 500);
		return () => clearTimeout(t);
	});
	$effect(() => {
		if (prefersReducedMotion.current || k < 0 || k >= NS) return;
		const t = setTimeout(() => (k += 1), stays(k));
		return () => clearTimeout(t);
	});

	// the money, rolled in once over the report stop (the system's roll, 700 ms); at its value under reduced motion
	let money = $state(0);
	const counting = $derived(k >= NS - 1);
	$effect(() => {
		const to = f.actual.net;
		if (prefersReducedMotion.current) {
			money = to;
			return;
		}
		if (!counting) {
			money = 0;
			return;
		}
		const c = animate(0, to, { duration: LAST / 1000, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (money = v) });
		return () => c.stop();
	});

	// the ring's turn that brings stop k's agent to the front (the middle one, where a stop has three): before the walk,
	// between the last agent and the first; at rest, the last
	const frontOf = (k: number) => {
		if (k < 0) return -1.5;
		if (k >= NS) return N - 1;
		const here = f.crew.map((c, j) => (c.stop === k ? j : -1)).filter((j) => j >= 0);
		return here[Math.floor(here.length / 2)];
	};
	// the ring starts where the walk does, and from there turns to each stop's agent
	let rot = $state(0);
	let rotNow: number | null = null;
	$effect(() => {
		const to = frontOf(k) * T;
		if (rotNow === null || prefersReducedMotion.current) {
			rotNow = to;
			rot = to;
			return;
		}
		const c = animate(rotNow, to, {
			duration: k < 0 ? 0.5 : 0.42,
			ease: [0.45, 0, 0.4, 1],
			onUpdate: (v) => {
				rotNow = v;
				rot = v;
			}
		});
		return () => c.stop();
	});

	// the ring sits round the carton's middle, tilted as if seen from above; on narrow plates it pulls in to stay on the
	// plate
	const ring = $derived.by(() => {
		if (!g) return null;
		const [x, y] = at(wide ? [0.522, 0.565] : [0.512, 0.565]);
		return { x, y, rx: (wide ? 0.245 : 0.178) * g.nw * g.s, ry: (wide ? 0.13 : 0.12) * g.nh * g.s };
	});
	const tiles = $derived.by(() => {
		if (!ring) return [];
		return f.crew.map((c, j) => {
			const a = j * T - rot;
			const d = Math.cos(a);
			const now = c.stop === k && playing;
			return {
				...c,
				j,
				x: ring.x + ring.rx * Math.sin(a),
				y: ring.y + ring.ry * d,
				d,
				done: c.stop < k || done,
				now,
				scale: (0.8 + (0.2 * (d + 1)) / 2) * (now ? 1.14 : 1)
			};
		});
	});
	type Tile = (typeof tiles)[number];
	// the carton cut out of the layer: what rides behind it (the back of the ring, its tiles and threads) is hidden by it
	const outline = $derived(
		g
			? `M0 0 H${g.w} V${g.h} H0 Z M${CARTON.map((p) =>
					at(p)
						.map((v) => v.toFixed(1))
						.join(' ')
				).join(' L')} Z`
			: ''
	);
	// the handoff threads: from each agent that has worked to the next one in the crew
	const threads = $derived.by(() => {
		const reached = tiles.filter((t) => t.done || t.now).length;
		return tiles.slice(1, Math.max(1, reached)).map((t, i) => [tiles[i], t] as const);
	});
	const s = $derived(playing ? f.stops[k] : null);
</script>

<!-- on a phone each tile is its icon, except the agent at work (and, at rest, the last) -->
{#snippet tile(t: Tile)}<span
		class={cx(
			'crew-tile',
			t.human && 'human',
			t.done && 'on',
			playing && !t.done && !t.now && 'later',
			!wide && !t.now && !(done && t.j === N - 1) && 'icon'
		)}
		style:transform="translate({t.x.toFixed(1)}px, {t.y.toFixed(1)}px) translate(-50%, -50%) scale({t.scale.toFixed(
			3
		)})"
		style:z-index={Math.round((t.d + 1) * 50) + (t.now ? 200 : 0)}
		><span class={cx(t.now && 'aura')}><i><Icon name={t.icon as IconName} size={13} stroke={2.2} /></i>{t.name}</span
		></span
	>{/snippet}

<div
	class="crew-layer"
	bind:this={layer}
	style:left={g ? `${g.left}px` : undefined}
	style:top={g ? `${g.top}px` : undefined}
	style:width={g ? `${g.w}px` : undefined}
	style:height={g ? `${g.h}px` : undefined}
	style:visibility={g ? undefined : 'hidden'}
	aria-hidden="true"
>
	{#if g && ring}
		<svg
			><defs><clipPath id="crew-behind"><path clip-rule="evenodd" d={outline} /></clipPath></defs><ellipse
				class="crew-ring"
				cx={ring.x}
				cy={ring.y}
				rx={ring.rx}
				ry={ring.ry}
				clip-path="url(#crew-behind)"
			/><path
				class="crew-ring"
				d="M{ring.x - ring.rx} {ring.y} A{ring.rx} {ring.ry} 0 0 0 {ring.x + ring.rx} {ring.y}"
			/></svg
		>
		<svg
			>{#each threads as [a, b] (a.name + b.name)}<line
					class={cx('crew-thread', (a.human || b.human) && 'human')}
					x1={a.x}
					y1={a.y}
					x2={b.x}
					y2={b.y}
					clip-path={a.d < 0 || b.d < 0 ? 'url(#crew-behind)' : undefined}
				/>{/each}</svg
		>
		<div class="crew-back" style:clip-path="path(evenodd, '{outline}')">
			{#each tiles.filter((t) => t.d < 0) as t (t.name)}{@render tile(t)}{/each}
		</div>
		<div class="crew-front">
			{#each tiles.filter((t) => t.d >= 0) as t (t.name)}{@render tile(t)}{/each}
		</div>
	{/if}
</div>
<!-- the picture is hidden from screen readers, which get the nine stops and the result as text instead -->
<ol class="sr-only" aria-label="The nine stops">
	{#each f.stops as st (st.id)}<li>{st.title}, {st.who.join(' · ')}: {st.done}.</li>{/each}
</ol>
<p class="sr-only">
	Sold, not binned: {fmt.inr(f.actual.net)} recovered, instead of {fmt.inr(-f.bin)} to destroy it.
</p>
<!-- what the batch is doing, under the carton: before it sets off, at each stop, and when it is done -->
<div class={cx('hero-caption', s?.human && 'human')} aria-hidden="true">
	{#if k < 0}<b>{fmt.num(f.atRisk)} packs, {f.daysLeft} days left.</b><span
			>Ten agents and one person take it from here.</span
		>{:else if s}<span class="n">{k + 1} of {NS}</span><b>{s.title}</b><span>{s.who.join(' · ')}</span><span class="did"
			>{s.id === 'report' ? `${fmt.inr(money)} recovered · ${fmt.num(f.kg)} kg kept out of landfill` : s.done}</span
		>{:else}<span class="n">{NS} of {NS}</span><b>Sold, not binned.</b><span class="did"
			>{fmt.inr(f.actual.net)} recovered, instead of {fmt.inr(-f.bin)} to destroy it</span
		>{/if}
</div>
<!-- empty, and so not drawn, until the page is live; under reduced motion there is nothing to replay -->
<div class="hero-replay">
	{#if app.mounted && !prefersReducedMotion.current}<button type="button" class="replay" onclick={() => (run += 1)}
			><Icon name="rotate-ccw" size={16} stroke={2} />Replay the batch</button
		>{/if}
</div>
