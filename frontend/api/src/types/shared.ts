// The frontend's contract with backend-api, provisional: once the FastAPI service publishes its OpenAPI schema,
// openapi-typescript generates these types into contracts/ and these files re-export them. The shapes follow the
// prototype's data (design3/core) so the seed and the mock speak them already. This file holds what more than one
// surface reads: the platform's catalog, the workspaces people sign in to, and demo requests.

export type Mark = { from: string; to: string; ink: string };
export type WorkspaceSummary = {
	id: string;
	name: string;
	short: string;
	domain: string;
	emailDomain: string;
	mark: Mark;
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

/** POST /v1/workspaces/lookup → the workspaces an email or mobile number belongs to. It names the workspace only,
 *  never the person's role or whether they were deactivated (SC-43) */
export type WorkspaceMatch = { workspace: WorkspaceSummary; value: string };

/** POST /v1/demo-requests, from Book a demo on the landing page */
export type DemoRequestInput = {
	name: string;
	company: string;
	email: string;
	makes: string;
	plan: string | null;
	note: string;
};
/** a demo request as the console lists it: new, or set up as a client (named by `client`) */
export type DemoRequest = DemoRequestInput & { id: string; at: string; status: 'new' | 'set up'; client?: string };

/** an API answer that isn't a success; `fields` names the inputs a 422 rejected, with the message for each. `trace` is
 *  the call's trace id over HTTP (SC-57): its log lines, spans and audit rows in Google Cloud carry the same one. */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly fields: Record<string, string> = {},
		readonly trace?: string
	) {
		super(message);
	}
}

/** how an app signs a person in over HTTP: Firebase Authentication with an email and a password, which the app
 *  provides (createFirebase in @smart-clearance/api/firebase). The token is the Firebase ID token every call to
 *  backend-api carries; `fresh` forces a new one (after a 401) */
export type PasswordAuth = {
	signIn(email: string, password: string): Promise<void>;
	signOut(): Promise<void>;
	token(fresh?: boolean): Promise<string | null>;
};
