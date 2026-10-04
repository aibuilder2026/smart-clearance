<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';

	type Props = Omit<HTMLButtonAttributes, 'class'> & {
		icon: IconName;
		label: string;
		round?: boolean;
		badge?: string | number;
		size?: number;
		class?: string;
		ref?: HTMLButtonElement | null;
	};
	let { icon, label, round, badge, class: className, size = 20, ref = $bindable(null), ...rest }: Props = $props();
</script>

<button
	bind:this={ref}
	type="button"
	class={cx('iconbtn', round && 'round', className)}
	aria-label={label}
	title={label}
	{...rest}
	><Icon name={icon} size={round ? 16 : size} />{#if badge}<span class="badge-count">{badge}</span>{/if}</button
>
