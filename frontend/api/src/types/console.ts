// The staff console's part of the contract (console.smartclearance.com): the platform's own staff, every client
// workspace (its supply chain, agents, exits and rules, people, integrations and plan), and the audit log. The shapes
// are design3/core/platform.js's, the console prototype's mock backend. Shared shapes are in shared.ts.
import type { Catalog, DemoRequest, Mark, PasswordAuth, WorkspaceMatch } from './shared';

/** how far an agent may go before a person says yes */
export type Autonomy = 'suggest' | 'ask' | 'act';
export type AutonomyLevel = { id: Autonomy; label: string; text: string };

export type SettingValue = string | number | boolean | null;
export type AgentSettings = Record<string, SettingValue>;
/** one of an agent's settings, as the console edits it */
export type SettingField = {
	key: string;
	label: string;
	/** how the audit log names it ("floor", "daily run") */
	short?: string;
	type: 'time' | 'number' | 'money' | 'switch' | 'select' | 'stepper' | 'approver';
	unit?: string;
	min?: number;
	max?: number;
	step?: number;
	options?: string[];
	/** a switch that can't be changed, and why */
	locked?: string;
};
/** an agent as one client runs it; the approval gate's autonomy is always "gate" */
export type AgentConfig = {
	on: boolean;
	autonomy: Autonomy | 'gate';
	settings: AgentSettings;
	last: string | null;
	next: string | null;
};

export type ExitId = 'expiresoon' | 'kirana' | 'staff' | 'foodbank' | 'd2c';
export type ExitDef = { id: ExitId; name: string; icon: string };
/** an exit for one client: on or off, or locked off with the reason */
export type ExitState = { on: boolean; locked?: string | null; cap?: number };
export type Exits = Record<ExitId, ExitState>;

/** the supply-chain profile a client answers at onboarding; its exits and agents follow from it */
export type Profile = {
	route: 'distributors' | 'modern-trade' | 'own';
	owner: 'distributor' | 'manufacturer';
	expiry: 'full-credit' | 'price-support' | 'none';
};
export type ProfileQuestion = keyof Profile;
export type ProfileQuestionDef = { label: string; options: { id: string; label: string }[] };

export type PresetId = 'cautious' | 'standard' | 'trusted';
/** how far a new client's agents go at first */
export type Preset = { id: PresetId; label: string; text: string };

export type Rules = {
	reserve: number;
	scheme: string;
	staffCap: number;
	tokenPct: number;
	offerWindowHours: number;
	hindiOffers: boolean;
	requirePhoto: boolean;
};
/** the quick-commerce shelf-life gates: Blinkit's days left, Zepto's and Instamart's share of life left */
export type Gates = { blinkitDays: number; qcomPct: number };

export type Access = 'Approver' | 'Admin' | 'Member' | 'Partner';
export type PersonStatus = 'active' | 'invited' | 'deactivated';
export type ClientPerson = {
	id: string;
	name: string;
	org: string;
	role: string;
	kind: string;
	access: Access;
	/** how they sign in: "Google", "Phone and code", "Google, invited" */
	provider: string;
	status: PersonStatus;
	img: string | null;
	email: string;
	phone: string;
};
export type Distributor = {
	id: string;
	name: string;
	city: string;
	state?: string;
	kiranas: number;
	staffCap: number | null;
	/** the one-time permission that lets the agents act in the distributor's name */
	permission: 'given' | 'not-yet';
};
/** an SKU's own quick-commerce gates (SC-47): each value is the SKU's, absent for the client's default */
export type SkuGates = { blinkitDays?: number; qcomPct?: number };
export type Sku = {
	id: string;
	code: string;
	brand: string;
	name: string;
	mrp: number;
	gst: number;
	lifeDays: number;
	gates: SkuGates;
};
export type GateApp = 'blinkit' | 'zepto' | 'instamart';
/** where a batch's gate comes from: its own override, its SKU's own gates, or the client's default */
export type GateSource = 'default' | 'sku' | 'override';
/** a gate as the agents read it: what the app needs and what the batch has, in days left for Blinkit and in % of the
 *  SKU's life left for Zepto and Instamart */
export type GateCheck = { app: GateApp; need: number; has: number; pass: boolean; source: GateSource };
/** one batch's own gates, with why, who set them and when ("4 Oct, 16:20", "Today, 09:40") */
export type BatchOverride = { blinkitDays?: number; qcomPct?: number; reason: string; by: string; at: string };
/** an open batch and its quick-commerce gates as the agents read them (GET …/clients/:id/batches) */
export type BatchGates = {
	ref: string;
	sku: string;
	distributor: string;
	units: number;
	/** ISO date: 2026-11-18 */
	bestBefore: string;
	daysLeft: number;
	lifeDays: number;
	blinkitDays: number;
	qcomPct: number;
	checks: GateCheck[];
	override?: BatchOverride;
};
export type OverrideInput = { blinkitDays?: number; qcomPct?: number; reason: string };
export type Integration = {
	id: string;
	name: string;
	kind: string;
	status: 'ok' | 'mock' | 'soon' | 'waiting';
	note: string;
};
export type SignInMethod = { id: string; title: string; who: string; rule: string; on: boolean };

