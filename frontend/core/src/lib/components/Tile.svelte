<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';

	// one figure with its label and a line under it (the kit's Tile)
	type Props = {
		label: string;
		icon?: IconName;
		foot?: string | Snippet;
		live?: boolean;
		class?: string;
		style?: string;
		children?: Snippet;
	};
	let { label, icon, foot, live, class: className, style, children }: Props = $props();
</script>

<div class={cx('tile', live && 'live', className)} {style}>
	<span class="tl-label"
		>{#if icon}<Icon name={icon} size={15} />{/if}{label}</span
	><span class="tl-value">{@render children?.()}</span>{#if foot}<span class="tl-foot"
			>{#if typeof foot === 'string'}{foot}{:else}{@render foot()}{/if}</span
		>{/if}
</div>
