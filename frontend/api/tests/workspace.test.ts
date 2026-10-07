import { describe, expect, it, vi } from 'vitest';
import { ApiError, type PasswordAuth } from '../src/types/shared';
import {
	NotAMember,
	refusalOf,
	sseParser,
	workspaceEvents,
	workspaceHttp,
	type Activity,
	type EventsHandle,
	type Liveness,
	type SseMessage,
	type WorkspaceEvent
} from '../src/workspace/index';

// the workspace's side of backend-api against a fake one: the SSE parser, the HTTP client's keys, retries and
// sign-in, and the live stream's resumption, refusals and fallbacks

const reply = (status: number, body?: unknown) =>
	new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});

/** a server-sent-events answer, in the chunks given */
const sse = (...chunks: string[]) =>
	new Response(
		new ReadableStream({
			start(c) {
				for (const x of chunks) c.enqueue(new TextEncoder().encode(x));
				c.close();
			}
		}),
		{ status: 200, headers: { 'content-type': 'text/event-stream' } }
	);

/** a stream that stays open until its request is aborted */
const open = (init: RequestInit | undefined, ...chunks: string[]) =>
	new Response(
		new ReadableStream({
			start(c) {
				for (const x of chunks) c.enqueue(new TextEncoder().encode(x));
				init?.signal?.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')));
			}
		}),
		{ status: 200 }
	);

const frame = (e: Partial<WorkspaceEvent> & { seq: number; type: WorkspaceEvent['type'] }) =>
	`id: ${e.seq}\nevent: ${e.type}\ndata: ${JSON.stringify({ wall: '', ref: null, feed: null, notification: null, ...e })}\n\n`;

function fakeAuth(): PasswordAuth & { signedIn: boolean; fresh: number } {
	const a = {
		signedIn: true,
		fresh: 0,
		async signIn(_email: string, password: string) {
			if (password !== 'right') throw new ApiError(401, 'wrong');
			a.signedIn = true;
		},
		async signOut() {
			a.signedIn = false;
		},
		async token(fresh = false) {
			if (fresh) a.fresh++;
			return a.signedIn ? (fresh ? 'new-token' : 'old-token') : null;
		}
	};
	return a;
}

async function until(cond: () => boolean, what = 'the condition') {
	for (let i = 0; i < 500; i++) {
		if (cond()) return;
		await new Promise((r) => setTimeout(r, 1));
	}
	throw new Error(`timed out waiting for ${what}`);
}

const instant = () => Promise.resolve();

describe('sseParser', () => {
	it('reads events across chunks, with CR, LF and CRLF, comments, ids and multi-line data', () => {
		const got: SseMessage[] = [];
		const notes: string[] = [];
		const p = sseParser(
			(m) => got.push(m),
			(c) => notes.push(c)
		);
		p.push('retry: 3000\r\n: connected at 4\r');
		p.push('\nid: 5\nevent: case\nda');
		p.push('ta: {"a":1}\n\n');
		p.push('data: line one\rdata: line two\r\r');
		p.push('event: nothing\n\n: keep-alive\n\n');
		expect(got).toEqual([
			{ id: '5', event: 'case', data: '{"a":1}' },
			{ id: '5', event: 'message', data: 'line one\nline two' }
		]);
		expect(notes).toEqual(['connected at 4', 'keep-alive']);
		expect(p.retry).toBe(3000);
		expect(p.lastId).toBe('5');
	});
});

describe('workspaceHttp', () => {
	it('sends a change again with the same key when its answer is lost, and never a refused one', async () => {
		const keys: (string | null)[] = [];
		let n = 0;
		const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			keys.push(new Headers(init?.headers).get('idempotency-key'));
			if (String(url).endsWith('/orders'))
				return ++n < 3 ? reply(503, { message: 'busy' }) : reply(200, { seq: 9, case: null });
			return reply(409, { message: 'The journey has moved on.' });
		});
		const api = workspaceHttp('http://api', 'munchly', {
			auth: fakeAuth(),
			fetcher: fetcher as typeof fetch,
			sleep: instant
		});
		expect(await api.order('MF-1', 12)).toEqual({ seq: 9, case: null });
		expect(keys).toHaveLength(3);
		expect(new Set(keys).size).toBe(1);
		expect(fetcher.mock.calls[0][0]).toBe('http://api/v1/workspaces/munchly/cases/MF-1/orders');
		expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({ units: 12 });

		const err = await api.approve('MF-1', 'phone').catch((e) => e);
		expect(fetcher).toHaveBeenCalledTimes(4);
		expect(refusalOf(err)).toBe('stale');
		expect(keys[3]).not.toBe(keys[0]);
	});

	it('tries once more with a fresh token after a 401', async () => {
		const auth = fakeAuth();
		const fetcher = vi.fn(async (_u: string | URL | Request, init?: RequestInit) =>
			new Headers(init?.headers).get('authorization') === 'Bearer new-token' ? reply(200, { seq: 1 }) : reply(401, {})
		);
		const api = workspaceHttp('http://api', 'munchly', { auth, fetcher: fetcher as typeof fetch });
		expect(await api.snapshot()).toEqual({ seq: 1 });
		expect(auth.fresh).toBe(1);
	});

	it('signs an account that is not a member out of Firebase again', async () => {
		const auth = fakeAuth();
		auth.signedIn = false;
		const fetcher = vi.fn(async () => reply(403, { message: 'This account is not a member of this workspace.' }));
		const api = workspaceHttp('http://api', 'munchly', { auth, fetcher: fetcher as typeof fetch });
		const err = await api.signIn({ email: ' neha@x.example ', password: 'right' }).catch((e) => e);
		expect(err).toBeInstanceOf(NotAMember);
		expect(refusalOf(err)).toBe('not-a-member');
		expect(auth.signedIn).toBe(false);
	});

	it('answers nobody when nobody is signed in, and says the connection is down when fetch fails', async () => {
		const auth = fakeAuth();
		auth.signedIn = false;
		const down = vi.fn(async () => {
			throw new TypeError('Failed to fetch');
		});
		const api = workspaceHttp('http://api', 'munchly', { auth, fetcher: down as typeof fetch, sleep: instant });
		expect(await api.me()).toBeNull();
		expect(down).not.toHaveBeenCalled();
		const err = await api.markRead('all').catch((e) => e);
		expect(refusalOf(err)).toBe('offline');
		expect(down).toHaveBeenCalledTimes(3);
	});
});

