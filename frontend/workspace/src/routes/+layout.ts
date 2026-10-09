import { workspacePush, workspaceSource } from '#lib/client.ts';

// The workspace renders only in the browser: it sits behind a sign-in, so there is nothing to render on a server or
// ahead of time. The build is the client-side app and its index.html fallback.
export const ssr = false;

/** the source every screen reads: the stub, or backend-api (#lib/client.ts); and, on backend-api, this device's push */
export const load = async () => {
	// on backend-api the splash covers the first load (SC-131): the workspace's code is running, its reads go out
	if (typeof window !== 'undefined') window.SC3_SPLASH?.phase('platform');
	const source = await workspaceSource();
	return { source, push: await workspacePush() };
};
