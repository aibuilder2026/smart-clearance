// The stub source (SC-67): Munchly Foods' workspace as the prototype runs it in the browser (design3/core: store.js,
// flow.js and the seed), behind the same WorkspaceSource a live source implements. The journey's state is the store's,
// the workspace's data and the batch in focus are the seed's, built once, and each step a person takes is flow.ts's
// action, made as today's screens made it. Importing this module makes it the default source, so a screen drawn
// outside any provider (the guided demo, the design-system page) reads it.
import { CHIPS, D, ES, INVOICE, KL, SHOPS_ALL, storyOf } from './data';
import { A, act as run, Agents, type ActionName } from './flow';
import { expiryPapers, stubLedger, stubPage, type DestructionDone } from './ledger';
import { historyCase, recordOf, storyRecord } from './record';
import history from './seed/history.json';
import type { PartnerWorld } from './partners';
import { SvelteSet } from 'svelte/reactivity';
import { setDefaultSource, type SendOptions, type WorkspaceSource } from './source';
import { store } from './store.svelte';
import type {
	ActionArg,
	CaseData,
	HumanAction,
	InviteInput,
	PartnerCase,
	PartnerView,
	Plan,
	PlanLine,
	Push,
	RoleId,
	Rules,
	SourceStatus,
	State,
	StoryKey,
	User,
	UserStatus,
	WorkspaceData,
	WorkspacePublic
} from './types';

const hero = D.batches.find((b) => b.hero)!;
const second = D.batches.find((b) => b.second)!;

/** the workspace's data, as the screens read it */
/** the history's batches as the partners' pages read them (SC-130) */
export const HISTORY_CASES = history.cases as unknown as PartnerCase[];
/** the stub's world for the partners' pages: the prototype's */
export const STUB_WORLD: PartnerWorld = {
	skus: D.skus,
	distributors: D.distributors,
	buyer: D.buyer,
	client: D.client.name,
	short: D.workspace.short,
	capTimes: D.rules.shopCapTimes,
	people: D.people
};

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
	market: D.market,
	shops: SHOPS_ALL
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
		partner: D.setup.partners.find((p) => p.name === D.journey.donation.partner)!,
		// the receipt Feeding India issues as the packs are collected (SC-110); the screens show it once they are
		receipt: D.mangoReceipt
	}
});

const publicInfo: WorkspacePublic = Object.freeze({
	workspace: D.workspace,
	platform: D.platform,
	prototype: { code: D.explore.code, accounts: D.explore.accounts }
});

/* ---------- the stub's other journeys (SC-168): the Mango Drink's own and the slow chips' ---------- */

const NO_LINE = (id: string, name: string): PlanLine => ({
	id,
	name,
	short: name,
	units: 0,
	price: 0,
	packPrice: null,
	charged: 0,
	gross: 0,
	cost: 0,
	itcLoss: 0,
	net: 0,
	cartons: 0
});
const NO_PLAN: Plan = { ...D.mangoPlan, units: 0, rows: [], lines: [], net: 0, alt: null, donated: 0, meals: 0 };
/** a push not reached yet, or not the story's, reads as an empty one (as the live projection's) */
const pushes = (p: Record<string, Push>) =>
	new Proxy(p, { get: (t, k) => (typeof k === 'string' ? (t[k] ?? { at: '', title: '', body: '' }) : undefined) });
/** the workspace's data on another journey: its batches as that journey flags them */
const DATA: Partial<Record<StoryKey, WorkspaceData>> = { chips: data };
const dataOf = (key: StoryKey) =>
	(DATA[key] ??= Object.freeze({ ...data, batches: storyOf(key).batches }) as WorkspaceData);
const PUBLIC: Partial<Record<StoryKey, WorkspacePublic>> = { chips: publicInfo };
const publicOf = (key: StoryKey) =>
	(PUBLIC[key] ??= Object.freeze({
		...publicInfo,
		prototype: { code: storyOf(key).explore.code, accounts: storyOf(key).explore.accounts }
	}));

/** the batch in focus on the journey the state holds: the story's chips (`kase`), or another journey's batch, its papers
 *  as the state has them: on the slow chips' expiry day, once Priya approves the destruction, the expiry credit note and
 *  the agency's certificate (ledger.js storyCase) */
