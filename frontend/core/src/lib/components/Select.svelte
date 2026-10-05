<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cx } from '../cx';
	import { useField } from '../field';

	type Props = Omit<HTMLSelectAttributes, 'class'> & { class?: string; children?: Snippet };
	let { class: className, value = $bindable(), children, ...rest }: Props = $props();
	const field = useField();
</script>

<select
	bind:value
	class={cx('select', className)}
	aria-describedby={field?.describedBy}
	aria-invalid={field?.invalid || undefined}
	{...rest}>{@render children?.()}</select
>
