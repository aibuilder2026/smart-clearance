import { browser } from '$app/env';
import { QueryClient } from '@tanstack/svelte-query';

// The root layout stays server-renderable: kit 3 drops the load function of a layout that exports `ssr = false` from
// the server build, so client-only routes turn SSR off in their own group layout instead ((dev)/+layout.ts).
export const load = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			// queries never run on the server; a prerendered page prefetches what it needs in its load function
			queries: { enabled: browser, staleTime: 5 * 60_000 }
		}
	});
	return { queryClient };
};
