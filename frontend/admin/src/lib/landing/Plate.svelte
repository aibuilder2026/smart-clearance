<script lang="ts">
	import { useApp, useTheme } from '@smart-clearance/core';
	import type { Plate } from './plates';

	type Props = {
		plate: Plate;
		alt: string;
		/** the alt text of the night plate, when it differs */
		nightAlt?: string;
		/** draw it as <picture class={picture}>, with the night plate chosen by the browser before the page hydrates */
		picture?: string;
		class?: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
	};
	let { plate, alt, nightAlt, picture, class: className, width, height, loading }: Props = $props();

	// The plates are composed twice, by day and by night. Until the page hydrates it shows what the server rendered:
	// the day plate, or in a <picture> the night plate when the device is dark (app.html has set the same theme). After
	// that the reader's own choice decides, light or dark whatever the device says.
	const app = useApp();
	const theme = useTheme();
	const night = $derived(app.mounted && theme.resolved === 'dark');
	const src = $derived(night ? plate.night : plate.day);
</script>

{#if picture}<picture class={picture}
		>{#if !app.mounted}<source
				srcset={plate.night}
				media="(prefers-color-scheme: dark) and (scripting: enabled)"
			/>{/if}<img {src} {width} {height} alt={night && nightAlt ? nightAlt : alt} {loading} /></picture
	>{:else}<img class={className} {src} {width} {height} alt={night && nightAlt ? nightAlt : alt} {loading} />{/if}
