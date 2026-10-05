import { catalogQuery, configQuery, meQuery, queryClient } from '#lib/api/queries.ts';

// The console renders only in the browser: it sits behind a sign-in, so there is nothing to render on a server or ahead
// of time. The build is the client-side app and its index.html fallback.
export const ssr = false;

// who is signed in, and how the platform describes itself, before anything draws
export const load = async () => {
	const [me, config, catalog] = await Promise.all([
		queryClient.ensureQueryData(meQuery()),
		queryClient.ensureQueryData(configQuery()),
		queryClient.ensureQueryData(catalogQuery())
	]);
	return { me, config, catalog };
};
