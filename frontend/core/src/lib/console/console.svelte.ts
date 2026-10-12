import type { Catalog, Client, ConsoleConfig, Staff } from '@smart-clearance/api/console';
import { createContext } from 'svelte';
import type { Notices } from '../notice.svelte';
import { refusal } from '../wait.svelte';
import type { ConsoleData } from './data.svelte';
import { routePath, type ConsoleRoute, type ConsoleScreen, type GoOptions } from './route';

/** where the other surfaces live: the landing page, and a client's workspace (Munchly Foods') */
export type ConsoleLinks = { site: string; app: string };
/** the live surfaces, where a host names none */
const LINKS: ConsoleLinks = { site: 'https://smartclearance.web.app', app: 'https://munchly-smartclearance.web.app' };

/** What every screen of the console reads (SC-169: one per console, never a module's): how the platform describes
 *  itself (its config and catalog), who is signed in, the API and its cache, where the console is and how to move it,
 *  and act(), which makes a change, refreshes what the console shows and says so in a toast. The prototype's screens
 *  read these from window.SC3_PLATFORM. */
export class Console {
	readonly data: ConsoleData;
	readonly config: ConsoleConfig;
	readonly catalog: Catalog;
	readonly notices: Notices;
	readonly links: ConsoleLinks;
	/** the API is the in-browser mock: the prototype's people are fictional, and its data can be reset */
	readonly mock: boolean;
	/** drawn inside another page: its links carry hash addresses, and nothing reaches for the page's own */
	readonly embedded: boolean;
	readonly #me: () => Staff;
	readonly #route: () => ConsoleRoute | null;
	readonly #pending: () => ConsoleRoute | null;
	readonly #go: (route: ConsoleRoute, opts?: GoOptions) => Promise<unknown>;
	readonly #href: (route: ConsoleRoute) => string;
	readonly #top: () => void;
	readonly #refresh: () => Promise<unknown>;
	readonly #account: () => void;

	constructor(o: {
		data: ConsoleData;
		config: ConsoleConfig;
		catalog: Catalog;
		notices: Notices;
		me: () => Staff;
		route?: () => ConsoleRoute | null;
		pending?: () => ConsoleRoute | null;
		go?: (route: ConsoleRoute, opts?: GoOptions) => Promise<unknown>;
		href?: (route: ConsoleRoute) => string;
		links?: Partial<ConsoleLinks>;
		mock?: boolean;
		embedded?: boolean;
		/** scrolls the console's own page to its top */
		top?: () => void;
		refresh?: () => Promise<unknown>;
		/** opens the signed-in staff member's account sheet (Sign out) */
		account?: () => void;
	}) {
		this.data = o.data;
		this.config = o.config;
		this.catalog = o.catalog;
		this.notices = o.notices;
		this.links = { site: o.links?.site || LINKS.site, app: o.links?.app || LINKS.app };
		this.mock = !!o.mock;
		this.embedded = !!o.embedded;
		this.#me = o.me;
		this.#route = o.route ?? (() => null);
		this.#pending = o.pending ?? (() => null);
		this.#go = o.go ?? (() => Promise.resolve());
		this.#href = o.href ?? routePath;
		this.#top = o.top ?? (() => {});
		this.#refresh = o.refresh ?? (() => o.data.refresh());
		this.#account = o.account ?? (() => {});
	}

	get me() {
		return this.#me();
	}
	/** the API the console reads and changes, and what it reads, over this console's own cache */
	get api() {
		return this.data.api;
	}
	get q() {
		return this.data.q;
	}
	/** the route the console shows */
	get route(): ConsoleRoute {
		return this.#route() ?? { screen: 'overview' };
	}
	/** the route being read, before it shows (a link followed, a tab or filter changed) */
	get pending() {
		return this.#pending();
	}
	/** moves the console: resolves once the place has opened with its data (a button that waits on it lets go then) */
	go = (route: ConsoleRoute, opts?: GoOptions) => this.#go(route, opts);
	/** a link to a place in the console, as the host keeps its addresses */
	href = (route: ConsoleRoute) => this.#href(route);
	/** a screen's code, fetched ahead (the Overview's, while the sign-in is typed in) */
	preload = (screen: ConsoleScreen) => void this.data.code({ screen }).catch(() => undefined);
	/** the console's page back at its top (each step of New client) */
	top = () => this.#top();
	/** the account sheet, with Sign out: the sidebar's on tablets and desktops, the bar's on a phone (SC-194) */
	account = () => this.#account();

	agent = (id: string) => this.catalog.agents.find((a) => a.id === id)!;
	/** an autonomy level by its id ("ask" → Ask) */
	level = (id: string) => this.config.autonomy.find((x) => x.id === id) ?? { id, label: id, text: '' };
	planName = (id: string) => this.catalog.plans.find((p) => p.id === id)?.name ?? id;
	/** how many of a client's agents are on, the approval apart (it always is) */
	agentsOn = (c: Client) => this.catalog.agents.filter((a) => !a.gate && c.agents[a.id]?.on).length;
	/** the agents a client can switch: all but the approval */
	get workers() {
		return this.catalog.agents.length - 1;
	}

	/** makes a change and resolves once it is saved, so the button that waits on it lets go then (SC-152): everything
	 *  shown is read again in place, not awaited, and the toast confirms only a change that went through. A refusal
	 *  rejects with the API's own words, for the button to say under itself */
	act = async <T>(run: () => Promise<T>, ok?: string | ((r: T) => string)): Promise<T> => {
		const r = await run();
		void this.#refresh().catch(() => {});
		if (ok) this.notices.toast({ text: typeof ok === 'string' ? ok : ok(r), tone: 'ok' });
		return r;
	};
	/** act(), for a caller with no button to say a refusal under (a file dropped on a card): the refusal is a toast, and
	 *  it gives undefined */
	tell = async <T>(run: () => Promise<T>, ok?: string | ((r: T) => string)): Promise<T | undefined> => {
		try {
			return await this.act(run, ok);
		} catch (e) {
			this.notices.toast({ text: refusal(e), tone: 'err' });
			return undefined;
		}
	};
}

export const [useConsole, provideConsole] = createContext<Console>();