/** one manufacturer's workspace on Smart-Clearance */
export type Client = {
	id: string;
	name: string;
	legal: string;
	city: string;
	industry: string;
	domain: string;
	emailDomain: string;
	mark: Mark;
	plan: string;
	status: 'live' | 'setting-up';
	since: string | null;
	region: string;
	profile: Profile;
	gates: Gates;
	territoryGuard: boolean;
	returnWindowDays: number;
	exits: Exits;
	rules: Rules;
	signIn: SignInMethod[];
	distributors: Distributor[];
	skus: Sku[];
	people: ClientPerson[];
	integrations: Integration[];
	recovered: number;
	batches: number;
	approver: string | null;
	agents: Record<string, AgentConfig>;
};

export type StaffRole = 'Super admin' | 'Platform engineer' | 'Support';
/** one of Smart-Clearance's own people, who sign in to the console */
export type Staff = {
	id: string;
	name: string;
	short: string;
	role: StaffRole;
	team: string;
	email: string;
	/** the device their passkey lives on */
	passkey: string;
	status: 'active' | 'invited';
};

/** one of the nine stages a batch passes, with when it happens and who acts */
export type TrackStage = { id: string; title: string; human: boolean; time: string; who: string };
/** a batch on the move, for a client */
export type Track = {
	client: string;
	batch: string;
	product: string;
	distributor: string;
	city: string;
	done: number;
	current: number;
	note?: string;
	/** recovered so far */
	money?: number;
	/** how the batch is split, while it moves */
	split?: string;
};
export type Run = { at: string; agent: string; client: string; text: string };
export type AuditEntry = { id: string; at: string; who: string; client: string | null; text: string };
export type ClientTab = 'agents' | 'supply' | 'rules' | 'people' | 'integrations' | 'plan' | 'audit';
/** something waiting on a person, or on a file */
export type Attention = {
	id: string;
	client: string;
	icon: string;
	tone: 'amber' | 'blue';
	title: string;
	text: string;
	action: { kind: 'remind'; distributor: string; label: string } | { kind: 'open'; tab: ClientTab; label: string };
};
/** GET /v1/console/overview: the day across every client */
export type Overview = { tracks: Track[]; runs: Run[]; attention: Attention[] };

/** what a new client starts from: money.js's rules */
export type ConsoleDefaults = {
	gates: Gates;
	returnWindowDays: number;
	reserve: number;
	staffCap: number;
	tokenPct: number;
	scheme: string;
	offerWindowHours: number;
};
/** GET /v1/console/config: how the console describes agents, exits, the supply-chain profile and the presets */
export type ConsoleConfig = {
	autonomy: AutonomyLevel[];
	stageNames: Record<string, string>;
	fields: Record<string, SettingField[]>;
	exits: ExitDef[];
	profile: Record<ProfileQuestion, ProfileQuestionDef>;
	presets: Preset[];
	stages: TrackStage[];
	defaults: ConsoleDefaults;
};

export type AgentPatch = { on?: boolean; autonomy?: Autonomy; settings?: AgentSettings };
export type ProfileInput = { profile: Profile; gates: Gates; returnWindowDays: number };
export type RulesInput = { rules: Rules; exits: Exits };
export type InviteInput = { name: string; contact: string; access: Access };
export type PersonPatch = { access?: Access; status?: 'active' | 'deactivated' };
export type StaffInviteInput = { name: string; email: string; role: StaffRole };
/** the setup flow's answers; `request` is the demo request it started from */
export type NewClientInput = {
	name: string;
	city: string;
	industry: string;
	colour: string;
	slug: string;
	emailDomain: string;
	signGoogle: boolean;
	signPhone: boolean;
	profile: Profile;
	exits: Exits;
	preset: PresetId;
	adminName: string;
	adminEmail: string;
	plan: string;
	request: string | null;
};
/** what a staff member signs in with (SC-46) */
export type SignInInput = { email: string; password: string };
/** how the console signs in over HTTP: Firebase Authentication, which the app provides (frontend/console). The token is
 *  the Firebase ID token every call to backend-api carries */
export type ConsoleAuth = PasswordAuth;

