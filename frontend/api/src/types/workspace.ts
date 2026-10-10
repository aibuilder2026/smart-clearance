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

export type WsRole = 'operator' | 'distributor' | 'retailer' | 'buyer' | 'foodbank' | 'admin';
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
	/** what they do: "Regional Supply-Chain Manager", "Owner, distributor" */
	title: string;
	/** wall time of the last sign-in */
	lastSeen: string | null;
};

/* ---------- before sign-in ---------- */

export type WsMark = { from: string; to: string; ink: string };

export type SignInOption = { id: string; icon: string; title: string; who: string; rule: string };

/** someone a synthetic workspace offers on its sign-in: their address fills the form; the password is handed over */
export type SignInAccount = {
	id: string;
	name: string;
	role: WsRole;
	title: string;
	img: string | null;
	email: string;
	/** what they do in the story */
	does: string;
};

/** GET /v1/workspaces/{ws}: what the sign-in page and the installed app show. No token needed */
export type WorkspacePublic = {
	/** the people to sign in as, by where they stand; empty for a real client's workspace */
	accounts: { group: string; note: string; people: SignInAccount[] }[];
	id: string;
	name: string;
	short: string;
	domain: string;
	mark: WsMark;
	platform: { name: string; domain: string };
	signIn: SignInOption[];
	/** the domain Munchly's people sign in on, and what the sign-in suggests typing */
	emailDomain: string;
	hint: string;
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
	/** where its staff pay at a staff sale (SC-87), or null */
	upi: string | null;
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
	screen: string;
	role: string;
	view: string;
	human: boolean;
	time: string;
	sees: string;
	agents: string;
	money: string;
	pain: string;
	relief: string;
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
	/** the Data agent's daily run, which Setup names while it waits for the first export (SC-79) */
	dataTime: string;
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
	/** how long the setup takes, in minutes */
	minutes: number;
	dms: { source: string; file: string; rows: number; columns: [string, string][]; salesDays: number };
	channels: string[];
	channelNames: Record<string, string>;
	allowList: [string, string[]][];
	brandSafety: string[];
	partners: {
		id: string;
		name: string;
		minDays: number;
		minUnits: number;
		logistics: string;
		pickup?: string;
		paper: string;
	}[];
	approval: string;
	/** the distributors that have given the one-time permission, and when, as the setup states it */
	permissions: Record<string, string>;
	acts: string[];
	/** whether Priya has confirmed the Data agent's mapping and the guardrails */
	confirmed: boolean;
	/** how many DMS columns the Data agent mapped */
	mapped: number;
	/** the last DMS export the Data agent loaded */
	lastImport: { at: string; file: string; rows: number; batches: number } | null;
	/** the client's expiry policy, and how packs left at a godown are destroyed there (SC-139) */
	expiry: ExpiryPolicy;
	destruction: WsDestructionSettings | null;
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
	/** the domain Munchly's people sign in on */
	emailDomain: string;
	/** what the sign-in suggests typing */
	hint: string;
	/** what the invite form suggests typing */
	invite: { name: string; contact: string };
};

export type WsClient = {
	name: string;
	short: string;
	city: string;
	gstin: string;
	fssai: string;
	listed: string;
	revenue: string;
	/** packs that go short-dated a quarter, and the share destroyed today */
	shortDatedPerQuarter: number;
	destroyedToday: number;
	skus: number;
	distributors: number;
	kiranas: number;
};

/** another lot on the marketplace (illustrative) */
export type WsMarketLot = {
	id: string;
	name: string;
	icon?: string;
	units: number;
	price: number;
	mrp: number;
	days: number;
	seller: string;
};
/** the marketplace the workspace lists on: its terms, and the other lots on it */
export type WsMarket = { dispatchHours: number; balanceHours: number; minOrder: number; lots: WsMarketLot[] };

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
	/** the packs going to a food bank, for those who see the donation */
	donation: number | null;
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
	market: WsMarket;
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
		/** ended: the lot's days ran out with no buyer (SC-86) */
		status: 'live' | 'awarded' | 'ended';
		units: number;
		price: number;
		/** hidden from the buyer */
		reserve: number | null;
		at: string;
		title: string;
		description: string;
	};
	offer: null | {
		status: 'sent' | 'closed';
		at: string;
		shops: number;
		closesAt: string;
		/** the shops that said not this time (SC-130), by kirana; a kirana is told its own */
		declined: Record<string, { at: string }>;
	};
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
	/** the plan's staff sale at the distributor's godown, open once approved, then recorded with what sold (SC-86);
	 *  for staff and the distributor holding the batch */
	staff: null | {
		status: 'open' | 'recorded';
		units: number;
		price: number;
		godown: string;
		at: string;
		sold: number | null;
		left: number | null;
		recordedAt: string | null;
	};
	docs: null | { id: string; status: string }[];
	invoiceIssued: boolean;
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

