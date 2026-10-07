import { ease, motionMs } from './index';

type Rise = { y?: number; scale?: number; delay?: number; duration?: number; opacity?: number };

/** The screens' entrance (framer-motion's `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` in the
 *  prototype): fades in as it rises (or drops, with a negative y) into place on the design's ease. A scale below 1 grows
 *  it too. Reduced motion lands it at once. */
export function rise(_node: Element, { y = 8, scale = 1, delay = 0, duration = 320, opacity = 0 }: Rise = {}) {
	return {
		delay: motionMs(delay),
		duration: motionMs(duration),
		easing: ease,
		css: (t: number) =>
			`opacity: ${opacity + (1 - opacity) * t}; transform: translateY(${y * (1 - t)}px)${scale === 1 ? '' : ` scale(${scale + (1 - scale) * t})`}`
	};
}

/** a plain fade, for a flash or a scrim of its own */
export function fade(_node: Element, { duration = 120, delay = 0 } = {}) {
	return { delay: motionMs(delay), duration: motionMs(duration), css: (t: number) => `opacity: ${t}` };
}
