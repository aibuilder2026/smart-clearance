<script lang="ts">
	import '../app.css';
	import '@smart-clearance/core/console/console.css';
	import plate from '$design3/site/assets/plates/scene.webp';
	import { AppRoot, ICON_SVG, ThemeProvider } from '@smart-clearance/core';
	import { ConsoleApp, routeOf, routePath, type ConsoleRoute, type GoOptions } from '@smart-clearance/core/console';
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { data, usingMock } from '#lib/api/client.ts';
	import { LINKS } from '#lib/links.ts';

	// The console app is a host (SC-169): the console itself is core's ConsoleApp. Its places are real paths
	// (/clients/munchly/agents, routeOf and routePath), each route's load function reads the place's code and data
	// before it draws (data.load), and the place being read shows its loader (navigating). A move in the console is a
	// goto; an address the console doesn't have is its Not found
	let { children } = $props();
	const route = $derived(routeOf(page.url.pathname, page.url.search));
	const pending = $derived(navigating.to ? routeOf(navigating.to.url.pathname, navigating.to.url.search) : null);
	const error = $derived(page.error ? { status: page.status, message: page.error.message } : null);
	const go = (r: ConsoleRoute, o: GoOptions) => goto(routePath(r), { replace: !!o.replace, reset: !o.keep });
</script>

<svelte:head>
	<link rel="icon" href={ICON_SVG} type="image/svg+xml" />
	<meta
		name="description"
		content="The Smart-Clearance console, where platform staff set up each manufacturer's workspace: its agents, supply chain, channels, rules and people."
	/>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- the prototype's Root: the theme, and a fixed app root the screens scroll inside; the console brings its own toasts -->
<ThemeProvider>
	<AppRoot class="app-root" style="position: fixed; inset: 0">
		<ConsoleApp {data} {route} ongo={go} preloaded {pending} {error} links={LINKS} {plate} mock={usingMock} />
	</AppRoot>
</ThemeProvider>
<!-- the route's page draws nothing (the console draws every place); its error page neither: ConsoleApp says Not found -->
{@render children()}
