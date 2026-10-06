<script lang="ts">
	import { cx } from '@smart-clearance/core';
	// where a batch stands, as nine short segments: done, the current one half-filled (amber at Approve), and the rest
	let { stage }: { stage: number } = $props();
</script>

<span class="cs-ov-seg" aria-hidden="true"
	>{#each Array(9) as _, i (i)}<i
			class={cx(i < stage && 'done', i === stage && 'now', i === stage && i === 5 && 'human')}
		></i>{/each}</span
>
