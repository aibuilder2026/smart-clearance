<script lang="ts">
	import { AppRoot, ThemeProvider } from '@smart-clearance/core';
	import { provideWorkspace, WorkspaceApp, type WorkspaceSource } from '@smart-clearance/core/workspace/app';

	// the workspace app as frontend/workspace's page draws it, on the source a test gives it
	type Props = { source: WorkspaceSource; screen: string | null; at?: string | null };
	let { source, screen, at = null }: Props = $props();
	// svelte-ignore state_referenced_locally (one source for each render)
	provideWorkspace(source);
</script>

<ThemeProvider>
	<AppRoot class="app-root">
		<WorkspaceApp {screen} ref={at} navigate={() => {}} back={() => {}} />
	</AppRoot>
</ThemeProvider>
