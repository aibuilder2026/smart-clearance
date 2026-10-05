<script lang="ts">
	import { cx } from '../cx';

	let { size = 20, class: className }: { size?: number; class?: string } = $props();
</script>

<svg class={cx('spinner', className)} width={size} height={size} viewBox="0 0 24 24" aria-label="Loading" role="status"
	>{#each { length: 8 } as _, i (i)}<rect
			x="11"
			y="2"
			width="2"
			height="6"
			rx="1"
			fill="currentColor"
			opacity={0.25 + (i / 8) * 0.75}
			transform="rotate({i * 45} 12 12)"
		/>{/each}</svg
>