/** what the console calls. Every change is written to the audit log by the server, in the staff member's name */
/** one day of the Overview's range (SC-48) */
export type DayFigures = {
	/** ISO date: 2026-10-02 */
	date: string;
	/** "2 Oct" */
	label: string;
	recovered: number;
	closed: number;
	units: number;
	runs: number;
};
/** the platform's figures over a range of days, every one an aggregate over the batches and runs when read */
export type Dashboard = {
	/** when they were read, in India's time: "09:41:20" */
	readAt: string;
	days: number;
	recovered: number;
	recoveredBefore: number;
	byDay: DayFigures[];
	inFlight: number;
	inFlightClients: number;
	inFlightSeries: number[];
	waiting: number;
	oldestWaiting?: { hours: number; client: string };
	runsToday: number;
	/** batches in flight at each of the nine stops */
	byStop: number[];
	/** the latest three batches to arrive at each of the nine stops (SC-49) */
	atStop: BatchMark[][];
	/** the batches closed today: how many, what they recovered, and the latest three */
	closedToday: { count: number; recovered: number; batches: BatchMark[] };
};
/** a batch as Agents at work draws it: its client's mark, keyed by the batch, and when it reached its stop (or closed),
 *  so a reading can tell what arrived since the last */
export type BatchMark = { client: string; ref: string; at: string };
export type BatchStatus = 'in-flight' | 'waiting' | 'closed';
export type BatchSort = 'priority' | 'stop' | 'days' | 'units' | 'value' | 'updated';
export type BatchQuery = {
	status?: BatchStatus;
	client?: string | null;
	stop?: number | null;
	q?: string;
	sort?: BatchSort;
	dir?: 'asc' | 'desc';
	page?: number;
	size?: number;
};
/** a batch in the Overview's table: its value is at MRP while in flight, and what it recovered once past Settle */
export type BatchRow = {
	client: string;
	ref: string;
	product: string;
	distributor: string;
	city: string;
	stage: number;
	done: number;
	daysLeft?: number;
	units: number;
	value: number;
	valueKind: 'mrp' | 'recovered';
	/** "09:38" today, else "4 Oct" */
	updated: string;
	closed: boolean;
	outcome?: string;
};
export type BatchPage = {
	rows: BatchRow[];
	total: number;
	page: number;
	size: number;
	counts: { inFlight: number; waiting: number; closed: number };
};

export interface ConsoleApi {
	catalog(): Promise<Catalog>;
	config(): Promise<ConsoleConfig>;
	lookupWorkspaces(query: string): Promise<WorkspaceMatch[]>;

	/** a work email and a password. Over HTTP, Firebase Authentication checks them and backend-api answers the staff
	 *  member the account belongs to; the mock lets any active staff member in with any password. A wrong sign-in is a
	 *  401 with SIGN_IN_FAILED (platform.ts) */
	signIn(input: SignInInput): Promise<Staff>;
	signOut(): Promise<void>;
	/** who is signed in, or null */
	me(): Promise<Staff | null>;

	overview(): Promise<Overview>;
	/** the platform's figures over the last 7, 30 or 90 days, every client's or one's (SC-48) */
	dashboard(days: number, client?: string | null): Promise<Dashboard>;
	/** every client's batches, a page at a time, filtered, sorted and counted on the server */
	batches(query?: BatchQuery): Promise<BatchPage>;
	clients(): Promise<Client[]>;
	/** a client by id, or null when there is none */
	client(id: string): Promise<Client | null>;
	staff(): Promise<Staff[]>;
	/** newest first; every client's, or one client's */
	audit(client?: string | null): Promise<AuditEntry[]>;
	demoRequests(): Promise<DemoRequest[]>;

	updateAgent(client: string, agent: string, patch: AgentPatch): Promise<Client>;
	runAgent(client: string, agent: string): Promise<Client>;
	setAllAgents(client: string, on: boolean): Promise<Client>;
	goLive(client: string): Promise<Client>;
	setPlan(client: string, plan: string): Promise<Client>;
	saveProfile(client: string, input: ProfileInput): Promise<Client>;
	saveRules(client: string, input: RulesInput): Promise<Client>;
	/** a client's open batches with their quick-commerce gates as the agents read them; one SKU's when it is given */
	clientBatches(client: string, sku?: string): Promise<BatchGates[]>;
	/** an SKU's own quick-commerce gates, or null to put it back on the client's default */
	saveSkuGates(client: string, sku: string, gates: SkuGates | null): Promise<Client>;
	/** one batch's own gates, with why, until it closes */
	overrideBatch(client: string, ref: string, input: OverrideInput): Promise<Client>;
	/** a batch back on its SKU's gates */
	clearBatchOverride(client: string, ref: string): Promise<Client>;
	remindDistributor(client: string, distributor: string): Promise<void>;
	requestFirstExport(client: string): Promise<Client>;
	invitePerson(client: string, input: InviteInput): Promise<Client>;
	updatePerson(client: string, person: string, patch: PersonPatch): Promise<Client>;
	resendInvite(client: string, person: string): Promise<void>;
	createClient(input: NewClientInput): Promise<Client>;
	inviteStaff(input: StaffInviteInput): Promise<Staff>;
	/** the prototype's "Reset prototype data": back to the seed. Only the mock has it */
	reset?(): Promise<void>;
}
