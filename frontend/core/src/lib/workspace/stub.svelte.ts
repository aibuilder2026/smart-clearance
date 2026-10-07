// The stub source (SC-67): Munchly Foods' workspace as the prototype runs it in the browser (design3/core: store.js,
// flow.js and the seed), behind the same WorkspaceSource a live source implements. The journey's state is the store's,
// the workspace's data and the batch in focus are the seed's, built once, and each step a person takes is flow.ts's
// action, made as today's screens made it. Importing this module makes it the default source, so a screen drawn
// outside any provider (the guided demo, the design-system page) reads it.
import { CHIPS, D, ES, INVOICE, KL } from './data';
import { A, act as run, Agents, type ActionName } from './flow';
import { setDefaultSource, type WorkspaceSource } from './source';
import { store } from './store.svelte';
import type {
	ActionArg,
	CaseData,
	HumanAction,
	InviteInput,
	RoleId,
	Rules,
	SourceStatus,
	State,
	User,
	UserStatus,
	WorkspaceData,
	WorkspacePublic
} from './types';

const hero = D.batches.find((b) => b.hero)!;
const second = D.batches.find((b) => b.second)!;

/** the workspace's data, as the screens read it */
export const data: WorkspaceData = Object.freeze({
	day0: D.day0,
	platform: D.platform,
	workspace: D.workspace,
	client: D.client,
	skus: D.skus,
	distributors: D.distributors,
	people: D.people,
	roles: D.roles,
	rules: D.rules,
	setup: D.setup,
	stages: D.stages,
	batches: D.batches,
	quarter: D.quarter,
	market: D.market
});

/** the batch in focus: the chips batch the story follows, and the Mango Drink batch the same agents donate */
export const kase: CaseData = Object.freeze({
	batch: hero,
	sku: CHIPS,
	dist: D.distributors[hero.distributor],
	buyer: D.buyer,
	kiranas: D.kiranas,
	offered: D.offered,
	scheme: D.rules.scheme,
	risk: D.risk,
	plan: D.plan,
	lines: { kirana: KL, expiresoon: ES },
	counter: D.counter,
	award: D.award,
	actual: D.actual,
	support: D.support,
	supportPlan: D.supportPlan,
	claim: D.claim,
	docs: D.docs,
	invoice: INVOICE,
	shelf: D.shelf,
	returnBy: D.returnBy,
	push: D.push,
	today: D.journey.today,
	planMinutes: D.journey.planMinutes,
	permissionAsked: D.journey.permissionAsked,
	listing: D.journey.listing,
	van: D.journey.van,
	donation: {
		...D.journey.donation,
		batch: second,
		sku: D.skus[second.sku],
		dist: D.distributors[second.distributor],
		plan: D.mangoPlan,
		units: D.mangoFb,
		partner: D.setup.partners.find((p) => p.name === D.journey.donation.partner)!
	}
});

const publicInfo: WorkspacePublic = Object.freeze({
	workspace: D.workspace,
	platform: D.platform,
	prototype: { code: D.explore.code, accounts: D.explore.accounts }
});

/* ---------- the session and the splash, per browser ---------- */

type Session = { uid: string; at: number };
const SESSION = 'sc3-session';
const SPLASH = 'sc3-app-splash';
const readSession = (): Session | null => {
	try {
		return JSON.parse(localStorage.getItem(SESSION) || 'null');
	} catch {
		return null;
	}
};
const writeSession = (v: Session | null) => {
	try {
		if (v) localStorage.setItem(SESSION, JSON.stringify(v));
		else localStorage.removeItem(SESSION);
	} catch {
		/* storage blocked: the session lasts this visit */
	}
};

/** the guardrails' and the users' audit lines (screens/admin.jsx), each its own change after the one it records */
const audit = (who: string, what: string, target: string) =>
	store.update((s) => {
		s.audit.unshift({ id: 'a-' + Date.now().toString(36), who, what, target, at: 'now' });
	});

class StubSource implements WorkspaceSource {
	readonly kind = 'stub' as const;
	readonly status: SourceStatus = Object.freeze({ phase: 'ready', connection: 'local' });
	readonly publicInfo = publicInfo;
	readonly data = data;
	readonly case = kase;
	/** the stub has one batch in focus, whatever a screen asks for */
	readonly focus = null;
	readonly explore = D.explore.groups;
	#pending = new Set<string>();
	#session = $state<Session | null>(null);
	#splash = $state(true);

	get pending(): ReadonlySet<string> {
		return this.#pending;
	}
	get state(): State {
		return store.state;
	}
	get me(): User | null {
		const s = this.#session;
		return s ? (store.state.users.find((u) => u.id === s.uid && u.status === 'active') ?? null) : null;
	}
	get splash() {
		return this.#splash;
	}
	splashed = () => {
		this.#splash = false;
		try {
			sessionStorage.setItem(SPLASH, '1');
		} catch {
			/* storage blocked */
		}
	};

