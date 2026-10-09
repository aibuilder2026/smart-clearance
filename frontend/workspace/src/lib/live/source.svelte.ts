// The live source (SC-73): Munchly's workspace on backend-api, behind the same WorkspaceSource the stub implements,
// so every screen reads it unchanged. It holds the member's snapshot, the batch in focus, the batch being donated, the
// ledger and the audit log; it reads them again when the member's stream says they changed (events.ts), and it takes
// each step a person makes through workspaceHttp, showing the step at once where it can and putting it back if the
// API refuses it. The projection onto the screens' shapes is project.ts.
import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import {
	ApiError,
	NotAMember,
	putUpload,
	refusalOf,
	workspaceEvents,
	type Activity,
	type CaseDetail,
	type EventsHandle,
	type Member,
	type ActionResult,
	type UploadLink,
	type WorkspaceApi,
	type WorkspaceEvent,
	type WorkspacePublic as ApiPublic,
	type WorkspaceSnapshot,
	type WsAuditRow,
	type WsLedger,
	type WsRules
} from '@smart-clearance/api/workspace';
import type {
	ActionArg,
	CaseData,
	CaseTab,
	Ledger,
	LedgerPage,
	Failure,
	HumanAction,
	InviteInput,
	JourneyClock,
	RoleId,
	Rules,
	SourceStatus,
	State,
	User,
	UserStatus,
	WorkspaceData,
	WorkspacePublic,
	WorkspaceSource
} from '@smart-clearance/core/workspace/app';
import { caseOf, dataOf, donationRef, emptyData, emptyState, focusRef, publicOf, stateOf, userOf } from './project';

export type LiveOptions = {
	api: WorkspaceApi;
	/** for the stream: the backend's address, the workspace and the member's token */
	base: string;
	ws: string;
	token: (fresh?: boolean) => Promise<string | null>;
	activity?: Activity;
	/** how a phone is told from a desktop, for the approval's record */
	device?: () => 'phone' | 'desktop';
	/** how long changes are gathered before the workspace is read again */
	settleMs?: number;
	/** the stream; tests pass their own */
	events?: typeof workspaceEvents;
};

/** the roles that read the ledger, and the audit log */
type Wanted = { snapshot: boolean; cases: string[]; ledger: boolean; audit: boolean };

const LEDGER: RoleId[] = ['operator', 'finance', 'sustainability', 'admin'];
const AUDIT: RoleId[] = ['admin'];

const phone = () =>
	typeof matchMedia !== 'undefined' && matchMedia('(max-width: 767px)').matches ? 'phone' : 'desktop';

export class LiveSource implements WorkspaceSource {
	readonly kind = 'live' as const;
	readonly #o: LiveOptions;
	readonly #api: WorkspaceApi;

	#public = $state<ApiPublic | null>(null);
	#member = $state<Member | null>(null);
	#snap = $state<WorkspaceSnapshot | null>(null);
	#focus = $state<CaseDetail | null>(null);
	#second = $state<CaseDetail | null>(null);
	#ledger = $state<WsLedger | null>(null);
	/** the ledger's batch pages asked for (SC-121), and what backend-api answered for each */
	#paged = new SvelteSet<string>();
	#pages = new SvelteMap<string, CaseDetail>();
	#audit = $state<WsAuditRow[]>([]);
	#asked = $state<string | null>(null);
	#phase = $state<SourceStatus['phase']>('loading');
	#error = $state<unknown>(null);
	#connection = $state<SourceStatus['connection']>('connecting');
	#failed = $state<Failure | null>(null);
	/** an account that signed in to Firebase but is not a member here */
	#outsider = $state<string | null>(null);
	readonly #pending = new SvelteSet<string>();
	readonly #uploads = new SvelteMap<string, number>();
	/** how to stop each file on its way, by its key in uploads (bookkeeping, not state) */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping: nothing draws from it
	readonly #aborts = new Map<string, AbortController>();
	/** the wall time the member's snapshot was read, which the journey clock runs on from */
	#readAt = $state(0);
	#stream: EventsHandle | null = null;
	#settle: ReturnType<typeof setTimeout> | null = null;
	/** what to read next: the snapshot, the cases by ref, the ledger, the audit log (bookkeeping, not state) */
	#wanted: Wanted = { snapshot: false, cases: [], ledger: false, audit: false };
	#reading: Promise<void> | null = null;

