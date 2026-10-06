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
	import { fade, fly, scale } from 'svelte/transition';
	import type { Figures } from './figures';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';
	import { Camera, ZMAX, type Focus } from './town/camera';
	import { DepthRenderer, loadDepthMap, shifted, type DepthMap } from './town/depth';
	import { GEO, along, fitOf, placeAt, shotOf, wpx, type Fit, type Pt, type Shot } from './town/geo';
	import { gestures } from './town/gestures';
	import { Graph } from './town/graph';

	// The whole business as one miniature town (design3/site/town.jsx, SC-32): the maker's factory and office, the
	// distributor's godown, the kirana lane, a buyer in the next town, a food bank and the landfill. Every agent works
	// at a post in the town, and the handoffs between them are the agent graph. The batch tours it once (SC-34), the
	// camera framing each beat's agents (SC-42): a stop for each agent in the order they work, its card opening beside its
	// pin, about 17 s, with Pause and Play (WCAG 2.2.2). Then the town is the visitor's: drag or swipe to look round, pinch or Ctrl-scroll to zoom,
	// double-click to go nearer, and open a place or an agent for what it did; taking the camera pauses the tour, and
	// leaving the hero brings the whole town back. Drawn in WebGL2 from the plate and its depth map, so it parallaxes as
	// the camera travels, tilts under the pointer and keeps its focus on what the camera looks at; without WebGL2 the
	// plate is drawn flat. Under reduced motion the batch is at its result from the start and the camera jumps. The
	// server sends the plate at rest; the rest is drawn in the browser.
	let { f }: { f: Figures } = $props();
	const app = useApp();
	const theme = useTheme();
	const T = $derived(f.town);
	const NB = $derived(T.beats.length);
	const NS = $derived(T.stops.length);
	const agentOf = (id: string) => T.agents.find((a) => a.id === id)!;
	const placeOf = (id: string) => T.places.find((p) => p.id === id)!;
	const beatOf = (id: string) => T.beats.findIndex((b) => b.id === id);
	const names = (who: string[]) => who.map((w) => agentOf(w).name).join(' · ');
	const dark = $derived(app.mounted && theme.resolved === 'dark');
	// the page's loader, told what the town has done on the next frame, once it is drawn
	const loaderSays = (say: (L: NonNullable<Window['SC3_LOADER']>) => void) => {
		const L = window.SC3_LOADER;
		if (L) requestAnimationFrame(() => say(L));
	};
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
			// ready once the plate and its depth are in; the page's loader hears of each plate drawn (SC-35)
			r = new DepthRenderer(c, camera, () => {
				ready = true;
				loaderSays((L) => L.plateDrawn(dark));
			});
		} catch {
			gl = false;
			return;
		}
		renderer = r;
		loadDepthMap(PLATES.townDepth.day).then(
			(m) => {
				map = m;
				r.setDepth(m);
				loaderSays((L) => L.depthIn());
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
	// s: -1 before it sets off, 0 to NS - 1 at a stop, NS when it is done; k is the stop's beat (-1 before, NB after). It
	// sets off half a second after the town has loaded, so it never plays over an empty frame. It holds while paused, and
	// while the hero is out of view (it carries on when it is back); stepping by hand stops the clock, and Play restarts
	// it from where it is.
	let s = $state(-1);
	let run = $state(0);
	// the tour sets off once the page's loader has lifted (SC-35), so its first stop is never spent under it
	let lifted = $state(true);
	$effect(() => {
		const L = window.SC3_LOADER;
		if (!L || L.lifted) return;
		lifted = false;
		const up = () => (lifted = true);
		window.addEventListener('sc3:loader-lifted', up);
		return () => window.removeEventListener('sc3:loader-lifted', up);
	});
	let manual = $state(false);
	let paused = $state(false);
	let inView = $state(true);
	// what the visitor is looking at (SC-42): the card beside it, the ring while the look dwells, the zoom, whether a
	// click has kept it; the tour holds meanwhile
	type Sel = { kind: 'place' | 'agent'; id: string };
	let peek = $state<{ s: Sel; ring: boolean; zoomed: boolean; pinned: boolean } | null>(null);
	const stop = $derived(s >= 0 && s < NS ? T.stops[s] : null);
	const k = $derived(s < 0 ? -1 : stop ? stop.beat : NB);
	const held = $derived(paused || manual || !inView || !!peek);
	const playing = $derived(s < NS && !manual && !paused);
	const touring = $derived(!!stop && !manual);
	const done = $derived(s >= NS);
	const beat = $derived(stop ? T.beats[stop.beat] : null);
	const agentNow = $derived(stop ? stop.agent : null);
	$effect(() => {
		void run;
		if (reduce) {
			s = NS;
			return;
		}
		if (!ready || !lifted) return;
		s = -1;
		paused = false;
		const t = setTimeout(() => (s = 0), 500);
		return () => clearTimeout(t);
	});
	$effect(() => {
		if (reduce || held || s < 0 || s >= NS) return;
		const t = setTimeout(() => (s += 1), T.stops[s].ms);
		return () => clearTimeout(t);
	});
	const step = (d: number) => {
		manual = true;
		paused = false;
		s = Math.min(NS, Math.max(0, (s < 0 ? 0 : s) + d));
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

	/* ---------- the camera: the tour's until the visitor takes it ---------- */
	let following = $state(true);
	let sel = $state<{ kind: 'place' | 'agent'; id: string } | null>(null);
	let hov = $state<{ kind: 'place' | 'agent'; id: string } | null>(null);
	// The tour frames each beat (SC-42): while it has the camera, the camera takes in the beat's agents together (or, for
	// a beat without agents, its place) in the clear part of the stage, under the heading's buttons and over the caption,
	// with room for a card above them, up to 1.7× near (1.5× on phones and tablets). It moves once a beat and rests while
	// the beat's agents take their turns; before the tour, after it, and when Play or Replay hands the camera back, it
	// rests on the whole town.
	const frame = (G: Fit, pts: Pt[], zmax: number): Shot => {
		const R = room(),
			[ax, ay] = G.wide ? [0.5, 0.64] : [0.5, 0.5],
			padX = G.wide ? 190 : 80,
			padT = G.wide ? 120 : 104,
			padB = 40,
			rh = Math.max(80, R.bottom - R.top);
		const xs = pts.map((p) => p[0]),
			ys = pts.map((p) => p[1]),
			x0 = Math.min(...xs),
			x1 = Math.max(...xs),
			y0 = Math.min(...ys),
			y1 = Math.max(...ys);
		const z = Math.min(
			ZMAX,
			Math.max(1, Math.min(G.W / ((x1 - x0) * G.w + 2 * padX), rh / ((y1 - y0) * G.h + padT + padB), zmax))
		);
		const cx = (x0 + x1) / 2,
			cy = (y0 + y1) / 2 - (padT - padB) / 2 / (G.h * z);
		// the group's middle at the middle of the clear part: the plate point the camera holds at its anchor
		return [cx + (ax * G.W - G.W / 2) / (G.w * z), cy + (ay * G.H - (R.top + R.bottom) / 2) / (G.h * z), z];
	};
	const framed = $derived(g && !done && s >= 0 && stop ? stop.beat : -1);
	$effect(() => {
		const G = g,
			b = framed;
		void run;
		if (!G || !following) return;
		if (b < 0) return camera.to(shotOf(G, 'rest'), untrack(() => s) < 0 ? 0 : 0.9);
		const B = T.beats[b];
		camera.to(
			untrack(() =>
				frame(G, B.who.length ? B.who.map((w) => GEO.posts[w]) : B.at.map((id) => placeAt(G, id)), G.wide ? 1.7 : 1.5)
			),
			0.9
		);
	});
	// the visitor takes the camera (a drag, a pinch, a zoom, a card opened): the tour holds until they press Play
	const take = () => {
		following = false;
		if (!done && playing) paused = true;
	};
	$effect(() => {
		const el = stage;
		if (!el || !app.mounted) return;
		return gestures(el, camera, take);
	});
	// Looking (SC-42), on desktops: pointing at a place or an agent, or focusing a place, opens its card at once and
	// lights its handoffs; after DWELL ms the town zooms in about it, so it stays under the pointer. Looking away (the
	// pointer off the node and its card for 250 ms, or focus moving on) closes the card and puts the camera back where
	// it was. A click keeps the card; Escape, its close button, or leaving the hero closes it. The tour holds while the
	// visitor looks, and carries on after.
	const DWELL = 600,
		PEEK_Z = 1.8;
	const same = (a: Sel | null | undefined, b: Sel | null | undefined) =>
		!!a && !!b && a.kind === b.kind && a.id === b.id;
	const timers: { dwell?: ReturnType<typeof setTimeout>; leave?: ReturnType<typeof setTimeout>; before: Focus | null } =
		{
			before: null
		};
	const posOf = (G: Fit, sl: Sel): Pt => (sl.kind === 'place' ? placeAt(G, sl.id) : GEO.posts[sl.id]);
	const outOfView = (G: Fit, p: [number, number]) => {
		const R = room();
		return p[0] < 80 || p[0] > G.W - 80 || p[1] < R.top + 40 || p[1] > R.bottom - 40;
	};
	const zoomOn = (sl: Sel) => {
		const G = g;
		if (!G || !peek || !same(peek.s, sl)) return;
		const p = project ? project(posOf(G, sl), sl.id) : camera.toStage(posOf(G, sl)),
			z = camera.t().z;
		if (!timers.before) timers.before = { ...camera.get() };
		if (z < PEEK_Z - 0.05) camera.zoomAt(PEEK_Z / z, p[0], p[1], true);
		else if (outOfView(G, p)) camera.to([posOf(G, sl)[0], posOf(G, sl)[1], z], reduce ? 0 : 0.6); // a chip named something out of view: bring it in
		if (peek && same(peek.s, sl)) peek = { ...peek, ring: false, zoomed: true };
	};
	const unlook = (force: boolean) => {
		clearTimeout(timers.dwell);
		clearTimeout(timers.leave);
		if (!peek || (peek.pinned && !force)) return;
		peek = null;
		hov = null;
		if (timers.before) {
			const b = timers.before;
			timers.before = null;
			camera.to([b.x, b.y, b.z], reduce ? 0 : 0.6);
		}
	};
	const look = (sl: Sel | null, to?: EventTarget | null) => {
		if (!sl) {
			clearTimeout(timers.dwell);
			// focus moving into the kept card is still looking
			if (to instanceof Element && to.closest('.town-peek')) return;
			clearTimeout(timers.leave);
			timers.leave = setTimeout(() => unlook(false), 250);
			return;
		}
		hov = sl;
		clearTimeout(timers.leave);
		if (!g?.wide || sel || peek?.pinned) return;
		if (!peek || !same(peek.s, sl)) peek = { s: sl, ring: !reduce, zoomed: !!peek?.zoomed, pinned: false };
		clearTimeout(timers.dwell);
		timers.dwell = setTimeout(() => zoomOn(sl), DWELL);
	};
	const pinCard = (sl: Sel) => {
		clearTimeout(timers.leave);
		clearTimeout(timers.dwell);
		const was = peek;
		peek = { s: sl, ring: false, zoomed: true, pinned: true };
		if (!was?.zoomed || !same(was.s, sl)) setTimeout(() => zoomOn(sl), 0);
	};
	// in a kept card, its chips keep the card on what they name
	const keepOn = (sl: Sel) => pinCard(sl);
	const open = (sl: Sel, e?: MouseEvent) => {
		// a click on what the pointer is looking at keeps its card there; the keyboard (Enter) and touch open the panel
		if (g?.wide && e && e.detail > 0 && peek && (same(peek.s, sl) || peek.pinned)) return pinCard(sl);
		unlook(true);
		take();
		sel = sl;
		const place = sl.kind === 'place' ? sl.id : agentOf(sl.id).at,
			shot = shotOf(g, place);
		camera.to(
			sl.kind === 'agent' ? [GEO.posts[sl.id][0], GEO.posts[sl.id][1] + (g?.wide ? 0.06 : 0.04), shot[2]] : shot,
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
		paused = false;
		run += 1;
	};
	const play = () => {
		sel = null;
		following = true;
		manual = false;
		paused = false;
		if (s < 0) s = 0;
	};
	// Leaving the hero brings the town back to the whole business: the pointer leaves it (after a moment, in case it
	// only slipped out), focus moves out of it, a tap or click lands outside it, or it scrolls out of view. Any card the
	// visitor opened closes. A tour that is playing on its own keeps its camera, and holds while it is out of view.
	$effect(() => {
		const st = stage,
			hero = st?.closest<HTMLElement>('.hero');
		if (!st || !hero || !app.mounted) return;
		let t: ReturnType<typeof setTimeout> | undefined;
		const back = () => {
			clearTimeout(t);
			untrack(() => unlook(true));
			sel = null;
			hov = null;
			const G = untrack(() => g);
			if (G && !untrack(() => following && playing)) camera.to(shotOf(G, 'rest'), untrack(() => reduce) ? 0 : 0.7);
		};
		const enter = (e: PointerEvent) => {
			if (e.pointerType === 'mouse') clearTimeout(t);
		};
		const leave = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return;
			clearTimeout(t);
			t = setTimeout(back, 300);
		};
		const out = (e: FocusEvent) => {
			if (e.relatedTarget instanceof Node && !hero.contains(e.relatedTarget)) back();
		};
		const down = (e: PointerEvent) => {
			if (e.target instanceof Node && !hero.contains(e.target)) back();
		};
		hero.addEventListener('pointerenter', enter);
		hero.addEventListener('pointerleave', leave);
		hero.addEventListener('focusout', out);
		document.addEventListener('pointerdown', down, true);
		const io = new IntersectionObserver(
			([e]) => {
				const v = e.intersectionRatio >= 0.3;
				inView = v;
				if (!v) back();
			},
			{ threshold: [0, 0.3, 0.6] }
		);
		io.observe(st);
		return () => {
			clearTimeout(t);
			hero.removeEventListener('pointerenter', enter);
			hero.removeEventListener('pointerleave', leave);
			hero.removeEventListener('focusout', out);
			document.removeEventListener('pointerdown', down, true);
			io.disconnect();
		};
	});
	// Escape closes an open panel, wherever the focus is
	const onkey = (e: KeyboardEvent) => {
		if (e.key !== 'Escape') return;
		if (peek) unlook(true);
		else if (sel) sel = null;
	};
	// what the graph lifts: an agent, or a place's team, and its neighbours in the graph
	const focus = $derived.by(() => {
		const x = hov ?? sel;
		if (!x) return null;
		const core = x.kind === 'agent' ? [x.id] : T.agents.filter((a) => a.at === x.id).map((a) => a.id);
		const near = T.edges.flatMap(([a, b]) => (core.includes(a) ? [b] : core.includes(b) ? [a] : []));
		return new Set([...core, ...near]) as ReadonlySet<string>;
	});

	/* ---------- what stands on the town, kept clear of the heading and the controls ---------- */
	// Nothing on the town sits under the heading's text or buttons, the caption, the controls or a card, or half off
	// the stage; once the camera is nearer, nothing it carries into the haze either. The graph is clipped round the
	// heading's boxes.
	const boxes = (sels: string, pad: number, any = false): [number, number, number, number][] => {
		const st = stage,
			hero = st?.closest('.hero');
		if (!st || !hero || !g || (!g.wide && !any)) return [];
		const o = st.getBoundingClientRect();
		return [...hero.querySelectorAll(sels)].map((e) => {
			const r = e.getBoundingClientRect();
			return [r.left - o.left - pad, r.top - o.top - pad, r.right - o.left + pad, r.bottom - o.top + pad];
		});
	};
	const holes = () => boxes('.hero-h, .hero-sub, .hero-ctas > *', 8);
	// the clear part of the stage for a card: below the heading's buttons and above the caption
	const room = () => {
		const st = stage,
			hero = st?.closest('.hero');
		if (!st || !hero || !g) return { top: 8, bottom: 0 };
		const o = st.getBoundingClientRect();
		let top = 8;
		for (const e of hero.querySelectorAll('.hero-h, .hero-sub, .hero-ctas > *'))
			top = Math.max(top, e.getBoundingClientRect().bottom - o.top + 10);
		const cap = hero.querySelector('.town-caption'),
			bottom = Math.min(g.H - 8, cap ? cap.getBoundingClientRect().top - o.top - 10 : g.H - 8);
		return { top, bottom };
	};
	$effect(() => {
		const el = topWorld,
			st = stage,
			G = g;
		void s;
		void done;
		void sel;
		void hov;
		void following;
		void peek;
		if (!el || !st || !G) return;
		const check = () => {
			const o = st.getBoundingClientRect(),
				hs = holes().concat(
					boxes('.town-caption, .town-ctl > *, .town-panel', 6),
					boxes('.town-tip, .town-peek', 4, true)
				),
				near = G.wide && camera.t().z > 1.02,
				haze = GEO.haze[0] * G.H;
			for (const n of el.querySelectorAll<HTMLElement>('[data-at], .town-batch')) {
				const b = (n.querySelector('.town-pin-body, .town-node, .town-batch-card') ?? n).getBoundingClientRect();
				const x0 = b.left - o.left,
					y0 = b.top - o.top,
					x1 = b.right - o.left,
					y1 = b.bottom - o.top;
				const out = x1 < 4 || x0 > G.W - 4 || y1 < 4 || y0 > G.H - 4 || (b.width > 0 && (x0 < -6 || x1 > G.W + 6));
				// the agent at work, and whatever the visitor is looking at or has open, always stay
				const kept = !!n.querySelector('.town-node.now, .town-node.open, .town-pin.open');
				const under = !kept && hs.some((h) => x0 < h[2] && x1 > h[0] && y0 < h[3] && y1 > h[1]);
				n.classList.toggle('off', !kept && (out || under || (near && (y0 + y1) / 2 < haze)));
			}
		};
		check();
		const a = camera.listen(check),
			b = camera.listenView(check),
			t = setTimeout(check, 260);
		return () => {
			a();
			b();
			clearTimeout(t);
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
		const gr = new Graph(c, camera, T.agents, T.edges, NS);
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
		gr.state = { g, s, done, playing, touring, manual, reduce, dark, focus, project, holes };
		gr.draw();
	});
	// draw each handoff in as the tour reaches it; the packs run out as the sale's first agent starts work
	$effect(() => {
		void run;
		const gr = graph,
			sale = !!stop && T.beats[stop.beat].id === 'sell' && stop.agent === T.beats[stop.beat].who[0];
		void done;
		if (!gr || !gr.state) return;
		gr.state = { ...gr.state, s, done, reduce, ...untrack(() => ({ playing, touring, manual })) };
		gr.step(sale);
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
	const agentState = (a: (typeof T.agents)[number]) => ({ done: a.stop < s || done, now: a.stop === s && !done });
	// The tour's card, beside the agent at work, while the tour has the camera and no card of the visitor's is open: over
	// where the renderer shows the agent's post, in the clear part of the stage (SC-42): above its pin when it fits under
	// the heading's buttons, else below it above the caption, else where there is more room, on a stem to the pin. It names the agent, so the pin's own name stands down meanwhile.
	const tour = $derived(following && !sel && !peek && touring && agentNow ? agentNow : null);
	// The card beside what the visitor looks at: in the clear part of the stage, above the node if it fits there, else
	// below it, else beside it, on a stem to the node
	const placePeek = (sl: Sel) => (el: HTMLElement) => {
		const G = g,
			proj = project;
		if (!G) return;
		const pos = posOf(G, sl),
			lift = sl.kind === 'place' ? 54 : 24,
			drop = sl.kind === 'place' ? 12 : 24;
		const put = () => {
			const p = proj ? proj(pos, sl.id) : camera.toStage(pos),
				w = el.offsetWidth,
				h = el.offsetHeight,
				R = room();
			let x: number, y: number, side: string;
			if (p[1] - lift - h >= R.top) {
				side = 'above';
				y = p[1] - lift - h;
				x = Math.min(G.W - w - 8, Math.max(8, p[0] - w / 2));
			} else if (p[1] + drop + h <= R.bottom) {
				side = 'below';
				y = p[1] + drop;
				x = Math.min(G.W - w - 8, Math.max(8, p[0] - w / 2));
			} else {
				side = p[0] + 30 + w <= G.W - 8 ? 'right' : 'left';
				x = side === 'right' ? p[0] + 30 : p[0] - 30 - w;
				y = Math.min(Math.max(R.top, R.bottom - h), Math.max(R.top, p[1] - h / 2));
			}
			el.style.left = `${x.toFixed(1)}px`;
			el.style.top = `${y.toFixed(1)}px`;
			el.style.setProperty('--caret', `${Math.min(w - 14, Math.max(14, p[0] - x)).toFixed(1)}px`);
			el.style.setProperty('--caret-y', `${Math.min(h - 14, Math.max(14, p[1] - y)).toFixed(1)}px`);
			el.dataset.side = side;
		};
		put();
		const a = camera.listen(put),
			b = camera.listenView(put);
		return () => {
			a();
			b();
		};
	};
	const placeTip = (id: string) => (el: HTMLElement) => {
		const G = g,
			proj = project;
		if (!G) return;
		const put = () => {
			const p = proj ? proj(GEO.posts[id], id) : camera.toStage(GEO.posts[id]),
				w = el.offsetWidth,
				h = el.offsetHeight,
				R = room(),
				fitsUp = p[1] - 28 - h >= R.top,
				fitsDown = p[1] + 28 + h <= R.bottom,
				up = fitsUp || (!fitsDown && p[1] - R.top > R.bottom - p[1]),
				x = Math.min(G.W - w - 8, Math.max(8, p[0] - w / 2)),
				y = Math.min(Math.max(R.top, R.bottom - h), Math.max(R.top, up ? p[1] - 28 - h : p[1] + 28));
			el.style.left = `${x.toFixed(1)}px`;
			el.style.top = `${y.toFixed(1)}px`;
			el.style.setProperty('--caret', `${Math.min(w - 14, Math.max(14, p[0] - x)).toFixed(1)}px`);
			el.classList.toggle('below', !up);
		};
		put();
		const a = camera.listen(put),
			b = camera.listenView(put);
		return () => {
			a();
			b();
		};
	};
	const named = $derived(!!g && g.wide && (done || k < 0));
	const hint = $derived(
		g?.wide ? 'Point at a place or an agent · drag to look round' : 'Swipe to look round · tap a place'
	);
	const said = (b: (typeof T.beats)[number]) => b.did;
	const center = (): [number, number] => [g!.W / 2, g!.H * (g!.wide ? 0.64 : 0.5)];
</script>

<svelte:window onkeydown={onkey} />

{#snippet chips(ids: string[], live: boolean, pick: (x: Sel) => void)}<span class="town-panel-chips"
		>{#each ids as id (id)}{@const a = agentOf(id)}{#if live}<button
					type="button"
					class={cx('town-chip', a.human && 'human', agentState(a).done && 'on')}
					onclick={() => pick({ kind: 'agent', id })}
					><i><Icon name={a.icon as IconName} size={13} stroke={2.2} /></i>{a.name}</button
				>{:else}<span class={cx('town-chip', a.human && 'human', agentState(a).done && 'on')}
					><i><Icon name={a.icon as IconName} size={13} stroke={2.2} /></i>{a.name}</span
				>{/if}{/each}</span
	>{/snippet}
<!-- what a place or an agent is to this batch: the panel's body, and the card's beside its node (its chips are buttons
only where they can be used) -->
{#snippet cardBody(sl: Sel, live: boolean, pick: (x: Sel) => void)}
	{#if sl.kind === 'place'}{@const p = placeOf(sl.id)}{@const team = T.agents
			.filter((a) => a.at === p.id)
			.map((a) => a.id)}
		<header>
			<i><Icon name={p.icon as IconName} size={16} stroke={2} /></i>
			<h3 id="town-panel-h">{p.t}</h3>
		</header>
		<p>{p.line}</p>
		{#if team.length}<span class="town-panel-k">Who works here</span>{@render chips(team, live, pick)}{:else}<span
				class="town-panel-k">The Valuer prices it on every plan</span
			>{/if}
	{:else}{@const a = agentOf(sl.id)}{@const from = T.edges.filter((e) => e[1] === a.id).map((e) => e[0])}{@const to =
			T.edges.filter((e) => e[0] === a.id).map((e) => e[1])}
		<header>
			<i class={cx(a.human && 'human')}><Icon name={a.icon as IconName} size={16} stroke={2} /></i>
			<h3 id="town-panel-h">{a.name}</h3>
			{#if live}<button type="button" class="town-panel-at" onclick={() => pick({ kind: 'place', id: a.at })}
					>at the {placeOf(a.at).short.toLowerCase()}</button
				>{:else}<span class="town-panel-at plain">at the {placeOf(a.at).short.toLowerCase()}</span>{/if}
		</header>
		<p>{a.job}.</p>
		<p class="town-panel-did"><span class="town-panel-k">This batch</span>{a.did}</p>
		{#if from.length || to.length}<div class="town-panel-flow">
				{#if from.length}<span><span class="town-panel-k">From</span>{@render chips(from, live, pick)}</span>{/if}
				{#if to.length}<span><span class="town-panel-k">Hands to</span>{@render chips(to, live, pick)}</span>{/if}
			</div>{/if}
	{/if}
{/snippet}

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
				onload={() => {
					ready = true;
					loaderSays((L) => L.plateDrawn(dark));
				}}
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
					!!beat && beat.at.includes(p.id)}{@const me = { kind: 'place' as const, id: p.id }}{@const looked = same(
					peek?.s,
					me
				)}{@const isOpen = (sel?.kind === 'place' && sel.id === p.id) || looked}<span
					class="town-shift"
					data-at={JSON.stringify(placeAt(g, p.id))}
					><span class="town-at" style:left="{at[0]}px" style:top="{at[1]}px"
						><button
							type="button"
							class={cx('town-pin', here && 'here', isOpen && 'open', looked && peek?.ring && 'ring')}
							aria-expanded={sel?.kind === 'place' && sel.id === p.id}
							aria-controls={sel?.kind === 'place' && sel.id === p.id ? 'town-panel' : undefined}
							aria-describedby={looked && !peek?.pinned ? 'town-peek' : undefined}
							aria-label="{p.t}: what happens here"
							onclick={(e) => open(me, e)}
							onpointerenter={(e) => e.pointerType === 'mouse' && look(me)}
							onpointerleave={(e) => e.pointerType === 'mouse' && look(null)}
							onfocus={(e) => e.currentTarget.matches(':focus-visible') && look(me)}
							onblur={(e) => look(null, e.relatedTarget)}
							><span class="town-pin-body"
								><i><Icon name={p.icon as IconName} size={14} stroke={2} /></i><b>{g.wide ? p.t : p.short}</b></span
							><span class="town-pin-stem"></span></button
						></span
					></span
				>{/each}
			{#each T.agents as a (a.id)}{@const at = wpx(g, GEO.posts[a.id])}{@const st = agentState(a)}{@const me = {
					kind: 'agent' as const,
					id: a.id
				}}{@const looked = same(peek?.s, me)}{@const isOpen =
					(sel?.kind === 'agent' && sel.id === a.id) || looked}{@const show =
					tour !== a.id && ((named && (!focus || focus.has(a.id))) || isOpen || (st.now && (g.wide || a.human)))}<span
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
								show && 'named',
								looked && peek?.ring && 'ring'
							)}
							onclick={(e) => open(me, e)}
							onpointerenter={(e) => e.pointerType === 'mouse' && look(me)}
							onpointerleave={(e) => e.pointerType === 'mouse' && look(null)}
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
	{#if tour}{@const a = agentOf(tour)}{#key tour}<div
				class={cx('town-tip', a.human && 'human')}
				aria-hidden="true"
				{@attach placeTip(tour)}
				in:scale={{ start: 0.94, duration: motionMs(220), easing: ease }}
				out:fade={{ duration: motionMs(140) }}
			>
				<header>
					<i><Icon name={a.icon as IconName} size={13} stroke={2.2} /></i><b>{a.name}</b><span
						>at the {placeOf(a.at).short.toLowerCase()}</span
					>
				</header>
				<p>{a.did}</p>
				{#if !reduce}<span
						class="town-tip-time"
						style:animation-duration="{stop?.ms ?? 0}ms"
						style:animation-play-state={held ? 'paused' : 'running'}
					></span>{/if}
			</div>{/key}{/if}
	{#if peek && g?.wide}{@const pk = peek}{@const human =
			pk.s.kind === 'agent' && agentOf(pk.s.id).human}{#key `${pk.s.kind}${pk.s.id}${pk.pinned}`}<div
				id="town-peek"
				class={cx('town-peek', human && 'human', pk.pinned && 'kept')}
				role={pk.pinned ? 'region' : 'tooltip'}
				aria-labelledby={pk.pinned ? 'town-panel-h' : undefined}
				{@attach placePeek(pk.s)}
				onpointerenter={() => clearTimeout(timers.leave)}
				onpointerleave={() => {
					if (peek && !peek.pinned) {
						clearTimeout(timers.leave);
						timers.leave = setTimeout(() => unlook(false), 250);
					}
				}}
				in:scale={{ start: 0.96, duration: motionMs(200), easing: ease }}
				out:fade={{ duration: motionMs(120) }}
			>
				{@render cardBody(pk.s, pk.pinned, keepOn)}
				{#if pk.pinned}<button type="button" class="town-panel-x" aria-label="Close" onclick={() => unlook(true)}
						><Icon name="x" size={16} stroke={2} /></button
					>{/if}
			</div>{/key}{/if}
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
	{manual
		? beat
			? `${k + 1} of ${NB}, ${beat.t}${agentNow ? `, ${agentOf(agentNow).name}: ${agentOf(agentNow).did}` : `: ${said(beat)}`}.`
			: `Sold, not binned: ${T.result}.`
		: ''}
</p>
<!-- what the batch is doing, with the steps that walk it by hand -->
<div class={cx('town-caption', beat?.human && 'human')}>
	<button type="button" class="town-step" aria-label="The step before" disabled={s <= 0} onclick={() => step(-1)}
		><Icon name="chevron-left" size={16} stroke={2} /></button
	>
	<span class="town-caption-text" aria-hidden="true"
		>{#if s < 0}<b>{fmt.num(T.batch.units)} packs leave the factory.</b><span>Follow them through the business.</span
			>{:else if beat}<span class="n">{k + 1} of {NB}</span><b>{beat.t}</b>{#if beat.who.length}<span class="who"
					>{names(beat.who)}</span
				>{/if}<span class="did"
				>{beat.id === 'report'
					? `${fmt.inr(money)} recovered · ${fmt.num(T.batch.kg)} kg kept out of landfill`
					: beat.did}</span
			>{:else}<span class="n">{NB} of {NB}</span><b>Sold, not binned.</b><span class="did">{T.result}</span
			>{#if !sel && !peek && app.mounted}<span class="hint">{hint}</span>{/if}{/if}</span
	>
	<button type="button" class="town-step" aria-label="The next step" disabled={done} onclick={() => step(1)}
		><Icon name="chevron-right" size={16} stroke={2} /></button
	>
</div>
<!-- a place or an agent, opened -->
{#if sel}{@const sl = sel}
	<div
		id="town-panel"
		class="town-panel"
		role="region"
		aria-labelledby="town-panel-h"
		tabindex="-1"
		bind:this={panel}
		in:fly={{ y: 8, duration: motionMs(240), easing: ease }}
	>
		{@render cardBody(sl, true, (x) => open(x))}
		<button type="button" class="town-panel-x" aria-label="Close" onclick={() => (sel = null)}
			><Icon name="x" size={16} stroke={2} /></button
		>
	</div>{/if}
<!-- Pause while the tour plays, Play while it is held (paused, stepped by hand, or handed to the visitor), Replay once it
is done, none under reduced motion: one button, so focus stays on it as it changes; and the zoom. Drawn once the page is
live -->
{#if g && app.mounted}<div class="town-ctl">
		{#if !reduce}<button type="button" class="replay" onclick={done ? replay : playing ? () => (paused = true) : play}
				><Icon name={done ? 'rotate-ccw' : playing ? 'pause' : 'play'} size={16} stroke={2} />{done
					? 'Replay'
					: playing
						? 'Pause'
						: 'Play'}</button
			>{/if}
		<span class="town-zoom" role="group" aria-label="Zoom">
			<button
				type="button"
				aria-label="Zoom out"
				disabled={zoom <= 1}
				onclick={() => {
					take();
					camera.zoomAt(1 / 1.45, ...center(), true);
				}}><Icon name="minus" size={16} stroke={2} /></button
			><button
				type="button"
				aria-label="Zoom in"
				disabled={zoom >= ZMAX}
				onclick={() => {
					take();
					camera.zoomAt(1.45, ...center(), true);
				}}><Icon name="plus" size={16} stroke={2} /></button
			><button type="button" aria-label="The whole business" disabled={zoom <= 1} onclick={whole}
				><Icon name="minimize-2" size={16} stroke={2} /></button
			>
		</span>
	</div>{/if}
