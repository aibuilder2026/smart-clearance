<script lang="ts">
	import '../app.css';
	import { ICON_SVG, ThemeProvider } from '@smart-clearance/core';
	import { QueryClientProvider } from '@tanstack/svelte-query';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={ICON_SVG} type="image/svg+xml" />
</svelte:head>

<QueryClientProvider client={data.queryClient}>
	<ThemeProvider>
		{@render children()}
	</ThemeProvider>
</QueryClientProvider>
