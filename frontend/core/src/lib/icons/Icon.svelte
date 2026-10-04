<script lang="ts">
	import { cx } from '../cx';
	import { ICONS, type IconName } from './registry';

	type Props = { name: IconName; size?: number; stroke?: number; class?: string; style?: string; title?: string };
	let { name, size = 20, stroke = 1.75, class: className, style, title }: Props = $props();
	const nodes = $derived(ICONS[name] ?? ICONS.circle);
</script>

<!-- a Lucide icon by its design-system name, stroke 1.75 unless set: the kit's Icon -->
<svg
	class={cx('ic', className)}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	{style}
	aria-hidden={title ? undefined : 'true'}
	role={title ? 'img' : undefined}
	>{#if title}<title>{title}</title>{/if}{#each nodes as [tag, attrs], i (i)}<svelte:element
			this={tag}
			{...attrs}
		/>{/each}</svg
>