export function caseOf(state: State): CaseData {
	const key = state.scenario ?? 'chips';
	if (key === 'chips') return kase;
	const S = storyOf(key),
		h = state.hero,
		d = h.destruction;
	const approved = !!S.expiry && !!h.expiry && d?.status === 'approved';
	const xd = approved
		? ({
				...d,
				method: D.setup.destruction.method,
				approvedAt: `${S.cleared}T${d!.approvedAt || '11:00'}`,
				photos: Object.fromEntries(
					Object.entries(d!.photos ?? {}).map(([w, p]) => [w, { ...p, at: `${S.expiryDay}T${p.at}` }])
				)
			} as DestructionDone)
		: null;
	const docs = xd ? expiryPapers([...S.docs], h.expiry!, xd, S.batch, S.sku, S.dist, S.expiryNo!) : S.docs;
	const x = S.donation;
	return {
		batch: S.batch,
		sku: S.sku,
		dist: S.dist,
		buyer: D.buyer,
		kiranas: S.kiranas,
		offered: S.offered,
		scheme: D.rules.scheme,
		risk: S.risk,
		plan: S.plan,
		lines: {
			kirana: S.KL ?? NO_LINE('kirana', 'Kirana cluster push'),
			expiresoon: S.ES ?? NO_LINE('expiresoon', 'ExpireSoon')
		},
		counter: S.counter ?? { action: 'counter', price: 0, below: false },
		award: S.award ?? { units: 0, price: 0, gross: 0, token: 0, balance: 0 },
		actual: S.actual,
		support: S.support,
		supportPlan: S.supportPlan,
		claim: S.claim,
		docs,
		invoice: S.invoice ?? { id: 'invoice', type: '', owner: S.dist.name, no: '', status: 'not required', amount: 0 },
		returnBy: S.returnBy,
		push: pushes(S.push),
		today: S.journey.today,
		planMinutes: S.journey.planMinutes,
		permissionAsked: S.journey.permissionAsked,
		listing: S.listing ?? { id: '', url: '' },
		van: S.journey.van,
		realised: S.realised,
		expiry: approved ? h.expiry : null,
		story: {
			key,
			fills: S.fills,
			expires: S.expiry?.units ?? 0,
			vanDay: S.vanDay,
			permits: !S.setupDone,
			evidence: { before: S.evidence.before, after: S.evidence.after }
		},
		donation: x
			? {
					...S.journey.donation,
					batch: x.batch,
					sku: D.skus[x.batch.sku],
					dist: D.distributors[x.batch.distributor],
					plan: x.plan,
					units: x.units,
					partner: x.partner,
					receipt: x.receipt
				}
			: {
					...S.journey.donation,
					batch: S.batch,
					sku: S.sku,
					dist: S.dist,
					plan: NO_PLAN,
					units: 0,
					partner: D.setup.partners[0],
					receipt: null
				}
	};
}

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
	// the journey the store holds (SC-168): its data, its batch in focus and the people a visitor can step into
	readonly #scenario = $derived(store.state.scenario ?? 'chips');
	readonly #case = $derived(caseOf(store.state));
	get publicInfo() {
		return publicOf(this.#scenario);
	}
	get data() {
		return dataOf(this.#scenario);
	}
	get case() {
		return this.#case;
	}
	/** the stub has one batch in focus, whatever a screen asks for */
	readonly focus = null;
	get explore() {
		return storyOf(this.#scenario).explore.groups;
	}
	// the steps waiting out their feel, so a screen can draw them waiting (SC-152)
	#pending = new SvelteSet<string>();
	#session = $state<Session | null>(null);
	#splash = $state(true);

	get pending(): ReadonlySet<string> {
		return this.#pending;
	}
	// the ledger follows the journey: the chips batch joins once Impact has posted it (design3/core/ledger.js)
	readonly #ledger = $derived(stubLedger(store.state));
	get ledger() {
		return this.#ledger;
	}
	ledgerPage(ref: string) {
		return stubPage(ref, this.data, this.#case, store.state);
	}
	// a batch's record (SC-142): a history batch's from its own stamps, the journey's from its feed and audit; the stub
	// keeps no record of a batch in no journey (beside the chips, the Mango Drink, which it leaves at its label photo)
	record(ref: string) {
		const c = historyCase(ref);
		if (c) return recordOf(c);
		if (ref === storyOf(this.#scenario).batch.id) return storyRecord(store.state);
		return D.batches.some((b) => b.id === ref) ? { ref, steps: [], photos: [] } : null;
	}
	// a partner's own history (SC-130): the client's history; each partner's screens take their own part of it, a
	// kirana its shop among every shop the schemes go to (data.shops)
	readonly partners: PartnerView = Object.freeze({
		buyer: { name: D.buyer.name, city: D.buyer.city },
		shop: null,
		cases: HISTORY_CASES
	});
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

	// the stub never refuses a step, so `inline` changes nothing here
	act = <N extends HumanAction>(name: N, arg?: ActionArg<N>, o?: { feel?: number; ref?: string } & SendOptions) => {
		const step = () => {
			if (name === 'order' && arg && typeof arg === 'object') {
				// a kirana's order with its own count, as the offer screen made it: one change
				const { kirana, units } = arg as ActionArg<'order'>;
				store.update((st) => {
					A.order(st, kirana);
					const x = st.hero.orders.find((y) => y.id === kirana);
					if (x && units != null) x.units = units;
				});
			} else run(name as ActionName, arg as Parameters<typeof run>[1]);
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
	// an invitation is an email address only (SC-68), as the console's
	invite = (i: InviteInput) => {
		const me = this.me;
		const email = i.contact.trim().toLowerCase();
		const staff = email.endsWith('@' + data.workspace.emailDomain);
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
				provider: 'google',
				phone: '',
				email,
				status: 'invited',
				invitedBy: me?.name,
				kind: staff ? 'staff' : 'partner',
				lastSeen: null,
				extra: true
			});
		});
		audit(me?.id ?? '', 'invited ' + i.name + ' as ' + data.roles[i.role].toLowerCase(), email);
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
