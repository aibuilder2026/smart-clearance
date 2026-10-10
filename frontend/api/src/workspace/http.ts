// The workspace API over HTTP (SC-73): backend-api's /v1/workspaces/{ws} routes, for a member signed in with Firebase
// (email and password, PasswordAuth). Every call carries the member's Firebase ID token; a 401 gets one more try with a
// fresh token. Every change carries an Idempotency-Key, and is sent again with the same key when its answer is lost
// (no connection, or a 502, 503 or 504), so a retry never acts twice.
import { transport, type Method, type TransportOptions } from '../http';
import { ApiError, type PasswordAuth } from '../types/shared';
import type {
	ActionResult,
	CaseDetail,
	EventsPage,
	Member,
	UploadLink,
	WorkspaceApi,
	WorkspacePublic,
	WorkspaceSnapshot,
	WsAuditPage,
	WsLedger,
	WsPartner
} from '../types/workspace';

export type WorkspaceHttpOptions = Omit<TransportOptions, 'token'> & {
	auth: PasswordAuth;
	/** how many more times a change whose answer was lost is sent, with its key (default 2) */
	retries?: number;
	/** the wait between tries; tests pass an instant one */
	sleep?: (ms: number) => Promise<void>;
	/** a new idempotency key */
	key?: () => string;
};

/** what the workspace app does about a refusal: backend-api answers in words and a status, and the status says it */
export type Refusal =
	| 'offline'
	| 'signed-out'
	| 'not-a-member'
	| 'forbidden'
	| 'not-found'
	| 'stale'
	| 'invalid'
	| 'rate-limited'
	| 'failed';

export function refusalOf(e: unknown): Refusal {
	if (!(e instanceof ApiError)) return 'failed';
	if (e instanceof NotAMember) return 'not-a-member';
	return (
		(
			{
				0: 'offline',
				401: 'signed-out',
				403: 'forbidden',
				404: 'not-found',
				409: 'stale',
				422: 'invalid',
				429: 'rate-limited'
			} as Record<number, Refusal>
		)[e.status] ?? 'failed'
	);
}

/** a Firebase account that signed in but is not an active member of this workspace (a console account, another
 *  client's member); the app has signed it out of Firebase again */
export class NotAMember extends ApiError {
	constructor(message: string, trace?: string) {
		super(403, message, {}, trace);
	}
}

export const OFFLINE = 'The workspace is offline. Check the connection.';
const LOST = new Set([0, 502, 503, 504]);
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const uuid = () => crypto.randomUUID();

/** a failed fetch (no connection, a CORS refusal) as the ApiError the app shows */
export const offline = (e: unknown): ApiError => (e instanceof ApiError ? e : new ApiError(0, OFFLINE));

