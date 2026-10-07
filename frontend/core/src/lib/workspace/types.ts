// The shapes of Munchly Foods' workspace as the prototype's data and store hold them (design3/core/data.js and
// store.js). The seed (./seed/workspace.json) is written from design3 by frontend/scripts/seed.mjs; a quantity without a
// limit (Infinity in money.js) is null here.
import type { IconName } from '../icons/registry';

export type RoleId =
	'operator' | 'distributor' | 'retailer' | 'buyer' | 'finance' | 'sustainability' | 'foodbank' | 'admin';

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
	alt: { id: string; short: string; label: string; net: number };
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
};

export type Shelf = {
	date: string;
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

export type Quarter = {
	label: string;
	recovered: number;
	itc: number;
	kg: number;
	meals: number;
	batches: number;
	/** [week, recovered, would-be write-off] */
	weeks: [string, number, number][];
	mix: [string, number][];
	brsr: { cat: string; diverted: number; resold: number; donated: number; disposed: number; evidence: string }[];
	writeOffAvoided: number;
	co2: number;
};

export type Rules = {
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
	listing: null | { id: string; status: 'live' | 'awarded'; units: number; price: number; reserve: number; at: string };
	offer: null | { status: string; at: string; shops: number };
	orders: { id: string; units: number; at: string }[];
	bids: Bid[];
	chat: ChatMessage[];
	award: null | (Award & { at: string; buyer: string; status: string });
	van: { status: 'idle' | 'done'; done: number };
	truck: { status: 'idle' | 'dispatched'; at?: string };
	docs: null | { id: string; status: string }[];
	invoiceIssued: boolean;
	shelf: null | (Shelf & { at: string });
	posted: boolean;
	reviewed?: boolean;
};

export type UserStatus = 'active' | 'invited' | 'deactivated';

/** a member of the workspace: a person in the story, or a partner organisation's account */
export type User = {
	id: string;
	name: string;
	short: string;
	org: string;
	role: RoleId;
	provider: 'google' | 'phone' | 'expiresoon';
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
	mango: { id: string; phase: string; donation: null | 'booked' | 'confirmed' | 'collected' };
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
	quarter: Quarter;
	setup: {
		dms: { source: string; rows: number; columns: [string, string][]; salesDays: number };
		channels: string[];
		allowList: [string, string[]][];
		brandSafety: string[];
		partners: { name: string; minDays: number; minUnits: number; logistics: string; paper: string }[];
		approval: string;
		permissions: Record<string, string>;
		acts: string[];
	};
	shelf: Shelf;
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
	returnBy: string;
	rules: MoneyRules;
	roles: Record<RoleId, string>;
	connectEvent: FeedEvent;
	initial: State;
};

/* ---------- what the screens read from their source (source.ts, SC-67) ---------- */

/** the workspace before anyone signs in: its name, mark and address, and the platform it runs on */
export type WorkspacePublic = {
	workspace: Workspace;
	platform: WorkspaceSeed['platform'];
	/** the stub's own sign-in: the one-time code it sends, and the accounts a visitor may try */
	prototype?: { code: string; accounts: [string, string][] };
};

/** the workspace's own data: who it is, its people and supply chain, the rules it plans by, its batches and quarter */
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
	quarter: Quarter;
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
	shelf: Shelf;
	/** scheme packs may come back until this day */
	returnBy: string;
	/** the pushes of the case, by moment */
	push: Record<string, Push>;
	/** the batch the same agents donate, and how many packs go to the food bank */
	donation: { batch: Batch; sku: Sku; dist: Distributor; plan: Plan; units: number };
};

/** the people a visitor can step into in the stub, by where they stand */
export type ExploreGroup = { group: string; note: string; ids: [string, string][] };

/** an invitation to the workspace: a person or a partner organisation, by email or mobile number */
export type InviteInput = { name: string; contact: string; role: RoleId };

/** the steps of the journey a person takes (the agents take the rest), and what each is told */
export type ActionArgs = {
	connect: undefined;
	permit: undefined;
	/** true pauses, false resumes */
	pause: boolean;
	sendPhoto: undefined;
	/** who approves */
	approve: string;
	/** a kirana's order, and how many packets when it differs from its share */
	order: { kirana: string; units?: number };
	/** the bid, a packet */
	bid: number;
	accept: undefined;
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
