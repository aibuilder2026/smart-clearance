// The town's camera (design3/site/town.jsx useCamera). It looks at a plate point, held at the stage's anchor, from a
// zoom of 1 (the whole town) up to ZMAX, clamped so the town always fills the stage. It writes the worlds' transform
// itself, frame by frame, and tells whoever listens (the graph, the depth renderer, the pins' placement); the component
// hears only when the zoom passes a step.
import { animate } from 'motion';
import { clamp, type Fit, type Shot } from './geo';

export const ZMAX = 2.6;
export type View = { tx: number; ty: number; z: number };
export type Focus = { x: number; y: number; z: number };
const FLY: [number, number, number, number] = [0.65, 0, 0.35, 1];

export class Camera {
	g: Fit | null = null;
	reduce = false;
	private cam: Focus = { x: 0.5, y: 0.5, z: 1 };
	private live: View | null = null;
	private fly: { stop(): void } | null = null;
	private subs = new Set<(t: View) => void>();
	private views = new Set<() => void>();

	constructor(
		private worlds: () => HTMLElement[],
		private haze: () => HTMLElement | null,
		private onZoom: (step: number) => void
	) {}

	private anchor(G: Fit) {
		return G.wide ? [0.5, 0.64] : [0.5, 0.5];
	}
	private solve(c: Focus, G = this.g!): View {
		const z = clamp(c.z, 1, ZMAX),
			[ax, ay] = this.anchor(G);
		return {
			tx: clamp(ax * G.W - G.ox - c.x * G.w * z, G.W - G.ox - G.w * z, -G.ox),
			ty: clamp(ay * G.H - G.oy - c.y * G.h * z, G.H - G.oy - G.h * z, -G.oy),
			z
		};
	}
	// the focus a transform holds at the anchor, so a clamped camera never drifts
	private focusOf(t: View, G = this.g!): Focus {
		const [ax, ay] = this.anchor(G);
		return { x: (ax * G.W - G.ox - t.tx) / (G.w * t.z), y: (ay * G.H - G.oy - t.ty) / (G.h * t.z), z: t.z };
	}
	private write(c: Focus) {
		if (!this.g) return;
		const t = this.solve(c);
		this.cam = this.focusOf(t);
		this.live = t;
		for (const el of this.worlds()) {
			el.style.transform = `translate(${t.tx.toFixed(2)}px, ${t.ty.toFixed(2)}px) scale(${t.z.toFixed(4)})`;
			el.style.setProperty('--iz', (1 / t.z).toFixed(4));
		}
		const h = this.haze();
		if (h) h.style.opacity = clamp((t.z - 1) / 0.28, 0, 1).toFixed(3);
		this.subs.forEach((f) => f(t));
		this.onZoom(Math.round(t.z * 10) / 10);
	}
	stop() {
		this.fly?.stop();
		this.fly = null;
	}

	/** the stage was measured, or measured again: keep the framing */
	fit(g: Fit) {
		this.g = g;
		this.write(this.cam);
	}
	get(): Focus {
		return this.cam;
	}
	t(): View {
		return this.live ?? (this.g ? this.solve(this.cam) : { tx: 0, ty: 0, z: 1 });
	}
	/** fly to a shot ([x, y, z]); jumps under reduced motion */
	to(shot: Shot, dur = 0.7) {
		this.stop();
		const to = { x: shot[0], y: shot[1], z: shot[2] };
		if (this.reduce || dur <= 0) return this.write(to);
		const from = { ...this.cam },
			lz0 = Math.log(from.z),
			lz1 = Math.log(to.z);
		this.fly = animate(0, 1, {
			duration: dur,
			ease: FLY,
			onUpdate: (u) =>
				this.write({
					x: from.x + (to.x - from.x) * u,
					y: from.y + (to.y - from.y) * u,
					z: Math.exp(lz0 + (lz1 - lz0) * u)
				})
		});
	}
	/** move by a drag, in stage px, from a transform taken at its start */
	drag(t0: View, dx: number, dy: number) {
		this.stop();
		this.write(this.focusOf(this.solve(this.focusOf({ tx: t0.tx + dx, ty: t0.ty + dy, z: t0.z }))));
	}
	/** zoom by a factor about a stage point, which stays under the pointer */
	zoomAt(f: number, sx: number, sy: number, smooth: boolean) {
		const G = this.g;
		if (!G) return;
		const t = this.t(),
			z1 = clamp(t.z * f, 1, ZMAX);
		const px = (sx - G.ox - t.tx) / (G.w * t.z),
			py = (sy - G.oy - t.ty) / (G.h * t.z);
		const c1 = this.focusOf({ tx: sx - G.ox - px * G.w * z1, ty: sy - G.oy - py * G.h * z1, z: z1 });
		if (smooth) this.to([c1.x, c1.y, c1.z], 0.42);
		else {
			this.stop();
			this.write(c1);
		}
	}
	/** where a plate point would land on the stage under a shot, without moving the camera */
	at(shot: Shot, p: [number, number]): [number, number] {
		const G = this.g!,
			t = this.solve({ x: shot[0], y: shot[1], z: shot[2] });
		return [G.ox + t.tx + p[0] * G.w * t.z, G.oy + t.ty + p[1] * G.h * t.z];
	}
	/** a plate point on the stage, now */
	toStage(p: [number, number]): [number, number] {
		const G = this.g!,
			t = this.t();
		return [G.ox + t.tx + p[0] * G.w * t.z, G.oy + t.ty + p[1] * G.h * t.z];
	}
	listen(f: (t: View) => void) {
		this.subs.add(f);
		return () => void this.subs.delete(f);
	}
	/** the depth renderer's own changes (its tilt and focus), for what stands on the town */
	listenView(f: () => void) {
		this.views.add(f);
		return () => void this.views.delete(f);
	}
	viewChanged() {
		this.views.forEach((f) => f());
	}
}