export type WsAward = {
	units: number;
	price: number;
	gross: number;
	token: number;
	balance: number;
	/** the buyer's tax invoice for the lot, as Paperwork will draft it, from the moment it is won (SC-96) */
	invoice: WsInvoiceFigures;
};
export type WsInvoiceFigures = { taxable: number; igst: number; gstPct: number; roundOff: number; total: number };
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
	/** awaiting: another's paper still to come (the agency's destruction certificate, SC-139) */
	status: 'generated' | 'drafted' | 'awaiting' | 'not required';
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
	/** the journey day it is dated */
	date: string | null;
	/** whether a PDF can be downloaded (GET …/documents/{id}) */
	pdf: boolean;
	/** the expiry paper's settlement (SC-94): the client's policy, who destroys the packs, and the client's own costs */
	policy?: ExpiryPolicy;
	destroyedBy?: 'client' | 'distributor' | null;
	disposal?: number;
	epr?: number;
	itc?: number;
	/** the GST memo's credit reversed under s.17(5)(h), and the packs given away or destroyed it is reversed on
	 *  (SC-122); `units` is then the packs sold under tax invoices */
	reversed?: number;
	away?: number;
	/** the GST memo: packs destroyed at the distributor's godown, his stock, so his reversal (SC-139) */
	atGodown?: number;
} & Partial<ReceiptFields> &
	Partial<DestructionDocFields>;

/** packs destroyed at the distributor's godown (SC-139): the expiry credit note's lines (the dealer price, the GST he
 *  reverses, grossed up, and the agency's charges) against the agency's certificate; the certificate's agency, its
 *  authorisation, the method and the site, the packs' batch, the evidence and who approved it. `at` is "godown" */
export type DestructionDocFields = {
	credit: number | null;
	gst: number;
	charges: number;
	reversal: number | null;
	dp: number;
	certificate: string;
	agency: string;
	auth: string;
	method: string;
	site: string;
	for: { name: string; address?: string; gstin?: string };
	batch: string;
	bestBefore: string;
	hsn: string;
	/** when the packs were destroyed, in the client's time (2026-10-03T13:20) */
	destroyedAt: string;
	packKg: number;
	evidence: { photos: number; checks: number; of: number };
	/** the member who approved it, by name, and when */
	approvedBy: string;
	approvedAt: string;
};

/** the food bank's receipt for the packs it collected (SC-110, money.js receipt): issued in its name as it collects,
 *  numbered in its own series, in its own form (Feeding India's in-app receipt, India FoodBanking Network's
 *  acknowledgement) */
export type ReceiptFields = {
	/** the food bank's kind of paper, as its setup names it */
	paper: string;
	/** RECEIVED or ACKNOWLEDGED */
	stamp: string;
	kg: number;
	/** the meals, by the food bank's own rule */
	meals: number;
	mealsRule: string;
	/** on a CSR acknowledgement: the packs' value at the donor's cost (indicative), and the CSR activity */
	value: number | null;
	csr: string | null;
	/** the journey time it was collected (HH:MM), and by whom */
	at: string;
	by: string;
	donor: string;
	fssai: string;
	/** the distributor it came through, and from where */
	via: string;
	from: string;
	/** where the food bank serves it */
	spot: string | null;
};
export type WsReceipt = WsDoc & ReceiptFields;

/** a client's expiry policy: what happens to packs that expire at the distributor's godown (SC-94): destroyed there
 *  through an authorised agency against evidence the client approves (SC-139), taken back for full credit, the gap
 *  paid, or none */
