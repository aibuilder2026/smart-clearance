import { cubicBezier, springCurve, type SpringOptions } from './index';

type Frame = Record<string, string | number>;

/** Keyframes for a Web Animation that follows a spring (so the overshoot of a bouncy spring is kept) from `from` to
 *  `to`: `style(v)` turns the spring's value (0 → 1, and past 1 where it overshoots) into a keyframe. */
export function springFrames(o: SpringOptions, style: (v: number) => Frame, steps = 30) {
	const curve = springCurve(o);
	return {
		frames: Array.from({ length: steps + 1 }, (_, k) => style(curve.easing(k / steps))),
		duration: curve.duration
	};
}

/** the same for a timed curve (cubic-bezier) */
export function curveFrames(bezier: [number, number, number, number], style: (v: number) => Frame, steps = 30) {
	const e = cubicBezier(...bezier);
	return Array.from({ length: steps + 1 }, (_, k) => style(e(k / steps)));
}
