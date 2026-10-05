// The frontend's contract with backend-api, provisional: once the FastAPI service publishes its OpenAPI schema,
// openapi-typescript generates these types into contracts/ and this file re-exports them. The shapes follow the
// prototype's data (design3/core) so the seed and the mock speak them already.

export type Mark = { from: string; to: string; ink: string };
export type WorkspaceSummary = {
	id: string;
	name: string;
	short: string;
	domain: string;
	emailDomain: string;
	mark: Mark;
};

export type PlanLine = {
	id: string;
	short: string;
	units: number;
	price: number;
	packPrice: number | null;
	gross: number;
	cost: number;
	net: number;
};
export type ChannelRow = { id: string; short: string; net: number; eligible: boolean; capacity: number | null };
export type Stage = { id: string; title: string; human: boolean };

/** GET /v1/site/showcase: one batch with every figure worked out, as the landing page tells it. It names no client, no
 *  person and no partner: the platform's own page tells it as an illustrative batch (SC-28) */
export type Showcase = {
	platform: { name: string; domain: string };
	batch: { daysLeft: number; distributorCity: string };
	risk: { atRisk: number };
	plan: {
		net: number;
		soldUnits: number;
		itcRetained: number;
		kg: number;
		writeOff: { total: number; perUnit: number };
		lines: PlanLine[];
		rows: ChannelRow[];
	};
	award: { units: number; price: number; gross: number };
	actual: { net: number; pnl: number; swing: number };
	shops: number;
	stages: Stage[];
};

export type Agent = {
	id: string;
	name: string;
	stage: string;
	icon: string;
	model?: string;
	job: string;
	gate: boolean;
};
export type Connector = {
	id: string;
	name: string;
	kind: string;
	icon: string;
	note: string;
	status: 'ok' | 'mock' | 'soon';
};
export type PlanTier = { id: string; name: string; scope: string[] };

/** GET /v1/platform/catalog: what Smart-Clearance offers every client */
export type Catalog = { agents: Agent[]; connectors: Connector[]; plans: PlanTier[] };

/** POST /v1/workspaces/lookup → the workspaces an email or mobile number belongs to */
export type WorkspaceMatch = { workspace: WorkspaceSummary; as: string; value: string };

/** POST /v1/demo-requests */
export type DemoRequestInput = {
	name: string;
	company: string;
	email: string;
	makes: string;
	plan: string | null;
	note: string;
};
export type DemoRequest = DemoRequestInput & { id: string; at: string; status: 'new' };

export interface Api {
	showcase(): Promise<Showcase>;
	catalog(): Promise<Catalog>;
	lookupWorkspaces(query: string): Promise<WorkspaceMatch[]>;
	requestDemo(input: DemoRequestInput): Promise<DemoRequest>;
}

/** an API answer that isn't a success; `fields` names the inputs a 422 rejected, with the message for each */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly fields: Record<string, string> = {}
	) {
		super(message);
	}
}
