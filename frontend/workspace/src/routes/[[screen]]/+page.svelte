<script lang="ts">
	import { WorkspaceApp } from '@smart-clearance/core/workspace';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// every screen of the workspace is one path, /command, /route, /inbox … (the prototype's #/command); the root is the
	// sign-in, or the person's home once they are in
	const screen = $derived(page.params.screen ?? null);
	const navigate = (name: string | null, opts: { replace?: boolean } = {}) =>
		void goto(name ? `/${name}` : '/', { replace: !!opts.replace, reset: false });
</script>

<WorkspaceApp {screen} {navigate} back={() => history.back()} />
