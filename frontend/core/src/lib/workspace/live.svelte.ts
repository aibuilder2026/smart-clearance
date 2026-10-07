// The live workspace's facts as every screen shows them (SC-73, SC-68 option B, design3/screens/live.jsx): whether it
// is live, and the journey clock. The clock is the backend's, read with the workspace, and carried on at the client's
// pace between reads; it steps a quarter hour at a time and is never announced (WCAG 2.2.2: it is essential, so it has
// no pause). RoleApp makes one for the source it reads and provides it; the stub has no clock, so none of the live
// workspace draws there. What the host app adds, web push and the splash, comes in through the controls below.
import { createContext } from 'svelte';
import type { WorkspaceSource } from './source';
import type { Connection, JourneyClock } from './types';

const QUARTER = 15 * 60_000;

/** a journey time (ISO, with its offset), plus some milliseconds, as the journey's own wall clock shows it */
export function journeyAt(iso: string, add = 0) {
	const at = Date.parse(iso) + add;
	const m = /([+-])(\d\d):?(\d\d)$/.exec(iso);
	const offset = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a value read once, never state
	const d = new Date(at + offset * 60_000);
	const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });
	const hh = d.getUTCHours();
	const mm = d.getUTCMinutes();
	return {
		at,
		/** "Fri 2 Oct" */
		date: f({ weekday: 'short', day: 'numeric', month: 'short' }),
		/** "Friday 2 October" */
		long: f({ weekday: 'long', day: 'numeric', month: 'long' }),
		/** "09:31" */
		time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
		/** minutes since the journey day's midnight */
		minutes: hh * 60 + mm
	};
}

/** the pace, said shortly ("1 day = 5 min", "1 day = 1.5 h"); nothing in real time */
export const cue = (dayMinutes: number) =>
	dayMinutes >= 1440
		? ''
		: dayMinutes >= 60
			? `1 day = ${Math.round(dayMinutes / 6) / 10} h`
			: `1 day = ${dayMinutes} min`;
/** the pace, said in full */
export const cueLong = (dayMinutes: number) =>
	dayMinutes >= 1440
		? 'The journey runs in real time.'
		: `One journey day lasts ${dayMinutes >= 60 ? Math.round(dayMinutes / 6) / 10 + ' hours' : dayMinutes + ' minutes'} of real time.`;
/** the stream is down: what is shown may be behind */
export const isDown = (c: Connection) => c === 'reconnecting' || c === 'offline';
/** what the connection is called on the live line */
export const connWord = (c: Connection) =>
	c === 'connecting' ? 'Catching up' : c === 'reconnecting' ? 'Reconnecting' : c === 'offline' ? 'Offline' : 'Live';
/** the greeting for a journey time */
export const greeting = (minutes: number) =>
	minutes < 12 * 60 ? 'Good morning' : minutes < 17 * 60 ? 'Good afternoon' : 'Good evening';

export class LiveView {
	readonly #ws: WorkspaceSource;
	/** the wall time the clock was last stepped at */
	#wall = $state(Date.now());
	/** the journey time the stream dropped at, while it is down */
	#since = $state('');

	constructor(ws: WorkspaceSource) {
		this.#ws = ws;
	}

	/** whether the workspace is live: the source has a clock (the stub has none) */
	get on(): boolean {
		return !!this.#ws.clock;
	}
	get conn(): Connection {
		return this.#ws.status.connection;
	}
	get down(): boolean {
		return isDown(this.conn);
	}
	get offline(): boolean {
		return this.conn === 'offline';
	}
	/** the clock, carried on from when it was read, a quarter hour at a time */
	readonly #now = $derived.by(() => {
		const c: JourneyClock | null | undefined = this.#ws.clock;
		if (!c) return null;
		const ran = Math.max(0, this.#wall - c.read) * (1440 / Math.max(1, c.dayMinutes));
		return journeyAt(c.now, Math.floor(ran / QUARTER) * QUARTER);
	});
	get date() {
		return this.#now?.date ?? '';
	}
	get long() {
		return this.#now?.long ?? '';
	}
	get time() {
		return this.#now?.time ?? '';
	}
	/** minutes since the journey day's midnight */
	get minutes() {
		return this.#now?.minutes ?? 0;
	}
	get dayMinutes() {
		return this.#ws.clock?.dayMinutes ?? 1440;
	}
	/** the journey time updates stopped at */
	get since() {
		return this.#since || this.time;
	}

	/** keep the clock stepping, and remember when the stream drops; returns how to stop */
	start = (): (() => void) => {
		let timer: ReturnType<typeof setTimeout> | null = null;
		const step = () => {
			const c = this.#ws.clock;
			this.#wall = Date.now();
			const every = ((c?.dayMinutes ?? 1440) * 60_000) / 96;
			const ran = c ? Math.max(0, this.#wall - c.read) : 0;
			// wait for the next quarter hour of journey time
			timer = setTimeout(step, Math.max(250, every - (ran % every) + 50));
		};
		step();
		return () => {
			if (timer) clearTimeout(timer);
		};
	};
	/** the stream's state changed: a drop is remembered at the journey time it happened */
	observe(down: boolean) {
		if (down && !this.#since) this.#since = this.time;
		if (!down) this.#since = '';
	}
}

const [get, set, has] = createContext<LiveView>();
/** the live workspace's facts for every screen under it */
export const provideLive = (v: LiveView) => set(v);
/** the live workspace's facts, or null on the stub (and outside an app) */
export const useLive = (): LiveView | null => (has() ? get() : null);

/** web push on this device, as the host app runs it (the live workspace's Push, SC-73) */
export type PushControl = {
	readonly state: 'unsupported' | 'install-first' | 'default' | 'granted' | 'denied';
	readonly busy: boolean;
	check(): Promise<void>;
	enable(): Promise<void>;
	disable(): Promise<void>;
};

/** the console's splash (design3/console/splash.js, SC-51), in the workspace's words, as the host app inlines it */
export type SplashRead = { id: string; label: string };
export type SplashControl = {
	readonly active: 'boot' | 'enter' | 'leave' | null;
	/** the animate() its motion runs on (motion's, given by the app) */
	animate: ((...args: never[]) => unknown) | null;
	readonly lifted: boolean;
	begin(
		kind: 'enter' | 'leave',
		opts: { who?: string; title?: string; from?: DOMRect | null; reads?: SplashRead[] }
	): Promise<void>;
	reads(list: SplashRead[]): void;
	mark(id: string): void;
	say(o: { title?: string; sub?: string; brand?: { id: string; name: string; mark?: unknown } | null }): void;
	open(o: { anchor?: string | Element | DOMRect | null }): Promise<void>;
	fail(o: { title?: string; text?: string; label?: string; onRetry?: () => void }): void;
};
