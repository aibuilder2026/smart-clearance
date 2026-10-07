// The workspace API (SC-66): a client's workspace on backend-api, as Munchly Foods' members use it. backend-api serves
// it under /v1/workspaces/{ws}; the workspace app reads it through workspaceHttp (SC-73), and turns it into the
// prototype's shapes (core's workspace State) so the screens stay as designed.
//
// - Sign-in is a Firebase ID token (email and password, as the console's), sent as a Bearer token. A token whose
//   account is not an active member of this workspace gets 403 NOT_A_MEMBER; the app then signs out of Firebase.
// - Times are ISO 8601. A journey's times are journey time (the client's compressed clock, JourneyClock); `lastSeen`,
//   `expiresAt` and the events' `wall` are wall time.
// - Money is in rupees, as numbers. A quantity without a limit is null.
// - What a member sees is cut to their role: a buyer never sees the reserve or Munchly's figures, a distributor only
//   his own batches, a kirana only its own offer.
// - Every change answers ActionResult and may carry an Idempotency-Key header, so a retry never acts twice.

/* ---------- people ---------- */

export type WsRole =
	'operator' | 'distributor' | 'retailer' | 'buyer' | 'finance' | 'sustainability' | 'foodbank' | 'admin';
/** the console's access levels: Approver, Admin, Member, Partner */
export type WsAccess = 'approver' | 'admin' | 'member' | 'partner';
export type MemberKind = 'staff' | 'partner' | 'external';
export type MemberStatus = 'active' | 'invited' | 'deactivated';
export type Lang = 'hi' | 'en' | 'mr';

/** a member of the workspace: a person, or a partner organisation's account */
export type Member = {
	/** the member's ref in the workspace, e.g. "priya", "rakesh", "kirana-om-sai-provision" */
	id: string;
	name: string;
	short: string;
	org: string;
	role: WsRole;
	access: WsAccess;
	kind: MemberKind;
	status: MemberStatus;
	/** the sign-in address: @munchly.example for Munchly's people, @google.example for everyone else */
	email: string;
	/** a design-system image path (sc3img:/people/…), resolved by the app */
	img: string | null;
	city: string | null;
	lang: Lang | null;
	invitedBy: string | null;
	/** what the member stands for: a distributor's, kirana's, buyer's or food bank's id; null for Munchly's people */
	orgRef: string | null;
	/** wall time of the last sign-in */
	lastSeen: string | null;
};

/* ---------- before sign-in ---------- */

export type WsMark = { from: string; to: string; ink: string };

export type SignInOption = { id: string; icon: string; title: string; who: string; rule: string };

/** GET /v1/workspaces/{ws}: what the sign-in page and the installed app show. No token needed */
export type WorkspacePublic = {
	id: string;
	name: string;
	short: string;
	domain: string;
	mark: WsMark;
	platform: { name: string; domain: string };
	signIn: SignInOption[];
	manifest: { name: string; shortName: string; description: string; themeColor: string; backgroundColor: string };
};

export type WsSignInInput = { email: string; password: string };

/* ---------- the journey clock ---------- */

/** the client's clock. With compressed days, one journey day lasts `dayMinutes` of wall time (1 to 1440); 1440 is
 *  real time. Every journey time the API sends is on this clock */
export type JourneyClock = {
	/** the journey time now */
	now: string;
	dayMinutes: number;
	compressed: boolean;
	/** the open journey's id and its day 0, or null between journeys (the clock then runs in real time) */
	journey: string | null;
	day0: string | null;
	/** days since day 0, from 0 */
	day: number | null;
};

/* ---------- the workspace's world ---------- */

export type WsSku = {
	id: string;
	code: string;
	brand: string;
	name: string;
	category: string;
	hsn: string;
	mrp: number;
	dp: number | null;
	cost: number;
	gst: number;
	itcPerUnit: number | null;
	perCarton: number;
	lifeDays: number;
	kgPerUnit: number;
	img: string;
};