export type ExpiryPolicy = 'godown' | 'full-credit' | 'price-support' | 'none';

/** expiry day's settlement of the packs left at the godown (money.js expirySettlement): the credit is null for an SKU
 *  without its dealer price */
export type ExpirySettlement = {
	policy: ExpiryPolicy;
	units: number;
	credit: number | null;
	/** the credit note's amount: the credit, and under SC-139's route B the GST gross-up and the agency's charges */
	amount: number | null;
	gst?: number;
	charges?: number;
	reversal?: number | null;
	at?: 'godown' | null;
	destroyedBy: 'client' | 'distributor' | null;
	kg: number;
	disposal: number;
	epr: number;
	itc: number;
	total: number;
};

/** packs destroyed at the distributor's godown on expiry day (SC-139, option B): he is asked for the evidence (two
 *  photos and the agency's certificate number), Vision checks it, and the client's operator gives the second yes, on
 *  which the expiry credit note and the agency's certificate are issued and the batch closes */
export type WsDestruction = {
	status: 'requested' | 'asked' | 'reading' | 'checked' | 'approved';
	units: number;
	/** why the operator asked again */
	reason: string | null;
	agency: { id: string; name: string; auth: string; site: string } | null;
	certificate: string | null;
	/** each photo as sent: when (the client's time), and a short-lived link to it */
	photos: { before: WsDestructionPhoto; after: WsDestructionPhoto } | null;
	askedAt: string | null;
	sentAt: string | null;
	checkedAt: string | null;
	/** Vision's checks on the photos: the batch on the label, the count in view, the slate, when and where */
	checks: { id: string; label: string; ok: boolean }[];
	/** the member who approved it, by name, and when */
	approvedAt: string | null;
	approvedBy: string | null;
	/** when the distributor is reminded, while the evidence is still asked for */
	remindAt: string | null;
	method: string;
};
export type WsDestructionPhoto = { name: string; at: string; url: string | null };
/** how a client has packs destroyed at a distributor's godown (SC-139; the console's Channels and rules) */
export type WsDestructionAgency = {
	id: string;
	name: string;
	city: string;
	auth: string;
	series: { prefix: string; next: number; width: number };
	site: string;
};
export type WsDestructionSettings = {
	evidence: [string, string][];
	visionCheck: boolean;
	reviewer: string;
	remindDays: number;
	grossUp: boolean;
	chargesPerUnit: number;
	method: string;
	agencies: WsDestructionAgency[];
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
	/** declined: no food bank takes the line, or the one booked turned it down; the packs stay at the godown (SC-86) */
	status: 'booked' | 'confirmed' | 'collected' | 'declined';
	/** null when no food bank was booked */
	partner: string | null;
	units: number;
	/** the pickup the Donation agent proposed, then the one the food bank confirmed */
	pickupAt: string | null;
	/** the other times it may move to */
	slots: string[];
	/** where the food bank serves it */
	spot: string | null;
	from: string;
	/** when the Donation agent booked it, the food bank confirmed and collected */
	at: string;
	confirmedAt: string | null;
	collectedAt: string | null;
	/** the food bank's answer as it confirmed */
	reply: string | null;
	/** why the line went untaken, when declined */
	reason: string | null;
	/** the food bank's receipt, issued as it collected (SC-110); null before, or from a food bank set up without one */
	receipt: WsReceipt | null;
};

