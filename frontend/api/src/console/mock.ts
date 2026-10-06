// The console's API as the prototype answers it, in the browser (design3/core/platform.js and console.jsx): the seed,
// kept per browser, and every change the console makes, each writing its audit line in the signed-in staff member's
// name, word for word as the prototype writes it. backend-api implements the same contract.
import seed from '../seed/console.json';
import { browserStorage, catalog, lookupWorkspaces, waiter, type MockOptions } from '../mock/shared';
import { ApiError, type Agent, type DemoRequest } from '../types/shared';
import type {
	AgentPatch,
	Attention,
	AuditEntry,
	Client,
	ConsoleApi,
	ConsoleConfig,
	NewClientInput,
	Run,
	Staff,
	Track
} from '../types/console';
import {
	agentDefaults,
	exitsFor,
	inviteError,
	optLabel,
	setupErrors,
	showValue,
	SIGN_IN_FAILED,
	staffInviteError
} from './platform';

/** where the mock keeps the platform's state, and who is signed in */
export const CONSOLE_KEY = 'sc-console';
export const SESSION_KEY = 'sc-console-session';
const VERSION = 1;

type State = {
	v: number;
	clients: Client[];
	staff: Staff[];
	runs: Run[];
	tracks: Track[];
	audit: AuditEntry[];
	requests: DemoRequest[];
	nextAudit: number;
};

const config = seed.config as ConsoleConfig;
const AGENTS = catalog().agents;

// The console prototype opens with no demo requests: the landing page in the same browser fills them. On its own
// subdomain the console cannot see the landing page's storage, so the mock starts with two (fictional) requests.
const REQUESTS: DemoRequest[] = [
	{
		id: 'rq-kesari',
		at: '4 Oct, 11:20 am',
		name: 'Ritu Malhotra',
		company: 'Kesari Foods',
		email: 'ritu@kesari.in',
		makes: 'Snacks and drinks',
		plan: 'Pilot',
		note: 'Three distributors around Indore; namkeen and biscuits go short-dated every month.',
		status: 'new'
	},
	{
		id: 'rq-amrit',
		at: '5 Oct, 09:05 am',
		name: 'Farhan Siddiqui',
		company: 'Amrit Dairy',
		email: 'farhan@amritdairy.in',
		makes: 'Dairy',
		plan: 'Growth',
		note: '',
		status: 'new'
	}
];

const fresh = (): State => ({
	v: VERSION,
	...(structuredClone(seed.state) as Omit<State, 'v' | 'requests' | 'nextAudit'>),
	requests: structuredClone(REQUESTS),
	nextAudit: 100
});

const two = (n: number) => String(n).padStart(2, '0');
/** what a change sends, as it would arrive over HTTP: plain JSON, never a live object of the caller's */
const wire = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const hhmm = () => {
	const d = new Date();
	return two(d.getHours()) + ':' + two(d.getMinutes());
};
const RULE_LABEL: Record<string, string> = {
	staffCap: 'staff sale cap',
	offerWindowHours: 'offer window hours',
	hindiOffers: 'Hindi offers',
	requirePhoto: 'label photo first'
};

