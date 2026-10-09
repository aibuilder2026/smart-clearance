// The shapes of Munchly Foods' workspace as the prototype's data and store hold them (design3/core/data.js and
// store.js). The seed (./seed/workspace.json) is written from design3 by frontend/scripts/seed.mjs; a quantity without a
// limit (Infinity in money.js) is null here.
import type { IconName } from '../icons/registry';

export type RoleId = 'operator' | 'distributor' | 'retailer' | 'buyer' | 'foodbank' | 'admin';

export type Workspace = {
	id: string;
	name: string;
	short: string;
	domain: string;
	emailDomain: string;
	mark: { from: string; to: string; ink: string };
	since: string;
	plan: string;
	region: string;
	signIn: { id: string; icon: string; title: string; who: string; rule: string }[];
	outside: string;
	/** what the sign-in suggests typing */
	hint: string;
	/** what the invite form suggests typing */
	invite: { name: string; contact: string };
	profile: { id: string; icon: IconName; title: string; value: string; text: string }[];
};

export type Sku = {
	id: string;
	code: string;
	brand: string;
	name: string;
	category: string;
	hsn: string;
	mrp: number;
	/** the distributor's price, where the data sets one */
	dp?: number;
	cost: number;
	gst: number;
	itcPerUnit?: number;
	perCarton: number;
	lifeDays: number;
	kgPerUnit: number;
	img: string;
	/** the product's own tax history, as its invoice states it */
	gstNote?: string;
};

export type Distributor = {
	id: string;
	name: string;
	short: string;
	city: string;
	state: string;
	godown: string;
	address?: string;
	gstin?: string;
	kiranas: number;
	cluster: string;
	territory: string;
	pins: string;
	staffCap?: number;
	/** where its staff pay at a staff sale (SC-87) */
	upi?: string | null;
};

