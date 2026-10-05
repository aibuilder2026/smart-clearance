<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';
	import Product from './Product.svelte';

	type Props = { icon?: IconName; img?: string; title: string; body?: string | null; action?: Snippet };
	let { icon = 'package', img, title, body, action }: Props = $props();
</script>

<!-- an empty state: a render or an icon, what is missing, what fills it, and the action that does (the kit's Empty) -->
<div class="empty">
	{#if img}<Product name={img} size={120} />{:else}<span
			class="icontile soft"
			style="width: 56px; height: 56px; border-radius: 16px"><Icon name={icon} size={26} /></span
		>{/if}<b>{title}</b>{#if body}<p>{body}</p>{/if}{@render action?.()}
</div>
