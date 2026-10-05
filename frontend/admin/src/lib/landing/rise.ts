import { DURATION, EASE, prefersReducedMotion } from '@smart-clearance/core';

const EASING = `cubic-bezier(${EASE.join(', ')})`;
const CARD = { opacity: '0', transform: 'translateY(16px)' };
const ROW = { opacity: '0', transform: 'translateY(10px)' };
const TO = { opacity: '1', transform: 'none' };

/** A card that rises once it comes into view, its rows ([data-rise]) following it in turn (design3/site useRise:
 *  420 ms each, the rows from 160 ms, 110 ms apart; about a second and a half, once). `arm` runs when the card is set
 *  to wait for the reader and `show` as it starts to rise. A card on screen when the page starts, or for a reader who
 *  asks for less motion, stays as the server sent it: in place. Returns the cleanup. */
export function riseInView(card: HTMLElement, { arm, show }: { arm?: () => void; show?: () => void } = {}) {
	if (prefersReducedMotion.current || card.getBoundingClientRect().top < innerHeight) return;
	const rows = [...card.querySelectorAll<HTMLElement>('[data-rise]')];
	Object.assign(card.style, CARD);
	for (const r of rows) Object.assign(r.style, ROW);
	arm?.();
	const io = new IntersectionObserver(
		(entries) => {
			if (!entries.some((e) => e.isIntersecting)) return;
			io.disconnect();
			card.animate([CARD, TO], { duration: DURATION.slow, easing: EASING, fill: 'backwards' });
			Object.assign(card.style, { opacity: '', transform: '' });
			rows.forEach((r, i) => {
				r.animate([ROW, TO], { duration: DURATION.slow, delay: 160 + i * 110, easing: EASING, fill: 'backwards' });
				Object.assign(r.style, { opacity: '', transform: '' });
			});
			show?.();
		},
		{ threshold: 0.3 }
	);
	io.observe(card);
	return () => io.disconnect();
}
