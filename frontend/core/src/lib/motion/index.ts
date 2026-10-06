import { spring } from 'motion';
import { prefersReducedMotion } from 'svelte/motion';

export { prefersReducedMotion };

export type SpringOptions = { stiffness: number; damping: number; mass?: number };

/** The springs the kit uses (kit.jsx), by what moves. Each is critically damped or close to it, so nothing bounces. */
export const SPRINGS = {
	sheet: { stiffness: 420, damping: 40, mass: 0.9 },
	segmented: { stiffness: 520, damping: 40 },
	tabs: { stiffness: 500, damping: 40 },
	alert: { stiffness: 500, damping: 36 },
	notice: { stiffness: 420, damping: 34 },
	/** the console (SC-49): Sign in's tick, the chart's today dot, and a batch's mark travelling between stops */
	tick: { stiffness: 520, damping: 22 },
	dot: { stiffness: 420, damping: 20 },
	token: { stiffness: 170, damping: 24, mass: 1 }
} as const satisfies Record<string, SpringOptions>;

/** --ease in tokens.css, as a function of time (cubic-bezier(0.22, 1, 0.36, 1)) */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** --t-fast, --t-base, --t-slow and --t-roll in tokens.css, plus the scrim's fade and the menu's pop */
export const DURATION = { fast: 160, base: 240, slow: 420, roll: 700, scrim: 200, menu: 160 } as const;

type Curve = { duration: number; easing: (t: number) => number; linear: string };
const cache = new Map<string, Curve>();

/** A spring as a duration (ms) and an easing over it, for Svelte transitions: the same curve framer-motion runs in the
 *  prototype, sampled from motion's spring generator. */
export function springCurve(o: SpringOptions): Curve {
	const key = `${o.stiffness}/${o.damping}/${o.mass ?? 1}`;
	let curve = cache.get(key);
	if (!curve) {
		const gen = spring({ keyframes: [0, 1], stiffness: o.stiffness, damping: o.damping, mass: o.mass ?? 1 });
		let duration = 0;
		while (!gen.next(duration).done && duration < 4000) duration += 10;
		const d = duration;
		const easing = (t: number) => (t >= 1 ? 1 : gen.next(t * d).value);
		// the same curve as a CSS easing, for transitions the browser runs itself
		const points = Array.from({ length: 21 }, (_, i) => +easing(i / 20).toFixed(4));
		curve = { duration: d, easing, linear: `linear(${points.join(', ')})` };
		cache.set(key, curve);
	}
	return curve;
}

/** cubic-bezier easing, for the design's --ease */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
	const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1;
	const b = (p1: number, p2: number) => 3 * p2 - 6 * p1;
	const c = (p1: number) => 3 * p1;
	const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
	const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
	return (x: number) => {
		if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1;
		let t = x;
		for (let i = 0; i < 8; i++) {
			const s = slope(t, x1, x2);
			if (Math.abs(s) < 1e-6) break;
			t -= (at(t, x1, x2) - x) / s;
		}
		return at(t, y1, y2);
	};
}

export const ease = cubicBezier(...EASE);

/** 0 when the reader asks for reduced motion: Web Animations (and so Svelte transitions) ignore base.css's kill switch */
export const motionMs = (ms: number) => (prefersReducedMotion.current ? 0 : ms);
