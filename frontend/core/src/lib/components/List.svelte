<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '../cx';

	type Props = {
		head?: Snippet | string;
		foot?: Snippet | string;
		icons?: boolean;
		class?: string;
		children?: Snippet;
	};
	let { head, foot, icons, class: className, children }: Props = $props();
</script>

<div class="stack tight">
	{#if head}<div class="list-head">
			{#if typeof head === 'string'}{head}{:else}{@render head()}{/if}
		</div>{/if}
	<div class={cx('list', icons && 'icons', className)}>{@render children?.()}</div>
	{#if foot}<div class="list-foot">
			{#if typeof foot === 'string'}{foot}{:else}{@render foot()}{/if}
		</div>{/if}
</div>