describe('workspaceEvents', () => {
	type Call = { url: string; headers: Headers };
	function harness(answer: (call: Call, init: RequestInit | undefined, n: number) => Response, activity?: Activity) {
		const calls: Call[] = [];
		const events: WorkspaceEvent[] = [];
		const resets: number[] = [];
		const statuses: Liveness[] = [];
		let refused: ApiError | null = null;
		const auth = fakeAuth();
		const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			const call = { url: String(url), headers: new Headers(init?.headers) };
			calls.push(call);
			return answer(call, init, calls.length);
		});
		const handle: EventsHandle = workspaceEvents({
			base: 'http://api',
			ws: 'munchly',
			token: auth.token,
			after: 4,
			onEvent: (e) => events.push(e),
			onReset: (seq) => resets.push(seq),
			onStatus: (s) => statuses.push(s),
			onRefused: (e) => (refused = e),
			activity,
			fetcher: fetcher as typeof fetch,
			sleep: (_ms, signal) =>
				new Promise((r) => {
					const t = setTimeout(r, 2);
					signal.addEventListener('abort', () => (clearTimeout(t), r()), { once: true });
				}),
			random: () => 0.5
		});
		return { calls, events, resets, statuses, handle, auth, refused: () => refused };
	}

	it('applies events in order, resumes from the last one after the server ends a stream, and skips what it has', async () => {
		const h = harness((call, init, n) =>
			n === 1
				? sse(
						': connected at 4\n\n',
						frame({ seq: 5, type: 'case', ref: 'MF-1' }),
						frame({ seq: 6, type: 'workspace' }),
						'event: end\ndata: {}\n\n'
					)
				: open(init, ': connected\n\n', frame({ seq: 6, type: 'workspace' }), frame({ seq: 7, type: 'feed' }))
		);
		await until(() => h.events.length === 3, 'three events');
		h.handle.stop();
		expect(h.events.map((e) => e.seq)).toEqual([5, 6, 7]);
		expect(h.handle.position).toBe(7);
		expect(h.calls[0].url).toBe('http://api/v1/workspaces/munchly/events/stream?after=4');
		expect(h.calls[0].headers.get('authorization')).toBe('Bearer old-token');
		expect(h.calls[1].url).toContain('after=6');
		expect(h.calls[1].headers.get('last-event-id')).toBe('6');
		expect(h.statuses.slice(0, 2)).toEqual(['connecting', 'live']);
	});

	it('reads everything again when the stream cannot resume', async () => {
		const h = harness((_c, init, n) =>
			n === 1 ? open(init, 'id: 40\nevent: reset\ndata: {"seq":40}\n\n') : open(init)
		);
		await until(() => h.resets.length === 1, 'the reset');
		h.handle.stop();
		expect(h.resets).toEqual([40]);
		expect(h.handle.position).toBe(40);
	});

	it('takes a fresh token after a 401, and stops on a 403', async () => {
		const h = harness((call) =>
			call.headers.get('authorization') === 'Bearer new-token'
				? reply(403, { message: 'Not a member.' })
				: reply(401, {})
		);
		await until(() => h.refused() !== null, 'the refusal');
		expect(h.auth.fresh).toBe(1);
		expect(h.refused()?.status).toBe(403);
		const before = h.calls.length;
		await new Promise((r) => setTimeout(r, 20));
		expect(h.calls.length).toBe(before);
	});

	it('polls instead of streaming while nobody is using the app, and streams again when they are back', async () => {
		let active = false;
		let notify = () => {};
		const activity: Activity = {
			active: () => active,
			subscribe: (fn) => ((notify = fn), () => {})
		};
		const h = harness(
			(call, init) =>
				call.url.includes('/events/stream')
					? open(init, ': connected\n\n')
					: reply(200, {
							seq: 8,
							reset: false,
							events: [{ seq: 8, type: 'notification', wall: '', ref: null, feed: null, notification: null }]
						}),
			activity
		);
		await until(() => h.events.length === 1, 'the polled event');
		expect(h.calls[0].url).toBe('http://api/v1/workspaces/munchly/events?after=4');
		expect(h.statuses).toContain('paused');
		active = true;
		notify();
		await until(() => h.handle.status === 'live', 'the stream');
		h.handle.stop();
		expect(h.calls.at(-1)?.url).toContain('/events/stream?after=8');
	});

	it('polls quickly when the stream keeps failing to open', async () => {
		const h = harness((call) =>
			call.url.includes('/events/stream') ? reply(502, {}) : reply(200, { seq: 4, reset: false, events: [] })
		);
		await until(() => h.handle.status === 'polling', 'polling');
		h.handle.stop();
		expect(h.calls.filter((c) => c.url.includes('/events/stream'))).toHaveLength(3);
		expect(h.statuses).toContain('reconnecting');
	});
});