export function consoleMock({ latency = 0, storage = browserStorage }: MockOptions = {}): ConsoleApi {
	const wait = waiter(latency);
	const read = <T>(key: string): T | null => {
		try {
			const raw = storage()?.getItem(key);
			return raw ? (JSON.parse(raw) as T) : null;
		} catch {
			return null;
		}
	};
	const write = (key: string, value: unknown) => {
		try {
			const s = storage();
			if (!s) return;
			if (value == null) s.removeItem(key);
			else s.setItem(key, JSON.stringify(value));
		} catch {
			// storage blocked: changes last until the page closes
		}
	};

	const saved = read<State>(CONSOLE_KEY);
	let state: State = saved && saved.v === VERSION ? saved : fresh();
	const out = <T>(v: T): T => structuredClone(v);

	const me = (): Staff | null => {
		const session = read<{ uid: string }>(SESSION_KEY);
		return (session && state.staff.find((s) => s.id === session.uid && s.status === 'active')) || null;
	};
	const who = () => {
		const m = me();
		if (!m) throw new ApiError(401, 'Sign in to the console first.');
		return m.name;
	};
	const clientOf = (id: string) => {
		const c = state.clients.find((x) => x.id === id);
		if (!c) throw new ApiError(404, 'No such client.');
		return c;
	};
	const agentOf = (id: string): Agent => {
		const a = AGENTS.find((x) => x.id === id);
		if (!a) throw new ApiError(404, 'No such agent.');
		return a;
	};
	const level = (id: string) => config.autonomy.find((x) => x.id === id)?.label ?? id;
	const planName = (id: string) => catalog().plans.find((p) => p.id === id)?.name ?? id;
	const nameOf = (c: Client, pid: unknown) => c.people.find((x) => x.id === pid)?.name ?? 'nobody';

	// update(fn, audit?): the prototype's Platform.update. A change happens on a copy, then lands with its audit line
	function update(fn: (draft: State) => void, audit?: { client: string | null; text: string }) {
		const draft = structuredClone(state);
		fn(draft);
		if (audit) {
			const d = new Date();
			draft.audit.unshift({
				id: 'a' + draft.nextAudit++,
				at: `Today, ${two(d.getHours())}:${two(d.getMinutes())}`,
				who: who(),
				client: audit.client,
				text: audit.text
			});
		}
		state = draft;
		write(CONSOLE_KEY, state);
	}
	// a change to one client, returning it as it now stands
	const change = (id: string, fn: (c: Client, draft: State) => void, text?: string) => {
		clientOf(id);
		update(
			(d) =>
				fn(
					d.clients.find((x) => x.id === id)!,
					d
				),
			text ? { client: id, text } : undefined
		);
		return out(clientOf(id));
	};

	function attention(): Attention[] {
		const items: Attention[] = [];
		for (const c of state.clients) {
			for (const d of c.distributors.filter((x) => x.permission !== 'given'))
				items.push({
					id: `${c.id}-${d.id}`,
					client: c.id,
					icon: 'hand',
					tone: 'amber',
					title: d.name,
					text: 'one-time permission not given yet',
					action: { kind: 'remind', distributor: d.id, label: 'Ask again' }
				});
			if (c.status !== 'live') {
				const admin = c.people.find((p) => p.access === 'Admin');
				items.push({
					id: `${c.id}-invite`,
					client: c.id,
					icon: 'user-plus',
					tone: 'amber',
					title: c.name,
					text: `waiting for ${admin ? admin.name : 'its admin'} to accept the invitation`,
					action: { kind: 'open', tab: 'people', label: 'Open' }
				});
			}
		}
		// a file the day is waiting on (console.jsx's Overview)
		if (state.clients.some((c) => c.id === 'munchly'))
			items.push({
				id: 'gupta-export',
				client: 'munchly',
				icon: 'file-spreadsheet',
				tone: 'blue',
				title: 'Gupta & Sons',
				text: 'stock export arrived 2 h late today',
				action: { kind: 'open', tab: 'supply', label: 'Open' }
			});
		return items;
	}

	function buildClient(f: NewClientInput): Client {
		const id = f.slug;
		const d = config.defaults;
		const admin = {
			id: 'admin-' + id,
			name: f.adminName.trim(),
			org: f.name.trim(),
			role: 'Workspace admin',
			kind: 'Workspace admin',
			access: 'Admin' as const,
			provider: 'Google',
			status: 'invited' as const,
			img: null,
			email: f.adminEmail.trim().toLowerCase(),
			phone: ''
		};
		const client: Client = {
			id,
			name: f.name.trim(),
			legal: f.name.trim(),
			city: f.city.trim(),
			industry: f.industry,
			domain: id + '.smartclearance.com',
			emailDomain: f.emailDomain.trim().toLowerCase(),
			mark: { from: f.colour, to: f.colour, ink: '#ffffff' },
			plan: f.plan,
			status: 'setting-up',
			since: null,
			region: 'India',
			profile: f.profile,
			gates: { ...d.gates },
			territoryGuard: true,
			returnWindowDays: d.returnWindowDays,
			exits: f.exits,
			rules: {
				reserve: d.reserve,
				scheme: d.scheme,
				staffCap: d.staffCap,
				tokenPct: d.tokenPct,
				offerWindowHours: d.offerWindowHours,
				hindiOffers: true,
				requirePhoto: true
			},
			signIn: [
				{
					id: 'google',
					title: 'Google Workspace',
					who: f.name.trim() + ' staff',
					rule: f.emailDomain.trim().toLowerCase() + ' accounts only',
					on: f.signGoogle
				},
				{
					id: 'phone',
					title: 'Mobile number and a one-time code',
					who: 'Distributors and kirana owners',
					rule: 'Numbers the client or its distributors invite',
					on: f.signPhone
				}
			],
			distributors: [],
			skus: [],
			people: [admin],
			integrations: [],
			recovered: 0,
			batches: 0,
			approver: admin.id,
			agents: agentDefaults(f.preset, AGENTS, d, admin.id)
		};
		for (const a of Object.values(client.agents)) {
			a.last = 'not run yet';
			a.next = 'after the first stock export';
		}
		return client;
	}

	return {
		async catalog() {
			await wait();
			return catalog();
		},
		async config() {
			await wait();
			return out(config);
		},
		async lookupWorkspaces(query) {
			await wait();
			return lookupWorkspaces(query);
		},

		// the prototype has no passwords: any active staff member's address, with any password, signs in
		async signIn({ email, password }) {
			await wait();
			const s = state.staff.find((x) => x.status === 'active' && x.email.toLowerCase() === email.trim().toLowerCase());
			if (!s || !password) throw new ApiError(401, SIGN_IN_FAILED);
			write(SESSION_KEY, { uid: s.id, at: Date.now() });
			return out(s);
		},
		async signOut() {
			await wait();
			write(SESSION_KEY, null);
		},
		async me() {
			await wait();
			const m = me();
			return m ? out(m) : null;
		},

		async overview() {
			await wait();
			return out({
				tracks: state.tracks.filter((t) => state.clients.some((c) => c.id === t.client)),
				runs: state.runs,
				attention: attention()
			});
		},
		async clients() {
			await wait();
			return out(state.clients);
		},
		async client(id) {
			await wait();
			const c = state.clients.find((x) => x.id === id);
			return c ? out(c) : null;
		},
		async staff() {
			await wait();
			return out(state.staff);
		},
		async audit(client) {
			await wait();
			return out(state.audit.filter((a) => !client || a.client === client));
		},
		async demoRequests() {
			await wait();
			return out(state.requests);
		},

		async updateAgent(id, agentId, sent: AgentPatch) {
			await wait();
			const patch = wire(sent);
			const c = clientOf(id);
			const a = agentOf(agentId);
			const cfg = c.agents[agentId];
			if (patch.autonomy !== undefined && patch.autonomy !== cfg.autonomy) {
				const from = cfg.autonomy;
				const v = patch.autonomy;
				change(
					id,
					(x) => (x.agents[agentId].autonomy = v),
					`Set the ${a.name} agent to ${level(v)} for ${c.name} (was ${level(from)})`
				);
			}
			if (patch.on !== undefined && patch.on !== cfg.on) {
				const v = patch.on;
				change(
					id,
					(x) => (x.agents[agentId].on = v),
					`${v ? 'Switched on' : 'Switched off'} the ${a.name} agent for ${c.name}`
				);
			}
			if (patch.settings) {
				const next = patch.settings;
				const fields = config.fields[agentId] ?? [];
				const changes = fields
					.filter((f) => JSON.stringify(next[f.key]) !== JSON.stringify(cfg.settings[f.key]))
					.map((f) =>
						f.type === 'approver'
							? `approver ${nameOf(c, cfg.settings[f.key])} to ${nameOf(c, next[f.key])}`
							: `${f.short || f.label.toLowerCase()} ${showValue(f, cfg.settings[f.key])} to ${showValue(f, next[f.key])}`
					);
				if (changes.length)
					change(
						id,
						(x) => (x.agents[agentId].settings = next),
						`Changed the ${a.name} agent for ${c.name}: ${changes.join('; ')}`
					);
			}
			return out(clientOf(id));
		},
		async runAgent(id, agentId) {
			await wait();
			const c = clientOf(id);
			const a = agentOf(agentId);
			const at = hhmm();
			return change(
				id,
				(x, d) => {
					d.runs.unshift({ at, agent: agentId, client: id, text: 'ran on request; nothing new' });
					x.agents[agentId].last = `${at} today · ran on request; nothing new`;
				},
				`Ran the ${a.name} agent now for ${c.name}`
			);
		},
		async setAllAgents(id, on) {
			await wait();
			const c = clientOf(id);
			return change(
				id,
				(x) => AGENTS.filter((a) => !a.gate).forEach((a) => (x.agents[a.id].on = on)),
				on ? `Resumed every agent for ${c.name}` : `Paused every agent for ${c.name}`
			);
		},
		async goLive(id) {
			await wait();
			const c = clientOf(id);
			return change(
				id,
				(x) => {
					x.status = 'live';
					x.since = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
				},
				`Moved ${c.name} to Live on the ${planName(c.plan)} plan`
			);
		},
		async setPlan(id, plan) {
			await wait();
			const c = clientOf(id);
			if (plan === c.plan) return out(c);
			return change(id, (x) => (x.plan = plan), `Moved ${c.name} from ${planName(c.plan)} to ${planName(plan)}`);
		},
		async saveProfile(id, sent) {
			await wait();
			const f = wire(sent);
			const c = clientOf(id);
			const label = (q: 'route' | 'owner' | 'expiry') => optLabel(config.profile, q, f.profile[q]).toLowerCase();
			return change(
				id,
				(x) => {
					const was = x.exits;
					x.profile = { route: f.profile.route, owner: f.profile.owner, expiry: f.profile.expiry };
					const ex = exitsFor(x.profile, config.defaults.staffCap);
					for (const k of Object.keys(ex) as (keyof typeof ex)[])
						if (!ex[k].locked && was[k]) ex[k].on = was[k].on && ex[k].on;
					x.exits = ex;
					x.gates = { blinkitDays: f.gates.blinkitDays, qcomPct: f.gates.qcomPct };
					x.returnWindowDays = f.returnWindowDays;
					x.agents.watcher.settings.blinkitDays = f.gates.blinkitDays;
					x.agents.watcher.settings.qcomPct = f.gates.qcomPct;
					x.agents.impact.settings.returnWindowDays = f.returnWindowDays;
				},
				`Changed ${c.name}'s supply-chain profile: ${label('route')}, ${label('owner')} owns the stock, ${label('expiry')}`
			);
		},
		async saveRules(id, sent) {
			await wait();
			const { rules, exits } = wire(sent);
			const c = clientOf(id);
			const changed: string[] = [];
			for (const e of config.exits)
				if (exits[e.id].on !== c.exits[e.id].on) changed.push(`${e.name} ${exits[e.id].on ? 'on' : 'off'}`);
			for (const k of Object.keys(rules) as (keyof typeof rules)[]) {
				const v = rules[k];
				if (v !== c.rules[k]) changed.push(`${RULE_LABEL[k] || k} ${typeof v === 'boolean' ? (v ? 'on' : 'off') : v}`);
			}
			return change(
				id,
				(x) => {
					x.rules = rules;
					x.exits = exits;
				},
				`Changed ${c.name}'s channels and rules: ${changed.join('; ')}`
			);
		},
		async remindDistributor(id, distributor) {
			await wait();
			const c = clientOf(id);
			const d = c.distributors.find((x) => x.id === distributor);
			if (!d) throw new ApiError(404, 'No such distributor.');
			update(() => {}, { client: id, text: `Asked ${d.name} again for its one-time permission` });
		},
		async requestFirstExport(id) {
			await wait();
			const c = clientOf(id);
			return change(
				id,
				(x) =>
					x.integrations.push({
						id: 'dms',
						name: 'Distributor stock exports',
						kind: 'Inventory',
						status: 'waiting',
						note: 'Upload link sent to the distributors'
					}),
				`Asked ${c.name}'s distributors for their first stock export`
			);
		},
		async invitePerson(id, sent) {
			await wait();
			const input = wire(sent);
			const c = clientOf(id);
			const problem = inviteError(input, c);
			if (problem) throw new ApiError(422, problem, input.name.trim() ? { contact: problem } : { name: problem });
			const contact = input.contact.trim();
			const phone = /^[+\d\s]{10,}$/.test(contact);
			const name = input.name.trim();
			const partner = input.access === 'Partner';
			return change(
				id,
				(x) =>
					x.people.push({
						id: 'p-' + Date.now().toString(36),
						name,
						org: partner ? name : c.name,
						role: partner ? 'Partner' : 'Staff',
						kind: input.access,
						access: input.access,
						provider: phone ? 'Phone and code' : partner ? 'Google, invited' : 'Google',
						status: 'invited',
						img: null,
						email: phone ? '' : contact,
						phone: phone ? contact : ''
					}),
				`Invited ${name} as ${input.access}`
			);
		},
		async updatePerson(id, person, sent) {
			await wait();
			const patch = wire(sent);
			const c = clientOf(id);
			const p = c.people.find((x) => x.id === person);
			if (!p) throw new ApiError(404, 'No such person.');
			if (patch.status)
				change(
					id,
					(x) => (x.people.find((y) => y.id === person)!.status = patch.status!),
					`${patch.status === 'deactivated' ? 'Deactivated' : 'Reactivated'} ${p.name}`
				);
			if (patch.access)
				change(
					id,
					(x) => (x.people.find((y) => y.id === person)!.access = patch.access!),
					`Gave ${p.name} ${patch.access} access`
				);
			return out(clientOf(id));
		},
		async resendInvite(id, person) {
			await wait();
			if (!clientOf(id).people.some((p) => p.id === person)) throw new ApiError(404, 'No such person.');
		},
		async createClient(sent) {
			await wait();
			const f = wire(sent);
			const problem = setupErrors(f, (s) => state.clients.some((c) => c.id === s)).find(Boolean);
			if (problem) throw new ApiError(422, problem);
			const client = buildClient(f);
			const label = (q: 'route' | 'owner' | 'expiry') => optLabel(config.profile, q, f.profile[q]).toLowerCase();
			update(
				(d) => {
					d.clients.push(client);
					if (f.request)
						d.requests = d.requests.map((r) =>
							r.id === f.request ? { ...r, status: 'set up', client: client.id } : r
						);
				},
				{
					client: client.id,
					text: `Set up ${client.name} from its supply-chain profile: ${label('route')}, ${label('owner')} owns the stock, ${label('expiry')}; invited ${client.people[0].name} as admin`
				}
			);
			return out(client);
		},
		async inviteStaff(sent) {
			await wait();
			const input = wire(sent);
			const problem = staffInviteError(input);
			if (problem) throw new ApiError(422, problem, input.name.trim() ? { email: problem } : { name: problem });
			const name = input.name.trim();
			const s: Staff = {
				id: 'st-' + Date.now().toString(36),
				name,
				short: name.split(' ')[0],
				role: input.role,
				team: input.role === 'Support' ? 'Customer success' : 'Platform',
				email: input.email.trim().toLowerCase(),
				passkey: 'not set up yet',
				status: 'invited'
			};
			update((d) => d.staff.push(s), { client: null, text: `Invited ${name} to the console as ${input.role}` });
			return out(s);
		},
		async reset() {
			await wait();
			state = fresh();
			write(CONSOLE_KEY, state);
		}
	};
}