	constructor(o: LiveOptions) {
		this.#o = o;
		this.#api = o.api;
	}

	/* ---------- what the screens read ---------- */

	/** the batch whose donation the screens show: the one in focus, when its plan has a food bank (SC-85) */
	readonly #donor = $derived.by((): CaseDetail | null => {
		const snap = this.#snap;
		const f = this.#focus;
		return snap && f && donationRef(snap, f.ref) === f.ref ? f : null;
	});
	readonly #data = $derived.by((): WorkspaceData | null => {
		const snap = this.#snap;
		if (!snap) return null;
		return dataOf(snap, { ref: this.#focus?.ref ?? null, second: this.#donor?.ref ?? null });
	});
	readonly #emptyData = $derived(emptyData(this.#public));
	readonly #emptyState = emptyState();
	readonly #state = $derived.by((): State | null =>
		this.#snap ? stateOf(this.#snap, this.#focus, this.#donor, this.#audit) : null
	);
	readonly #case = $derived.by((): CaseData | null =>
		this.#snap && this.#focus && this.#data ? caseOf(this.#snap, this.#focus, this.#donor, this.#data) : null
	);
	readonly #me = $derived.by((): User | null =>
		this.#member && this.#snap ? userOf(this.#member, this.#snap.clock.now) : null
	);

	get status(): SourceStatus {
		return { phase: this.#phase, error: this.#error ?? undefined, connection: this.#connection };
	}
	get publicInfo(): WorkspacePublic | null {
		return this.#public ? publicOf(this.#public) : null;
	}
	get me(): User | null {
		return this.#me;
	}
	/** the journey's state; an empty one until the member's snapshot has loaded */
	get state(): State {
		return this.#state ?? this.#emptyState;
	}
	/** the workspace's data; only its name and mark until the member's snapshot has loaded */
	get data(): WorkspaceData {
		return this.#data ?? this.#emptyData;
	}
	get case(): CaseData | null {
		return this.#case;
	}
	/** Finance & ESG's ledger, as backend-api works it out (SC-124), for those who read it */
	get ledger(): Ledger | null {
		return this.#ledger;
	}
	/** a batch's page in the ledger: its case as the papers read it, its state and its ledger row (SC-121) */
	ledgerPage(ref: string): LedgerPage | null {
		const snap = this.#snap;
		const data = this.#data;
		const d = this.#pages.get(ref) ?? (this.#focus?.ref === ref ? this.#focus : null);
		if (!snap || !data || !d) return null;
		const donor = d.donation ? d : null;
		return { c: caseOf(snap, d, donor, data), h: stateOf(snap, d, donor, this.#audit).hero, row: d.ledger };
	}
	openPage = (ref: string) => {
		if (this.#paged.has(ref)) return;
		this.#paged.add(ref);
		void this.#readPage(ref);
	};
	async #readPage(ref: string) {
		const d = await this.#api.case(ref).catch((e) => {
			if (refusalOf(e) === 'not-found' || refusalOf(e) === 'forbidden') return null;
			this.#error = e;
			return null;
		});
		if (d && this.#paged.has(ref)) this.#pages.set(ref, d);
	}
	get focus(): string | null {
		return this.#asked;
	}
	get pending(): ReadonlySet<string> {
		return this.#pending;
	}
	get uploads(): ReadonlyMap<string, number> {
		return this.#uploads;
	}
	get failed(): Failure | null {
		return this.#failed;
	}
	/** the address of an account that signed in but is not a member of this workspace */
	get outsider(): string | null {
		return this.#outsider;
	}
	/** the journey's clock, as the API stated it when the workspace was read, and when that was (SC-73) */
	get clock(): JourneyClock | null {
		const c = this.#snap?.clock;
		return c
			? { now: c.now, dayMinutes: c.dayMinutes, compressed: c.compressed, day: c.day, read: this.#readAt }
			: null;
	}
	/** the batches in a journey a screen can put in focus, most urgent first: every one the member sees, each its own
	 *  journey (SC-85) */
	get cases(): readonly CaseTab[] {
		const snap = this.#snap;
		if (!snap) return [];
		return snap.cases.map((c) => ({ ref: c.ref, sku: c.sku, stage: c.stage, phase: c.phase }));
	}
	/** whether the workspace and the member's data have loaded */
	get ready(): boolean {
		return this.#public !== null && (this.#member === null || this.#snap !== null);
	}

	dismissFailure = () => {
		this.#failed = null;
	};

	/** try the live stream again now (the band's Try again) */
	reconnect = () => {
		this.#stream?.poke();
	};

	/* ---------- keeping it up to date ---------- */

	start = () => {
		let stopped = false;
		void (async () => {
			try {
				this.#public = await this.#api.workspace();
				const me = await this.#api.me().catch((e) => {
					if (e instanceof NotAMember) {
						this.#outsider = e.message;
						return null;
					}
					throw e;
				});
				if (stopped) return;
				if (me) await this.#enter(me);
				this.#phase = 'ready';
			} catch (e) {
				this.#error = e;
				this.#phase = 'error';
				this.#connection = refusalOf(e) === 'offline' ? 'offline' : this.#connection;
			}
		})();
		return () => {
			stopped = true;
			this.#leave();
		};
	};

	async #enter(me: Member) {
		this.#member = me;
		this.#outsider = null;
		await this.#readAll();
		this.#listen();
	}

	#leave() {
		this.#stream?.stop();
		this.#stream = null;
		if (this.#settle) clearTimeout(this.#settle);
		this.#settle = null;
	}

	#listen() {
		const snap = this.#snap;
		if (!snap) return;
		this.#stream?.stop();
		this.#stream = (this.#o.events ?? workspaceEvents)({
			base: this.#o.base,
			ws: this.#o.ws,
			token: this.#o.token,
			after: snap.seq,
			activity: this.#o.activity,
			onEvent: (e) => this.#heard(e),
			onReset: () => this.#want({ snapshot: true, all: true }),
			onStatus: (s) => (this.#connection = s),
			onRefused: () => void this.#signedOut()
		});
	}

	/** something changed: what can be applied at once is, and the rest is read again together, shortly */
	#heard(e: WorkspaceEvent) {
		const snap = this.#snap;
		if (e.type === 'notification' && e.notification && snap) {
			if (!snap.notifications.some((n) => n.id === e.notification!.id))
				snap.notifications = [e.notification, ...snap.notifications];
			return;
		}
		if (e.type === 'feed' && e.feed && e.ref) {
			for (const c of [this.#focus, this.#second])
				if (c && c.ref === e.ref && !c.feed.some((f) => f.id === e.feed!.id)) c.feed = [...c.feed, e.feed];
		}
		// a batch page open in the ledger reads its batch again when it changes (SC-121)
		if (e.ref && this.#paged.has(e.ref) && (e.type === 'case' || e.type === 'ledger')) void this.#readPage(e.ref);
		if (e.type === 'ledger') return this.#want({ ledger: true });
		if (e.type === 'audit') return this.#want({ audit: true });
		this.#want({ snapshot: true, ref: e.ref });
	}

	#want(w: { snapshot?: boolean; ref?: string | null; all?: boolean; ledger?: boolean; audit?: boolean }) {
		if (w.snapshot) this.#wanted.snapshot = true;
		if (w.ref && !this.#wanted.cases.includes(w.ref)) this.#wanted.cases.push(w.ref);
		if (w.all) {
			this.#wanted.ledger = this.#wanted.audit = true;
			for (const c of [this.#focus, this.#second])
				if (c && !this.#wanted.cases.includes(c.ref)) this.#wanted.cases.push(c.ref);
		}
		if (w.ledger) this.#wanted.ledger = true;
		if (w.audit) this.#wanted.audit = true;
		if (this.#settle) return;
		this.#settle = setTimeout(() => {
			this.#settle = null;
			void this.#read();
		}, this.#o.settleMs ?? 150);
	}

	/** read what was asked for; one read at a time, and whatever was asked meanwhile right after */
	async #read(): Promise<void> {
		if (this.#reading) {
			await this.#reading;
			if (this.#wanted.snapshot || this.#wanted.cases.length || this.#wanted.ledger || this.#wanted.audit)
				return this.#read();
			return;
		}
		const w = this.#wanted;
		this.#wanted = { snapshot: false, cases: [], ledger: false, audit: false };
		this.#reading = (async () => {
			try {
				if (w.snapshot) await this.#readSnapshot();
				await this.#readCases(w.cases);
				const role = this.#member?.role;
				if (w.ledger && role && LEDGER.includes(role)) this.#ledger = await this.#api.ledger().catch(() => null);
				if (w.audit && role && AUDIT.includes(role))
					this.#audit = (await this.#api.audit().catch(() => ({ rows: [] }))).rows;
			} catch (e) {
				if (refusalOf(e) === 'signed-out' || refusalOf(e) === 'not-a-member') return this.#signedOut();
				this.#error = e;
			} finally {
				this.#reading = null;
			}
		})();
		return this.#reading;
	}

	async #readAll() {
		this.#wanted = { snapshot: true, cases: [], ledger: true, audit: true };
		await this.#read();
		for (const ref of this.#paged) void this.#readPage(ref);
		if (!this.#snap) throw this.#error ?? new Error('The workspace did not load.');
	}

	async #readSnapshot() {
		const snap = await this.#api.snapshot();
		this.#readAt = Date.now();
		this.#snap = snap;
		this.#member = snap.me;
		// the batches the screens show: the one in focus, and the one going to a food bank
		const focus = focusRef(snap, this.#asked);
		const second = donationRef(snap, focus);
		const keep = (c: CaseDetail | null, ref: string | null) => (c && c.ref === ref ? c : null);
		let missing = [focus, second].filter((r, i, all): r is string => !!r && all.indexOf(r) === i);
		this.#focus = keep(this.#focus, focus);
		this.#second = keep(this.#second, second);
		for (const c of [this.#focus, this.#second]) if (c) missing = missing.filter((r) => r !== c.ref);
		await this.#readCases(missing);
		if (!focus) this.#focus = null;
		if (!second) this.#second = null;
	}

	async #readCases(refs: string[]) {
		const snap = this.#snap;
		if (!snap || !refs.length) return;
		const focus = focusRef(snap, this.#asked);
		const second = donationRef(snap, focus);
		await Promise.all(
			refs
				.filter((r) => r === focus || r === second)
				.map(async (ref) => {
					const c = await this.#api.case(ref).catch((e) => {
						if (refusalOf(e) === 'not-found' || refusalOf(e) === 'forbidden') return null;
						throw e;
					});
					this.#put(ref, c);
				})
		);
	}

	#put(ref: string, c: CaseDetail | null) {
		const snap = this.#snap;
		if (!snap) return;
		const focus = focusRef(snap, this.#asked);
		const second = donationRef(snap, focus);
		if (
			c &&
			c.seq < Math.max(this.#focus?.ref === ref ? this.#focus.seq : 0, this.#second?.ref === ref ? this.#second.seq : 0)
		)
			return; // an answer older than the one held
		if (ref === focus) this.#focus = c;
		if (ref === second) this.#second = c;
	}

	setFocus = (ref: string | null) => {
		if (ref === this.#asked) return;
		this.#asked = ref;
		const snap = this.#snap;
		if (!snap) return;
		const focus = focusRef(snap, ref);
		if (focus && focus !== this.#focus?.ref) {
			// the batch shown stays until the one asked for is read (the screens show it is coming: focus is asked for)
			if (focus === this.#second?.ref) this.#focus = this.#second;
			this.#want({ ref: focus });
		}
	};

	/* ---------- signing in and out ---------- */

	signIn = async (i: { email: string; password: string } | { uid: string }): Promise<User> => {
		if ('uid' in i) throw new ApiError(400, 'Sign in with your email and password.');
		this.#outsider = null;
		const me = await this.#api.signIn(i).catch((e) => {
			// the password was right, but the account is not a member here: the sign-in says so (SC-68)
			if (e instanceof NotAMember) this.#outsider = e.message;
			throw e;
		});
		await this.#enter(me);
		return this.#me!;
	};

	signOut = async () => {
		this.#leave();
		await this.#api.signOut();
		this.#clear();
	};

	async #signedOut() {
		this.#leave();
		this.#clear();
	}

	#clear() {
		this.#member = null;
		this.#snap = null;
		this.#focus = this.#second = this.#ledger = null;
		this.#paged.clear();
		this.#pages.clear();
		this.#audit = [];
		this.#failed = null;
		this.#pending.clear();
		this.#connection = 'connecting';
	}

	/* ---------- the steps a person takes ---------- */

	/** send a step: shown at once where that is safe, put back if refused; the answer's case replaces the one held */
	async #send(action: HumanAction, run: () => Promise<{ case: CaseDetail | null } | void>, show?: () => () => void) {
		this.#pending.add(action);
		this.#failed = null;
		const undo = show?.();
		try {
			const out = await run();
			if (out && out.case) this.#put(out.case.ref, out.case);
			this.#want({ snapshot: true });
			this.#stream?.poke();
		} catch (e) {
			undo?.();
			// a file the person stopped on its way is not a failure
			if ((e as { name?: string })?.name === 'AbortError') return;
			const stale = refusalOf(e) === 'stale';
			if (stale) this.#want({ snapshot: true, all: true });
			if (refusalOf(e) === 'signed-out') return this.#signedOut();
			this.#failed = {
				action,
				stale,
				message: e instanceof Error ? e.message : String(e),
				retry: () => this.#send(action, run, show)
			};
		} finally {
			this.#pending.delete(action);
		}
	}

	act = async <N extends HumanAction>(name: N, arg?: ActionArg<N>, o?: { feel?: number }): Promise<void> => {
		if (o?.feel) await new Promise((r) => setTimeout(r, o.feel));
		const api = this.#api;
		const ref = this.#focus?.ref ?? '';
		const second = this.#donor?.ref ?? '';
		const focus = () => this.#focus;
		switch (name) {
			case 'connect':
				return this.#send(name, () => api.confirmSetup());
			case 'permit':
				return this.#send(name, () => api.permit(), this.#showPermission({ paused: false }));
			case 'pause': {
				const paused = arg as boolean;
				return this.#send(name, () => api.pause(paused), this.#showPermission({ paused }));
			}
			case 'sendPhoto':
				return this.#send(name, () => this.#upload(ref, arg as Blob | undefined));
			case 'approve':
				return this.#send(
					name,
					() => api.approve(ref, (this.#o.device ?? phone)()),
					this.#show((c) => {
						if (c.journey.plan) c.journey.plan = { ...c.journey.plan, status: 'approved' };
						c.journey.phase = 'approved';
					})
				);
			case 'order': {
				const { kirana, units } = arg as ActionArg<'order'>;
				const k = focus()?.kiranas.find((x) => x.id === kirana);
				const n = units ?? k?.cap ?? 0;
				return this.#send(
					name,
					() => api.order(ref, n),
					this.#show((c) => {
						c.journey.orders = [
							...c.journey.orders,
							{ id: kirana, units: n, at: this.#now(), by: this.#member?.id ?? '' }
						];
					})
				);
			}
			case 'bid': {
				const price = arg as number;
				return this.#send(
					name,
					() => api.bid(ref, price),
					this.#show((c) => {
						c.journey.bids = [
							...c.journey.bids,
							{ id: 'pending', price, at: this.#now(), by: this.#member?.id ?? '', status: 'placed', counter: null }
						];
					})
				);
			}
			case 'accept': {
				const bid = [...(focus()?.journey.bids ?? [])].reverse().find((b) => b.status === 'countered');
				if (!bid) return;
				return this.#send(name, () => api.accept(ref, bid.id));
			}
			case 'recordStaffSale': {
				const sold = arg as number;
				return this.#send(
					name,
					() => api.staffSale(ref, sold),
					this.#show((c) => {
						if (c.journey.staff)
							c.journey.staff = {
								...c.journey.staff,
								status: 'recorded',
								sold,
								left: c.journey.staff.units - sold,
								recordedAt: this.#now()
							};
					})
				);
			}
			case 'confirmPickup':
				return this.#send(name, () => api.confirmPickup(second || ref));
			case 'collect':
				return this.#send(name, () => api.collect(second || ref));
			case 'dispatch':
				return this.#send(name, () => api.dispatch(ref, 'truck'));
			case 'vanRound':
				return this.#send(name, () => api.dispatch(ref, 'van'));
			case 'issueInvoice':
				return this.#send(name, () => api.issueInvoice(ref, 'invoice'));
			case 'review':
				return this.#send(name, () => api.review(ref));
			case 'join':
				// an invited member joins by signing in for the first time: nothing to send
				return;
		}
	};

	message = (text: string) => {
		const ref = this.#focus?.ref ?? '';
		return this.#send('bid', () => this.#api.message(ref, text));
	};

	documentUrl = async (doc: string, ref?: string) =>
		(await this.#api.documentUrl(ref ?? this.#focus?.ref ?? '', doc)).url;

	/** the label photo: a signed link, the file straight to Cloud Storage with its progress, then Vision reads it */
	async #upload(ref: string, file: Blob | undefined) {
		if (!file) throw new ApiError(422, 'Choose a photo of the carton label first.');
		return this.#put_(`photo:${ref}`, file, 'image/jpeg', {
			link: (input) => this.#api.uploadPhoto(ref, input),
			done: (id) => this.#api.photoSent(ref, id)
		});
	}

	/** a file to a signed link with its progress under its key, then the backend told it arrived; stoppable */
	async #put_(
		key: string,
		file: Blob,
		type: string,
		to: {
			link: (i: { contentType: string; bytes: number; fileName?: string }) => Promise<UploadLink>;
			done: (id: string) => Promise<ActionResult>;
		}
	) {
		const stop = new AbortController();
		this.#aborts.set(key, stop);
		this.#uploads.set(key, 0);
		try {
			const link = await to.link({ contentType: file.type || type, bytes: file.size, fileName: (file as File).name });
			stop.signal.throwIfAborted();
			await putUpload(link, file, { onProgress: (f) => this.#uploads.set(key, f), signal: stop.signal });
			return await to.done(link.id);
		} finally {
			this.#uploads.delete(key);
			this.#aborts.delete(key);
		}
	}

	/** Setup's DMS export for the Data agent (SC-73): its progress in uploads, under 'export' */
	uploadExport = (file: Blob) =>
		this.#send('connect', () =>
			this.#put_('export', file, 'text/csv', {
				link: (input) => this.#api.uploadExport(input),
				done: (id) => this.#api.exportUploaded(id)
			})
		);

	/** stop a file on its way */
	cancelUpload = (key: string) => {
		this.#aborts.get(key)?.abort();
	};

	#now = () => this.#snap?.clock.now ?? '';

	/** a change to the batch in focus shown before the API answers, and how to put it back */
	#show(change: (c: CaseDetail) => void) {
		return () => {
			const before = this.#focus;
			if (!before) return () => {};
			const after = structuredClone($state.snapshot(before)) as CaseDetail;
			change(after);
			this.#focus = after;
			// the state holds its own proxy of the change, so that is what is compared when it is put back
			const shown = this.#focus;
			return () => {
				if (this.#focus === shown) this.#focus = before;
			};
		};
	}

	#showPermission(p: { paused: boolean }) {
		return () => {
			const snap = this.#snap;
			const id = this.#member?.orgRef;
			const d = id ? snap?.distributors[id] : undefined;
			if (!snap || !d) return () => {};
			const before = d.permission;
			d.permission = { by: before?.by ?? this.#member!.id, at: before?.at ?? this.#now(), paused: p.paused };
			return () => {
				d.permission = before;
			};
		};
	}

	markRead = async (ids: string[] | 'all') => {
		const snap = this.#snap;
		const me = this.#member?.id;
		const before = snap?.notifications;
		if (snap)
			snap.notifications = snap.notifications.map((n) =>
				(ids === 'all' ? n.to === me : ids.includes(n.id)) ? { ...n, read: true } : n
			);
		try {
			await this.#api.markRead(ids);
		} catch {
			if (snap && before) snap.notifications = before;
		}
	};

	invite = (i: InviteInput) =>
		this.#send('join', () => this.#api.invite({ name: i.name, email: i.contact.trim(), role: i.role }));

	setUserStatus = (id: string, s: UserStatus) =>
		s === 'invited' ? Promise.resolve() : this.#send('join', () => this.#api.updateMember(id, { status: s }));

	setUserRole = (id: string, r: RoleId) => this.#send('join', () => this.#api.updateMember(id, { role: r }));

	saveRules = (r: Rules) => {
		const snap = this.#snap;
		const before = snap?.rules;
		return this.#send(
			'connect',
			() => this.#api.saveRules(r as WsRules),
			() => {
				if (snap) snap.rules = r;
				return () => {
					if (snap && before) snap.rules = before;
				};
			}
		);
	};
}

export const isNotAMember = (e: unknown) => e instanceof NotAMember;
