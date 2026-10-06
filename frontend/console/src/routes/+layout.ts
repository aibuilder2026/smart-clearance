import { catalogQuery, configQuery, meQuery, queryClient } from '#lib/api/queries.ts';

// The console renders only in the browser: it sits behind a sign-in, so there is nothing to render on a server or ahead
// of time. The build is the client-side app and its index.html fallback.
export const ssr = false;

// who is signed in, and how the platform describes itself, before anything draws. On the first load each answer is
// a stop on the splash (SC-51): the splash covers the page from its first paint and follows them as they land
const landed = (id: string) => <T>(v: T) => (window.SC3_SPLASH?.mark(id), v);
export const load = async () => {
	const [me, config, catalog] = await Promise.all([
		queryClient.ensureQueryData(meQuery()).then(landed('session')),
		queryClient.ensureQueryData(configQuery()).then(landed('config')),
		queryClient.ensureQueryData(catalogQuery()).then(landed('catalog'))
	]);
	return { me, config, catalog };
};
