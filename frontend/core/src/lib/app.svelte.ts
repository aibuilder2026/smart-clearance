import { createContext } from 'svelte';
import { bpOf, type Breakpoint } from './bp';

/** What every layout decision reads: the app's own width and height (so a device preview renders true), the element
 *  overlays portal into, and whether the page has hydrated. The kit's AppRoot context (useApp). */
export class AppState {
	w = $state(1440);
	h = $state(900);
	/** the element sheets and alerts are portalled into */
	overlays: HTMLElement | null = $state(null);
	/** true once the page has mounted in the browser: before that, render what the server rendered */
	mounted = $state(false);
	/** an app drawn inside a device preview (the demo, the design system page), not the page itself */
	readonly embedded: boolean;
	/** 'window': a page that scrolls the window (the landing page), whose overlays sit in a fixed layer and leave the
	 *  page where it was, as the prototype's do; 'app': the app scrolls inside its root */
	readonly scroll: 'app' | 'window';
	readonly bp: Breakpoint = $derived(bpOf(this.w));

	constructor({ embedded = false, scroll = 'app' }: { embedded?: boolean; scroll?: 'app' | 'window' } = {}) {
		this.embedded = embedded;
		this.scroll = scroll;
		if (typeof window !== 'undefined' && !embedded) {
			this.w = window.innerWidth;
			this.h = window.innerHeight;
		}
	}
}

export const [useApp, provideApp] = createContext<AppState>();
