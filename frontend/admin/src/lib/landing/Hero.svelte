<script lang="ts">
	import { Button, Icon, ease, motionMs, prefersReducedMotion, useApp, useTheme } from '@smart-clearance/core';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { LINKS, linkProps } from './links';
	import { FILM } from './media';
	import { PLATES } from './plates';

	let { ondemo }: { ondemo: () => void } = $props();

	// The first viewport (SC-60, option A): the miniature business alive on film under the heading. The film plays once
	// (8 s by day, 6 s by night) over its plate, with Pause, since it runs longer than five seconds (WCAG 2.2.2); a
	// reader who asks for less motion gets the plate. The heading's last word turns once, through what a carton gets,
	// and rests on "chance", which is also what the server sends and what is read out.
	const WORDS = ['buyer', 'shelf', 'invoice', 'ledger line', 'chance'];
	const app = useApp();
	const theme = useTheme();
	const night = $derived(app.mounted && theme.resolved === 'dark');
	const reduce = $derived(app.mounted && prefersReducedMotion.current);
	const src = $derived(night ? FILM.night : FILM.day);
	const poster = $derived(night ? PLATES.town.night : PLATES.town.day);

	let w = $state(WORDS.length - 1);
	let em = $state(96);
	let heading: HTMLHeadingElement | undefined = $state();
	let video: HTMLVideoElement | undefined = $state();
	let playing: 'playing' | 'paused' | 'ended' = $state('playing');
	onMount(() => {
		if (heading) em = parseFloat(getComputedStyle(heading).fontSize) || em;
		if (!prefersReducedMotion.current) w = 0;
	});
	$effect(() => {
		if (reduce || w >= WORDS.length - 1) return;
		const t = setTimeout(() => (w += 1), w === 0 ? 1500 : 1000);
		return () => clearTimeout(t);
	});
	// the loader's handshake (SC-35): the plate is in once the film's poster has decoded, for each theme
	$effect(() => {
		const loader = window.SC3_LOADER;
		if (!loader) return;
		let live = true;
		const im = new Image();
		im.decoding = 'async';
		im.src = poster;
		const done = () => {
			if (live) requestAnimationFrame(() => loader.plateDrawn(night));
		};
		im.decode().then(done, done);
		return () => {
			live = false;
		};
	});
	// a new film (the theme turned) starts from the beginning
	$effect(() => {
		void src;
		playing = 'playing';
	});
	const toggle = () => {
		const v = video;
		if (!v) return;
		if (playing === 'playing') {
			v.pause();
			playing = 'paused';
		} else {
			if (playing === 'ended') v.currentTime = 0;
			void v.play();
			playing = 'playing';
		}
	};
	const label = $derived(playing === 'playing' ? 'Pause' : playing === 'ended' ? 'Replay' : 'Play');
	const icon = $derived(playing === 'playing' ? 'pause' : playing === 'ended' ? 'rotate-ccw' : 'play');
</script>

<section class="hero film" id="top-hero" aria-labelledby="hero-h">
	<div class="film-media" aria-hidden="true">
		{#if reduce}
			<img src={poster} alt="" />
		{:else}
			{#key src}
				<video
					bind:this={video}
					{src}
					{poster}
					muted
					playsinline
					autoplay
					preload="auto"
					onended={() => (playing = 'ended')}
				></video>
			{/key}
		{/if}
		<div class="film-shade"></div>
	</div>
	<div class="film-copy">
		<h1 id="hero-h" class="film-h" bind:this={heading}>
			Every near-expiry carton gets a second <span class="film-word"
				><span class="sr-only">chance</span>{#key w}<span
						aria-hidden="true"
						in:fly={{ y: em / 2, duration: motionMs(420), easing: ease }}
						out:fly={{ y: -em / 2, duration: motionMs(420), easing: ease }}>{WORDS[w]}</span
					>{/key}</span
			>.
		</h1>
		<p class="film-sub">
			AI agents find the best exit for short-dated stock, and do the running around. You say yes once.
		</p>
		<div class="film-ctas">
			<Button variant="primary" size="lg" pill onclick={() => ondemo()}>Book a demo</Button><a
				class="btn btn-lg btn-pill film-ghost"
				{...linkProps(LINKS.demo)}
				><i aria-hidden="true"><Icon name="play" size={12} stroke={2.6} /></i>Watch the 6-minute demo</a
			>
		</div>
	</div>
	{#if !reduce}
		<div class="film-ctl">
			<button type="button" onclick={toggle}><Icon name={icon} size={16} />{label}</button>
		</div>
	{/if}
</section>
