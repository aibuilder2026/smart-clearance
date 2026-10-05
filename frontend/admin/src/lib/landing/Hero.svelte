<script lang="ts">
	import type { Figures } from './figures';
	import { LINKS, linkProps } from './links';
	import Town from './Town.svelte';

	let { f, onfind }: { f: Figures; onfind: () => void } = $props();
</script>

<!-- the first viewport. On desktops it is the approved comp's frame, box for box (site.css); the agents work the batch
     at their posts in the town (SC-32), so it is the page's #agents -->
<section class="hero" id="agents" aria-labelledby="hero-h">
	<div class="hero-frame">
		<div class="hero-copy">
			<h1 id="hero-h" class="hero-h">Every near-expiry carton gets a second chance.</h1>
			<p class="hero-sub">AI agents find the best exit for short-dated stock. You say yes once.</p>
			<div class="hero-ctas">
				<a class="btn btn-primary" {...linkProps(LINKS.demo)}>Watch the 6-minute demo</a><button
					type="button"
					class="btn btn-secondary"
					onclick={onfind}>Find your workspace</button
				>
			</div>
		</div>
		<div class="hero-stage">
			<!-- the whole business as one miniature town, composed by day and by night, never inverted; its depth map
			     draws it in depth (SC-32) -->
			<Town {f} />
		</div>
	</div>
</section>
