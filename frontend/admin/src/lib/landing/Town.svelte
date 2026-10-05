<script lang="ts">
	import {
		Icon,
		cx,
		ease,
		fmt,
		motionMs,
		prefersReducedMotion,
		useApp,
		useTheme,
		type IconName
	} from '@smart-clearance/core';
	import { animate } from 'motion';
	import { untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { Figures } from './figures';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';
	import { Camera, ZMAX } from './town/camera';
	import { DepthRenderer, loadDepthMap, shifted, type DepthMap } from './town/depth';
	import { GEO, along, fitOf, placeAt, shotOf, wpx, type Fit, type Pt } from './town/geo';
	import { gestures } from './town/gestures';
	import { Graph } from './town/graph';

	// The whole business as one miniature town (design3/site/town.jsx, SC-32): the maker's factory and office, the
	// distributor's godown, the kirana lane, a buyer in the next town, a food bank and the landfill. Every agent works
	// at a post in the town, and the handoffs between them are the agent graph. A camera follows one batch through it,
	// once (4.7 s, WCAG 2.2.2), then the town is the visitor's: drag or swipe to look round, pinch or Ctrl-scroll to
	// zoom, double-click to go nearer, and open a place or an agent for what it did. Drawn in WebGL2 from the plate and
	// its depth map, so it parallaxes as the camera travels, tilts under the pointer and keeps its focus on what the
	// camera looks at; without WebGL2 the plate is drawn flat. Under reduced motion the batch is at its result from the
	// start and the camera jumps. The server sends the plate at rest; the rest is drawn in the browser.
	let { f }: { f: Figures } = $props();
	const app = useApp();
	const theme = useTheme();
	const T = $derived(f.town);
	const NB = $derived(T.beats.length);
	const agentOf = (id: string) => T.agents.find((a) => a.id === id)!;
	const placeOf = (id: string) => T.places.find((p) => p.id === id)!;
	const beatOf = (id: string) => T.beats.findIndex((b) => b.id === id);
	const names = (who: string[]) => who.map((w) => agentOf(w).name).join(' · ');
	const dark = $derived(app.mounted && theme.resolved === 'dark');
	const reduce = $derived(prefersReducedMotion.current);

	/* ---------- the stage, the camera and the town's layers ---------- */
	let stage: HTMLElement | undefined = $state();
	let plateWorld: HTMLElement | undefined = $state();
	let topWorld: HTMLElement | undefined = $state();
	let hazeEl: HTMLElement | undefined = $state();
	let glCanvas: HTMLCanvasElement | undefined = $state();
	let graphCanvas: HTMLCanvasElement | undefined = $state();
	let g = $state<Fit | null>(null);
	let zoom = $state(1);
	let gl = $state(true);
	let ready = $state(false);
	const camera = new Camera(
		() => [plateWorld, topWorld].filter((x): x is HTMLElement => !!x),
		() => hazeEl ?? null,
		(z) => (zoom = z)
	);
	$effect(() => {
		camera.reduce = reduce;
	});
	$effect(() => {
		const el = stage;
		if (!el) return;
		const measure = () => {
			const W = el.clientWidth,
				H = el.clientHeight;
			const cur = untrack(() => g);
			if (!W || !H || (cur && cur.W === W && cur.H === H)) return;
			g = fitOf(W, H);
			camera.fit(g);
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});

	/* ---------- the depth renderer: the plate and its depth map, in WebGL2 ---------- */
	let renderer = $state.raw<DepthRenderer | null>(null);
	let map = $state.raw<DepthMap | null>(null);
	// made once, when its canvas is in: a second renderer on the same canvas would find its context lost
	$effect(() => {
		const c = glCanvas;
		if (!c || !app.mounted) return;
		let r: DepthRenderer;
		try {
			r = new DepthRenderer(c, camera, () => (ready = true));
		} catch {
			gl = false;
			return;
		}
		renderer = r;
		loadDepthMap(PLATES.townDepth.day).then(
			(m) => {
				map = m;
				r.setDepth(m);
			},
			() => (gl = false)
		);
		return () => {
			r.destroy();
			renderer = null;
		};
	});
	// the pointer tilts it, a swipe sways it
	$effect(() => {
		const r = renderer,
			el = stage;
		if (!r || !el) return;
		r.reduce = reduce;
		return r.follow(el);
	});
	$effect(() => {
		const r = renderer;
		if (!r || !gl) return;
		r.g = g;
		r.reduce = reduce;
		r.dark = dark;
		r.draw();
	});
	// the plate for the theme
	$effect(() => {
		const r = renderer,
			src = dark ? PLATES.town.night : PLATES.town.day;
		if (!r || !gl) return;
		let alive = true;
		const im = new Image();
		im.decoding = 'async';
		im.crossOrigin = 'anonymous';
		im.onload = () => alive && r.setPlate(im);
		im.onerror = () => (gl = false);
		im.src = src;
		return () => {
			alive = false;
		};
	});
	// where the renderer puts a plate point, for the graph and what stands on the town
	const project = $derived.by(() => {
		const m = map;
		if (!gl || !m) return null;
		return (p: Pt, id?: string) => {
			const v = renderer?.view;
			return v ? camera.toStage(shifted(p, m.at(p) + (id ? 0.04 : 0), v)) : camera.toStage(p);
		};
	});

	/* ---------- the journey ---------- */
	// -1 before it sets off, 0 to 6 at a beat, 7 when it is done. It sets off half a second after the town has loaded,
	// so it never plays over an empty frame. Stepping by hand stops the clock.
	let k = $state(-1);
	let run = $state(0);
	let manual = $state(false);
	const playing = $derived(k >= 0 && k < NB && !manual);
	const done = $derived(k >= NB);
	const beat = $derived(k >= 0 && k < NB ? T.beats[k] : null);
	$effect(() => {
		void run;
		if (reduce) {
			k = NB;
			return;
		}
		if (!ready) return;
		k = -1;
		const t = setTimeout(() => (k = 0), 500);
		return () => clearTimeout(t);
	});
	$effect(() => {
		if (reduce || manual || k < 0 || k >= NB) return;
		const t = setTimeout(() => (k += 1), T.beats[k].ms);
		return () => clearTimeout(t);
	});
	const step = (d: number) => {
		manual = true;
		k = Math.min(NB, Math.max(0, (k < 0 ? 0 : k) + d));
	};
	// the money, rolled in once over the settling beat (the system's roll, 700 ms); at its value under reduced motion
	let money = $state(0);
	const counting = $derived(k >= beatOf('report'));
	$effect(() => {
		const to = T.batch.net;
		if (reduce) {
			money = to;
			return;
		}
		if (!counting) {
			money = 0;
			return;
		}
		const c = animate(0, to, { duration: 0.7, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (money = v) });
		return () => c.stop();
	});

	/* ---------- the camera follows the journey until the visitor takes it ---------- */
	let following = $state(true);
	let sel = $state<{ kind: 'place' | 'agent'; id: string } | null>(null);
	let hov = $state<{ kind: 'place' | 'agent'; id: string } | null>(null);
	$effect(() => {
		if (!g || !following) return;
		const id = done || k < 0 ? 'rest' : T.beats[k].id;
		camera.to(shotOf(g, id), k < 0 ? 0 : 0.6);
	});
	$effect(() => {
		const el = stage;
		if (!el || !app.mounted) return;
		return gestures(el, camera, () => (following = false));
	});
	const open = (s: { kind: 'place' | 'agent'; id: string }) => {
		following = false;
		sel = s;
		const place = s.kind === 'place' ? s.id : agentOf(s.id).at,
			shot = shotOf(g, place);
		camera.to(
			s.kind === 'agent' ? [GEO.posts[s.id][0], GEO.posts[s.id][1] + (g?.wide ? 0.06 : 0.04), shot[2]] : shot,
			0.7
		);
	};
	const whole = () => {
		sel = null;
		camera.to(shotOf(g, 'rest'), 0.7);
	};
	const replay = () => {
		sel = null;
		following = true;
		manual = false;
		run += 1;
	};
	// Escape closes an open panel, wherever the focus is
	const onkey = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && sel) sel = null;
	};
	// what the graph lifts: an agent, or a place's team, and its neighbours in the graph
	const focus = $derived.by(() => {
		const s = hov ?? sel;
		if (!s) return null;
		const core = s.kind === 'agent' ? [s.id] : T.agents.filter((a) => a.at === s.id).map((a) => a.id);
		const near = T.edges.flatMap(([a, b]) => (core.includes(a) ? [b] : core.includes(b) ? [a] : []));
		return new Set([...core, ...near]) as ReadonlySet<string>;
	});

	/* ---------- what stands on the town, kept clear of the heading and the controls ---------- */
	// Nothing on the town sits under the heading's text or buttons, the caption, the controls or the panel, or half off
	// the stage; once the camera is nearer, nothing it carries into the haze either. The graph is clipped round the
	// heading's boxes.
	const boxes = (sels: string, pad: number): [number, number, number, number][] => {
		const s = stage,
			hero = s?.closest('.hero');
		if (!s || !hero || !g || !g.wide) return [];
		const o = s.getBoundingClientRect();
		return [...hero.querySelectorAll(sels)].map((e) => {
			const r = e.getBoundingClientRect();
			return [r.left - o.left - pad, r.top - o.top - pad, r.right - o.left + pad, r.bottom - o.top + pad];
		});
	};
	const holes = () => boxes('.hero-h, .hero-sub, .hero-ctas > *', 8);
	$effect(() => {
		const el = topWorld,
			s = stage,
			G = g;
		void k;
		void done;
		void sel;
		void hov;
		if (!el || !s || !G) return;
		const check = () => {
			const o = s.getBoundingClientRect(),
				hs = holes().concat(boxes('.town-caption, .town-ctl > *, .town-panel', 6)),
				near = G.wide && camera.t().z > 1.02,
				haze = GEO.haze[0] * G.H;
			for (const n of el.querySelectorAll<HTMLElement>('[data-at], .town-batch')) {
				const b = (n.querySelector('.town-pin-body, .town-node, .town-batch-card') ?? n).getBoundingClientRect();
				const x0 = b.left - o.left,
					y0 = b.top - o.top,
					x1 = b.right - o.left,
					y1 = b.bottom - o.top;
				const out = x1 < 4 || x0 > G.W - 4 || y1 < 4 || y0 > G.H - 4 || (b.width > 0 && (x0 < -6 || x1 > G.W + 6));
				const under = hs.some((h) => x0 < h[2] && x1 > h[0] && y0 < h[3] && y1 > h[1]);
				n.classList.toggle('off', out || under || (near && (y0 + y1) / 2 < haze));
			}
		};
		check();
		const a = camera.listen(check),
			b = camera.listenView(check);
		return () => {
			a();
			b();
		};
	});
	// in depth, the pins and the agents ride the renderer's shift
	$effect(() => {
		const el = topWorld,
			G = g,
			m = map;
		if (!gl || !m || !el || !G) return;
		const items = [...el.querySelectorAll<HTMLElement>('[data-at]')];
		const place = () => {
			const v = renderer?.view;
			if (!v) return;
			for (const n of items) {
				const p = JSON.parse(n.dataset.at!) as Pt,
					q = shifted(p, m.at(p) + 0.04, v);
				n.style.translate = `${((q[0] - p[0]) * G.w).toFixed(2)}px ${((q[1] - p[1]) * G.h).toFixed(2)}px`;
			}
		};
		place();
		const a = camera.listen(place),
			b = camera.listenView(place);
		return () => {
			a();
			b();
		};
	});

	/* ---------- the graph ---------- */
	let graph = $state.raw<Graph | null>(null);
	$effect(() => {
		const c = graphCanvas;
		if (!c) return;
		const gr = new Graph(c, camera, T.agents, T.edges, NB);
		graph = gr;
		const a = camera.listen(gr.draw),
			b = camera.listenView(gr.draw);
		return () => {
			a();
			b();
			gr.destroy();
			graph = null;
		};
	});
	$effect(() => {
		const gr = graph;
		if (!gr || !g) return;
		gr.state = { g, k, done, playing, manual, reduce, dark, focus, project, holes };
		gr.draw();
	});
	$effect(() => {
		void run;
		const gr = graph,
			id = beat?.id ?? null;
		void k;
		void done;
		if (!gr || !gr.state) return;
		gr.state = { ...gr.state, k, done, playing, manual, reduce };
		gr.step(id);
	});

	/* ---------- the batch, travelling the route ---------- */
	let batchEl: HTMLElement | undefined = $state();
	const batchAt = $derived(done ? null : beat ? beat.batch : k < 0 ? 'maker' : null);
	let batchPos: Pt | null = null;
	$effect(() => {
		const el = batchEl,
			G = g,
			place = batchAt;
		if (!el || !G || !place || place === 'sold') return;
		const to = wpx(G, GEO.batch[place]);
		const set = (p: Pt) => {
			batchPos = p;
			el.style.left = `${p[0]}px`;
			el.style.top = `${p[1]}px`;
		};
		if (!batchPos || reduce || place !== 'godown') return set(to);
		const route = GEO.routes.out.map((p) => wpx(G, p));
		const c = animate(0, 1, { duration: 0.5, ease: [0.22, 1, 0.36, 1], onUpdate: (u) => set(along(route, u)) });
		return () => c.stop();
	});
	const risk = $derived(k >= beatOf('risk') && k < beatOf('sell'));
	const batchText = $derived(
		beat?.id === 'sell'
			? `${fmt.num(T.batch.kiranas)} + ${fmt.num(T.batch.buyer)} sold`
			: k >= beatOf('risk')
				? `${fmt.num(T.batch.atRisk)} at risk`
				: `${fmt.num(T.batch.units)} packs`
	);

	/* ---------- the panel ---------- */
	let panel: HTMLElement | undefined = $state();
	$effect(() => {
		void sel?.kind;
		void sel?.id;
		if (sel && panel) panel.focus({ preventScroll: true });
	});
	const agentState = (a: (typeof T.agents)[number]) => ({ done: a.beat < k || done, now: a.beat === k && playing });
	const named = $derived(!!g && g.wide && (done || k < 0));
	const hint = $derived(
		g?.wide ? 'Drag to look round · click a place or an agent' : 'Swipe to look round · tap a place'
	);
	const said = (b: (typeof T.beats)[number]) => b.did;
	const center = (): [number, number] => [g!.W / 2, g!.H * (g!.wide ? 0.64 : 0.5)];
