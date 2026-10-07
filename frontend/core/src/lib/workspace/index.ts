// @smart-clearance/core/workspace: Munchly Foods' workspace app (SC-62), the port of design3/app and design3/screens.
// The host app (frontend/workspace) renders WorkspaceApp with the screen its address names. The data is the
// prototype's stub (store.svelte.ts and flow.ts on the seed in ./seed), which backend-api replaces later.
export { default as WorkspaceApp } from './WorkspaceApp.svelte';
export { default as RoleApp } from './RoleApp.svelte';
export { store, seedState } from './store.svelte';
export { act, run, fastForward, stageOf, Agents, type ActionName } from './flow';
export { D, WS, PLAN, KL, ES, INVOICE, batchView } from './data';
export { HOME, NAV, SCREENS, routesFor, heroModel, offerMath } from './model';
export { provideAccount, type Account, type Route } from './context';
export { default as SignIn } from './screens/auth/SignIn.svelte';
export { default as LockScreen, type LockPush } from './screens/common/LockScreen.svelte';
export type * from './types';
