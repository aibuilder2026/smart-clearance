// Whether someone is using the workspace (SC-73): the tab is visible and there has been input in the last five
// minutes. The live stream stays open only then, so Cloud Run is billed only while someone is actually looking; the
// rest of the time the app polls every 30 seconds, and pushes still carry anything urgent.

export type Activity = {
	active(): boolean;
	/** called whenever active() may have changed; returns how to stop */
	subscribe(fn: () => void): () => void;
};

/** always active: for tests, and for places with no document */
export const always: Activity = { active: () => true, subscribe: () => () => undefined };

const INPUTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

export function browserActivity({ idleMs = 5 * 60_000 }: { idleMs?: number } = {}): Activity {
	if (typeof document === 'undefined') return always;
	let last = Date.now();
	let was = true;
	let timer: ReturnType<typeof setTimeout> | null = null;
	const subs = new Set<() => void>();
	const active = () => document.visibilityState === 'visible' && Date.now() - last < idleMs;
	const check = () => {
		const now = active();
		if (now !== was) {
			was = now;
			subs.forEach((fn) => fn());
		}
		if (timer) clearTimeout(timer);
		// look again when the input goes stale
		if (now) timer = setTimeout(check, Math.max(1000, last + idleMs - Date.now() + 50));
	};
	let throttled = 0;
	const input = () => {
		const now = Date.now();
		if (now - throttled < 1000 && was) return;
		throttled = now;
		last = now;
		check();
	};
	return {
		active,
		subscribe(fn) {
			if (subs.size === 0) {
				INPUTS.forEach((t) => window.addEventListener(t, input, { passive: true, capture: true }));
				document.addEventListener('visibilitychange', check);
				check();
			}
			subs.add(fn);
			return () => {
				subs.delete(fn);
				if (subs.size) return;
				INPUTS.forEach((t) => window.removeEventListener(t, input, { capture: true }));
				document.removeEventListener('visibilitychange', check);
				if (timer) clearTimeout(timer);
				timer = null;
			};
		}
	};
}
