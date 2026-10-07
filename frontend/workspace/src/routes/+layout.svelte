<script lang="ts">
	import '../app.css';
	import { AppRoot, ICON_SVG, ThemeProvider } from '@smart-clearance/core';
	import appleIcon from '../../../../design3/app/icons/apple-touch-icon.png?url';

	let { children, data } = $props();
	// the workspace this host serves, as its sign-in page names it (on backend-api, once its public page has answered)
	const workspace = $derived(data.source.publicInfo?.workspace);
</script>

<svelte:head>
	<link rel="icon" href={ICON_SVG} type="image/svg+xml" />
	<!-- installable as design3's app is (routes/manifest.webmanifest); iOS sends push only to an installed app -->
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href={appleIcon} />
	<meta
		name="description"
		content={`${workspace?.name ?? 'A client'}' workspace on Smart-Clearance: near-expiry stock routed to the channel that recovers the most, with one human approval: kiranas, marketplaces, staff sales and food banks.`}
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
