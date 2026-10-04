<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Theme, provideTheme, type ThemeMode } from '../theme.svelte';

	// light, dark, or follow the device; the choice is kept in localStorage (sc3-theme) and named on <html data-theme>.
	// app.html applies the same choice before the first paint, so this only keeps it in step afterwards.
	let { initial, children }: { initial?: ThemeMode; children?: Snippet } = $props();
	// svelte-ignore state_referenced_locally
	const theme = new Theme(initial);
	provideTheme(theme);

	$effect(() => {
		document.documentElement.setAttribute('data-theme', theme.resolved);
	});
</script>

{@render children?.()}
