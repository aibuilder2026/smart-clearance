<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from '../cx';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'class'> & {
		as?: string;
		pad?: boolean | 'lg';
		raised?: boolean;
		interactive?: boolean;
		class?: string;
		children?: Snippet;
	};
	let { as = 'div', pad = true, raised, interactive, class: className, children, ...rest }: Props = $props();
</script>

<svelte:element
	this={as}
	class={cx(
		'card',
		pad === 'lg' ? 'pad-lg' : pad && 'pad',
		raised && 'raised',
		interactive && 'interactive',
		className
	)}
	{...rest}>{@render children?.()}</svelte:element
>
