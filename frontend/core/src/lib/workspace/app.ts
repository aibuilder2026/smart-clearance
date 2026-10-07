// @smart-clearance/core/workspace/app: the workspace app's UI alone (SC-67). Its screens read everything through the
// source the host provides (provideWorkspace), so this entry carries no data: not the stub's seed, store or journey.
// A host that runs on the stub adds @smart-clearance/core/workspace/stub; SC-73 adds a live source over backend-api.
export { default as WorkspaceApp } from './WorkspaceApp.svelte';
export { default as RoleApp } from './RoleApp.svelte';
export { default as SignIn } from './screens/auth/SignIn.svelte';
export { default as LockScreen, type LockPush } from './screens/common/LockScreen.svelte';
export { provideWorkspace, setDefaultSource, useWorkspace, type Failure, type WorkspaceSource } from './source';
export {
	HOME,
	NAV,
	PARENT,
	SCREENS,
	addDays,
	batchViews,
	cartons,
	heroModel,
	offerMath,
	routesFor,
	stageAt,
	stageTimes,
	track,
	trackTimed,
	viewOf
} from './model';
export { provideAccount, useAccount, type Account, type Route } from './context';
export type * from './types';
