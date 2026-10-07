// The member's live stream (SC-73): what changed in the workspace, in order, from backend-api's
// GET /v1/workspaces/{ws}/events/stream (server-sent events), resumed from the last position the app holds.
//
// - The stream is open only while someone is using the app (the tab visible, input in the last five minutes:
//   activity.ts). Otherwise the app polls GET …/events?after= every 30 seconds, so an idle tab costs next to nothing.
// - A stream that drops comes back with backoff and jitter; a stream that never opens three times running gives way
//   to polling every 2 seconds, and is tried again a minute later. A stream silent for 45 seconds (the server's
//   heartbeat is 20) is taken for dead.
// - A 401 gets one more try with a fresh Firebase token; a second 401, or a 403 (no longer a member), stops the stream
//   and says so.
// - The server ends every stream after 15 minutes (`event: end`); the client opens the next at once.
import { ApiError } from '../types/shared';
import type { EventsPage, WorkspaceEvent } from '../types/workspace';
import { always, type Activity } from './activity';
import { sseParser } from './sse';

export type Liveness = 'connecting' | 'live' | 'reconnecting' | 'polling' | 'paused' | 'offline';

export type EventsOptions = {
	base: string;
	ws: string;
	token: (fresh?: boolean) => Promise<string | null>;
	/** the position the app's data is at: the snapshot's seq */
	after: number;
	onEvent: (e: WorkspaceEvent) => void;
	/** the stream cannot resume from the app's position: read everything again */
	onReset: (seq: number) => void;
	onStatus?: (s: Liveness) => void;
	/** signed out, or no longer a member: the stream has stopped */
	onRefused?: (e: ApiError) => void;
	activity?: Activity;
	fetcher?: typeof fetch;
	/** waits; resolves early when the signal aborts */
	sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
	random?: () => number;
	now?: () => number;
	idlePollMs?: number;
	failPollMs?: number;
	watchdogMs?: number;
	streamRetryMs?: number;
};

export type EventsHandle = {
	stop(): void;
	/** the last position applied */
	readonly position: number;
	readonly status: Liveness | null;
	/** read now, if the app is polling (after a change it made itself) */
	poke(): void;
};

class Refused extends Error {
	constructor(readonly error: ApiError) {
		super(error.message);
	}
}

const pause = (ms: number, signal: AbortSignal) =>
	new Promise<void>((resolve) => {
		if (signal.aborted) return resolve();
		const t = setTimeout(done, ms);
		function done() {
			clearTimeout(t);
			signal.removeEventListener('abort', done);
			resolve();
		}
		signal.addEventListener('abort', done, { once: true });
	});

const isAbort = (e: unknown) => (e as { name?: string })?.name === 'AbortError';

