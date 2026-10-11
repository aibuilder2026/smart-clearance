<script lang="ts">
	import { Button } from '@smart-clearance/core';
	import { DEMO_FILM } from './media';
	import { PLATES } from './plates';
	import Watch from './Watch.svelte';

	let { ondemo, onwatch }: { ondemo: () => void; onwatch: () => void } = $props();
</script>

<!-- the closing band: the heading and the buttons sit in the dusk plate's own sky (the board's comp L6) -->
<section class="close" aria-labelledby="close-h">
	<div class="close-copy">
		<h2 id="close-h" class="close-h">Give your next batch a second chance.</h2>
		<div class="close-ctas">
			<Button variant="primary" onclick={() => ondemo()}>Book a demo</Button><Watch {onwatch} class="btn btn-secondary"
				>{DEMO_FILM.label}</Watch
			>
		</div>
	</div>
	<img class="close-plate" src={PLATES.dusk.day} width="4128" height="1024" alt="" loading="lazy" />
</section>
