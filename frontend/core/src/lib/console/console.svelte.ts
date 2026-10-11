import type { Catalog, Client, ConsoleConfig, Staff } from '@smart-clearance/api/console';
import { refusal, type Notices } from '@smart-clearance/core';
import { createContext } from 'svelte';
import { refresh as refreshAll } from './api/queries';

/** What every screen of the console reads: how the platform describes itself (its config and catalog), who is signed in,
 *  and act(), which makes a change, refreshes what the console shows and says so in a toast. The prototype's screens
 *  read these from window.SC3_PLATFORM. */
export class Console {
	readonly #me: () => Staff;
	readonly #refresh: () => Promise<unknown>;
	constructor(
		readonly config: ConsoleConfig,
		readonly catalog: Catalog,
		readonly notices: Notices,
		me: () => Staff,
		refresh: () => Promise<unknown> = refreshAll
	) {
		this.#me = me;
		this.#refresh = refresh;
	}

	get me() {
		return this.#me();
	}
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
