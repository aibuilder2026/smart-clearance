<script lang="ts">
	import type { ConsoleApi } from '@smart-clearance/api/console';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { untrack } from 'svelte';
	import NoticeHost from '../components/NoticeHost.svelte';
	import Boot from './Boot.svelte';
	import type { ConsoleLinks } from './console.svelte';
	import { ConsoleData } from './data.svelte';
	import type { ConsoleRoute, GoOptions } from './route';

	// The staff console as one component (SC-169), the port of design3/console: the sign-in until a staff member is in,
	// then the shell with the screen the route names. The console app hosts it on real paths (frontend/console); the
	// guided demo draws it in a laptop. It needs the host's AppRoot around it (useApp), and the console's stylesheet
	// (@smart-clearance/core/console/console.css) after core's; it brings its own cache, toasts and console context, so
	// two consoles in one page never share anything.
	type Props = {
		/** the API the console reads and changes: backend-api over HTTP (consoleHttp) or the in-browser mock
		 *  (consoleMock; the demo world's: @smart-clearance/core/console/demo) */
		api?: ConsoleApi;
		/** or the console's data over that API, when the host made it for its own load functions (the console app) */
		data?: ConsoleData;
		/** where the console is; null, an address that names no place (with error). Given none, it keeps its own route,
		 *  starting at the Overview */
		route?: ConsoleRoute | null;
		/** the console moves (a link, a button, a tab, a filter): the host keeps the route and hands it back. What it
		 *  returns is awaited (SvelteKit's goto) */
		ongo?: (route: ConsoleRoute, opts: GoOptions) => unknown;
		/** the host reads each route's data before it hands the route over (the console app's load functions, which call
		 *  data.load), and says which route it is reading in `pending` (SvelteKit's navigating). Otherwise the console
		 *  reads each route itself, showing the one before until it is in */
		preloaded?: boolean;
		pending?: ConsoleRoute | null;
		/** what went wrong reaching the route: 404, a place the console doesn't have */
		error?: { status: number; message?: string } | null;
		/** the other surfaces: the landing page and a client's workspace */
		links?: Partial<ConsoleLinks>;
		/** the sign-in's picture (design3/site/assets/plates/scene.webp, which the host imports so its build hashes it) */
		plate?: string;
		/** the API is the in-browser mock: the sign-in says the prototype's people are fictional, the account sheet offers
		 *  to reset the data */
		mock?: boolean;
		/** drawn inside another page (a device in the guided demo): links carry hash addresses (#/clients/munchly) and
		 *  come back through ongo, the page's title and #main are left alone, and no splash is used */
		embedded?: boolean;
	};
	let { api, data: given, ...rest }: Props = $props();
	// one console, one cache: made once, from what the host gave first
	const data = untrack(() => given ?? new ConsoleData(api!));
</script>

<QueryClientProvider client={data.queryClient}>
	<NoticeHost><Boot {data} {...rest} /></NoticeHost>
</QueryClientProvider>
