<script lang="ts">
	import HeroCard from './HeroCard.svelte';
	import { LINKS, linkProps } from './links';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';

	let { packs, net, onfind }: { packs: number; net: number; onfind: () => void } = $props();
	const stops = [
		['kiranas', 'Kiranas'],
		['market', 'Marketplace'],
		['staff', 'Staff sale'],
		['foodbank', 'Food bank']
	] as const;
</script>

<!-- the first viewport. On desktops it is the approved comp's frame, box for box (site.css) -->
<section class="hero" aria-labelledby="hero-h">
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
			<!-- the town is composed twice, by day and by night, never inverted -->
			<Plate
				picture="hero-scene"
				plate={PLATES.scene}
				width={2752}
				height={1504}
				alt="A miniature Indian town in the morning: one giant cardboard carton stands among tiny kirana shops, a van and a handcart, with a green path running from it to the shops."
				nightAlt="A miniature Indian town at night: one giant cardboard carton stands among tiny kirana shops with lit windows, a van and a handcart, lit from below by a glowing green path that runs from it to the shops."
			/>
			<HeroCard {packs} {net} />
			<ol class="hero-stops" aria-label="Where its packs can go">
				{#each stops as [id, t] (id)}<li class="st-{id}">{t}</li>{/each}
			</ol>
			<span class="hero-line l1" aria-hidden="true"></span><span class="hero-line l2" aria-hidden="true"></span><span
				class="hero-line l3"
				aria-hidden="true"
			></span>
		</div>
	</div>
</section>
