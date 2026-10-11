<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { ICON_SVG, ThemeProvider } from '@smart-clearance/core';
	import { QueryClientProvider } from '@tanstack/svelte-query';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={ICON_SVG} type="image/svg+xml" />
</svelte:head>

<QueryClientProvider client={data.queryClient}>
	<!-- the landing page is always in day (SC-165); /ds, the design-system page, keeps both themes -->
	<ThemeProvider fixed={page.route.id === '/' ? 'light' : undefined}>
		{@render children()}
	</ThemeProvider>
</QueryClientProvider>
