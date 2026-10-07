import { workspaceSource } from '#lib/client.ts';

// The workspace renders only in the browser: it sits behind a sign-in, so there is nothing to render on a server or
// ahead of time. The build is the client-side app and its index.html fallback.
export const ssr = false;

/** the source every screen reads: the stub, or backend-api (#lib/client.ts) */
export const load = async () => ({ source: await workspaceSource() });