</script>

<svelte:window onkeydown={onkey} />

{#snippet chips(ids: string[])}<span class="town-panel-chips"
		>{#each ids as id (id)}{@const a = agentOf(id)}<button
				type="button"
				class={cx('town-chip', a.human && 'human', agentState(a).done && 'on')}
				onclick={() => open({ kind: 'agent', id })}
				><i><Icon name={a.icon as IconName} size={13} stroke={2.2} /></i>{a.name}</button
			>{/each}</span
	>{/snippet}

<div class={cx('hero-scene town-stage', gl && 'is-gl', ready && 'ready')} bind:this={stage}>
	<!-- the plate at rest, as the server sends it: the first paint, under the stage's own drawing -->
	<Plate picture="town-pre" plate={PLATES.town} width={GEO.nw} height={GEO.nh} alt="" />
	{#if gl && app.mounted}<canvas class="town-gl" bind:this={glCanvas} aria-hidden="true"></canvas>{/if}
	<div
		class="town-world"
		bind:this={plateWorld}
		style:left={g ? `${g.ox}px` : undefined}
		style:top={g ? `${g.oy}px` : undefined}
		style:width={g ? `${g.w}px` : undefined}
		style:height={g ? `${g.h}px` : undefined}
		style:visibility={g ? undefined : 'hidden'}
	>
		{#if !gl && app.mounted}<img
				src={dark ? PLATES.town.night : PLATES.town.day}
				width={GEO.nw}
				height={GEO.nh}
				draggable="false"
				onload={() => (ready = true)}
				alt=""
			/>{/if}
	</div>
	{#if !gl && g?.wide}<div class="town-haze" bind:this={hazeEl} aria-hidden="true"></div>{/if}
	{#if app.mounted}<canvas class="town-graph" bind:this={graphCanvas} aria-hidden="true"></canvas>{/if}
	<div
		class="town-world town-top"
		bind:this={topWorld}
		style:left={g ? `${g.ox}px` : undefined}
		style:top={g ? `${g.oy}px` : undefined}
		style:width={g ? `${g.w}px` : undefined}
		style:height={g ? `${g.h}px` : undefined}
		style:visibility={g ? undefined : 'hidden'}
	>
		{#if g}
			{#each T.places as p (p.id)}{@const at = wpx(g, placeAt(g, p.id))}{@const here =
					!!beat && beat.at.includes(p.id)}{@const isOpen = sel?.kind === 'place' && sel.id === p.id}<span
					class="town-shift"
					data-at={JSON.stringify(placeAt(g, p.id))}
					><span class="town-at" style:left="{at[0]}px" style:top="{at[1]}px"
						><button
							type="button"
							class={cx('town-pin', here && 'here', isOpen && 'open')}
							aria-expanded={isOpen}
							aria-controls={isOpen ? 'town-panel' : undefined}
							aria-label="{p.t}: what happens here"
							onclick={() => open({ kind: 'place', id: p.id })}
							onpointerenter={() => (hov = { kind: 'place', id: p.id })}
							onpointerleave={() => (hov = null)}
							><span class="town-pin-body"
								><i><Icon name={p.icon as IconName} size={14} stroke={2} /></i><b>{g.wide ? p.t : p.short}</b></span
							><span class="town-pin-stem"></span></button
						></span
					></span
				>{/each}
			{#each T.agents as a (a.id)}{@const at = wpx(g, GEO.posts[a.id])}{@const st = agentState(a)}{@const isOpen =
					sel?.kind === 'agent' && sel.id === a.id}{@const show =
					(named && (!focus || focus.has(a.id))) || isOpen || (st.now && (g.wide || a.human))}<span
					class="town-shift"
					data-at={JSON.stringify(GEO.posts[a.id])}
					><span class="town-at" style:left="{at[0]}px" style:top="{at[1]}px"
						><button
							type="button"
							tabindex="-1"
							aria-hidden="true"
							class={cx(
								'town-node',
								'side-' + (GEO.labels[a.id] ?? 'right'),
								a.human && 'human',
								st.done && 'on',
								st.now && 'now',
								!st.done && !st.now && k >= 0 && 'later',
								isOpen && 'open',
								show && 'named'
							)}
							onclick={() => open({ kind: 'agent', id: a.id })}
							onpointerenter={() => (hov = { kind: 'agent', id: a.id })}
							onpointerleave={() => (hov = null)}
							><span class={cx('town-node-dot', st.now && 'aura')}
								><Icon name={a.icon as IconName} size={14} stroke={2.1} /></span
							><span class="town-node-name">{a.name}</span></button
						></span
					></span
				>{/each}
			{#if batchAt}<span class="town-at town-batch" bind:this={batchEl} aria-hidden="true"
					><span class={cx('town-batch-card', risk && 'risk')}
						><i><Icon name="package" size={14} stroke={2} /></i><b>{batchText}</b></span
					></span
				>{/if}
		{/if}
	</div>
	<p class="sr-only">
		{dark
			? "The whole business as a miniature town at night: the snack maker's factory and office, the distributor's godown, a lane of kirana shops, a highway to a buyer's warehouse, a food bank, and a fenced landfill, dark."
			: "The whole business as a miniature town in the morning: on the left the snack maker's factory and office, in the middle the distributor's godown full of cartons, on the right a lane of kirana shops hung with snack packets; behind them a highway to a buyer's warehouse in the next town, a food bank, and a fenced landfill, empty."}
	</p>
</div>
<!-- the journey, for a screen reader: the town is hidden from it; each step taken by hand is read out -->
<ol class="sr-only" aria-label="One batch's journey through the business">
	{#each T.beats as b (b.id)}<li>{b.t}{b.who.length ? `, ${names(b.who)}` : ''}: {said(b)}.</li>{/each}
</ol>
<p class="sr-only">Sold, not binned: {T.result}.</p>
<p class="sr-only" aria-live="polite">
	{manual ? (beat ? `${k + 1} of ${NB}, ${beat.t}: ${said(beat)}.` : `Sold, not binned: ${T.result}.`) : ''}
</p>
<!-- what the batch is doing, with the steps that walk it by hand -->
<div class={cx('town-caption', beat?.human && 'human')}>
	<button type="button" class="town-step" aria-label="The step before" disabled={k <= 0} onclick={() => step(-1)}
		><Icon name="chevron-left" size={16} stroke={2} /></button
	>
	<span class="town-caption-text" aria-hidden="true"
		>{#if k < 0}<b>{fmt.num(T.batch.units)} packs leave the factory.</b><span>Follow them through the business.</span
			>{:else if beat}<span class="n">{k + 1} of {NB}</span><b>{beat.t}</b>{#if beat.who.length}<span class="who"
					>{names(beat.who)}</span
				>{/if}<span class="did"
				>{beat.id === 'report'
					? `${fmt.inr(money)} recovered · ${fmt.num(T.batch.kg)} kg kept out of landfill`
					: beat.did}</span
			>{:else}<span class="n">{NB} of {NB}</span><b>Sold, not binned.</b><span class="did">{T.result}</span
			>{#if !sel && app.mounted}<span class="hint">{hint}</span>{/if}{/if}</span
	>
	<button type="button" class="town-step" aria-label="The next step" disabled={done} onclick={() => step(1)}
		><Icon name="chevron-right" size={16} stroke={2} /></button
	>
</div>
<!-- a place or an agent, opened -->
{#if sel}{@const s = sel}
	<div
		id="town-panel"
		class="town-panel"
		role="region"
		aria-labelledby="town-panel-h"
		tabindex="-1"
		bind:this={panel}
		in:fly={{ y: 8, duration: motionMs(240), easing: ease }}
	>
		{#if s.kind === 'place'}{@const p = placeOf(s.id)}{@const team = T.agents
				.filter((a) => a.at === p.id)
				.map((a) => a.id)}
			<header>
				<i><Icon name={p.icon as IconName} size={16} stroke={2} /></i>
				<h3 id="town-panel-h">{p.t}</h3>
			</header>
			<p>{p.line}</p>
			{#if team.length}<span class="town-panel-k">Who works here</span>{@render chips(team)}{:else}<span
					class="town-panel-k">The Valuer prices it on every plan</span
				>{/if}
		{:else}{@const a = agentOf(s.id)}{@const from = T.edges.filter((e) => e[1] === a.id).map((e) => e[0])}{@const to =
				T.edges.filter((e) => e[0] === a.id).map((e) => e[1])}
			<header>
				<i class={cx(a.human && 'human')}><Icon name={a.icon as IconName} size={16} stroke={2} /></i>
				<h3 id="town-panel-h">{a.name}</h3>
				<button type="button" class="town-panel-at" onclick={() => open({ kind: 'place', id: a.at })}
					>at the {placeOf(a.at).short.toLowerCase()}</button
				>
			</header>
			<p>{a.job}.</p>
			<p class="town-panel-did"><span class="town-panel-k">This batch</span>{a.did}</p>
			{#if from.length || to.length}<div class="town-panel-flow">
					{#if from.length}<span><span class="town-panel-k">From</span>{@render chips(from)}</span>{/if}
					{#if to.length}<span><span class="town-panel-k">Hands to</span>{@render chips(to)}</span>{/if}
				</div>{/if}
		{/if}
		<button type="button" class="town-panel-x" aria-label="Close" onclick={() => (sel = null)}
			><Icon name="x" size={16} stroke={2} /></button
		>
	</div>{/if}
<!-- Replay, and the zoom; drawn once the page is live -->
{#if g && app.mounted}<div class="town-ctl">
		{#if !reduce}<button type="button" class="replay" onclick={replay}
				><Icon name="rotate-ccw" size={16} stroke={2} />Replay</button
			>{/if}
		<span class="town-zoom" role="group" aria-label="Zoom">
			<button
				type="button"
				aria-label="Zoom out"
				disabled={zoom <= 1}
				onclick={() => camera.zoomAt(1 / 1.45, ...center(), true)}><Icon name="minus" size={16} stroke={2} /></button
			><button
				type="button"
				aria-label="Zoom in"
				disabled={zoom >= ZMAX}
				onclick={() => camera.zoomAt(1.45, ...center(), true)}><Icon name="plus" size={16} stroke={2} /></button
			><button type="button" aria-label="The whole business" disabled={zoom <= 1} onclick={whole}
				><Icon name="minimize-2" size={16} stroke={2} /></button
			>
		</span>
	</div>{/if}
