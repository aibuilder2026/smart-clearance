<script lang="ts">
	import { cx } from '../cx';

	let { size = 20, class: className }: { size?: number; class?: string } = $props();
</script>

<!-- a non-breaking hyphen (U+2011) keeps the name on one line -->
<span class={cx('wordmark', className)} style="font-size: {size}px">Smart‑Clearance</span>
