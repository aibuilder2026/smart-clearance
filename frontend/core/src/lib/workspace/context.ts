// What the workspace's screens share through context (design3/screens/common.jsx): the router, the app's account
// controls, and the workspace the person is in.
import { createContext, type Snippet } from 'svelte';
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

/** a screen of a batch (SC-112): the operator's batch page gives each of its screens the batch's head (its pack, name,
 *  id, distributor and state, then its screens as tabs) in place of the screen's own title, line and the row under it,
 *  and a back link to where the batch was opened from. RoleApp provides it for everyone; it is on only on a batch page */
export type BatchFrame = {
	readonly on: boolean;
	readonly title: string;
	readonly back: string;
	readonly head: Snippet;
};
const [getFrame, setFrame, hasFrame] = createContext<BatchFrame>();
export const provideBatchFrame = setFrame;
/** the batch page a screen is on, if RoleApp gave one (a screen drawn on its own has none) */
export const useBatchFrame = (): BatchFrame | null => (hasFrame() ? getFrame() : null);
