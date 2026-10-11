<script lang="ts">
	import '../app.css';
	import '#lib/demo.css';
	// the console's stylesheet after core's, as the console app's layout imports it, for the console on Neha's laptop
	import '@smart-clearance/core/console/console.css';
	import { AppRoot, ICON_SVG, NoticeHost, ThemeProvider } from '@smart-clearance/core';

	let { children } = $props();
</script>

<svelte:head>
	<title>Smart-Clearance guided demo</title>
	<link rel="icon" href={ICON_SVG} type="image/svg+xml" />
	<meta
		name="description"
		content="The Smart-Clearance guided demo as a route map: the platform's console, then three batches in Munchly Foods' workspace (chips sold through, Mango Drink sold through, a slow week destroyed on a second yes), on a laptop and a phone running the real screens."
	/>
</svelte:head>

<!-- the prototype's Root: the theme, a fixed app root, and the host for its toasts -->
<ThemeProvider>
	<AppRoot class="demo-root" style="position: fixed; inset: 0"><NoticeHost>{@render children()}</NoticeHost></AppRoot>
</ThemeProvider>
