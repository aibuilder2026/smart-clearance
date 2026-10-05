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
		/** the landing page's loader (design3/site/loader.js, SC-35), put first in <body> by hooks.server.ts */
		SC3_LOADER?: {
			lifted: boolean;
			busy: boolean;
			/** the animate() its exits run on: motion's, given by the page */
			animate?: (...args: never[]) => unknown;
			mark: (milestone: string, share?: number) => void;
			depthIn: () => void;
			plateDrawn: (dark: boolean) => void;
			switchTheme: (o: { to: 'light' | 'dark'; apply: () => void }) => Promise<void>;
		};
		/** where the loader finds a plate by its name in design3, now that the build has hashed it */
		SC3_PLATE_URL?: (name: string) => string | undefined;
	}
}

export {};
