<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from '../icons/Icon.svelte';

	type Props = Omit<HTMLInputAttributes, 'value'> & {
		value?: string;
		onchange?: (v: string) => void;
		placeholder?: string;
	};
	let { value = $bindable(''), onchange, placeholder = 'Search', ...rest }: Props = $props();
</script>

<span class="input-wrap"
	><Icon name="search" size={17} /><input
		class="input search"
		type="search"
		bind:value
		oninput={() => onchange?.(value)}
		{placeholder}
		aria-label={placeholder}
		{...rest}
	/></span
>
