<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cx } from '../cx';
	import { useField } from '../field';

	type Props = Omit<HTMLTextareaAttributes, 'class'> & { class?: string };
	let { class: className, value = $bindable(), ...rest }: Props = $props();
	const field = useField();
</script>

<textarea
	bind:value
	class={cx('textarea', className)}
	aria-describedby={field?.describedBy}
	aria-invalid={field?.invalid || undefined}
	{...rest}></textarea>