/** the moments of a batch's journey its screens state, as facts on the journey clock */
export type CaseMoments = {
	/** when the case opened: its day 0 */
	day0: string;
	/** how soon a plan follows a verified label, in minutes */
	planMinutes: number;
	/** when the distributor was asked for the one-time permission (the setup's confirmation) */
	permissionAskedAt: string | null;
	/** the lot's address on the marketplace, once listed */
	listingUrl: string | null;
	/** the distributor's van round that takes the scheme's orders: the morning after the offer closes */
	van: { leavesAt: string | null; depot: string; doneAt: string | null };
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
	/** what destroying the packs at risk would cost, from the Watcher's assessment: from Detect on, before the plan
	 *  (SC-99); null for those who may not see Munchly's figures */
	writeOff: WsWriteOff | null;
	/** the ledger Impact posted, for those who see Munchly's figures (SC-124) */
	ledger: WsLedgerBatch | null;
	counter: { action: 'accept' | 'counter'; price: number; below: boolean } | null;
	award: WsAward | null;
	actual: WsActual | null;
	support: WsSupport | null;
	supportPlan: WsSupport | null;
	/** what each finished line took (ordered, awarded, sold to staff, collected), and the packs no channel took, left at
	 *  the godown (SC-86); for staff and the distributor, once a line has finished */
	realised: { lines: { id: string; units: number }[]; godown: number } | null;
	/** expiry day's settlement, once the report has run (SC-94) */
	expiry: ExpirySettlement | null;
	/** the packs destroyed at his godown, while the evidence is asked for, checked and approved (SC-139); for staff and
	 *  the distributor */
	destruction: WsDestruction | null;
	claim: WsClaim | null;
	docs: WsDoc[];
	kiranas: KiranaOffer[];
	offered: number;
	donation: Donation | null;
	returnBy: string | null;
	/** the pushes this batch's journey sent the member, by key (detect, verify, plan, approved, offer …) */
	push: Record<string, PushCopy>;
	/** the plan's split without Munchly's figures, once approved: all of it for staff and the distributor, a partner's
	 *  own line for the others */
	split: WsSplitLine[] | null;
	moments: CaseMoments;
};

export type WsSplitLine = Pick<
	WsPlanLine,
	'id' | 'name' | 'short' | 'units' | 'price' | 'packPrice' | 'charged' | 'cartons'
>;

/* ---------- the ledger and the audit log ---------- */

/** a cleared batch's figures, as Impact posted them (money.js realised, settled by the expiry policy) */
export type WsLedgerFigures = {
	/** recovered, after price support and costs */
	net: number;
	/** better than destroying the batch */
	swing: number;
	/** the effect on the P&L, against −writeOff */
	pnl: number;
	/** what destroying the packs at risk would have cost */
	writeOff: number;
	/** input GST kept on the packs sold under tax invoices */
	itcKept: number;
	/** reversed under s.17(5)(h) on the packs donated or destroyed */
	itcReversed: number;
	/** kept out of landfill: resold and donated */
	kg: number;
	/** CO₂e avoided, kg × the factor (indicative) */
	co2: number;
	meals: number;
	/** the batch's packs at risk, and what became of them */
	units: number;
	sold: number;
	donated: number;
	godown: number;
	destroyed: number;
	resoldKg: number;
	donatedKg: number;
	destroyedKg: number;
	/** the plastic packaging on those packs, which goes where its pack goes (SC-125) */
	packResoldKg: number;
	packDonatedKg: number;
	packDestroyedKg: number;
	/** the expiry credit for the packs left at the godown, by the client's policy */
	credit: number;
	/** the price-support credit note to the distributor */
	support: number;
};

export type WsLedgerOutcome = 'sold' | 'leftover' | 'donation';

/** a paper in a cleared batch's pack */
export type WsLedgerPaper = {
	id: string;
	type: string;
	no: string;
	status: string;
	date: string | null;
	amount: number | null;
	pdf: boolean;
};

/** GET /ledger's row for a cleared batch, and CaseDetail.ledger */
export type WsLedgerBatch = {
	ref: string;
	sku: string;
	name: string;
	img: string;
	distributor: string;
	distributorName: string;
	city: string;
	/** the day the Watcher flagged it, and the day its ledger posted */
	flagged: string;
	cleared: string;
	outcome: WsLedgerOutcome;
	/** cleared before the story's journey (SC-123) */
	history: boolean;
	figures: WsLedgerFigures;
	/** what each channel took */
	lines: { id: string; short: string; units: number; price: number; gross: number }[];
	papers: WsLedgerPaper[];
	reviewed: { by: string; at: string | null } | null;
};

/** a batch still out */
export type WsLedgerOpen = {
	ref: string;
	sku: string;
	name: string;
	img: string;
	distributor: string;
	distributorName: string;
	city: string;
	flagged: string;
	phase: Phase;
	/** the stop it is at (STAGES' id) */
	stage: string;
};

export type WsLedgerTotals = WsLedgerFigures & {
	batches: number;
	outcomes: Record<WsLedgerOutcome, number>;
	invoices: number;
	/** price-support and expiry credit notes */
	creditNotes: number;
	receipts: number;
	reviewed: number;
};

