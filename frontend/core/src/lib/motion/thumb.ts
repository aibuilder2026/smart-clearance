import { motionMs, springCurve, type SpringOptions } from './index';

/** Slides a selected-item thumb from the old choice to the new one: framer's shared layout (layoutId) in the
 *  prototype, as FLIP here. `items` are the choices in order; the thumb is inside the selected one. */
export function slideThumb(
	items: ArrayLike<HTMLElement>,
	from: number,
	to: number,
	thumbSelector: string,
	spring: SpringOptions
) {
	const a = items[from];
	const b = items[to];
	const thumb = b?.querySelector<HTMLElement>(thumbSelector);
	const curve = springCurve(spring);
	const duration = motionMs(curve.duration);
	if (!a || !b || !thumb || !duration) return;
	const dx = a.offsetLeft - b.offsetLeft;
	const sx = a.offsetWidth / b.offsetWidth;
	const steps = 24;
	thumb.animate(
		Array.from({ length: steps + 1 }, (_, k) => {
			const p = curve.easing(k / steps);
			return {
				transform: `translateX(${dx * (1 - p)}px) scaleX(${sx + (1 - sx) * p})`,
				transformOrigin: 'left center'
			};
		}),
		{ duration }
	);
}