/** a distributor's one-time permission for the agents to act in his name, inside the client's floors */
export type Permission = { by: string; at: string; paused: boolean };

export type WsDistributor = {
	id: string;
	name: string;
	short: string;
	city: string;
	state: string;
	godown: string;
	address: string | null;
	gstin: string | null;
	kiranas: number;
	cluster: string;
	territory: string;
	pins: string;
	staffCap: number | null;
	permission: Permission | null;
};

export type WsBuyer = {
	id: string;
	name: string;
	short: string;
	city: string;
	state: string;
	stateCode: string;
	address: string;
	gstin: string;
	kind: string;
};

export type WsKirana = {
	id: string;
	name: string;
	area: string;
	pincode: string;
	distributor: string;
	member: string | null;
};

export type WsGate = { id: string; app: string; need: number; has: number; pass: boolean; rule: string };

/** the Watcher's reading of a batch (money.js assess) */
export type WsAssess = {
	gates: WsGate[];
	life: number;
	usableDays: number;
	willSell: number;
	atRisk: number;
	atRiskMRP: number;
	blocked: boolean;
	status: 'at-risk' | 'gated' | 'safe';
	lifeUsedPct: number;
	urgency: number;
};

export type Phase =
	| 'watching'
	| 'at-risk'
	| 'verified'
	| 'valued'
	| 'planned'
	| 'approved'
	| 'executing'
	| 'dispatched'
	| 'settled'
	| 'cleared';

export type WsBatch = {
	id: string;
	sku: string;
	distributor: string;
	units: number;
	daysLeft: number;
	sellPerDay: number;
	bestBefore: string;
	mfg: string;
	city: string;
	staffCap: number | null;
	shelf: string | null;
	assess: WsAssess;
	/** where its journey is, when it has one */
	phase: Phase | null;
};

export type WsStage = {
	id: string;
	n: number;
	title: string;
	when: string;
	who: string;
	role: string;
	view: string;
	human: boolean;
	time: string;
};

export type WsChannel = {
	id: string;
	name: string;
	short: string;
	minDays: number;
	need: string;
	pricePct: number;
	clears: string;
	icon: string;
};

export type WsRules = {
	watchTime: string;
	floors: Record<string, number>;
	approvalTaps: number;
	hindiOffers: boolean;
	requirePhoto: boolean;
	offerWindowHours: number;
	tokenPct: number;
	disposalPerUnit: number;
	eprPerKg: number;
	territoryGuard: boolean;
	returnWindowDays: number;
	kiranaUplift: number;
	vanPerUnit: number;
};

/** the money rules every figure is worked out with (money.js RULES, with the client's own values) */
export type WsMoneyRules = {
	projectionStopDays: number;
	disposalPerUnit: number;
	eprPerKg: number;
	co2PerKg: number;
	vanPerUnit: number;
	listingFee: number;
	foodbankHandlingPerUnit: number;
	tokenPct: number;
	kiranaWindowDays: number;
	kiranaUplift: number;
	shopCapTimes: number;
	scheme: { buy: number; free: number };
	staffCap: number;
	returnWindowDays: number;
	floors: Record<string, number>;
	ewayThreshold: number;
	negotiation: { reservePerUnit: number; counterPctOfAsk: number };
	gates: { blinkit: { minDays: number }; zepto: { pctLife: number }; instamart: { pctLife: number } };
};

export type WsIntegration = { id: string; name: string; kind: string; status: 'ok' | 'mock' | 'waiting'; note: string };

export type WsSetup = {
	dms: { source: string; columns: [string, string][]; salesDays: number };
	channels: string[];
	allowList: [string, string[]][];
	brandSafety: string[];
	partners: { id: string; name: string; minDays: number; minUnits: number; logistics: string; paper: string }[];
	approval: string;
	acts: string[];
	/** whether Priya has confirmed the Data agent's mapping and the guardrails */
	confirmed: boolean;
	/** how many DMS columns the Data agent mapped */
	mapped: number;
	/** the last DMS export the Data agent loaded */
	lastImport: { at: string; file: string; rows: number; batches: number } | null;
};

