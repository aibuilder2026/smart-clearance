import { save, Wait } from '@smart-clearance/core';

/** A control that saves on change, a Switch or a Segmented (SC-152; the kit's useSaving): it keeps the value pressed
 *  while the change is out and once it is saved, until the console has read the change back, so it never jumps back in
 *  between; its SaveNote (`wait`) says Saving…, Saved, or puts the value back with the reason. A value changed
 *  elsewhere shows as soon as it is read. */
export class Saving<T> {
	readonly wait = new Wait({ done: () => true });
	/** the value pressed, and the saved value it was pressed over */
	#mine: { v: T; over: T } | null = $state(null);
	readonly #saved: () => T;
	readonly #run: (v: T) => unknown;

	constructor(saved: () => T, run: (v: T) => unknown) {
		this.#saved = saved;
		this.#run = run;
	}

	/** what the control shows */
	get value(): T {
		const saved = this.#saved();
		const m = this.#mine;
		return m && (this.wait.working || Object.is(saved, m.over)) ? m.v : saved;
	}

	change = (next: T) => {
		const before = this.value;
		if (Object.is(next, before)) return;
		const over = this.#saved();
		save(this.wait, { next, before, set: (v) => (this.#mine = { v, over }), run: this.#run });
	};
}
