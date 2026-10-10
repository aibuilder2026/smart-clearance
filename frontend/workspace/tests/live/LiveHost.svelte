<script lang="ts">
	import { AppRoot, ThemeProvider } from '@smart-clearance/core';
	import { provideWorkspace, WorkspaceApp, type WorkspaceSource } from '@smart-clearance/core/workspace/app';

	// the workspace app as frontend/workspace's page draws it, on the source a test gives it
	type Props = {
		source: WorkspaceSource;
		screen: string | null;
		at?: string | null;
		/** the tab of the batch's page the address opens on (SC-142) */
		tab?: string | null;
		/** where the app asks the page to go, for a test to read */
		onnavigate?: (name: string | null, opts?: { replace?: boolean; ref?: string; tab?: string }) => void;
	};
	let { source, screen, at = null, tab = null, onnavigate = () => {} }: Props = $props();
	// svelte-ignore state_referenced_locally (one source for each render)
	provideWorkspace(source);
</script>

<ThemeProvider>
	<AppRoot class="app-root">
		<WorkspaceApp {screen} ref={at} {tab} navigate={onnavigate} back={() => {}} />
	</AppRoot>
</ThemeProvider>
