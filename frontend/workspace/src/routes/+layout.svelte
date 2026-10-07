<script lang="ts">
	import '../app.css';
	import { AppRoot, ICON_SVG, ThemeProvider } from '@smart-clearance/core';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={ICON_SVG} type="image/svg+xml" />
	<meta
		name="description"
		content="Munchly Foods' workspace on Smart-Clearance: near-expiry stock routed to the channel that recovers the most, with one human approval: kiranas, marketplaces, staff sales and food banks."
	/>
	<meta name="robots" content="noindex" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Clearance" />
</svelte:head>

<!-- the prototype's Root: the theme, and a fixed app root the screens scroll inside -->
<ThemeProvider>
	<AppRoot class="app-root" style="position: fixed; inset: 0">{@render children()}</AppRoot>
</ThemeProvider>
