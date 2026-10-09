// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	interface Window {
		/** the console's splash (design3/console/splash.js, SC-51; SC-131), put first in <body> by hooks.server.ts: one
		 *  surface for the first load, signing in and signing out, saying what it waits for while the reads land */
		SC3_SPLASH?: {
			/** the first load's splash has gone */
			lifted: boolean;
			/** the wait that is on, if any */
			active: 'boot' | 'enter' | 'leave' | null;
			/** the animate() its motion runs on: motion's, given by the app */
			animate: ((...args: never[]) => unknown) | null;
			/** begins a wait; resolves once the cover is in, so the page behind can change under it */
			begin: (
				kind: 'enter' | 'leave',
				opts: { who?: string; from?: DOMRect | null; reads?: { id: string; label: string }[] }
			) => Promise<void>;
			/** what the wait is on now: 'platform' once the console's code runs and its reads have gone out */
			phase: (name: 'code' | 'platform' | 'wake' | 'open') => void;
			/** names the reads of the wait that is on, before any has landed */
			reads: (list: { id: string; label: string }[]) => void;
			/** a read landed */
			mark: (id: string) => void;
			/** the page behind is drawn: opens the window onto it from its mark; resolves once the cover has gone */
			open: (opts: { anchor?: string | Element | DOMRect | null; onOpening?: () => void }) => Promise<void>;
			/** something did not answer */
			fail: (opts: { title?: string; text?: string; label?: string; onRetry?: () => void }) => void;
		};
	}
}

export {};
