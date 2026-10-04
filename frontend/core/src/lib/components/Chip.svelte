<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';

	type Props = Omit<HTMLButtonAttributes, 'class'> & {
		pressed?: boolean;
		count?: number | string | null;
		icon?: IconName;
		class?: string;
		children?: Snippet;
	};
	let { pressed, count, icon, class: className, children, ...rest }: Props = $props();
</script>

<button type="button" class={cx('chip', className)} aria-pressed={!!pressed} {...rest}
	>{#if icon}<Icon name={icon} size={15} />{/if}{@render children?.()}{#if count != null}<span class="n">{count}</span
		>{/if}</button
>
