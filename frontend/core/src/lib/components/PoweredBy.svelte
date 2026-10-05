<script lang="ts">
	import { cx } from '../cx';
	import Mark from './Mark.svelte';
	import Wordmark from './Wordmark.svelte';

	// the platform's sign-off on a client's surfaces
	let { size = 'md', class: className }: { size?: 'sm' | 'md'; class?: string } = $props();
</script>

<span class={cx('poweredby', size, className)}
	><span class="pb-t">Powered by</span><Mark size={size === 'sm' ? 16 : 20} /><Wordmark
		size={size === 'sm' ? 13 : 15}
	/></span
>
