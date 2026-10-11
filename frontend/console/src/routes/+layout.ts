import { data } from '#lib/api/client.ts';

// The console renders only in the browser: it sits behind a sign-in, so there is nothing to render on a server or ahead
// of time. The build is the client-side app and its index.html fallback.
export const ssr = false;

// who is signed in, and how the platform describes itself, before anything draws. The splash covers the page from its
// first paint (SC-51; SC-131): it hears here that the console's code is running and its reads have gone out, then each
// read as it lands, or that one was refused (ConsoleData.boot)
export const load = () => data.boot();
