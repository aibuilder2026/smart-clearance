<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { AppState, provideApp } from '../../src/lib/app.svelte';
	import ConsoleApp from '../../src/lib/console/ConsoleApp.svelte';
	import { Theme, provideTheme } from '../../src/lib/theme.svelte';

	// the console's host in core's tests (console.test.ts): an app root at a desktop's width, as a page that embeds the
	// console gives it (the guided demo's laptop), and the console with the props asked for. Sheets and alerts portal
	// into the host
	let { width = 1440, ...props }: ComponentProps<typeof ConsoleApp> & { width?: number } = $props();

	const app = new AppState({ embedded: true });
	// svelte-ignore state_referenced_locally (each render is one width)
	app.w = width;
	app.h = 900;
	provideApp(app);
	provideTheme(new Theme('light'));

	let host: HTMLDivElement | undefined = $state();
	$effect(() => {
		app.overlays = host ?? null;
	});
</script>

<div class="app" bind:this={host}><ConsoleApp {...props} /></div>
