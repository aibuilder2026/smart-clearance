<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '../cx';

	// an agent's aura: one turn while it works, and gone the moment it hands off (base.css's .aura)
	type Props = { on?: boolean; class?: string; style?: string; as?: string; children?: Snippet };
	let { on = true, class: className, style, as = 'div', children }: Props = $props();
</script>

<svelte:element this={as} class={cx(on && 'aura', className)} {style}>{@render children?.()}</svelte:element>
