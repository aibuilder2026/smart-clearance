<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../icons/Icon.svelte';

	// a browser window; with a url, its chrome shows the address field instead of a title
	type Props = { title?: string; url?: string; style?: string; children?: Snippet };
	let { title, url, style, children }: Props = $props();
	const u = $derived(url ? url.replace(/^https?:\/\//, '') : '');
	const cut = $derived(u.indexOf('/'));
</script>

<div class="device-window" {style}>
	<div class="chrome">
		<span class="lights" aria-hidden="true"><i></i><i></i><i></i></span>{#if u}<span class="addr"
				><Icon name="lock" size={12} stroke={2.2} /><span class="host">{cut < 0 ? u : u.slice(0, cut)}</span
				>{#if cut >= 0}<span class="path">{u.slice(cut)}</span>{/if}</span
			>{:else}<span class="wtitle">{title}</span>{/if}
	</div>
	<div style="position: relative; min-height: 0">{@render children?.()}</div>
</div>
