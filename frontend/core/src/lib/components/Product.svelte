<script lang="ts">
	import { imgUrl } from '../assets';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';

	// a soft 3D product or scene render by name ("pack-chips"); a quiet tile when the render is missing
	type Props = { name: string; size?: number; float?: boolean; class?: string; style?: string; alt?: string };
	let { name, size = 96, float, class: className, style = '', alt = '' }: Props = $props();

	let failed = $state(false);
	const src = $derived(imgUrl(name + '.webp'));
</script>

{#if !src || failed}<span
		class={cx('icontile soft', className)}
		style="width: {size}px; height: {size}px; border-radius: {size * 0.28}px; {style}"
		aria-hidden="true"><Icon name="package" size={size * 0.38} stroke={1.5} /></span
	>{:else}<img
		class={className}
		{src}
		{alt}
		width={size}
		height={size}
		loading="lazy"
		decoding="async"
		onerror={() => (failed = true)}
		style="width: {size}px; height: {size}px; object-fit: contain;{float
			? ' animation: float-y 4.8s var(--ease);'
			: ''} {style}"
	/>{/if}
