<script lang="ts">
	import { Button } from '@smart-clearance/core';
	import { LINKS, linkProps } from './links';
	import { PLATES } from './plates';

	let { ondemo }: { ondemo: () => void } = $props();
</script>

<!-- the closing band: the heading and the buttons sit in the dusk plate's own sky (the board's comp L6) -->
<section class="close" aria-labelledby="close-h">
	<div class="close-copy">
		<h2 id="close-h" class="close-h">Give your next batch a second chance.</h2>
		<div class="close-ctas">
			<Button variant="primary" onclick={() => ondemo()}>Book a demo</Button><a
				class="btn btn-secondary"
				{...linkProps(LINKS.demo)}>Watch the 6-minute demo</a
			>
		</div>
	</div>
	<img class="close-plate" src={PLATES.dusk.day} width="4128" height="1024" alt="" loading="lazy" />
</section>