export function workspaceEvents(o: EventsOptions): EventsHandle {
	const fetcher = o.fetcher ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
	const activity = o.activity ?? always;
	const sleep = o.sleep ?? pause;
	const random = o.random ?? Math.random;
	const now = o.now ?? Date.now;
	const idlePollMs = o.idlePollMs ?? 30_000;
	const failPollMs = o.failPollMs ?? 2_000;
	const watchdogMs = o.watchdogMs ?? 45_000;
	const streamRetryMs = o.streamRetryMs ?? 60_000;
	const root = `${o.base}/v1/workspaces/${encodeURIComponent(o.ws)}`;

	let position = o.after;
	let status: Liveness | null = null;
	let stopped = false;
	/** reads that failed in a row, of either kind */
	let failures = 0;
	/** streams that failed to open in a row, and when the app began polling for it */
	let streamFails = 0;
	let pollingSince = 0;
	let wake = new AbortController();

	const set = (s: Liveness) => {
		if (s === status) return;
		status = s;
		o.onStatus?.(s);
	};
	const backoff = (n: number) => {
		const base = Math.min(30_000, 1000 * 2 ** Math.max(0, n - 1));
		return base / 2 + (random() * base) / 2;
	};
	const apply = (e: WorkspaceEvent) => {
		if (e.seq <= position) return;
		position = e.seq;
		o.onEvent(e);
	};
	const reset = (seq: number) => {
		position = seq;
		o.onReset(seq);
	};

	async function authed(path: string, accept: string, signal: AbortSignal): Promise<Response> {
		const go = async (fresh: boolean) => {
			const token = await o.token(fresh);
			return fetcher(root + path, {
				signal,
				headers: {
					accept,
					...(token ? { authorization: `Bearer ${token}` } : {}),
					...(accept === 'text/event-stream' ? { 'last-event-id': String(position) } : {})
				}
			});
		};
		let res = await go(false);
		if (res.status === 401) {
			await res.body?.cancel().catch(() => undefined);
			res = await go(true);
		}
		if (res.status === 401 || res.status === 403) {
			const detail = await res.json().catch(() => ({}));
			throw new Refused(new ApiError(res.status, detail.message ?? res.statusText));
		}
		return res;
	}

	/** one stream, until it ends, drops, or the app stops wanting it */
	async function stream(): Promise<'ended' | 'dropped' | 'failed' | 'interrupted'> {
		const dog = new AbortController();
		const signal = AbortSignal.any([wake.signal, dog.signal]);
		let timer: ReturnType<typeof setTimeout> | undefined;
		const kick = () => {
			clearTimeout(timer);
			timer = setTimeout(() => dog.abort(), watchdogMs);
		};
		let opened = false;
		let ended = false;
		try {
			kick();
			const res = await authed(`/events/stream?after=${position}`, 'text/event-stream', signal);
			if (!res.ok || !res.body) {
				await res.body?.cancel().catch(() => undefined);
				return 'failed';
			}
			const parser = sseParser((m) => {
				if (m.event === 'end') ended = true;
				else if (m.event === 'reset') reset(Number(JSON.parse(m.data).seq));
				else apply(JSON.parse(m.data) as WorkspaceEvent);
			});
			const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
			try {
				for (;;) {
					const { value, done } = await reader.read();
					if (done) break;
					kick();
					if (!opened) {
						opened = true;
						failures = 0;
						streamFails = 0;
						set('live');
					}
					parser.push(value);
					if (ended) break;
				}
			} finally {
				reader.cancel().catch(() => undefined);
			}
			return ended ? 'ended' : opened ? 'dropped' : 'failed';
		} catch (e) {
			if (e instanceof Refused) throw e;
			if (isAbort(e) && wake.signal.aborted) return 'interrupted';
			return opened ? 'dropped' : 'failed';
		} finally {
			clearTimeout(timer);
		}
	}

	async function poll(): Promise<void> {
		const res = await authed(`/events?after=${position}`, 'application/json', wake.signal);
		if (!res.ok) throw new ApiError(res.status, res.statusText);
		const page = (await res.json()) as EventsPage;
		if (page.reset) reset(page.seq);
		else {
			page.events.forEach(apply);
			position = Math.max(position, page.seq);
		}
	}

	async function run() {
		while (!stopped) {
			wake = new AbortController();
			const signal = wake.signal;
			const streaming = activity.active() && (streamFails < 3 || now() - pollingSince >= streamRetryMs);
			try {
				if (streaming) {
					if (streamFails >= 3) streamFails = 2; // one more try after a minute of polling
					if (status !== 'live') set(failures ? 'reconnecting' : 'connecting');
					const r = await stream();
					if (r === 'ended' || r === 'interrupted' || stopped) continue;
					failures++;
					if (r === 'failed' && ++streamFails === 3) pollingSince = now();
					if (streamFails >= 3) continue; // poll instead, at once
					set(failures >= 3 ? 'offline' : 'reconnecting');
					await sleep(backoff(failures), signal);
				} else {
					await poll();
					failures = 0;
					const active = activity.active();
					set(active ? 'polling' : 'paused');
					await sleep(active ? failPollMs : idlePollMs, signal);
				}
			} catch (e) {
				if (e instanceof Refused) {
					stopped = true;
					o.onRefused?.(e.error);
					break;
				}
				if (stopped) break;
				if (isAbort(e) && signal.aborted) continue;
				failures++;
				set(failures >= 2 ? 'offline' : 'reconnecting');
				await sleep(backoff(failures), signal);
			}
		}
		unsubscribe();
		if (typeof window !== 'undefined') window.removeEventListener('online', online);
	}

	const unsubscribe = activity.subscribe(() => wake.abort());
	const online = () => wake.abort();
	if (typeof window !== 'undefined') window.addEventListener('online', online);
	void run();

	return {
		stop() {
			stopped = true;
			wake.abort();
		},
		get position() {
			return position;
		},
		get status() {
			return status;
		},
		poke() {
			if (status !== 'live') wake.abort();
		}
	};
}
