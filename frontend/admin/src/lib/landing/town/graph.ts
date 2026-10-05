// The agent graph, the packs and the route, drawn over the town (design3/site/town.jsx Graph). Each handoff draws in
// (320 ms) as the tour reaches its agent: a bow between the posts, up within a place, dipping between places as if it
// travelled the road; amber where the person is in it. It rests quiet, thin and faint; the handoff happening now, or
// those of what is hovered or open, stand out on a thin casing of the plate's light. As the sale's first agent starts
// work, the batch's packs run out to the kiranas (green) and up the highway to the buyer (violet), and settle.
import type { Camera } from './camera';
import { along, clamp, GEO, type Fit, type Pt } from './geo';

export type GraphAgent = { id: string; at: string; human: boolean; stop: number };
export type GraphState = {
	g: Fit;
	/** the tour's stop: -1 before it sets off, the number of stops once it is done */
	s: number;
	done: boolean;
	playing: boolean;
	/** at a stop, and not stepped by hand (playing or paused) */
	touring: boolean;
	manual: boolean;
	reduce: boolean;
	dark: boolean;
	focus: ReadonlySet<string> | null;
	/** where a plate point shows, once the depth renderer has shifted it (the camera's own place where it hasn't) */
	project: ((p: Pt, id?: string) => Pt) | null;
	/** the boxes the graph keeps out of (the heading's text and buttons), in stage px */
	holes: () => [number, number, number, number][];
};

function fit(cv: HTMLCanvasElement, W: number, H: number) {
	const dpr = Math.min(window.devicePixelRatio || 1, 2),
		w = Math.round(W),
		h = Math.round(H);
	if (cv.width !== w * dpr || cv.height !== h * dpr) {
		cv.width = w * dpr;
		cv.height = h * dpr;
		cv.style.width = w + 'px';
		cv.style.height = h + 'px';
	}
	const ctx = cv.getContext('2d')!;
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	return ctx;
}

export class Graph {
	state: GraphState | null = null;
	private prog: Record<string, number> = {};
	private raf = 0;
	private packs: { t0: number; dur: number; list: { to: string; delay: number }[] } | null = null;
	private agent: Record<string, GraphAgent>;

	constructor(
		private cv: HTMLCanvasElement,
		private cam: Camera,
		agents: GraphAgent[],
		private edges: [string, string][],
		private ns: number
	) {
		this.agent = Object.fromEntries(agents.map((a) => [a.id, a]));
	}

	draw = () => {
		const s = this.state,
			c = this.cv;
		if (!s) return;
		const ctx = fit(c, s.g.W, s.g.H);
		ctx.clearRect(0, 0, s.g.W, s.g.H);
		ctx.save();
		const hs = s.holes();
		if (hs.length) {
			ctx.beginPath();
			ctx.rect(0, 0, s.g.W, s.g.H);
			hs.forEach((h) => ctx.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]));
			ctx.clip('evenodd');
		}
		const at = (p: Pt, id?: string) => (s.project ? s.project(p, id) : this.cam.toStage(p));
		const lit = s.dark ? '#3ccb8a' : '#167a52',
			amber = s.dark ? '#f7c04a' : '#e8a722',
			casing = s.dark ? 'rgba(8,14,11,0.6)' : 'rgba(255,255,255,0.75)';
		for (const [a, b] of this.edges) {
			const p = this.prog[a + b] || 0;
			if (p <= 0) continue;
			const A = at(GEO.posts[a], a),
				B = at(GEO.posts[b], b),
				d = Math.hypot(B[0] - A[0], B[1] - A[1]),
				mx = (A[0] + B[0]) / 2;
			const far = this.agent[a].at !== this.agent[b].at;
			const my = (A[1] + B[1]) / 2 + (far ? Math.min(110, d * 0.2) : -Math.min(70, d * 0.22));
			const loud = s.focus ? s.focus.has(a) && s.focus.has(b) : this.agent[b].stop === s.s && !s.done;
			const hue = this.agent[a].human || this.agent[b].human ? amber : lit,
				n = 36,
				m = Math.max(1, Math.round(n * p));
			const path = () => {
				ctx.beginPath();
				ctx.moveTo(A[0], A[1]);
				for (let i = 1; i <= m; i++) {
					const t = i / n,
						u = 1 - t;
					ctx.lineTo(u * u * A[0] + 2 * u * t * mx + t * t * B[0], u * u * A[1] + 2 * u * t * my + t * t * B[1]);
				}
			};
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			if (loud) {
				path();
				ctx.lineWidth = 6;
				ctx.strokeStyle = casing;
				ctx.stroke();
				path();
				ctx.lineWidth = 3;
				ctx.strokeStyle = hue;
				ctx.stroke();
			} else {
				ctx.globalAlpha = s.focus ? 0.16 : 0.32;
				path();
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = hue;
				ctx.stroke();
				ctx.globalAlpha = 1;
			}
		}
		const pk = this.packs;
		if (pk) {
			const now = performance.now(),
				u = clamp((now - pk.t0) / pk.dur, 0, 1),
				z = this.cam.t().z;
			for (const dot of pk.list) {
				const t = clamp((u - dot.delay) / (1 - dot.delay), 0, 1);
				if (t <= 0) continue;
				const [x, y] = at(along(GEO.routes[dot.to], 1 - Math.pow(1 - t, 3)));
				ctx.globalAlpha = t >= 1 ? clamp(1 - (now - pk.t0 - pk.dur) / 400, 0, 1) : 1;
				ctx.beginPath();
				ctx.arc(x, y, 3.6 * Math.max(1, Math.sqrt(z)), 0, Math.PI * 2);
				ctx.fillStyle = dot.to === 'buyer' ? (s.dark ? '#8a6ee8' : '#7c5cd6') : lit;
				ctx.fill();
				ctx.lineWidth = 1.2;
				ctx.strokeStyle = s.dark ? 'rgba(10,16,13,0.8)' : '#ffffff';
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
			if (now - pk.t0 > pk.dur + 420) this.packs = null;
		}
		ctx.restore();
	};

	/** the tour moved: draw each handoff in as it is reached, and send the packs out as the sale starts */
	step(saleStarts: boolean) {
		const s = this.state;
		if (!s) return;
		const n = s.done ? this.ns : s.s,
			want: Record<string, number> = {};
		for (const [a, b] of this.edges) {
			const stop = this.agent[b].stop;
			want[a + b] = stop >= 0 && (stop < n || (stop === n && (s.touring || s.manual))) ? 1 : 0;
		}
		cancelAnimationFrame(this.raf);
		if (s.reduce) {
			this.prog = want;
			return this.draw();
		}
		if (saleStarts && s.playing) {
			const list = [];
			for (let i = 0; i < 26; i++) list.push({ to: i % 13 < 6 ? 'kiranas' : 'buyer', delay: (i / 26) * 0.45 });
			this.packs = { t0: performance.now(), dur: 900, list };
		}
		const t0 = performance.now(),
			from = { ...this.prog };
		const tick = () => {
			const u = clamp((performance.now() - t0) / 320, 0, 1);
			for (const key of Object.keys(want)) {
				const f = from[key] || 0;
				this.prog[key] = f + (want[key] - f) * (want[key] > f ? u : 1);
			}
			this.draw();
			if (u < 1 || this.packs) this.raf = requestAnimationFrame(tick);
		};
		this.raf = requestAnimationFrame(tick);
	}

	destroy() {
		cancelAnimationFrame(this.raf);
	}
}
