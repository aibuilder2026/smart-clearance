<script lang="ts">
	import { Button, rise, useApp } from '@smart-clearance/core';
	import PhoneLines from './PhoneLines.svelte';
	import RouteMap from './RouteMap.svelte';
	import { lineName } from './map.ts';
	import type { Line, StoryAct } from './types.ts';

	// the start (director.jsx Start): the headline, Play the whole route, the legend, and the map, with a card naming what
	// a line shows while the visitor points at it; on a phone, the lines as a list
	type Props = {
		acts: StoryAct[];
		outs: Record<Line, string>;
		onpick: (a: number, s: number) => void;
		onall: () => void;
	};
	let { acts, outs, onpick, onall }: Props = $props();
	const app = useApp();
	const total = $derived(acts.reduce((t, a) => t + a.minutes, 0));
	let hot = $state<Line | null>(null);
	const peek = $derived(hot ? acts.find((a) => a.id === hot) : undefined);
	const screensOf = (a: StoryAct) =>
		[...new Set(a.stations.flatMap((s) => s.beats.map((b) => b.screen.split(' · ')[0])))]
			.filter((x) => !/Lock screen|Sign-in/.test(x))
			.slice(0, 8)
			.join(' · ');
</script>

<div class="rb-start">
	<div class="rb-intro">
		<div class="rb-intro-l">
			<span class="rb-eyebrow">Guided demo · about {total} minutes</span>
			<h1 class="rb-title">Three batches. Three endings.</h1>
		</div>
		<div class="rb-intro-r">
			<p class="rb-lede">
				The platform sets Munchly Foods up. Then a batch of chips sells out, a batch of Mango Drink feeds Hyderabad, and
				a slow week ends at the bin, on a second yes. Every screen is the real app, on sample data.
			</p>
			<div class="row wrap" style="gap: 18px; align-items: center">
				<Button variant="primary" size="lg" icon="play" onclick={onall}>Play the whole route</Button>
				<ul class="rb-legend" aria-label="How to read the map">
					<li><i class="lg-green"></i>The agents' work</li>
					<li><i class="lg-amber"></i>A person's yes</li>
					<li><i class="lg-red"></i>The bin</li>
				</ul>
			</div>
		</div>
	</div>
	{#if app.bp === 'phone'}
		<PhoneLines {acts} {outs} {onpick} />
	{:else}
		<div class="rb-mapwrap">
			<RouteMap {acts} {outs} bind:hot {onpick} draw />
			{#if peek}
				{#key peek.id}
					<div class="rb-peek" in:rise={{ y: 6, duration: 180 }}>
						<b>{lineName(peek)}</b><span>{peek.place}</span><span class="rb-peek-screens">{screensOf(peek)}</span>
					</div>
				{/key}
			{/if}
		</div>
	{/if}
</div>
