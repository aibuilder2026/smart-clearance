<script lang="ts">
	import { Icon, cx } from '@smart-clearance/core';
	import { DEMO_FILM } from './media';
	import Watch from './Watch.svelte';

	/** the way into the demo film, always at hand (SC-60, SC-164); gone at the close, where the same Watch stands in the band */
	let { hidden, onwatch }: { hidden: boolean; onwatch: () => void } = $props();
</script>

<Watch {onwatch} class={cx('pill', hidden && 'off')} label={DEMO_FILM.label}>
	<span class="thumb" aria-hidden="true"
		><img src={DEMO_FILM.thumb} alt="" width="52" height="52" /><i><Icon name="play" size={12} stroke={2.6} /></i></span
	>
	<span>{DEMO_FILM.label}</span>
</Watch>