	/** the app's journey, kept in this browser, with the agents running live; partners the person is not playing
	 *  answer by themselves */
	start = () => {
		store.usePersistence();
		this.#session = readSession();
		try {
			this.#splash = !sessionStorage.getItem(SPLASH);
		} catch {
			/* storage blocked: show it */
		}
		Agents.auto = true;
		Agents.maxStage = Infinity;
		Agents.setLive(true);
		const plays = $effect.root(() => {
			$effect(() => {
				const id = this.me?.id;
				Agents.plays = (x) => !!id && x === id;
				Agents.reconcile();
			});
		});
		return () => {
			plays();
			Agents.setLive(false);
		};
	};
	setFocus = (_ref: string | null) => {};

	signIn = (i: { email: string; password: string } | { uid: string }) => {
		const uid =
			'uid' in i ? i.uid : store.state.users.find((u) => u.email?.toLowerCase() === i.email.toLowerCase())?.id;
		const u = uid ? store.state.users.find((x) => x.id === uid) : undefined;
		if (!uid || !u) return Promise.reject(new Error('No account for that sign-in'));
		const v = { uid, at: Date.now() };
		writeSession(v);
		this.#session = v;
		store.update((st) => {
			const x = st.users.find((y) => y.id === uid);
			if (x) x.lastSeen = 'now';
		});
		return Promise.resolve(u);
	};
	signOut = () => {
		writeSession(null);
		this.#session = null;
		return Promise.resolve();
	};

	act = <N extends HumanAction>(name: N, arg?: ActionArg<N>, o?: { feel?: number }) => {
		const step = () => {
			if (name === 'order' && arg && typeof arg === 'object') {
				// a kirana's order with its own count, as the offer screen made it: one change
				const { kirana, units } = arg as ActionArg<'order'>;
				store.update((st) => {
					A.order(st, kirana);
					const x = st.hero.orders.find((y) => y.id === kirana);
					if (x && units != null) x.units = units;
				});
			} else run(name as ActionName, arg as string | number | boolean | undefined);
		};
		if (!o?.feel) {
			step();
			return Promise.resolve();
		}
		this.#pending.add(name);
		return new Promise<void>((done) =>
			setTimeout(() => {
				this.#pending.delete(name);
				step();
				done();
			}, o.feel)
		);
	};
	markRead = (ids: string[] | 'all') => {
		const me = this.me?.id;
		store.update((st) => {
			st.notifications.forEach((n) => {
				if (ids === 'all' ? n.to === me : ids.includes(n.id)) n.read = true;
			});
		});
		return Promise.resolve();
	};
	invite = (i: InviteInput) => {
		const me = this.me;
		const phone = /^[+\d\s]+$/.test(i.contact);
		const staff = !phone && i.contact.toLowerCase().endsWith('@' + data.workspace.emailDomain);
		const id =
			i.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '') +
			'-' +
			Date.now().toString(36).slice(-3);
		store.update((st) => {
			st.users.push({
				id,
				name: i.name,
				short: i.name,
				org: staff ? data.client.short : i.name,
				role: i.role,
				provider: phone ? 'phone' : 'google',
				phone: phone ? i.contact : '',
				email: phone ? '' : i.contact,
				status: 'invited',
				invitedBy: me?.name,
				kind: staff ? 'staff' : 'partner',
				lastSeen: null,
				extra: true
			});
		});
		audit(me?.id ?? '', 'invited ' + i.name + ' as ' + data.roles[i.role].toLowerCase(), i.contact);
		return Promise.resolve();
	};
	setUserStatus = (id: string, status: UserStatus) => {
		const u = store.state.users.find((x) => x.id === id);
		store.update((st) => {
			const x = st.users.find((y) => y.id === id);
			if (x) x.status = status;
		});
		audit(this.me?.id ?? '', status === 'deactivated' ? 'deactivated' : 'reactivated', u?.name ?? id);
		return Promise.resolve();
	};
	setUserRole = (id: string, r: RoleId) => {
		const u = store.state.users.find((x) => x.id === id);
		store.update((st) => {
			const x = st.users.find((y) => y.id === id);
			if (x) x.role = r;
		});
		audit(this.me?.id ?? '', 'changed the role to ' + data.roles[r].toLowerCase(), u?.name ?? id);
		return Promise.resolve();
	};
	saveRules = (r: Rules) => {
		store.update((st) => {
			st.rules = r;
		});
		audit(this.me?.id ?? '', 'updated the guardrails', 'Rules');
		return Promise.resolve();
	};
	reset = () => {
		store.reset();
		Agents.reconcile();
	};
}

export const stubSource = new StubSource();
setDefaultSource(stubSource);
