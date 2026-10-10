<script lang="ts">
	import { provideWorkspace, WorkspaceApp } from '@smart-clearance/core/workspace/app';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// every screen reads the source the layout loaded: backend-api's workspace, or the prototype's stub (#lib/client.ts)
	let { data } = $props();
	// svelte-ignore state_referenced_locally (one source for the app's life)
	provideWorkspace(data.source);

	// every screen of the workspace is one path, /command, /route, /inbox … (the prototype's #/command), and a screen about
	// one batch may name it after: /route/MF-2409-117, and the tab its page opens on: /report/MF-2407-116?tab=record. The
	// root is the sign-in, or the person's home once they are in
	const screen = $derived(page.params.screen ?? null);
	const ref = $derived(page.params.ref ?? null);
	const tab = $derived(page.url.searchParams.get('tab'));
	// the Ledger's reading the address opens on: /report?reading=impact (the Command Center's Impact card, SC-157)
	const reading = $derived(page.url.searchParams.get('reading'));
	const at = (opts: { ref?: string; tab?: string; reading?: string }) => {
		const q = [
			['tab', opts.tab],
			['reading', opts.reading]
		]
			.filter((kv): kv is [string, string] => !!kv[1])
			.map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
		const query = q.length ? `?${q.join('&')}` : '';
		return opts.ref ? `/${encodeURIComponent(opts.ref)}${query}` : query;
	};
	const navigate = (
		name: string | null,
		opts: { replace?: boolean; ref?: string; tab?: string; reading?: string } = {}
	) =>
		void goto(name ? `/${name}${at(opts)}` : '/', {
			replace: !!opts.replace,
			reset: false
		});
	// on backend-api, the console's splash covers the first load, signing in and signing out (hooks.server.ts puts it
	// first in <body>), and the first sign-in on a device asks for push
	const splash = typeof window !== 'undefined' ? (window.SC3_SPLASH ?? null) : null;
</script>

<WorkspaceApp {screen} {ref} {tab} {reading} {navigate} back={() => history.back()} push={data.push} {splash} />
