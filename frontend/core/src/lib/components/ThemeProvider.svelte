<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { Theme, provideTheme, type ThemeMode } from '../theme.svelte';

	// light, dark, or follow the device; the choice is kept in localStorage (sc3-theme) and named on <html data-theme>.
	// app.html applies the same choice before the first paint, so this only keeps it in step afterwards. A page can set
	// a gate on the theme to cover each change (the landing page's loader, SC-35).
	let { initial, children }: { initial?: ThemeMode; children?: Snippet } = $props();
	// svelte-ignore state_referenced_locally
	const theme = new Theme(initial);
	provideTheme(theme);

	$effect(() => {
		const to = theme.wanted;
		untrack(() => theme.follow(to));
	});
	$effect(() => {
		document.documentElement.setAttribute('data-theme', theme.resolved);
	});
</script>

{@render children?.()}
