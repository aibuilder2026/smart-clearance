<script lang="ts">
	import { Button, Mark, Wordmark } from '@smart-clearance/core';

	let k = $state(0);
</script>

{#key k}
	<div class="row" style="gap: 28px; flex-wrap: wrap">
		<Mark size={120} play />
		<div class="stack snug">
			<Wordmark size={30} play />
			<div class="ds-row"><Mark size={56} /><Mark size={40} /><Mark size={28} /><Mark size={20} /></div>
			<Button size="sm" icon="rotate-ccw" onclick={() => (k += 1)}>Draw again</Button>
		</div>
	</div>
{/key}
