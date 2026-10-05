<script lang="ts">
	import type { Figures } from './figures';

	let { f, ondemo }: { f: Figures; ondemo: (plan?: string) => void } = $props();
</script>

<!-- 6 · plans, without prices: the board's comp L6 -->
<section id="pricing" class="sec sec-plans" aria-labelledby="plans-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="plans-h" class="sec-h plain">Start with one distributor.</h2>
			<p class="sec-sub">A pilot runs on one distributor's stock for 90 days. Prices are set with each manufacturer.</p>
		</header>
		<ul class="plans">
			{#each f.plans as p (p.id)}<li class="plan">
					<b class="plan-name">{p.name}</b>
					<ul class="plan-scope">
						{#each p.scope as x (x)}<li>{x}</li>{/each}
					</ul>
					<span class="plan-foot"
						><span>Prices on request</span><button type="button" class="btn btn-link" onclick={() => ondemo(p.name)}
							>Talk to us<span class="sr-only">{` about ${p.name}`}</span></button
						></span
					>
				</li>{/each}
		</ul>
	</div>
</section>
