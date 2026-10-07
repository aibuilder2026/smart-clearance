// @smart-clearance/core/workspace: Munchly Foods' workspace app (SC-62), the port of design3/app and design3/screens.
// The host app (frontend/workspace) renders WorkspaceApp with the screen its address names. The data is the
// prototype's stub (store.svelte.ts and flow.ts on the seed in ./seed), which backend-api replaces later.
export { default as WorkspaceApp } from './WorkspaceApp.svelte';
export { default as RoleApp } from './RoleApp.svelte';
export { store, seedState } from './store.svelte';
export { act, stageOf, Agents, type ActionName } from './flow';
export { D, WS, PLAN, batchView } from './data';
export { HOME, NAV, SCREENS, routesFor, heroModel } from './model';
export type * from './types';
