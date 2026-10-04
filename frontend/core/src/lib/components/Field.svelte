<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '../cx';
	import { provideField } from '../field';

	type Props = {
		label?: string;
		help?: string | null;
		error?: string | null;
		htmlFor?: string;
		class?: string;
		children?: Snippet;
	};
	let { label, help, error, htmlFor, class: className, children }: Props = $props();

	const errorId = $derived(htmlFor ? `${htmlFor}-error` : undefined);
	const helpId = $derived(htmlFor ? `${htmlFor}-help` : undefined);
	provideField({
		get describedBy() {
			return error ? errorId : help ? helpId : undefined;
		},
		get invalid() {
			return !!error;
		}
	});
</script>

<!-- a label, the control, and either its error (announced as it appears) or its help: the kit's Field, with the error
     and help also tied to the control by aria-describedby -->
<div class={cx('field', className)}>
	{#if label}<label for={htmlFor}>{label}</label>{/if}{@render children?.()}{#if error}<div
			class="error"
			id={errorId}
			role="alert"
		>
			{error}
		</div>{:else if help}<div class="help" id={helpId}>{help}</div>{/if}
</div>
