<script lang="ts">
	import { Badge, Icon, cx } from '@smart-clearance/core';
	import type { Figures } from './figures';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';

	let { f }: { f: Figures } = $props();
</script>

<!-- 3 · nine stops, ten agents, one yes -->
<section id="agents" class="sec sec-stops" aria-labelledby="stops-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="stops-h" class="sec-h">Nine stops. Ten agents. One yes.</h2>
			<p class="sec-sub">The agents do the running around. A person approves once, with the money on screen.</p>
		</header>
		<div class="stops-grid">
			<figure class="plate-frame stops-plate">
				<Plate
					plate={PLATES.approve}
					loading="lazy"
					alt="A miniature town square seen from above: a giant amber push-button on a stone plinth, a woman in a sari beside it with her phone, vans and a handcart around the square."
					nightAlt="A miniature town square seen from above at night: a giant amber push-button on a stone plinth, a woman in a sari beside it with her phone, vans and a handcart around the square."
				/>
			</figure>
			<ol class="stops" aria-label="The nine stops">
				{#each f.stops as s (s.id)}<li class={cx('stop', s.human && 'human')}>
						<span class="st-dot" aria-hidden="true"
							>{#if s.human}<Icon name="hand" size={14} stroke={2.4} />{/if}</span
						>
						<span class="st-main"
							><b>{s.title}</b><span class="st-text">{s.text}</span><span class="st-who"
								>{#if s.human}<Badge size="sm" tone="amber">a person</Badge>{:else}{#each s.agents as n (n)}<Badge
											size="sm">{n}</Badge
										>{/each}{/if}</span
							></span
						>
					</li>{/each}
			</ol>
		</div>
	</div>
</section>