/** the Watcher's last run */
export type WatchRun = { at: string; checked: number; distributors: number; flagged: number };

export type WsWorkspace = {
	id: string;
	name: string;
	short: string;
	domain: string;
	mark: WsMark;
	since: string;
	plan: string;
	region: string;
	signIn: SignInOption[];
	outside: string;
	profile: { id: string; icon: string; title: string; value: string; text: string }[];
};

export type WsClient = { name: string; short: string; city: string; gstin: string; fssai: string };

/** a batch in a journey, for the lists: the Command Center, Batches, the inbox's links */
export type CaseSummary = {
	ref: string;
	sku: string;
	distributor: string;
	phase: Phase;
	/** the active stage, 0 to 8, or 9 once cleared */
	stage: number;
	urgency: number;
	atRisk: number;
	/** the plan's net, once there is a plan (hidden from partners) */
	net: number | null;
	updatedAt: string;
};

export type WsNotification = {
	id: string;
	/** the member it is for */
	to: string;
	read: boolean;
	title: string;
	body: string;
	at: string;
	/** the screen it opens, and the batch, if any */
	link: string | null;
	ref: string | null;
	hindi: boolean;
	/** an English line beside a Hindi body */
	en: string | null;
};

/** GET /v1/workspaces/{ws}/snapshot: everything the signed-in member's screens need, but a batch's own journey */
export type WorkspaceSnapshot = {
	seq: number;
	me: Member;
	clock: JourneyClock;
	platform: { name: string; domain: string };
	workspace: WsWorkspace;
	client: WsClient;
	roles: Record<WsRole, string>;
	members: Member[];
	skus: Record<string, WsSku>;
	distributors: Record<string, WsDistributor>;
	buyer: WsBuyer | null;
	kiranas: WsKirana[];
	stages: WsStage[];
	channels: WsChannel[];
	rules: WsRules;
	moneyRules: WsMoneyRules;
	integrations: WsIntegration[];
	setup: WsSetup;
	watch: WatchRun | null;
	batches: WsBatch[];
	/** the batches in a journey, most urgent first */
	cases: CaseSummary[];
	/** the member's own, newest first */
	notifications: WsNotification[];
};

/* ---------- a batch's journey ---------- */

export type WsFeedEvent = {
	id: string;
	key: string;
	stage: string;
	/** an agent's name, or null when a person acted */
	agent: string | null;
	/** the member who acted, or null for an agent */
	person: string | null;
	icon: string | null;
	at: string;
	text: string;
	/** the agent's tool calls: [name, what, tone] */
	calls: [string, string, string][];
	human: boolean;
};

export type WsChatMessage = { id: string; from: 'buyer' | 'agent'; text: string; at: string };

export type WsBid = {
	id: string;
	price: number;
	at: string;
	by: string;
	status: 'placed' | 'countered' | 'accepted' | 'declined';
	counter: number | null;
};

/** what the Vision agent read on the label, and whether it matches the DMS record */
export type LabelRead = {
	batch: string | null;
	mfg: string | null;
	bestBefore: string | null;
	mrp: number | null;
	pack: string | null;
	confidence: number;
	matches: boolean;
	mismatches: string[];
};

