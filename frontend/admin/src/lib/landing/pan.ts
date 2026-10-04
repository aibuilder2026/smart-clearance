// The street's pan (design3/site ExitsPanned): on desktops the panorama, zoomed 1.8×, pans as the page scrolls past
// a 250vh track and holds on each exit: hold, move, hold … over nine equal steps of the track's progress.

export const EX_AR = 4256 / 992;
export const EX_ZOOM = 1.8;

/** where each exit stands along the panorama, as a share of its width */
export const EXIT_X = [0.35, 0.515, 0.65, 0.785, 0.93] as const;

/** the pan that centres an exit at x, as a share of the panorama, clamped so the street never shows its edge */
export const holdShift = (x: number) => Math.max(1 / EX_ZOOM - 1, Math.min(0, 0.5 / EX_ZOOM - x));

/** the keyframes: progress (0-1 of the track) to the panorama's translateX (in % of its own width), two per exit */
export const EX_P: number[] = [];
export const EX_X: number[] = [];
EXIT_X.forEach((x, i) => {
	const t = i === 0 ? 0 : +(holdShift(x) * 100).toFixed(2);
	EX_P.push((2 * i) / 9, (2 * i + 1) / 9);
	EX_X.push(t, t);
});

/** the panorama's translateX (%) at a progress, interpolated between the keyframes as framer's useTransform does */
export function panX(p: number): number {
	if (p <= EX_P[0]) return EX_X[0];
	for (let i = 1; i < EX_P.length; i++) {
		if (p <= EX_P[i]) {
			const t = (p - EX_P[i - 1]) / (EX_P[i] - EX_P[i - 1]);
			return EX_X[i - 1] + (EX_X[i] - EX_X[i - 1]) * t;
		}
	}
	return EX_X[EX_X.length - 1];
}

/** the exit the reader is looking at, at a progress */
export const activeExit = (p: number) => Math.min(EXIT_X.length - 1, Math.floor(p * 4.5 + 0.25));

/** the street pins under the bar, in the middle of the window */
export const stickTop = (viewportHeight: number) => Math.max(68, Math.round(viewportHeight * 0.5 - 280));

/** the page offset that holds exit i: the middle of its hold, between the pan's start and end offsets */
export const holdScroll = (i: number, from: number, to: number) => from + ((to - from) * (2 * i + 0.5)) / 9;
