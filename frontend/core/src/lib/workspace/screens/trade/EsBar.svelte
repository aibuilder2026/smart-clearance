<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../../../icons/Icon.svelte';

	// ExpireSoon's own bar: another company's marketplace, so its own mark and words, with a title at its right
	let { title }: { title?: Snippet } = $props();
</script>

<div class="es-top">
	<span class="row tight"
		><span class="es-logo" aria-hidden="true"><Icon name="hourglass" size={16} stroke={2.2} /></span><span
			class="es-word">ExpireSoon</span
		></span
	><span class="t-caption subtle es-tag">Near-expiry B2B marketplace · dates visible</span><span class="grow"
	></span>{@render title?.()}
</div>