/** the journey of one batch, in the prototype's Hero shape */
export type Journey = {
	id: string;
	phase: Phase;
	photo: {
		status: 'none' | 'requested' | 'reading' | 'verified';
		at: string | null;
		confidence: number | null;
		/** a 5-minute signed link to the photo, for those who may see it */
		url: string | null;
		read: LabelRead | null;
	};
	plan: null | { status: 'proposed' | 'approved'; at: string; by: string | null; device: string | null };
	listing: null | {
		id: string;
		status: 'live' | 'awarded';
		units: number;
		price: number;
		/** hidden from the buyer */
		reserve: number | null;
		at: string;
		title: string;
		description: string;
	};
	offer: null | { status: 'sent' | 'closed'; at: string; shops: number; closesAt: string };
	orders: { id: string; units: number; at: string; by: string }[];
	bids: WsBid[];
	chat: WsChatMessage[];
	award: null | {
		units: number;
		price: number;
		gross: number;
		token: number;
		balance: number;
		at: string;
		buyer: string;
		status: string;
	};
	van: { status: 'idle' | 'done'; done: number; at: string | null };
	truck: { status: 'idle' | 'dispatched'; at: string | null };
	docs: null | { id: string; status: string }[];
	invoiceIssued: boolean;
	shelf: null | WsShelf;
	posted: boolean;
	reviewed: boolean;
};

export type WsChannelRow = {
	id: string;
	name: string;
	short: string;
	need: string;
	clears: string;
	icon: string;
	price: number;
	packPrice: number | null;
	pricePctLabel: string;
	costPerUnit: number;
	itcLoss: number;
	net: number;
	capacity: number | null;
	eligible: boolean;
	reason: string;
	itc: 'retained' | 'reversed';
	/** the Valuer's note on the channel, from recent prices */
	note: string | null;
};

export type WsPlanLine = {
	id: string;
	name: string;
	short: string;
	units: number;
	price: number;
	packPrice: number | null;
	charged: number;
	gross: number;
	cost: number;
	itcLoss: number;
	net: number;
	cartons: number;
};

export type WsWriteOff = {
	units: number;
	stock: number;
	itc: number;
	itcPerUnit: number;
	disposal: number;
	kg: number;
	epr: number;
	total: number;
	perUnit: number;
};

export type WsPlan = {
	units: number;
	rows: WsChannelRow[];
	lines: WsPlanLine[];
	gross: number;
	costs: number;
	itcLoss: number;
	net: number;
	pctMRP: number;
	writeOff: WsWriteOff;
	bookCost: number;
	pnl: number;
	swing: number;
	cashAvoided: number;
	itcRetained: number;
	itcReversed: number;
	disposalAvoided: number;
	alt: { id: string; short: string; label: string; net: number } | null;
	kg: number;
	co2: number;
	meals: number;
	soldUnits: number;
	donated: number;
	leftover: number;
	/** the Router's reasoning, in plain words */
	explanation: string | null;
};

export type WsAward = { units: number; price: number; gross: number; token: number; balance: number };
export type WsActual = {
	net: number;
	delta: number;
	swing: number;
	pnl: number | null;
	esPlanned: number | null;
	esActual: number | null;
};
export type WsSupport = {
	rows: { id: string; short: string; units: number; price: number; gap: number; amount: number }[];
	gap: number;
	van: number;
	fee: number;
	total: number;
};
export type WsClaim = { units: number; credit: number; disposal: number; epr: number; itc: number; total: number };

export type WsDoc = {
	id: string;
	type: string;
	owner: string;
	no: string;
	status: 'generated' | 'drafted' | 'not required';
	amount: number;
	note: string | null;
	taxable: number | null;
	igst: number | null;
	roundOff: number | null;
	total: number | null;
	units: number | null;
	price: number | null;
	gstPct: number | null;
	exact: number | null;
	/** whether a PDF can be downloaded (GET …/documents/{id}) */
	pdf: boolean;
};

export type WsShelf = {
	at: string;
	counted: number;
	shop: string;
	area: string;
	took: number;
	left: number;
	pickUp: number;
	leave: number;
	round: string;
	returnBy: string;
};

/** a shop the scheme was offered to, with its cap and what it ordered */
export type KiranaOffer = {
	id: string;
	name: string;
	area: string;
	cap: number;
	units: number;
	at: string | null;
	member: string | null;
};