export type WsBrsrRow = {
	cat: string;
	diverted: number;
	resold: number;
	donated: number;
	disposed: number;
	evidence: string;
};

/** a quarter of the Indian financial year, or a year so far, with its batches' totals */
export type WsLedgerPeriod = {
	/** fy27-q2, fy27 */
	id: string;
	kind: 'quarter' | 'year';
	/** Q2 FY27, This year */
	label: string;
	/** Jul to Sep 2026; Oct to Dec 2026 · so far; FY 2026-27 so far */
	long: string;
	from: string;
	to: string;
	/** today falls in it */
	current: boolean;
	totals: WsLedgerTotals;
	/** the months with batches cleared, oldest first */
	months: { month: string; label: string; totals: WsLedgerTotals }[];
	/** a quarter's 13 weeks: [label, recovered, the write-off avoided] */
	weeks: [string, number, number][];
	/** the share of the packs each channel took, in whole percent */
	mix: [string, number][];
	mixNames: Record<string, string>;
	/** BRSR Principle 6's waste rows, in kg */
	brsr: WsBrsrRow[];
};

/** GET /ledger (SC-124): every batch cleared in view, by quarter and by year, and the batches still out */
export type WsLedger = {
	/** when the workspace went live, as its people read it */
	since: string;
	/** the journey's today */
	today: string;
	co2PerKg: number;
	periods: WsLedgerPeriod[];
	/** cleared, in the order they cleared */
	batches: WsLedgerBatch[];
	inFlight: WsLedgerOpen[];
};

export type WsAuditRow = { id: string; who: string; what: string; target: string; at: string };
export type WsAuditPage = { rows: WsAuditRow[]; before: string | null };

/* ---------- changes ---------- */

/** what every change answers: the stream position it reached, and the batch's journey when one changed */
export type ActionResult = { seq: number; case: CaseDetail | null };

/** a signed upload link: PUT the file to `url` with the given headers, then confirm with its `id` */
export type UploadLink = { id: string; url: string; headers: Record<string, string>; expiresAt: string };
export type UploadRequest = { contentType: string; bytes: number; fileName?: string };
/** the destruction's evidence (SC-139): the agency by id, its certificate number, and the two photos uploaded */
export type DestructionInput = { agency: string; certificate: string; photos: { before: string; after: string } };

export type WsInviteInput = { name: string; email: string; role: WsRole; org?: string };
export type MemberPatch = { status?: MemberStatus; role?: WsRole };

export type DeviceInput = { token: string; userAgent: string };

/* ---------- live updates ---------- */

export type WorkspaceEventType = 'case' | 'workspace' | 'feed' | 'notification' | 'audit' | 'ledger' | 'reset';

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

/* ---------- a partner's own history (SC-130) ---------- */

/** a time in the client's zone, to the minute (2026-08-27T12:10) */
export type LocalTime = string;
/** a batch a partner took part in, as its own pages read it (design3/core/ledger.js partners), cut to its part: a
 *  distributor reads the plan, what each line took, the price support, his papers and copies of the food bank's
 *  receipt and the destruction certificate; a kirana, the scheme with its own order or Not this time; a food bank, the
 *  donation with its receipt */
