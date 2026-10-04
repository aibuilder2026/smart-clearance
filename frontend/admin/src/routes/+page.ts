export const prerender = true;
export const ssr = true;

export const load = async ({ parent }) => {
	const { queryClient } = await parent();
	await queryClient.prefetchQuery({ queryKey: ['spike'], queryFn: async () => ({ net: 21152, shops: 31 }) });
};