export type Donation = {
	status: 'booked' | 'confirmed' | 'collected';
	partner: string;
	units: number;
	pickupAt: string | null;
	from: string;
	at: string;
};

/** a push the journey sent, as its recipient read it */
export type PushCopy = { to: string; at: string; title: string; body: string; hindi: boolean; en: string | null };

/** GET /v1/workspaces/{ws}/cases/{ref}: one batch's journey, cut to the member's role */
export type CaseDetail = {
	seq: number;
	ref: string;
	batch: WsBatch;
	sku: WsSku;
	distributor: WsDistributor;
	journey: Journey;
	feed: WsFeedEvent[];
	/** null for those who may not see Munchly's figures */
	plan: WsPlan | null;
	counter: { action: 'accept' | 'counter'; price: number; below: boolean } | null;
	award: WsAward | null;
	actual: WsActual | null;
	support: WsSupport | null;
	supportPlan: WsSupport | null;
	claim: WsClaim | null;
	docs: WsDoc[];
	shelf: WsShelf | null;
	kiranas: KiranaOffer[];
	offered: number;
	donation: Donation | null;
	returnBy: string | null;
	/** the pushes this batch's journey sent the member, by key (detect, verify, plan, approved, offer …) */
	push: Record<string, PushCopy>;
};

/* ---------- the quarter and the audit log ---------- */

export type WsQuarter = {
	label: string;
	recovered: number;
	itc: number;
	kg: number;
	meals: number;
	batches: number;
	weeks: [string, number, number][];
	mix: [string, number][];
	brsr: { cat: string; diverted: number; resold: number; donated: number; disposed: number; evidence: string }[];
	writeOffAvoided: number;
	co2: number;
};

export type WsAuditRow = { id: string; who: string; what: string; target: string; at: string };
export type WsAuditPage = { rows: WsAuditRow[]; before: string | null };

/* ---------- changes ---------- */

/** what every change answers: the stream position it reached, and the batch's journey when one changed */
export type ActionResult = { seq: number; case: CaseDetail | null };

/** a signed upload link: PUT the file to `url` with the given headers, then confirm with its `id` */
export type UploadLink = { id: string; url: string; headers: Record<string, string>; expiresAt: string };
export type UploadRequest = { contentType: string; bytes: number; fileName?: string };

export type WsInviteInput = { name: string; email: string; role: WsRole; org?: string };
export type MemberPatch = { status?: MemberStatus; role?: WsRole };

export type DeviceInput = { token: string; userAgent: string };

/* ---------- live updates ---------- */

export type WorkspaceEventType = 'case' | 'workspace' | 'feed' | 'notification' | 'audit' | 'quarter' | 'reset';

/** one event on the member's stream. `case` and `workspace` mean "read again"; `feed` and `notification` carry the
 *  entry; `reset` means the stream cannot resume from `after`, so read everything again */
export type WorkspaceEvent = {
	seq: number;
	type: WorkspaceEventType;
	wall: string;
	ref: string | null;
	feed: WsFeedEvent | null;
	notification: WsNotification | null;
};

/** GET …/events?after=: the polling fallback, and what the stream sends one at a time */
export type EventsPage = { seq: number; events: WorkspaceEvent[]; reset: boolean };

/* ---------- the API ---------- */

/** backend-api's workspace routes, relative to /v1/workspaces/{ws} */
export interface WorkspaceApi {
	/** GET / (public) */
	workspace(): Promise<WorkspacePublic>;
	/** Firebase signs in with the address and password; then POST /session, which activates an invited member */
	signIn(input: WsSignInInput): Promise<Member>;
	/** GET /session, or null when signed out */
	me(): Promise<Member | null>;
	/** DELETE /session, then Firebase signs out */
	signOut(): Promise<void>;

