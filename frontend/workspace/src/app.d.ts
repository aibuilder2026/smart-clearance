// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SplashControl } from '@smart-clearance/core/workspace/app';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	interface Window {
		/** the console's splash (design3/console/splash.js, SC-51) in the workspace's words, put first in <body> by
		 *  hooks.server.ts in a live build (SC-73): the first load, signing in and signing out */
		SC3_SPLASH?: SplashControl;
	}
}

export {};
