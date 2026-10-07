// The workspace's stub backend (design3/core/store.js, which stands in for Firestore): one observable state for
// Munchly's workspace, persisted per browser. Every change is made on a copy and replaces the state whole, so anything
// that reads `store.state` updates, and the agents' reconciler (flow.ts) hears each change. backend-api replaces this
// later; the screens only read `store.state` and change it through flow.ts's actions or `store.update`.
import { D } from './data';
import type { State } from './types';

const KEY = 'sc3-store';
const VERSION = 5;
const clone = <T>(o: T): T => structuredClone(o);

/** the state the workspace starts in, before the journey */
export const seedState = (): State => clone(D.initial);

class WorkspaceStore {
	state: State = $state.raw(seedState());
	#listeners = new Set<(s: State) => void>();
	#persist = false;

	get = () => this.state;
	update = (fn: (draft: State) => void) => {
		const draft = clone(this.state);
		fn(draft);
		draft.seq = (draft.seq || 0) + 1;
		this.state = draft;
		this.#save();
		this.#emit();
		return this.state;
	};
	subscribe = (fn: (s: State) => void) => {
		this.#listeners.add(fn);
		return () => void this.#listeners.delete(fn);
	};
	reset = () => {
		this.state = seedState();
		this.#save();
		this.#emit();
	};
	/** the app keeps the journey in this browser; a store from another version starts again */
	usePersistence = () => {
		this.#persist = true;
		try {
			const raw = localStorage.getItem(KEY);
			if (!raw) return;
			const d = JSON.parse(raw) as State;
			if (d && d.v === VERSION) this.state = d;
		} catch {
			/* a private window or blocked storage: the journey lives for this visit */
		}
	};

	#save() {
		if (!this.#persist) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(this.state));
		} catch {
			/* storage full or blocked */
		}
	}
	#emit() {
		this.#listeners.forEach((fn) => {
			try {
				fn(this.state);
			} catch (e) {
				console.error(e);
			}
		});
	}
}

export const store = new WorkspaceStore();
