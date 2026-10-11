// The guided demo's player (director.jsx usePlayer): where the story is, Next and Back, the agents' beats happening on
// their own, a person's beat waiting for the visitor's tap in a device (or Next), and autoplay along the route. Entering
// a beat puts the stub's store where that beat begins (the station's start, plus what the beats before it did), so any
// beat can be opened from the address or the map.
import type { Pos, StoryAct } from './types.ts';

type Hooks = {
	/** put the store where a station's beat j begins */
	scene: (a: number, s: number, j: number) => void;
	/** run a beat's acts on the store */
	run: (a: number, s: number, b: number) => void;
	/** whether the store says the beat has happened (null: it cannot tell) */
	done: (a: number, s: number, b: number) => boolean | null;
};

export class Player {
	pos = $state<Pos>({ a: 0, s: 0, b: 0 });
	/** the beats the director ran, or the visitor passed, by index */
	ran = $state<Record<number, boolean>>({});
	playing = $state(false);
	end = $state(false);
	/** something covers the stage (the map), so the timers wait */
	hold = $state(false);

	readonly acts: StoryAct[];
	readonly #h: Hooks;

	constructor(acts: StoryAct[], hooks: Hooks, start: Pos) {
		this.acts = acts;
		this.#h = hooks;
		this.pos = start;
	}

	get act() {
		return this.acts[this.pos.a];
	}
	get station() {
		return this.act.stations[this.pos.s];
	}
	get complete() {
		return this.pos.b >= this.station.beats.length;
	}
	get beat() {
		const n = this.station.beats.length;
		return this.station.beats[Math.min(this.pos.b, n - 1)];
	}
	doneAt(i: number) {
		const { a, s } = this.pos;
		if (i >= this.station.beats.length || this.ran[i]) return true;
		return !this.act.console && this.#h.done(a, s, i) === true;
	}
	/** the current beat has happened (by the director, the visitor, or the store) */
	get done() {
		return !this.complete && this.doneAt(this.pos.b);
	}

	go(a: number, s: number, b = 0) {
		if (!this.acts[a].console) this.#h.scene(a, s, b);
		this.ran = {};
		this.end = false;
		this.pos = { a, s, b };
	}
	advance = () => {
		this.pos = { ...this.pos, b: this.pos.b + 1 };
	};
	nextStation = () => {
		const { a, s } = this.pos;
		if (s + 1 < this.act.stations.length) this.go(a, s + 1, 0);
		else if (a + 1 < this.acts.length) this.go(a + 1, 0, 0);
		else {
			this.playing = false;
			this.end = true;
		}
	};
	/** Next: make this beat happen (a person's move, or skip ahead to the agent's), then the next beat */
	next = () => {
		if (this.complete) return this.nextStation();
		if (!this.doneAt(this.pos.b)) this.runBeat();
		this.advance();
	};
	/** a tap in a device: the push opened, the sign-in made */
	tap = () => {
		if (this.complete) return;
		this.ran = { ...this.ran, [this.pos.b]: true };
		this.advance();
	};
	back = () => {
		const { a, s, b } = this.pos;
		const n = this.station.beats.length;
		if (b > 0) this.go(a, s, Math.min(b, n) - 1);
		else if (s > 0) this.go(a, s - 1, 0);
		else if (a > 0) this.go(a - 1, this.acts[a - 1].stations.length - 1, 0);
	};
	runBeat() {
		const { a, s, b } = this.pos;
		if (!this.act.console) this.#h.run(a, s, b);
		this.ran = { ...this.ran, [b]: true };
	}

	/** the timers, as effects: call once from the component that owns the player */
	effects() {
		// a move made in a device: once the store says this beat has happened, the notes move on
		$effect(() => {
			if (!this.done || this.hold) return;
			const t = setTimeout(this.advance, this.ran[this.pos.b] ? 0 : 700);
			return () => clearTimeout(t);
		});
		// the agents' beats happen on their own
		$effect(() => {
			if (this.complete || this.done || this.hold || !this.beat.agent || this.act.console) return;
			const t = setTimeout(() => this.runBeat(), 1500);
			return () => clearTimeout(t);
		});
		// autoplay: a person's beat after a moment, a station's end after a breath
		$effect(() => {
			if (!this.playing || this.hold || this.end) return;
			if (this.complete) {
				const t = setTimeout(this.nextStation, 1900);
				return () => clearTimeout(t);
			}
			if (this.done || (this.beat.agent && !this.act.console)) return;
			const wait = this.act.console ? 2600 : this.beat.acts?.length ? 2400 : 2300;
			const t = setTimeout(this.next, wait);
			return () => clearTimeout(t);
		});
	}
}
