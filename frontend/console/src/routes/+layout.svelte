<script lang="ts">
	import '../app.css';
	import '#lib/console.css';
	import { AppRoot, ICON_SVG, NoticeHost, ThemeProvider } from '@smart-clearance/core';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '#lib/api/queries.ts';
	import App from '#lib/screens/App.svelte';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={ICON_SVG} type="image/svg+xml" />
	<meta
		name="description"
		content="The Smart-Clearance console, where platform staff set up each manufacturer's workspace: its agents, supply chain, channels, rules and people."
	/>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- the prototype's Root: the theme, a fixed app root the screens scroll inside, and the host for its toasts -->
<QueryClientProvider client={queryClient}>
	<ThemeProvider>
		<AppRoot class="app-root" style="position: fixed; inset: 0">
			<NoticeHost>
				<App me={data.me} config={data.config} catalog={data.catalog}>{@render children()}</App>
			</NoticeHost>
		</AppRoot>
	</ThemeProvider>
</QueryClientProvider>
