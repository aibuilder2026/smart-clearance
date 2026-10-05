import { createContext } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** the reader's choice, shared with the prototype's pages (and read before the first paint by app.html) */
export const THEME_KEY = 'sc3-theme';

const isMode = (v: unknown): v is ThemeMode => v === 'light' || v === 'dark' || v === 'system';

/** Light, dark, or follow the device: the kit's ThemeProvider. Light and dark are composed separately in tokens.css;
 *  this only chooses which one <html data-theme> names. */
export class Theme {
	mode: ThemeMode = $state('system');
	#systemDark = new MediaQuery('(prefers-color-scheme: dark)', false);
	readonly resolved: ResolvedTheme = $derived(
		this.mode === 'system' ? (this.#systemDark.current ? 'dark' : 'light') : this.mode
	);

	constructor(initial: ThemeMode = 'system') {
		let saved: string | null = null;
		try {
			saved = globalThis.localStorage?.getItem(THEME_KEY) ?? null;
		} catch {
			// storage blocked: follow the default
		}
		this.mode = isMode(saved) ? saved : initial;
	}

	setMode = (mode: ThemeMode) => {
		this.mode = mode;
		try {
			localStorage.setItem(THEME_KEY, mode);
		} catch {
			// storage blocked: the choice lasts until the page closes
		}
	};
}

export const [useTheme, provideTheme] = createContext<Theme>();
