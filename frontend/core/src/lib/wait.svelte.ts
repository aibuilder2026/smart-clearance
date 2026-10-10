/** How a button that waits on the network moves through its wait (SC-152, the kit's useWait): nothing shows for an
 *  answer under 100 ms, a shown wait stays at least 400 ms, past 3 s it says it is still working, and the done word holds
 *  1.2 s before the button rests again. */
export const WAIT = { show: 100, least: 400, slow: 3000, hold: 1200 } as const;

/** idle; wait (pressed and locked, nothing shown yet); busy; slow (past 3 s); done (the done word); error (refused) */
export type WaitPhase = 'idle' | 'wait' | 'busy' | 'slow' | 'done' | 'error';

/** what a refusal says: the error's own words (the API's, for an ApiError) */
export const refusal = (e: unknown): string =>
	(e instanceof Error && e.message) || (typeof e === 'string' && e) || "That didn't go through. Try again.";

export class Wait {
	phase: WaitPhase = $state('idle');
	error: string | null = $state(null);
	#timers: ReturnType<typeof setTimeout>[] = [];
	#shown = 0;
	/** whether the button has a done word to show once the answer lands */
	#done: () => boolean;

	constructor(o: { done?: () => boolean } = {}) {
		this.#done = o.done ?? (() => false);
	}

	/** pressed and not yet answered */
	get working() {
		return this.phase === 'wait' || this.phase === 'busy' || this.phase === 'slow';
	}
	/** the face the button shows: its own, the waiting one, or the done one */
	get face(): 'rest' | 'busy' | 'done' {
		return this.phase === 'done' ? 'done' : this.phase === 'busy' || this.phase === 'slow' ? 'busy' : 'rest';
	}

	#later(fn: () => void, ms: number) {
		this.#timers.push(setTimeout(fn, ms));
	}
	stop() {
		this.#timers.forEach(clearTimeout);
		this.#timers = [];
	}

	begin() {
		this.stop();
		this.error = null;
		this.phase = 'wait';
		this.#shown = 0;
		this.#later(() => {
			this.#shown = Date.now();
			if (this.phase === 'wait') this.phase = 'busy';
		}, WAIT.show);
		this.#later(() => {
			if (this.phase === 'busy') this.phase = 'slow';
		}, WAIT.slow);
	}

	/** the answer: null when it went through, else what the refusal says */
	end(message: string | null) {
		const hold = this.#shown ? Math.max(0, WAIT.least - (Date.now() - this.#shown)) : 0;
		this.stop();
		this.#later(() => {
			if (message) {
				this.error = message;
				this.phase = 'error';
			} else if (this.#done()) {
				this.phase = 'done';
				this.#later(() => (this.phase = 'idle'), WAIT.hold);
			} else this.phase = 'idle';
		}, hold);
	}

	/** run an action and wait on it; a press while it waits, or while it shows its done word, does nothing (again lets a
	 *  control that saves change once more while it says Saved) */
	async run(action: () => unknown, again = false) {
		if (this.working || (this.phase === 'done' && !again)) return;
		this.begin();
		try {
			await action();
			this.end(null);
		} catch (e) {
			this.end(refusal(e));
		}
	}

	/** a screen's own refusal, shown under the button (or cleared) */
	refuse(message: string | null) {
		if (message) {
			this.stop();
			this.error = message;
			this.phase = 'error';
		} else if (this.phase === 'error') this.phase = 'idle';
	}
}

/** A control that saves (a Switch, a Segmented; the kit's useSaving): it shows `next` at once and waits on `run`, its
 *  SaveNote saying Saving…, then Saved; a refusal puts `before` back and says why. */
export function save<T>(wait: Wait, o: { next: T; before: T; set: (v: T) => void; run: (v: T) => unknown }) {
	if (wait.working) return;
	o.set(o.next);
	void wait.run(async () => {
		try {
			await o.run(o.next);
		} catch (e) {
			o.set(o.before);
			throw e;
		}
	}, true);
}
