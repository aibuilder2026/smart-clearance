// What every surface's mock answers alike: the platform's catalog and finding a workspace, from the seed (generated
// from design3/core by scripts/seed.mjs). backend-api implements the same contract.
import { digits, isEmail } from '@smart-clearance/core/identity';
import catalogSeed from '../seed/catalog.json';
import directory from '../seed/directory.json';
import { ApiError, type Catalog, type WorkspaceMatch, type WorkspaceSummary } from '../types/shared';

export type MockOptions = {
	/** milliseconds each call waits, to see loading states */
	latency?: number;
	/** where the mock keeps what people change; none, and it forgets on reload */
	storage?: () => Storage | undefined;
};

export const browserStorage = () => globalThis.localStorage as Storage | undefined;

export const waiter =
	(latency = 0) =>
	() =>
		latency > 0 ? new Promise<void>((r) => setTimeout(r, latency)) : Promise.resolve();

export const catalog = () => structuredClone(catalogSeed) as Catalog;

type Member = {
	workspace: string;
	id: string;
	email?: string;
	phone?: string;
	role: string;
	status: string;
	kind: string;
};

// screens/auth.jsx FindWorkspace: a member, an invitee or a deactivated account finds its workspace; an address at a
// client's email domain finds that client's workspace; anyone else finds nothing. Marketplace buyers are never members.
// It names the workspace only, as backend-api does: never the person's role or whether they were deactivated (SC-43).
export function lookupWorkspaces(query: string): WorkspaceMatch[] {
	const workspaces = directory.workspaces as WorkspaceSummary[];
	const members = directory.members as Member[];
	const t = query.trim();
	if (!isEmail(t) && digits(t).length !== 10)
		throw new ApiError(422, 'Enter an email address, or a 10-digit mobile number.');
	const u = isEmail(t)
		? members.find((x) => x.email && x.email.toLowerCase() === t.toLowerCase())
		: members.find((x) => x.phone && digits(x.phone) === digits(t));
	const out: WorkspaceMatch[] = [];
	if (u && u.kind !== 'external') {
		const ws = workspaces.find((w) => w.id === u.workspace);
		if (ws) out.push({ workspace: ws, value: t });
	} else if (isEmail(t)) {
		const ws = workspaces.find((w) => t.toLowerCase().endsWith('@' + w.emailDomain));
		if (ws) out.push({ workspace: ws, value: t });
	}
	return out;
}