export function workspaceHttp(
	base: string,
	ws: string,
	{ auth, retries = 2, sleep = wait, key = uuid, ...options }: WorkspaceHttpOptions
): WorkspaceApi {
	let fresh = false;
	const raw = transport(base, { ...options, token: () => auth.token(fresh) });
	const root = `/v1/workspaces/${encodeURIComponent(ws)}`;
	const enc = encodeURIComponent;

	async function call<T>(method: Method, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		try {
			return await raw<T>(method, root + path, body, headers);
		} catch (e) {
			if (!(e instanceof ApiError) || e.status !== 401) throw offline(e);
			// the token may have expired since it was read: once more, with a new one
			fresh = true;
			try {
				return await raw<T>(method, root + path, body, headers);
			} catch (again) {
				throw offline(again);
			} finally {
				fresh = false;
			}
		}
	}

	async function change<T = ActionResult>(method: Method, path: string, body?: unknown): Promise<T> {
		const headers = { 'idempotency-key': key() };
		for (let attempt = 0; ; attempt++) {
			try {
				return await call<T>(method, path, body, headers);
			} catch (e) {
				if (!(e instanceof ApiError) || !LOST.has(e.status) || attempt >= retries) throw e;
				await sleep(400 * 3 ** attempt);
			}
		}
	}

	const c = (ref: string) => `/cases/${enc(ref)}`;
	return {
		workspace: () => call<WorkspacePublic>('GET', ''),

		// Firebase checks the address and password; backend-api answers the member it belongs to (and makes an invited one
		// active). An account that is not a member here is signed out of Firebase again
		async signIn({ email, password }) {
			await auth.signIn(email.trim(), password);
			try {
				return await call<Member>('POST', '/session');
			} catch (e) {
				await auth.signOut().catch(() => undefined);
				if (e instanceof ApiError && e.status === 403) throw new NotAMember(e.message, e.trace);
				throw e;
			}
		},
		async me() {
			if (!(await auth.token())) return null;
			try {
				return await call<Member>('GET', '/session');
			} catch (e) {
				if (e instanceof ApiError && e.status === 401) return null;
				if (e instanceof ApiError && e.status === 403) {
					await auth.signOut().catch(() => undefined);
					throw new NotAMember(e.message, e.trace);
				}
				throw e;
			}
		},
		async signOut() {
			await call('DELETE', '/session').catch(() => undefined);
			await auth.signOut();
		},

		snapshot: () => call<WorkspaceSnapshot>('GET', '/snapshot'),
		case: (ref) => call<CaseDetail>('GET', c(ref)),
		ledger: () => call<WsLedger>('GET', '/ledger'),
		partner: () => call<WsPartner>('GET', '/partner'),
		audit: (before) => call<WsAuditPage>('GET', '/audit' + (before ? `?before=${enc(before)}` : '')),
		documentUrl: (ref, doc) => call('GET', `/documents/${enc(ref)}/${enc(doc)}`),

		uploadExport: (input) => change<UploadLink>('POST', '/setup/exports', input),
		exportUploaded: (id) => change('POST', `/setup/exports/${enc(id)}`),
		confirmSetup: () => change('POST', '/setup/confirm'),
		permit: () => change('POST', '/permission'),
		pause: (paused) => change('PATCH', '/permission', { paused }),

		uploadPhoto: (ref, input) => change<UploadLink>('POST', `${c(ref)}/photos`, input),
		photoSent: (ref, id) => change('POST', `${c(ref)}/photos/${enc(id)}`),
		approve: (ref, device) => change('POST', `${c(ref)}/approval`, { device }),
		order: (ref, units) => change('POST', `${c(ref)}/orders`, { units }),
		declineOffer: (ref) => change('POST', `${c(ref)}/offer/decline`),
		bid: (ref, price) => change('POST', `${c(ref)}/bids`, { price }),
		message: (ref, text) => change('POST', `${c(ref)}/messages`, { text }),
		accept: (ref, bid) => change('POST', `${c(ref)}/bids/${enc(bid)}/accept`),
		staffSale: (ref, sold) => change('POST', `${c(ref)}/staff-sale`, { sold }),
		destructionPhoto: (ref, which, input) =>
			change<UploadLink>('POST', `${c(ref)}/destruction/photos`, { which, ...input }),
		sendDestruction: (ref, input) => change('POST', `${c(ref)}/destruction`, input),
		approveDestruction: (ref) => change('POST', `${c(ref)}/destruction/approve`, {}),
		askDestructionAgain: (ref, reason) => change('POST', `${c(ref)}/destruction/ask`, { reason }),
		confirmPickup: (ref) => change('POST', `${c(ref)}/donation/confirm`),
		collect: (ref) => change('POST', `${c(ref)}/donation/collect`),
		dispatch: (ref, kind) => change('POST', `${c(ref)}/dispatches`, { kind }),
		issueInvoice: (ref, doc) => change('POST', `${c(ref)}/documents/${enc(doc)}/issue`),
		review: (ref) => change('POST', `${c(ref)}/review`),

		markRead: (ids) => change('POST', '/notifications/read', ids === 'all' ? { all: true } : { ids }),
		invite: (input) => change('POST', '/members', input),
		updateMember: (ref, patch) => change('PATCH', `/members/${enc(ref)}`, patch),
		saveRules: (rules) => change('PUT', '/rules', rules),

		registerDevice: (input) => call('POST', '/devices', input),
		unregisterDevice: (token) => call('DELETE', `/devices/${enc(token)}`),

		events: (after, wait = 0) => call<EventsPage>('GET', `/events?after=${after}` + (wait ? `&wait=${wait}` : ''))
	};
}
