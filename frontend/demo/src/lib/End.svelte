<script lang="ts">
	import { Button, cx, imgUrl, Mark, Money, prefersReducedMotion, rise, WorkspaceMark } from '@smart-clearance/core';
	import { WS } from '@smart-clearance/core/workspace';
	import { lineName } from './map.ts';
	import type { StoryAct } from './types.ts';

	// the end of the route (director.jsx End): three batches, three endings, each with what it recovered rolling up
	type Props = { acts: StoryAct[]; onrestart: () => void; onclose: () => void };
	let { acts, onrestart, onclose }: Props = $props();
	const ends = $derived(['chips', 'mango', 'slow'].map((id) => acts.find((a) => a.id === id)!));
	const reduce = prefersReducedMotion.current;
</script>

<!-- a dialog over the stage, which is inert behind it while it shows (Director.svelte) -->
<div class="finale rb-end" role="dialog" aria-modal="true" aria-labelledby="rb-end-title" transition:rise|global={{ y: 0, duration: 240 }}>
	<div class="finale-in">
		<Mark size={56} play={!reduce} />
		<span class="finale-ws"><WorkspaceMark ws={WS} size={22} /><span>{WS.name} · {WS.domain}</span></span>
		<h2 class="finale-title" id="rb-end-title">Three batches, three endings</h2>
		<p class="finale-hi hi" lang="hi">हर कार्टन को दूसरा मौका</p>
		<div class="rb-ends">
			{#each ends as a, k (a.id)}
				<div class={cx('rb-endcard', a.outcome.red && 'red')} in:rise|global={{ y: 10, delay: 300 + k * 120 }}>
					<img src={imgUrl((a.img ?? '') + '.webp')} alt="" /><b>{lineName(a)}</b><Money
						value={a.outcome.value ?? 0}
						roll
						from={0}
						size="l"
						style="color: var(--primary-text)"
					/><span>{a.outcome.line}</span>
				</div>
			{/each}
		</div>
		<div class="row wrap" style="gap: 10px; justify-content: center">
			<Button variant="primary" size="lg" icon="rotate-ccw" onclick={onrestart}>Ride it again</Button><Button
				variant="secondary"
				size="lg"
				onclick={onclose}>Stay on the last stop</Button
			>
		</div>
	</div>
</div>
