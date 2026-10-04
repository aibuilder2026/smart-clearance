import { catalogQuery, showcaseQuery } from '#lib/api/queries.ts';

// the landing page is prerendered with its data, so the static HTML carries every figure
export const prerender = true;

export const load = async ({ parent }) => {
	const { queryClient } = await parent();
	await Promise.all([queryClient.prefetchQuery(showcaseQuery()), queryClient.prefetchQuery(catalogQuery())]);
};
