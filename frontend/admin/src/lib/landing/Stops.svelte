<script lang="ts">
	import { Icon, cx, ease, motionMs, prefersReducedMotion, useApp } from '@smart-clearance/core';
	import { fly } from 'svelte/transition';
	import type { Figures } from './figures';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';

	let { f }: { f: Figures } = $props();
	const app = useApp();
	const N = $derived(f.stops.length);

	// the stop at work: -1 before the batch starts, N or more once it is done, which is how the page rests and how the
	// server sends it. Each stop takes 470 ms and the human yes 980, under five seconds in all, once; then it holds
	let k = $state(Infinity);
	let box: HTMLElement | undefined = $state();
	const playing = $derived(k >= 0 && k < N);

	// it plays when it comes into view, unless it is already on screen when the page starts or the reader asks for less
	// motion
	$effect(() => {
		const el = box;
		if (!el || prefersReducedMotion.current || el.getBoundingClientRect().top < innerHeight) return;
		k = -1;
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((e) => e.isIntersecting)) return;
				io.disconnect();
				k = 0;
			},
			{ threshold: 0.4 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
	$effect(() => {
		if (k < 0 || k >= N) return;
		const t = setTimeout(() => (k += 1), f.stops[k].human ? 980 : 470);
		return () => clearTimeout(t);
	});
	function replay() {
		k = -1;
		setTimeout(() => (k = 0), 30);
	}
</script>

<!-- 4 · nine stops, ten agents, one yes: the batch walks the rail, and each agent says what it did (SC-28) -->
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
			<div class="stops-box" bind:this={box}>
				<!-- --fill: how far the rail has filled; site.css draws it under the dots and eases it -->
				<ol
					class={cx('stops live', playing && 'playing')}
					style:--fill={k < 0 ? 0 : Math.min(1, k / (N - 1))}
					aria-label="The nine stops"
				>
					{#each f.stops as s, i (s.id)}
						{@const done = i < k || k >= N}
						{@const now = i === k && playing}
						<li class={cx('stop', s.human && 'human', done && 'on', now && 'now')}>
							<span class="st-dot" aria-hidden="true"
								>{#if s.human}<Icon name="hand" size={14} stroke={2.4} />{:else if done}<Icon
										name="check"
										size={13}
										stroke={3}
									/>{/if}</span
							>
							<span class="st-main"
								><b>{s.title}</b><span class="st-text">{s.text}</span><span class="st-who"
									>{#each s.who as w (w)}<span class={cx('chip-agent', s.human && 'person', (done || now) && 'on')}
											><i aria-hidden="true"></i>{w}</span
										>{/each}</span
								>{#if done || now}<span class="st-live" in:fly={{ y: 4, duration: motionMs(240), easing: ease }}
										>{s.done}</span
									>{/if}</span
							>
						</li>
					{/each}
				</ol>
				{#if app.mounted && !prefersReducedMotion.current}<button type="button" class="replay" onclick={replay}
						><Icon name="rotate-ccw" size={16} />{k >= N ? 'Run the batch again' : 'Run the batch'}</button
					>{/if}
			</div>
		</div>
	</div>
</section>
