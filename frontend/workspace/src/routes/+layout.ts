import { workspacePush, workspaceSource } from '#lib/client.ts';

// The workspace renders only in the browser: it sits behind a sign-in, so there is nothing to render on a server or
// ahead of time. The build is the client-side app and its index.html fallback.
export const ssr = false;

/** the source every screen reads: the stub, or backend-api (#lib/client.ts); and, on backend-api, this device's push */
export const load = async () => {
	const source = await workspaceSource();
	return { source, push: await workspacePush() };
};
