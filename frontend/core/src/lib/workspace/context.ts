// What the workspace's screens share through context (design3/screens/common.jsx): the router, the app's account
// controls, and the workspace the person is in.
import { createContext } from 'svelte';
import type { PushControl } from './live.svelte';

export type Route = { name: string; params?: Record<string, string> };
/** a small router: the app binds it to the address; each screen goes by name */
export type Router = {
	readonly route: Route;
	go: (name: string, params?: Record<string, string>) => void;
	back: () => void;
};
export const [useRoute, provideRoute] = createContext<Router>();

/** the app's account controls: switch person, sign out, start the journey again, install */
export type Account = {
	/** with an id, become that person (at a screen, if given); without, choose who */
	switchTo?: (id?: string, route?: string) => void;
	signOut?: () => void;
	reset?: () => void;
	/** the browser's install prompt, when it offers one; null when it doesn't, undefined where there is no install */
	install?: (() => void) | null;
	standalone?: boolean;
	/** the live workspace's web push on this device (Profile's switch); none on the stub */
	push?: PushControl | null;
};
export const [useAccount, provideAccount] = createContext<Account>();

/** the client workspace the person is in; on a phone it sits at the left of each page's bar. null outside it */
export type WorkspaceLead = { name: string; domain: string; open: () => void } | null;
export const [useWorkspaceLead, provideWorkspaceLead] = createContext<WorkspaceLead>();
