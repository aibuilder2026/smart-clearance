<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class'> & {
		tone?: 'green' | 'amber' | 'red' | 'blue' | 'violet';
		solid?: boolean;
		outline?: boolean;
		icon?: IconName;
		dot?: boolean;
		live?: boolean;
		size?: 'sm';
		class?: string;
		children?: Snippet;
	};
	let { tone, solid, outline, icon, dot, live, size, class: className, children, ...rest }: Props = $props();
</script>

<span
	class={cx(
		'badge',
		tone && `badge-${tone}`,
		solid && 'badge-solid',
		outline && 'badge-outline',
		size === 'sm' && 'badge-sm',
		className
	)}
	{...rest}
	>{#if dot}<i class={cx('dot', live && 'live')}></i>{/if}{#if icon}<Icon
			name={icon}
			size={14}
			stroke={2}
		/>{/if}{@render children?.()}</span
>