	/** GET /snapshot */
	snapshot(): Promise<WorkspaceSnapshot>;
	/** GET /cases/{ref} */
	case(ref: string): Promise<CaseDetail>;
	/** GET /quarter */
	quarter(): Promise<WsQuarter>;
	/** GET /audit?before= */
	audit(before?: string | null): Promise<WsAuditPage>;
	/** GET /documents/{ref}/{doc}: a 5-minute signed link to the PDF */
	documentUrl(ref: string, doc: string): Promise<{ url: string; expiresAt: string }>;

	/** POST /setup/exports, then PUT the file, then POST /setup/exports/{id}: a DMS export for the Data agent */
	uploadExport(input: UploadRequest): Promise<UploadLink>;
	exportUploaded(id: string): Promise<ActionResult>;
	/** POST /setup/confirm: the mapping and the guardrails (stage 1, connect) */
	confirmSetup(): Promise<ActionResult>;
	/** POST /permission: the distributor's one-time permission; PATCH /permission {paused} pauses or resumes it */
	permit(): Promise<ActionResult>;
	pause(paused: boolean): Promise<ActionResult>;

	/** POST /cases/{ref}/photos, PUT the photo, POST /cases/{ref}/photos/{id}: the label photo for Vision */
	uploadPhoto(ref: string, input: UploadRequest): Promise<UploadLink>;
	photoSent(ref: string, id: string): Promise<ActionResult>;
	/** POST /cases/{ref}/approval {device}: the one tap */
	approve(ref: string, device: 'phone' | 'desktop'): Promise<ActionResult>;
	/** POST /cases/{ref}/orders {units}: a kirana orders under the scheme, within its cap */
	order(ref: string, units: number): Promise<ActionResult>;
	/** POST /cases/{ref}/bids {price}; POST /cases/{ref}/messages {text}; POST /cases/{ref}/bids/{bid}/accept */
	bid(ref: string, price: number): Promise<ActionResult>;
	message(ref: string, text: string): Promise<ActionResult>;
	accept(ref: string, bid: string): Promise<ActionResult>;
	/** POST /cases/{ref}/donation/confirm and /donation/collect: the food bank's steps */
	confirmPickup(ref: string): Promise<ActionResult>;
	collect(ref: string): Promise<ActionResult>;
	/** POST /cases/{ref}/dispatches {kind}: the buyer's truck loaded, or the van round run */
	dispatch(ref: string, kind: 'truck' | 'van'): Promise<ActionResult>;
	/** POST /cases/{ref}/documents/{doc}/issue: the distributor issues his invoice from Tally */
	issueInvoice(ref: string, doc: string): Promise<ActionResult>;
	/** POST /cases/{ref}/review: finance has reviewed the papers */
	review(ref: string): Promise<ActionResult>;

	/** POST /notifications/read {ids} or {all: true} */
	markRead(ids: string[] | 'all'): Promise<ActionResult>;
	/** POST /members; PATCH /members/{ref} */
	invite(input: WsInviteInput): Promise<ActionResult>;
	updateMember(ref: string, patch: MemberPatch): Promise<ActionResult>;
	/** PUT /rules */
	saveRules(rules: WsRules): Promise<ActionResult>;

	/** POST /devices; DELETE /devices/{token}: FCM tokens for push */
	registerDevice(input: DeviceInput): Promise<void>;
	unregisterDevice(token: string): Promise<void>;

	/** GET /events?after=&wait=: the polling fallback. The stream itself is GET /events/stream (SSE), read by
	 *  workspaceEvents (SC-73) */
	events(after: number): Promise<EventsPage>;
}

/** the API's refusals the workspace app handles by code */
export const WS_ERRORS = {
	signInFailed: 'SIGN_IN_FAILED',
	notAMember: 'NOT_A_MEMBER',
	forbidden: 'FORBIDDEN',
	/** the step is no longer possible: the journey has moved on (read the case again) */
	stale: 'STALE',
	rateLimited: 'RATE_LIMITED'
} as const;
