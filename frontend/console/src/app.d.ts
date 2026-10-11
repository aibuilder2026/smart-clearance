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
		SC3_SPLASH?: import('@smart-clearance/core/console').ConsoleSplash;
	}
}

export {};
