<script lang="ts">
	import { Mark, Segmented, Wordmark, useTheme, type ThemeMode } from '@smart-clearance/core';
	import { LINKS, SECTIONS, linkProps } from './links';

	let { onfind }: { onfind: () => void } = $props();
	const theme = useTheme();
	const modes: { id: ThemeMode; label: string }[] = [
		{ id: 'light', label: 'Light' },
		{ id: 'dark', label: 'Dark' },
		{ id: 'system', label: 'Auto' }
	];
</script>

<footer class="foot">
	<div class="wrap foot-grid">
		<div class="foot-brand">
			<Mark size={40} /><span
				><Wordmark size={17} /><span class="foot-tag">Every near-expiry carton gets a second chance.</span></span
			>
		</div>
		<nav class="foot-cols" aria-label="Footer">
			<div class="foot-col">
				<b>Product</b>{#each SECTIONS.filter(([id]) => id !== 'customers') as [id, t] (id)}<a href="#{id}">{t}</a
					>{/each}
			</div>
			<div class="foot-col"><b>Customers</b><a href="#customers">Munchly Foods</a></div>
			<div class="foot-col">
				<b>Sign in</b><button type="button" class="foot-link" onclick={onfind}>Find your workspace</button><a
					{...linkProps(LINKS.console)}>Staff console</a
				>
			</div>
		</nav>
	</div>
	<div class="wrap foot-base">
		<p>Prototype · every company, person and number is fictional · Google AI Hackathon 2026</p>
		<Segmented options={modes} value={theme.mode} onchange={theme.setMode} label="Appearance" size="sm" />
	</div>
</footer>
