// Which source the workspace app runs on: backend-api when the build has PUBLIC_API_BASE (SC-73), else the
// prototype's stub in this browser. The address is inlined at build time, so the other one, with its code and (for the
// stub) Munchly's whole seed, is never part of the build.
import { PUBLIC_API_BASE } from '$app/env/public';
import type { PushControl, WorkspaceSource } from '@smart-clearance/core/workspace/app';

export const isLive = !!PUBLIC_API_BASE;

export async function workspaceSource(): Promise<WorkspaceSource> {
	if (PUBLIC_API_BASE) return (await import('./live/index.ts')).live();
	return (await import('@smart-clearance/core/workspace/stub')).stubSource;
}

/** this device's web push, on backend-api once the live workspace has started (the stub has none) */
export async function workspacePush(): Promise<PushControl | null> {
	if (!PUBLIC_API_BASE) return null;
	return (await import('./live/index.ts')).push;
}
