import { createContext } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
/** a page that covers each change of theme (the landing page's loader, SC-35): it is handed the theme to go to and the
 *  change itself, calls `apply` under its cover, and resolves once it has gone */
export type ThemeGate = (o: { to: ResolvedTheme; apply: () => void }) => Promise<void>;

/** the reader's choice, shared with the prototype's pages (and read before the first paint by app.html) */
export const THEME_KEY = 'sc3-theme';

const isMode = (v: unknown): v is ThemeMode => v === 'light' || v === 'dark' || v === 'system';

/** Light, dark, or follow the device: the kit's ThemeProvider. Light and dark are composed separately in tokens.css;
 *  this only chooses which one <html data-theme> names. */
export class Theme {
	mode: ThemeMode = $state('system');
	#systemDark = new MediaQuery('(prefers-color-scheme: dark)', false);
	/** what the reader's choice asks for: the device's theme while the page follows it */
	readonly wanted: ResolvedTheme = $derived(
		this.mode === 'system' ? (this.#systemDark.current ? 'dark' : 'light') : this.mode
	);
	/** the theme the page shows: it follows `wanted` at once, or through the gate when a page has set one */
	resolved: ResolvedTheme = $state('light');
	gate: ThemeGate | null = null;
	#turning = false;

	constructor(initial: ThemeMode = 'system') {
		let saved: string | null = null;
		try {
			saved = globalThis.localStorage?.getItem(THEME_KEY) ?? null;
		} catch {
			// storage blocked: follow the default
		}
		this.mode = isMode(saved) ? saved : initial;
		this.resolved = this.wanted;
	}

	setMode = (mode: ThemeMode) => {
		this.mode = mode;
		try {
			localStorage.setItem(THEME_KEY, mode);
		} catch {
			// storage blocked: the choice lasts until the page closes
		}
	};

	/** keep the page in step with the choice (ThemeProvider calls it whenever `wanted` changes). A choice made while a
	 *  change is still playing waits for it, and only the last one counts. */
	follow = (to: ResolvedTheme) => {
		if (to === this.resolved || this.#turning) return;
		if (!this.gate) {
			this.resolved = to;
			return;
		}
		this.#turning = true;
		this.gate({ to, apply: () => (this.resolved = to) }).finally(() => {
			this.#turning = false;
			if (this.wanted !== this.resolved) this.follow(this.wanted);
		});
	};
}

export const [useTheme, provideTheme] = createContext<Theme>();