export type Buyer = {
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

export type PersonKind = 'staff' | 'partner' | 'external';

export type StoryPerson = {
	id: string;
	name: string;
	short: string;
	role: string;
	org: string;
	city: string;
	img: string;
	email?: string;
	phone?: string;
	sign: string;
	lang?: string;
	kind: PersonKind;
};

export type Gate = { id: string; app: string; need: number; has: number; pass: boolean; rule: string };

/** the Watcher's reading of a batch (money.js assess) */
export type Assess = {
	gates: Gate[];
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

export type Batch = {
	id: string;
	sku: string;
	distributor: string;
	units: number;
	daysLeft: number;
	sellPerDay: number;
	bestBefore: string;
	mfg: string;
	city: string;
	staffCap?: number;
	shelf?: string;
	hero?: boolean;
	second?: boolean;
	/** the phase of the batch's own journey, when the source knows it: the live workspace has every batch's (SC-102);
	 *  the prototype's stub only the batch in focus's, from the state */
	journey?: Phase;
	assess: Assess;
};

/** a batch with its SKU and distributor, and the phase the journey has it at (the prototype's batchView) */
export type BatchView = Batch & { skuObj: Sku; dist: Distributor; phase?: string };

export type Kirana = { id: string; name: string; area: string; units: number; at: string };

export type Stage = {
	id: string;
	n: number;
	title: string;
	when: string;
	who: string;
	screen: string;
	role: string;
	view: string;
	human: boolean;
	/** when it happens, on the tracker (the kit's STAGE_TIMES) */
	time: string;
	sees: string;
	agents: string;
	money: string;
	pain: string;
	relief: string;
};

/** an entry in the agents' timeline: an agent's step, or a person's */
export type FeedEvent = {
	id?: string;
	key?: string;
	stage: string;
	agent?: string;
	person?: string;
	icon?: IconName;
	at: string;
	/** minutes since the entry before, which draws the gap */
	min: number;
	text: string;
	calls?: [string, string, string][];
	human?: boolean;
};

export type Push = { to?: string; at: string; title: string; body: string; hindi?: boolean; en?: string };
export type ChatMessage = { from: 'buyer' | 'agent'; text: string; at: string };

/** a channel as the Valuer priced it */
export type ChannelRow = {
	id: string;
	name: string;
	short: string;
	need: string;
	clears: string;
	icon: IconName;
	price: number;
	packPrice: number | null;
	pricePctLabel: string;
	costPerUnit: number;
	itcLoss: number;
	net: number;
	/** null: unlimited */
	capacity: number | null;
	eligible: boolean;
	reason: string;
	itc: 'retained' | 'reversed';
	indicative?: boolean;
};

/** a channel in the Router's split */
export type PlanLine = {
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

export type WriteOff = {
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

export type Plan = {
	units: number;
	rows: ChannelRow[];
	lines: PlanLine[];
	gross: number;
	costs: number;
	itcLoss: number;
	net: number;
	pctMRP: number;
	writeOff: WriteOff;
	bookCost: number;
	pnl: number;
	swing: number;
	cashAvoided: number;
	itcRetained: number;
	itcReversed: number;
	disposalAvoided: number;
	/** the best single exit the Router weighed against its split; none when no exit could take the whole batch */
	alt: { id: string; short: string; label: string; net: number } | null;
	kg: number;
	co2: number;
	meals: number;
	soldUnits: number;
	donated: number;
	leftover: number;
};

/** the result after the negotiation */
export type Actual = {
	net: number;
	delta: number;
	swing: number;
	pnl: number;
	esPlanned: number;
	esActual: number;
};

export type Award = { units: number; price: number; gross: number; token: number; balance: number };

export type SupportRow = { id: string; short: string; units: number; price: number; gap: number; amount: number };
export type Support = { rows: SupportRow[]; gap: number; van: number; fee: number; total: number };

export type Doc = {
	id: string;
	type: string;
	owner: string;
	no: string;
	status: 'generated' | 'drafted' | 'not required';
	amount: number;
	note?: string;
	taxable?: number;
	igst?: number;
	roundOff?: number;
	total?: number;
	units?: number;
	price?: number;
	gstPct?: number;
	exact?: number;
	/** when the document is dated (the invoice) */
	date?: string;
	/** the expiry paper's settlement (SC-94) */
	policy?: 'full-credit' | 'price-support' | 'none';
	destroyedBy?: 'client' | 'distributor' | null;
	disposal?: number;
	epr?: number;
	itc?: number;
	/** the GST memo's credit reversed, and the packs given away or destroyed (SC-122) */
	reversed?: number;
	away?: number;
	/** the food bank's receipt (SC-110, money.js receipt) */
	paper?: string;
	stamp?: string;
	kg?: number;
	meals?: number;
	mealsRule?: string;
	value?: number | null;
	csr?: string | null;
	at?: string;
	by?: string;
	donor?: string;
	fssai?: string;
	via?: string;
	from?: string;
	spot?: string | null;
	/** whether its PDF can be downloaded (the live source) */
	pdf?: boolean;
};

/** expiry day's settlement of the packs left at the godown (SC-94, money.js expirySettlement) */
export type ExpirySettlement = {
	policy: 'full-credit' | 'price-support' | 'none';
	units: number;
	credit: number | null;
	destroyedBy: 'client' | 'distributor' | null;
	kg: number;
	disposal: number;
	epr: number;
	itc: number;
	total: number;
};

export type Rules = {
	watchTime: string;
	/** the Data agent's daily run (SC-79) */
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

/** money.js RULES, the planning rules every figure was worked out with */
export type MoneyRules = {
	disposalPerUnit: number;
	eprPerKg: number;
	co2PerKg: number;
	vanPerUnit: number;
	listingFee: number;
	tokenPct: number;
	kiranaWindowDays: number;
	kiranaUplift: number;
	shopCapTimes: number;
	staffCap: number;
	returnWindowDays: number;
	gates: { blinkit: { minDays: number }; zepto: { pctLife: number }; instamart: { pctLife: number } };
	negotiation: { reservePerUnit: number; counterPctOfAsk: number };
	/** a kirana pays the pack price for `buy` packets and gets `free` more */
	scheme: { buy: number; free: number };
	ewayThreshold: number;
};

/* ---------- the store: one workspace's live state ---------- */

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

export type Bid = {
	id: string;
	price: number;
	at: string;
	by: string;
	status: 'placed' | 'countered' | 'accepted' | 'declined';
	counter?: number;
};

export type Hero = {
	id: string;
	phase: Phase;
	photo: { status: 'none' | 'requested' | 'reading' | 'verified'; at?: string; confidence?: number };
	plan: null | { status: 'proposed' | 'approved'; at: string; by?: string; device?: string };
	listing: null | {
		id: string;
		/** ended: the lot closed unsold on its deadline (SC-86) */
		status: 'live' | 'awarded' | 'ended';
		units: number;
		price: number;
		reserve: number;
		at: string;
	};
	offer: null | { status: string; at: string; shops: number };
	orders: { id: string; units: number; at: string }[];
	/** the shops that said not this time to the open scheme (SC-130); an order after all takes its shop off */
	declined?: Record<string, { at: string }>;
	bids: Bid[];
	chat: ChatMessage[];
	award: null | (Award & { at: string; buyer: string; status: string });
	van: { status: 'idle' | 'done'; done: number };
	truck: { status: 'idle' | 'dispatched'; at?: string };
	docs: null | { id: string; status: string }[];
	invoiceIssued: boolean;
	posted: boolean;
	reviewed?: boolean;
	/** the plan's staff sale at the distributor's godown (SC-86), open once approved, then recorded with what sold; the
	 *  story's stub opens none */
	staff?: StaffSale | null;
};

export type StaffSale = {
	status: 'open' | 'recorded';
	units: number;
	price: number;
	godown: string;
	at: string;
	sold: number | null;
	left: number | null;
};

export type UserStatus = 'active' | 'invited' | 'deactivated';

/** a member of the workspace: a person in the story, or a partner organisation's account */
export type User = {
	id: string;
	name: string;
	short: string;
	org: string;
	role: RoleId;
	/** how they sign in: the prototype's Google, phone code or ExpireSoon; the live workspace's email and password */
	provider: 'google' | 'phone' | 'expiresoon' | 'password';
	status: UserStatus;
	kind: PersonKind;
	img?: string;
	city?: string;
	email?: string;
	phone?: string;
	sign?: string;
	lang?: string;
	invitedBy?: string;
	extra?: boolean;
	lastSeen: string | null;
};

export type Notification = {
	id: string;
	to: string;
	read: boolean;
	title: string;
	body: string;
	at: string;
	link?: string;
	hindi?: boolean;
	en?: string;
};

export type AuditRow = { id: string; who: string; what: string; target: string; at: string };

export type Integration = {
	id: string;
	name: string;
	kind: string;
	status: 'ok' | 'mock';
	note: string;
};

export type State = {
	v: number;
	workspace: string;
	setup: { confirmed: boolean; mapped: number; permission: null | { by: string; at: string; paused: boolean } };
	hero: Hero;
	mango: {
		id: string;
		phase: string;
		donation: null | 'booked' | 'confirmed' | 'collected' | 'declined';
		/** the stub's staff sale for the second batch, once recorded (SC-133) */
		staff?: { status: 'open' | 'recorded'; units: number; sold: number | null; left: number | null } | null;
	};
	feed: FeedEvent[];
	notifications: Notification[];
	audit: AuditRow[];
	users: User[];
	rules: Rules;
	integrations: Integration[];
	seq: number;
};

/** everything the seed carries */
export type WorkspaceSeed = {
	day0: string;
	platform: { name: string; domain: string };
	workspace: Workspace;
	client: {
		name: string;
		short: string;
		city: string;
		listed: string;
		gstin: string;
		fssai: string;
		revenue: string;
		skus: number;
		distributors: number;
		kiranas: number;
		shortDatedPerQuarter: number;
		destroyedToday: number;
	};
	skus: Record<string, Sku>;
	distributors: Record<string, Distributor>;
	buyer: Buyer;
	people: Record<string, StoryPerson>;
	kiranas: Kirana[];
	offered: number;
	batches: Batch[];
	stages: Stage[];
	push: Record<string, Push>;
	chat: ChatMessage[];
	events: FeedEvent[];
	setup: {
		/** how long the setup takes, in minutes */
		minutes: number;
		dms: { source: string; file: string; rows: number; columns: [string, string][]; salesDays: number };
		channels: string[];
		channelNames: Record<string, string>;
		allowList: [string, string[]][];
		brandSafety: string[];
		partners: Partner[];
		approval: string;
		permissions: Record<string, string>;
		acts: string[];
	};
	risk: Assess;
	plan: Plan;
	counter: { action: string; price: number; below: boolean };
	award: Award;
	actual: Actual;
	support: Support;
	supportPlan: Support;
	claim: { units: number; credit: number; disposal: number; epr: number; itc: number; total: number };
	docs: Doc[];
	mangoPlan: Plan;
	mangoFb: number;
	/** the receipt Feeding India issues as the Mango Drink is collected (SC-110) */
	mangoReceipt: Doc;
	returnBy: string;
	rules: MoneyRules;
	roles: Record<RoleId, string>;
	connectEvent: FeedEvent;
	journey: Journey;
	market: Market;
	explore: Explore;
	initial: State;
};

/** a food-bank partner and its intake rules */
export type Partner = {
	name: string;
	minDays: number;
	minUnits: number;
	logistics: string;
	/** how it collects, in short */
	pickup?: string;
	paper: string;
	/** its own receipt for what it collects, and its own rule for the meals a donation makes (SC-110) */
	receipt?: {
		title: string;
		stamp: string;
		series: { prefix: string; next: number; width: number };
		csr: string | null;
		note: string;
	};
	meals?: { packs?: number; kg?: number; rule: string };
};

/** the moments of the batch's journey the screens state beyond its timeline */
export type Journey = {
	/** the day it starts, as the screens date it */
	today: string;
	/** how soon a plan follows a verified label, in minutes */
	planMinutes: number;
	/** when the distributor was asked for the one-time permission */
	permissionAsked: string;
	/** the lot's listing on the marketplace */
	listing: { id: string; url: string };
	/** the distributor's van round that takes the scheme orders, and his answer to it */
	van: { day: string; date: string; leaves: string; depot: string; reply: string; replyAt: string };
	/** the donation's partner, pickup and schedule */
	donation: {
		partner: string;
		from: string;
		spot: string;
		day: string;
		date: string;
		time: string;
		hour: string;
		asked: string;
		confirmed: string;
		collected: string;
		slots: string[];
		reply: string;
	};
};

/** a lot on the marketplace */
export type MarketLot = {
	id: string;
	name: string;
	icon?: IconName;
	units: number;
	price: number;
	mrp: number;
	days: number;
	seller: string;
};
/** ExpireSoon, another company's marketplace: its terms, and its other lots (illustrative) */
export type Market = { dispatchHours: number; balanceHours: number; minOrder: number; lots: MarketLot[] };

/** the stub's people to step into, the code it sends and the accounts its sign-in suggests */
export type Explore = { groups: ExploreGroup[]; code: string; accounts: [string, string][] };

/* ---------- what the screens read from their source (source.ts, SC-67) ---------- */

/** the workspace before anyone signs in: its name, mark and address, and the platform it runs on */
export type WorkspacePublic = {
	workspace: Workspace;
	platform: WorkspaceSeed['platform'];
	/** the stub's own sign-in: the one-time code it sends, and the accounts a visitor may try */
	prototype?: { code: string; accounts: [string, string][] };
	/** a live workspace's sign-in (SC-73): the story's people, by where they stand; a chip fills the email only, the
	 *  password is handed over apart. Empty for a real client's workspace */
	accounts?: SignInGroup[];
};

/** someone a synthetic workspace offers on its sign-in, by address only */
export type SignInPerson = {
	id: string;
	name: string;
	role: RoleId;
	title: string;
	img?: string;
	email: string;
	/** what they do in the story */
	does: string;
};
export type SignInGroup = { group: string; note: string; people: SignInPerson[] };

/** the live workspace's journey clock (SC-73): the journey time when the workspace was read, the wall time it was read
 *  at, and the client's pace (one journey day lasts dayMinutes of real time, 1 to 1,440; 1,440 is real time) */
export type JourneyClock = { now: string; read: number; dayMinutes: number; compressed: boolean; day: number | null };

/** a batch in a journey that a screen can put in focus (the live workspace, SC-73): its tab's facts */
export type CaseTab = {
	ref: string;
	/** its SKU, by id in the workspace's data */
	sku: string;
	/** the stage it is at, 0 to 8, or 9 once cleared */
	stage: number;
	phase: Phase;
};

/** the workspace's own data: who it is, its people and supply chain, the rules it plans by, and its batches */
export type WorkspaceData = {
	/** the day the workspace's story starts */
	day0: string;
	platform: WorkspaceSeed['platform'];
	workspace: Workspace;
	client: WorkspaceSeed['client'];
	skus: Record<string, Sku>;
	distributors: Record<string, Distributor>;
	people: Record<string, StoryPerson>;
	roles: Record<RoleId, string>;
	rules: MoneyRules;
	setup: WorkspaceSeed['setup'];
	/** the nine stages, with when each happens and who acts */
	stages: Stage[];
	/** every batch the Watcher sees */
	batches: Batch[];
	/** the marketplace the workspace lists on */
	market: Market;
	/** every shop a distributor's scheme goes to, the 31 that order in the story and the rest (the stub's, SC-130) */
	shops?: Shop[];
};

/** the batch in focus, and everything its screens read about it: its product and distributor, the kiranas and the
 *  buyer it goes to, the plan, the deal, the papers and the second batch the same agents donate */
export type CaseData = {
	batch: Batch;
	sku: Sku;
	dist: Distributor;
	buyer: Buyer;
	/** the kiranas that ordered, and how many were offered the scheme */
	kiranas: Kirana[];
	offered: number;
	/** the scheme the kiranas are offered */
	scheme: { buy: number; free: number };
	risk: Assess;
	plan: Plan;
	/** the Router's two lines: the kirana scheme and the ExpireSoon lot */
	lines: { kirana: PlanLine; expiresoon: PlanLine };
	counter: WorkspaceSeed['counter'];
	award: Award;
	actual: Actual;
	support: Support;
	supportPlan: Support;
	claim: WorkspaceSeed['claim'];
	docs: Doc[];
	/** the invoice the distributor issues to the buyer */
	invoice: Doc;
	/** scheme packs may come back until this day */
	returnBy: string;
	/** the pushes of the case, by moment */
	push: Record<string, Push>;
	/** the day the case starts, as the screens date it */
	today: string;
	/** how soon a plan follows a verified label, in minutes */
	planMinutes: number;
	/** when the distributor was asked for the one-time permission */
	permissionAsked: string;
	/** the lot's listing on the marketplace */
	listing: Journey['listing'];
	/** the distributor's van round that takes the scheme orders */
	van: Journey['van'];
	/** what each finished line took, and the packs no channel took, left at the godown (SC-86); the live source only,
	 *  once a line has finished */
	realised?: { lines: { id: string; units: number }[]; godown: number } | null;
	/** expiry day's settlement, once the report has run (SC-94); the live source only */
	expiry?: ExpirySettlement | null;
	/** the batch the same agents donate: how many packs go to the food bank, which partner takes them, and when */
	donation: { batch: Batch; sku: Sku; dist: Distributor; plan: Plan; units: number; partner: Partner } & Omit<
		Journey['donation'],
		'partner'
	> & {
			/** the food bank's receipt, once it has collected (SC-110) */
			receipt: Doc | null;
		};
};

/* ---------- the partners' own history (SC-130; design3/core/ledger.js partners) ---------- */

/** a shop a distributor's scheme goes to (world.js): every kirana in its cluster, the 31 that order in the story and
 *  the rest, each with the member who runs it */
export type Shop = {
	id: string;
	name: string;
	area: string;
	sales14: number;
	distributor: string;
	member: string | null;
};
/** a batch a partner took part in, as the partner's own pages read it: when each step happened, the plan and what
 *  each line took, the deal and the papers, cut to the partner's part. The stub reads the history's cases from the
 *  seed; the live workspace reads backend-api's (GET …/partner) */
export type PartnerCase = {
	ref: string;
	/** the SKU and the distributor, by id */
	sku: string;
	dist: string;
	outcome: LedgerOutcome | null;
	/** the day the Watcher flagged it, and the day it cleared (null while it is in a journey) */
	flagged: string;
	cleared: string | null;
	/** each step and when it happened, in the client's time (2026-08-27T09:00) */
	steps: { step: string; at: string }[];
	batch: { daysLeft: number; bestBefore: string; mfg?: string | null };
	plan: {
		units: number;
		lines: { id: string; short: string; units: number; price: number; packPrice: number | null }[];
	};
	/** what each line took, and the packs left at the godown; once the lines are done */
	realised: { lines: { id: string; units: number; gross: number; price: number }[]; godown: number } | null;
	listing: { id: string } | null;
	/** how many shops the scheme went to, the shops that ordered (a kirana sees its own), and the scheme's count */
	offered: number;
	kiranas: { kirana: string; units: number; at?: string }[];
	kirana: { planned: number; ordered: number } | null;
	/** the scheme while it runs, and the shops that said not this time (a kirana is sent its own); the live workspace's */
	offer?: { status: 'open' | 'closed'; closesAt: string | null; closedAt?: string | null } | null;
	declined?: Record<string, { at: string }>;
	award: { price: number; token: number } | null;
	partner: { name: string } | null;
	donation: { units: number; spot: string } | null;
	receipt: Doc | null;
	support: { total: number; van: number; fee: number } | null;
	expiry: { units: number; credit: number } | null;
	docs: Doc[];
};
/** what a partner reads of its own history with the client: the batches it took part in, the buyer they name, and a
 *  kirana's own shop */
export type PartnerView = { buyer: { name: string; city: string }; shop: Shop | null; cases: PartnerCase[] };
/** a moment of a batch, on its What happened tab; one still to come has no time */
export type PtMoment = { k: string; at?: string; icon: string; title: string; sub?: string; ahead?: boolean };
/** how a distributor ended whole: what he received against what he paid */
export type PtWhole = {
	rows: { k: string; sub?: string; v: number; paper?: string }[];
	recv: number;
	paid: number;
	gain: number;
	dp: number;
	units: number;
};
/** an offer a kirana was sent, and what came of it */
export type PtOffer = {
	ref: string;
	story?: boolean;
	open?: boolean;
	sku: Sku;
	dist: Distributor;
	sent: string;
	closed: string;
	share: number;
	pack: number;
	mrp: number;
	bestBefore: string;
	status: 'open' | 'ordered' | 'declined' | 'expired';
	why: 'filled' | 'time' | null;
	declinedAt?: string | null;
	units: number;
	orderedAt: string | null;
	van: string | null;
	m: { n: number; free: number; paid: number; pay: number; sell: number; margin: number } | null;
};
/** a donation a food bank collected, with its receipt */
export type PtPickup = {
	ref: string;
	sku: Sku;
	dist: Distributor;
	units: number;
	kg: number;
	meals: number;
	receipt: Doc;
	spot: string;
	from: string;
	asked: string | null;
	confirmed: string | null;
	collected: string;
	bestBefore: string;
	daysLeft: number;
};

/* ---------- the ledger (SC-121, SC-124; design3/core/ledger.js) ---------- */

/** a cleared batch's figures, as Impact posted them (money.js realised, settled by the expiry policy) */
export type LedgerFigures = {
	net: number;
	swing: number;
	pnl: number;
	writeOff: number;
	itcKept: number;
	itcReversed: number;
	kg: number;
	co2: number;
	meals: number;
	units: number;
	sold: number;
	donated: number;
	godown: number;
	destroyed: number;
	resoldKg: number;
	donatedKg: number;
	destroyedKg: number;
	/** the plastic packaging on those packs (SC-125) */
	packResoldKg: number;
	packDonatedKg: number;
	packDestroyedKg: number;
	credit: number;
	support: number;
};
export type LedgerOutcome = 'sold' | 'leftover' | 'donation';
export type LedgerPaper = {
	id: string;
	type: string;
	no: string;
	status: string;
	date: string | null;
	amount: number | null;
	pdf: boolean;
};
/** a cleared batch in the ledger */
export type LedgerBatch = {
	ref: string;
	sku: string;
	name: string;
	img: string;
	distributor: string;
	distributorName: string;
	city: string;
	flagged: string;
	cleared: string;
	outcome: LedgerOutcome;
	history: boolean;
	figures: LedgerFigures;
	lines: { id: string; short: string; units: number; price: number; gross: number }[];
	papers: LedgerPaper[];
	reviewed: { by: string; at: string | null } | null;
};
/** a batch still out */
export type LedgerOpen = {
	ref: string;
	sku: string;
	name: string;
	img: string;
	distributor: string;
	distributorName: string;
	city: string;
	flagged: string;
	phase: string;
	/** the stop it is at (a stage's id) */
	stage: string;
};
export type LedgerTotals = LedgerFigures & {
	batches: number;
	outcomes: Record<LedgerOutcome, number>;
	invoices: number;
	creditNotes: number;
	receipts: number;
	reviewed: number;
};
export type BrsrRow = {
	cat: string;
	diverted: number;
	resold: number;
	donated: number;
	disposed: number;
	evidence: string;
};
/** a quarter of the Indian financial year, or a year so far */
export type LedgerPeriod = {
	id: string;
	kind: 'quarter' | 'year';
	label: string;
	long: string;
	from: string;
	to: string;
	current: boolean;
	totals: LedgerTotals;
	months: { month: string; label: string; totals: LedgerTotals }[];
	weeks: [string, number, number][];
	mix: [string, number][];
	mixNames: Record<string, string>;
	brsr: BrsrRow[];
};
/** the ledger: every batch cleared, by quarter and by year, and the batches still out */
export type Ledger = {
	since: string;
	today: string;
	co2PerKg: number;
	periods: LedgerPeriod[];
	batches: LedgerBatch[];
	inFlight: LedgerOpen[];
};
/** a batch's own page in the ledger: its case as the papers read it, its state (drafted, reviewed, posted) and, once
 *  Impact has posted it, its row */
export type LedgerPage = { c: CaseData; h: Hero; row: LedgerBatch | null };

/** the people a visitor can step into in the stub, by where they stand */
export type ExploreGroup = { group: string; note: string; ids: [string, string][] };

/** an invitation to the workspace: a person or a partner organisation, by email (SC-68: an email address only) */
export type InviteInput = { name: string; contact: string; role: RoleId };

/** the steps of the journey a person takes (the agents take the rest), and what each is told */
export type ActionArgs = {
	connect: undefined;
	permit: undefined;
	/** true pauses, false resumes */
	pause: boolean;
	/** the label photo: the live source uploads it; the stub only marks it sent */
	sendPhoto: Blob | undefined;
	/** who approves */
	approve: string;
	/** a kirana's order, and how many packets when it differs from its share */
	order: { kirana: string; units?: number };
	/** a kirana says not this time to the open scheme (SC-130) */
	decline: string;
	/** the bid, a packet */
	bid: number;
	accept: undefined;
	/** the staff sale recorded: how many of its packs sold (SC-87) */
	recordStaffSale: number;
	confirmPickup: undefined;
	collect: undefined;
	dispatch: undefined;
	issueInvoice: undefined;
	review: undefined;
	vanRound: undefined;
	/** who joins */
	join: string;
};
export type HumanAction = keyof ActionArgs;
export type ActionArg<N extends HumanAction> = ActionArgs[N];

export type Connection = 'local' | 'connecting' | 'live' | 'reconnecting' | 'polling' | 'paused' | 'offline';
export type SourceStatus = { phase: 'loading' | 'ready' | 'error'; error?: unknown; connection: Connection };
