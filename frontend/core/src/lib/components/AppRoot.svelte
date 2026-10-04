<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { AppState, provideApp } from '../app.svelte';
	import { cx } from '../cx';

	type Props = {
		class?: string;
		style?: string;
		/** a fixed theme for this app alone (a device preview); pages follow <html data-theme> */
		theme?: 'light' | 'dark';
		/** drawn inside a device preview: overlays stay inside the device and don't take the page's focus */
		embedded?: boolean;
		/** 'app': the root fills its parent and the app scrolls inside it (the prototype's pages). 'window': a long page
		 *  that scrolls the window, so the address bar, find-in-page and #anchors behave as on any site. */
		scroll?: 'app' | 'window';
		children?: Snippet;
	};
	let { class: className, style, theme, embedded = false, scroll = 'app', children }: Props = $props();

	// svelte-ignore state_referenced_locally
	const app = new AppState({ embedded });
	provideApp(app);

	let root: HTMLDivElement | undefined = $state();
	let host: HTMLDivElement | undefined = $state();

	onMount(() => {
		app.mounted = true;
	});

	// the app's own size: the root's, or for a window-scrolling page the window's, read from the fixed overlay host.
	// bind:this lands after mount, so this waits for the element rather than reading it in onMount
	$effect(() => {
		const measured = scroll === 'window' ? host : root;
		if (!measured) return;
		app.overlays = scroll === 'window' ? (host ?? null) : (root ?? null);
		const ro = new ResizeObserver(([e]) => {
			const r = e.contentRect;
			if (Math.abs(app.w - r.width) >= 1) app.w = r.width;
			if (Math.abs(app.h - r.height) >= 1) app.h = r.height;
		});
		ro.observe(measured);
		return () => ro.disconnect();
	});
</script>

<!-- data-mounted: the page has hydrated (tests wait for it) -->
<div
	bind:this={root}
	class={cx('app', scroll === 'window' && 'app-window', className)}
	data-theme={theme}
	data-mounted={app.mounted ? '' : undefined}
	{style}
>
	<div class="ground" aria-hidden="true"></div>
	{@render children?.()}
</div>
{#if scroll === 'window'}
	<!-- sheets and alerts portal here: fixed to the window, and a query container named "app" like the root, so the
	     overlay rules in components.css read the same widths -->
	<div bind:this={host} class="app app-overlays"></div>
{/if}
