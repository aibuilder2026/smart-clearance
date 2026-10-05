// The API as the prototype answers it, in the browser: the seed (generated from design3/core by scripts/seed.mjs) and
// the prototype's own rules for finding a workspace and taking a demo request. backend-api implements the same contract.
import { digits, isEmail } from '@smart-clearance/core';
import catalog from '#lib/seed/catalog.json';
import directory from '#lib/seed/directory.json';
import showcase from '#lib/seed/showcase.json';
import {
	ApiError,
	type Api,
	type Catalog,
	type DemoRequest,
	type DemoRequestInput,
	type Showcase,
	type WorkspaceMatch,
	type WorkspaceSummary
} from './types';

/** where the mock keeps demo requests, in the shape the prototype's console reads (design3/core/platform.js requests) */
export const DEMO_REQUESTS_KEY = 'sc-demo-requests';

type Member = {
	workspace: string;
	id: string;
	email?: string;
	phone?: string;
	role: string;
	status: string;
	kind: string;
};

export function demoRequestErrors(input: DemoRequestInput): Record<string, string> {
	const e: Record<string, string> = {};
	if (!input.name.trim()) e.name = 'Enter your name.';
	if (!input.company.trim()) e.company = "Enter your company's name.";
	if (!isEmail(input.email)) e.email = 'Enter a work email address, like name@company.in.';
	return e;
}

export function mockApi({ latency = 0, storage = () => globalThis.localStorage as Storage | undefined } = {}): Api {
	const wait = () => (latency > 0 ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());
	const workspaces = directory.workspaces as WorkspaceSummary[];
	const roles = directory.roles as Record<string, string>;
	const members = directory.members as Member[];
	const role = (r: string) => (roles[r] || r).toLowerCase();

	return {
		async showcase() {
			await wait();
			return structuredClone(showcase) as Showcase;
		},
		async catalog() {
			await wait();
			return structuredClone(catalog) as Catalog;
		},
		// screens/auth.jsx FindWorkspace: a member, an invitee or a deactivated account names its workspace; an address at a
		// client's email domain names that client's workspace; anyone else finds nothing. Marketplace buyers are never members.
		async lookupWorkspaces(query) {
			await wait();
			const t = query.trim();
			if (!isEmail(t) && digits(t).length !== 10)
				throw new ApiError(422, 'Enter an email address, or a 10-digit mobile number.');
			const u = isEmail(t)
				? members.find((x) => x.email && x.email.toLowerCase() === t.toLowerCase())
				: members.find((x) => x.phone && digits(x.phone) === digits(t));
			const out: WorkspaceMatch[] = [];
			if (u && u.kind !== 'external') {
				const ws = workspaces.find((w) => w.id === u.workspace);
				const as =
					u.status === 'invited'
						? `invited as ${role(u.role)}`
						: u.status === 'deactivated'
							? 'deactivated by the admin'
							: role(u.role);
				if (ws) out.push({ workspace: ws, as, value: t });
			} else if (isEmail(t)) {
				const ws = workspaces.find((w) => t.toLowerCase().endsWith('@' + w.emailDomain));
				if (ws) out.push({ workspace: ws, as: "your company's workspace · ask its admin for access", value: t });
			}
			return out;
		},
		// design3/site DemoSheet: the request, stamped and kept in this browser
		async requestDemo(input) {
			await wait();
			const fields = demoRequestErrors(input);
			if (Object.keys(fields).length) throw new ApiError(422, 'Check the highlighted fields.', fields);
			const req: DemoRequest = {
				id: 'rq-' + Date.now().toString(36),
				at: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
				name: input.name.trim(),
				company: input.company.trim(),
				email: input.email.trim().toLowerCase(),
				makes: input.makes,
				plan: input.plan || null,
				note: input.note.trim(),
				status: 'new'
			};
			try {
				const s = storage();
				if (s) s.setItem(DEMO_REQUESTS_KEY, JSON.stringify([req, ...JSON.parse(s.getItem(DEMO_REQUESTS_KEY) || '[]')]));
			} catch {
				// storage blocked: the request still counts as sent for this visit
			}
			return req;
		}
	};
}
