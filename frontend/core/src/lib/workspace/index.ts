// @smart-clearance/core/workspace: Munchly Foods' workspace app (SC-62), the port of design3/app and design3/screens,
// with the prototype's stub as its source: the app's UI (./app.ts) and the stub (./stub.ts) together, as the guided demo
// imports them. heroModel and offerMath here are bound to the stub, as they were before the screens read a source
// (SC-67); the app entry has them taking their data.
import { heroModel as heroOf, offerMath as offerOf } from './model';
import { data, kase } from './stub.svelte';
import type { State } from './types';

export { default as WorkspaceApp } from './WorkspaceApp.svelte';
export { default as RoleApp } from './RoleApp.svelte';
export { default as SignIn } from './screens/auth/SignIn.svelte';
export { default as LockScreen, type LockPush } from './screens/common/LockScreen.svelte';
export { provideWorkspace, setDefaultSource, useWorkspace, type WorkspaceSource } from './source';
export { stubSource } from './stub.svelte';
export { store, seedState } from './store.svelte';
export { act, run, fastForward, stageOf, Agents, type ActionName } from './flow';
export { D, WS, PLAN, KL, ES, INVOICE, batchView } from './data';
export { HOME, NAV, SCREENS, routesFor } from './model';
export { provideAccount, type Account, type Route } from './context';
export type * from './types';

/** the batch in focus's live model, on the stub */
export const heroModel = (s: State) => heroOf(s, data, kase);
/** the scheme's maths for n packets, on the stub */
export const offerMath = (n: number) => offerOf(n, kase);
