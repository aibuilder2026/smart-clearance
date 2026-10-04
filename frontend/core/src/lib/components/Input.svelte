<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cx } from '../cx';
	import { useField } from '../field';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';

	type Props = Omit<HTMLInputAttributes, 'class'> & { icon?: IconName; class?: string; ref?: HTMLInputElement | null };
	let { icon, class: className, value = $bindable(), ref = $bindable(null), ...rest }: Props = $props();
	const field = useField();
</script>

{#if icon}<span class="input-wrap"
		><Icon name={icon} size={17} /><input
			bind:this={ref}
			bind:value
			class={cx('input', className)}
			aria-describedby={field?.describedBy}
			aria-invalid={field?.invalid || undefined}
			{...rest}
		/></span
	>{:else}<input
		bind:this={ref}
		bind:value
		class={cx('input', className)}
		aria-describedby={field?.describedBy}
		aria-invalid={field?.invalid || undefined}
		{...rest}
	/>{/if}
