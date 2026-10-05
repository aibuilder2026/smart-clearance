<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title'> & {
		icon?: IconName;
		iconTone?: string;
		leading?: Snippet;
		title?: Snippet | string;
		sub?: Snippet | string;
		value?: Snippet | string | number;
		chevron?: boolean;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		children?: Snippet;
	};
	let {
		icon,
		iconTone,
		leading,
		title,
		sub,
		value,
		chevron,
		onclick,
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!-- a row of a list: a button when it does something, a plain row otherwise (the kit's ListRow) -->
<svelte:element
	this={onclick ? 'button' : 'div'}
	type={onclick ? 'button' : undefined}
	class={cx('list-row', className)}
	{onclick}
	{...rest}
	>{#if icon}<span class={cx('icontile', iconTone)}><Icon name={icon} size={17} stroke={2} /></span
		>{/if}{@render leading?.()}<span class="lr-main"
		>{#if title}<span class="lr-title" style="display: block"
				>{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}</span
			>{/if}{#if sub}<span class="lr-sub" style="display: block"
				>{#if typeof sub === 'string'}{sub}{:else}{@render sub()}{/if}</span
			>{/if}{@render children?.()}</span
	>{#if value != null}<span class="lr-value"
			>{#if typeof value === 'function'}{@render value()}{:else}{value}{/if}</span
		>{/if}{#if chevron}<Icon name="chevron-right" size={18} class="chev" />{/if}</svelte:element
>
