<script lang="ts">
	import '../app.css';
	import '#lib/demo.css';
	import { AppRoot, ICON_SVG, NoticeHost, ThemeProvider } from '@smart-clearance/core';

	let { children } = $props();
</script>

<svelte:head>
	<title>Smart-Clearance guided demo</title>
	<link rel="icon" href={ICON_SVG} type="image/svg+xml" />
	<meta
		name="description"
		content="Nine stages of one near-expiry batch in Munchly Foods' workspace on Smart-Clearance, from the sign-in to the BRSR line, on a laptop and a phone running the real screens."
	/>
</svelte:head>

<!-- the prototype's Root: the theme, a fixed app root, and the host for its toasts -->
<ThemeProvider>
	<AppRoot class="demo-root" style="position: fixed; inset: 0"><NoticeHost>{@render children()}</NoticeHost></AppRoot>
</ThemeProvider>
