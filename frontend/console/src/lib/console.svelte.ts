import type { Catalog, Client, ConsoleConfig, Staff } from '@smart-clearance/api/console';
import type { Notices } from '@smart-clearance/core';
import { createContext } from 'svelte';
import { refresh } from './api/queries';

/** What every screen of the console reads: how the platform describes itself (its config and catalog), who is signed in,
 *  and act(), which makes a change, refreshes what the console shows and says so in a toast. The prototype's screens
 *  read these from window.SC3_PLATFORM. */
export class Console {
	readonly #me: () => Staff;
	constructor(
		readonly config: ConsoleConfig,
		readonly catalog: Catalog,
		readonly notices: Notices,
		me: () => Staff
	) {
		this.#me = me;
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

	/** makes a change, refreshes everything shown, and confirms it; a failure is said in a toast and gives undefined */
	act = async <T>(run: () => Promise<T>, ok?: string | ((r: T) => string)): Promise<T | undefined> => {
		try {
			const r = await run();
			await refresh();
			if (ok) this.notices.toast({ text: typeof ok === 'string' ? ok : ok(r), tone: 'ok' });
			return r;
		} catch (e) {
			this.notices.toast({ text: e instanceof Error ? e.message : 'That did not go through. Try again.', tone: 'err' });
			return undefined;
		}
	};
}

export const [useConsole, provideConsole] = createContext<Console>();
