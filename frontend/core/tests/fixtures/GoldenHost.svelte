<script lang="ts">
	import type { Component } from 'svelte';
	import { AppState, provideApp } from '../../src/lib/app.svelte';
	import NoticeHost from '../../src/lib/components/NoticeHost.svelte';
	import { Theme, provideTheme } from '../../src/lib/theme.svelte';
	import { provideAccount, provideRoute, provideWorkspaceLead } from '../../src/lib/workspace/context';

	// the golden texts' host (core/tests/goldens.test.ts): the contexts a workspace screen reads (the app at a given
	// width, the notices, the account controls of the app, a router and the workspace lead), then the component asked
	// for. Sheets and alerts portal into the host, so an open one's text is part of what is read
	type Props = {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any screen or part, with its own props
		component: Component<any>;
		props?: Record<string, unknown>;
		width?: number;
		/** route the component reads, when it reads one */
		route?: string;
	};
	let { component: C, props = {}, width = 1440, route = 'command' }: Props = $props();

	const app = new AppState({ embedded: true });
	// svelte-ignore state_referenced_locally (each render is one width)
	app.w = width;
	app.h = 900;
	provideApp(app);
	provideTheme(new Theme('light'));
	const noop = () => {};
	provideAccount({ switchTo: noop, signOut: noop, reset: noop });
	provideRoute({
		get route() {
			return { name: route };
		},
		go: noop,
		back: noop
	});
	provideWorkspaceLead({ name: 'workspace', domain: 'workspace', open: noop });

	let host: HTMLDivElement | undefined = $state();
	$effect(() => {
		app.overlays = host ?? null;
	});
</script>

<div class="app" bind:this={host}>
	<NoticeHost><C {...props} /></NoticeHost>
</div>
