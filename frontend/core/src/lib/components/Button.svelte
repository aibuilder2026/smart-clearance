<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';
	import Spinner from './Spinner.svelte';

	export type ButtonVariant =
		| 'primary'
		| 'approve'
		| 'secondary'
		| 'tinted'
		| 'outline'
		| 'ghost'
		| 'destructive'
		| 'destructive-soft'
		| 'violet'
		| 'link';

	type Common = {
		variant?: ButtonVariant;
		size?: 'sm' | 'lg' | 'xl';
		icon?: IconName;
		iconRight?: IconName;
		loading?: boolean;
		block?: boolean;
		pill?: boolean;
		class?: string;
		children?: Snippet;
		ref?: HTMLElement | null;
	};
	type Props = Common &
		(
			| (Omit<HTMLButtonAttributes, 'class' | 'children'> & { href?: undefined })
			| (Omit<HTMLAnchorAttributes, 'class' | 'children'> & { href: string })
		);

	let {
		variant = 'secondary',
		size,
		icon,
		iconRight,
		loading,
		block,
		pill,
		class: className,
		children,
		ref = $bindable(null),
		href,
		...rest
	}: Props = $props();

	const classes = $derived(
		cx(
			'btn',
			`btn-${variant}`,
			size && `btn-${size}`,
			block && 'btn-block',
			pill && 'btn-pill',
			!children && 'btn-icon',
			className
		)
	);
	const iconSize = $derived(size === 'sm' ? 16 : size === 'xl' ? 20 : 18);
</script>

<!-- the kit's Button; with href it is a link that looks like a button (the prototype's <a class="btn">) -->
{#if href}
	<a bind:this={ref} {href} class={classes} {...rest as HTMLAnchorAttributes}
		>{#if icon}<Icon name={icon} size={iconSize} />{/if}{@render children?.()}{#if iconRight}<Icon
				name={iconRight}
				size={size === 'sm' ? 16 : 18}
			/>{/if}</a
	>
{:else}
	<button
		bind:this={ref}
		type="button"
		class={classes}
		data-loading={loading ? 'true' : undefined}
		aria-busy={loading || undefined}
		{...rest as HTMLButtonAttributes}
		>{#if icon}<Icon name={icon} size={iconSize} />{/if}{@render children?.()}{#if iconRight}<Icon
				name={iconRight}
				size={size === 'sm' ? 16 : 18}
			/>{/if}{#if loading}<Spinner size={18} />{/if}</button
	>
{/if}
