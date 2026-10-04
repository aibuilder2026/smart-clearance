<script lang="ts" generics="T extends string">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';
	import { SPRINGS } from '../motion';
	import { slideThumb } from '../motion/thumb';

	type Option = { id: T; label: string; icon?: IconName };
	type Props = {
		options: Option[];
		value: T;
		onchange?: (id: T) => void;
		size?: 'sm';
		label: string;
		class?: string;
	};
	let { options, value = $bindable(), onchange, size, label, class: className }: Props = $props();

	let root: HTMLElement | undefined = $state();
	let last: number | undefined;

	// the thumb slides from the old choice to the new one
	$effect(() => {
		const i = options.findIndex((o) => o.id === value);
		const prev = last;
		last = i;
		if (root && prev != null && prev !== i && i >= 0)
			slideThumb(root.querySelectorAll<HTMLElement>(':scope > .seg'), prev, i, '.seg-thumb', SPRINGS.segmented);
	});

	const pick = (id: T) => {
		value = id;
		onchange?.(id);
	};
</script>

<div bind:this={root} class={cx('segmented', size, className)} role="group" aria-label={label}>
	{#each options as o (o.id)}<button type="button" class="seg" aria-pressed={value === o.id} onclick={() => pick(o.id)}
			>{#if value === o.id}<span class="seg-thumb"></span>{/if}{#if o.icon}<Icon
					name={o.icon}
					size={15}
				/>{/if}{o.label}</button
		>{/each}
</div>
