<script lang="ts">
	import { provideWorkspace, WorkspaceApp } from '@smart-clearance/core/workspace/app';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// every screen reads the source the layout loaded: backend-api's workspace, or the prototype's stub (#lib/client.ts)
	let { data } = $props();
	// svelte-ignore state_referenced_locally (one source for the app's life)
	provideWorkspace(data.source);

	// every screen of the workspace is one path, /command, /route, /inbox … (the prototype's #/command), and a screen about
	// one batch may name it after: /route/MF-2409-117. The root is the sign-in, or the person's home once they are in
	const screen = $derived(page.params.screen ?? null);
	const ref = $derived(page.params.ref ?? null);
	const navigate = (name: string | null, opts: { replace?: boolean; ref?: string } = {}) =>
		void goto(name ? `/${name}${opts.ref ? '/' + encodeURIComponent(opts.ref) : ''}` : '/', {
			replace: !!opts.replace,
			reset: false
		});
</script>

<WorkspaceApp {screen} {ref} {navigate} back={() => history.back()} />