export type WsPartnerCase = {
	ref: string;
	sku: string;
	dist: string;
	outcome: WsLedgerOutcome | null;
	/** the day the Watcher flagged it, and the day it cleared (null while it is in a journey) */
	flagged: string;
	cleared: string | null;
	/** each step and when it happened: detect, ask, photo, read, approve, listing, offer, donation, pickup, orders (the
	 *  first), accept, collect, closeOffer (a scheme closed on its clock), staff, truck, papers, invoice, van, review,
	 *  report. The van round also carries when it leaves (SC-97), which a compressed journey can run it before (SC-137) */
	steps: { step: string; at: LocalTime; leaves?: LocalTime }[];
	/** mfg: the day it was made, as its label reads (SC-133) */
	batch: { daysLeft: number; bestBefore: string; mfg: string | null };
	plan: {
		units: number;
		lines: { id: string; short: string; units: number; price: number; packPrice: number | null }[];
	};
	/** what each line took (the ExpireSoon lot at the price the buyer took), and the packs left at the godown; a
	 *  distributor's, once cleared */
	realised: { lines: { id: string; units: number; gross: number; price: number }[]; godown: number } | null;
	listing: { id: string } | null;
	offered: number;
	/** the shops' orders: a distributor's every one, a kirana its own */
	kiranas: { kirana: string; units: number; at: LocalTime }[];
	kirana: { planned: number; ordered: number } | null;
	offer: { status: 'open' | 'closed'; closesAt: LocalTime | null; closedAt: LocalTime | null } | null;
	/** a kirana's own Not this time */
	declined: Record<string, { at: LocalTime }>;
	award: { price: number; token: number } | null;
	partner: { name: string } | null;
	donation: { units: number; spot: string } | null;
	receipt: WsReceipt | null;
	support: { total: number; van: number; fee: number } | null;
	expiry: {
		units: number;
		credit: number;
		/** destroyed at his godown (SC-139): the note's amount, with the GST he reverses and the agency's charges */
		amount?: number | null;
		at?: 'godown' | null;
		reversal?: number | null;
		charges?: number;
	} | null;
	/** destroyed at his godown (SC-139): the evidence he sent and the client's yes */
	destruction?: WsDestruction | null;
	docs: WsDoc[];
};
/** what a partner reads of its own history with the client: the batches it took part in, newest first, the buyer they
 *  name, and a kirana's own shop */
export type WsPartner = {
	buyer: { name: string; city: string };
	shop: { id: string; name: string; area: string; sales14: number; distributor: string; member: string | null } | null;
	cases: WsPartnerCase[];
};

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
	/** GET /ledger */
	ledger(): Promise<WsLedger>;
	/** GET /partner: a distributor's, kirana's or food bank's own history (SC-130) */
	partner(): Promise<WsPartner>;
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
	/** POST /cases/{ref}/offer/decline: a kirana says not this time; an order after all takes it back (SC-130) */
	declineOffer(ref: string): Promise<ActionResult>;
	/** POST /cases/{ref}/bids {price}; POST /cases/{ref}/messages {text}; POST /cases/{ref}/bids/{bid}/accept */
	bid(ref: string, price: number): Promise<ActionResult>;
	message(ref: string, text: string): Promise<ActionResult>;
	accept(ref: string, bid: string): Promise<ActionResult>;
	/** POST /cases/{ref}/donation/confirm and /donation/collect: the food bank's steps */
	/** POST /cases/{ref}/staff-sale {sold}: the distributor records the staff sale once, how many of its packs sold */
	staffSale(ref: string, sold: number): Promise<ActionResult>;
	confirmPickup(ref: string): Promise<ActionResult>;
	collect(ref: string): Promise<ActionResult>;
	/** POST /cases/{ref}/dispatches {kind}: the buyer's truck loaded, or the van round run */
	dispatch(ref: string, kind: 'truck' | 'van'): Promise<ActionResult>;
	/** POST /cases/{ref}/documents/{doc}/issue: the distributor issues his invoice from Tally */
	issueInvoice(ref: string, doc: string): Promise<ActionResult>;
	/** POST /cases/{ref}/review: the operator has reviewed the papers */
	review(ref: string): Promise<ActionResult>;
	/** packs destroyed at his godown (SC-139): POST /cases/{ref}/destruction/photos {which}, PUT each photo, then
	 *  POST /cases/{ref}/destruction {agency, certificate, photos} sends the evidence for Vision to check */
	destructionPhoto(ref: string, which: 'before' | 'after', input: UploadRequest): Promise<UploadLink>;
	sendDestruction(ref: string, input: DestructionInput): Promise<ActionResult>;
	/** POST /cases/{ref}/destruction/approve: the operator's second yes; /destruction/ask {reason}: send it back */
	approveDestruction(ref: string): Promise<ActionResult>;
	askDestructionAgain(ref: string, reason: string): Promise<ActionResult>;

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

	/** GET /events?after=&wait=: the polling fallback; `wait` (up to 25 s) holds the answer until something happens.
	 *  The stream itself is GET /events/stream (SSE), read by workspaceEvents (SC-73) */
	events(after: number, wait?: number): Promise<EventsPage>;
}
