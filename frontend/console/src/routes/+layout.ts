import { catalogQuery, configQuery, meQuery, queryClient } from '#lib/api/queries.ts';

// The console renders only in the browser: it sits behind a sign-in, so there is nothing to render on a server or ahead
// of time. The build is the client-side app and its index.html fallback.
export const ssr = false;

// who is signed in, and how the platform describes itself, before anything draws. The splash covers the page from its
// first paint (SC-51; SC-131): it hears here that the console's code is running and its reads have gone out, then each
// read as it lands, or that one was refused
const landed =
	(id: string) =>
	<T>(v: T) => (window.SC3_SPLASH?.mark(id), v);
export const load = async () => {
	window.SC3_SPLASH?.phase('platform');
	try {
		const [me, config, catalog] = await Promise.all([
			queryClient.ensureQueryData(meQuery()).then(landed('session')),
			queryClient.ensureQueryData(configQuery()).then(landed('config')),
			queryClient.ensureQueryData(catalogQuery()).then(landed('catalog'))
		]);
		return { me, config, catalog };
	} catch (err) {
		window.SC3_SPLASH?.fail({ text: 'The platform could not answer just now. Check the connection, then try again.' });
		throw err;
	}
};
