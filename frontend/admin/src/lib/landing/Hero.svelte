<script lang="ts">
	import { Button, Icon, cx, ease, motionMs, prefersReducedMotion, useApp, useTheme } from '@smart-clearance/core';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { Beat, Figures } from './figures';
	import { LINKS, linkProps } from './links';
	import { FILM } from './media';
	import { PLATES } from './plates';

	let { f, ondemo }: { f: Figures; ondemo: () => void } = $props();

	// The first viewport (SC-78): one day at the miniature business on film, under the heading. Two ten-second clips
	// chained without a cut, morning to night and night to morning, each ending on the frame the other begins on; the
	// light theme starts in the morning, the dark one at night. The film loops under its Pause control (WCAG 2.2.2),
	// drifts with the scroll rather than the clock, and the strip under the copy reads the hours of the story. The
	// heading's last word turns once, through what a carton gets, and rests on "chance", which is also what the server
	// sends and what is read out. A reader who asks for less motion gets the plate, the final word and the last beat.
	const WORDS = ['buyer', 'shelf', 'invoice', 'ledger line', 'chance'];
	const app = useApp();
	const theme = useTheme();
	const night = $derived(app.mounted && theme.resolved === 'dark');
	const reduce = $derived(app.mounted && prefersReducedMotion.current);
	const poster = $derived(night ? PLATES.town.night : PLATES.town.day);
	// the two clips, chained: the theme's own first, then the other, then round again
	const order = $derived(night ? [FILM.dawn, FILM.dusk] : [FILM.dusk, FILM.dawn]);

	let w = $state(WORDS.length - 1);
	let em = $state(96);
	let heading: HTMLHeadingElement | undefined = $state();
	let media: HTMLDivElement | undefined = $state();
	let va: HTMLVideoElement | undefined = $state();
	let vb: HTMLVideoElement | undefined = $state();
	let front = $state(0);
	let playing = $state(true);
	// the film's clock: which beat the clip in front is at (four to a clip), and how far through it
	let beat = $state(3);
	let p = $state(1);
	onMount(() => {
		if (heading) em = parseFloat(getComputedStyle(heading).fontSize) || em;
		if (!prefersReducedMotion.current) {
			w = 0;
			beat = 0;
			p = 0;
		}
	});
	$effect(() => {
		if (reduce || w >= WORDS.length - 1) return;
		const t = setTimeout(() => (w += 1), w === 0 ? 1600 : 1100);
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
	// a new pair (the theme turned) starts from its first clip
	$effect(() => {
		void night;
		front = 0;
		playing = !reduce;
	});
	const current = () => (front === 0 ? va : vb);
	const other = () => (front === 0 ? vb : va);
	const onended = () => {
		const o = other();
		if (!o) return;
		o.currentTime = 0;
		o.play().catch(() => {});
		front = 1 - front;
	};
	const toggle = () => {
		const v = current();
		if (!v) return;
		if (playing) {
			v.pause();
			playing = false;
		} else {
			v.play().catch(() => {});
			playing = true;
		}
	};
	// the clock runs while the film plays, one frame at a time
	$effect(() => {
		if (reduce || !playing) return;
		let raf = 0;
		const tick = () => {
			const v = current();
			if (v && v.duration) {
				const seg = v.duration / 4;
				const i = Math.min(3, Math.floor(v.currentTime / seg));
				beat = i;
				p = Math.min(1, (v.currentTime - i * seg) / seg);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
	// the film drifts with the scroll, not the clock: a slow rise and a touch of scale over the first 900 px
	// (design3's useFilmDrift), one write a frame
	$effect(() => {
		const el = media;
		if (!el || reduce) return;
		let raf = 0;
		const measure = () => {
			raf = 0;
			const k = Math.min(1, Math.max(0, scrollY / 900));
			el.style.transform = `translateY(${(k * 120).toFixed(1)}px) scale(${(1 + k * 0.06).toFixed(4)})`;
		};
		const onscroll = () => {
			if (!raf) raf = requestAnimationFrame(measure);
		};
		measure();
		addEventListener('scroll', onscroll, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			removeEventListener('scroll', onscroll);
			el.style.transform = '';
		};
	});
	// which half of the day the clip in front shows
	const dayHalf = $derived((front === 0) !== night);
	const beats: Beat[] = $derived(dayHalf ? f.beats.day : f.beats.night);
</script>

<section class="hero film" id="top-hero" aria-labelledby="hero-h">
	<div class="film-media" aria-hidden="true" bind:this={media}>
		{#if reduce}
			<img src={poster} alt="" />
		{:else}
			{#key night}
				<video
					bind:this={va}
					class={cx('fx', front === 0 && 'front')}
					src={order[0]}
					{poster}
					muted
					playsinline
					autoplay
					preload="auto"
					onended={() => front === 0 && onended()}
				></video>
				<video
					bind:this={vb}
					class={cx('fx', front === 1 && 'front')}
					src={order[1]}
					muted
					playsinline
					preload="auto"
					onended={() => front === 1 && onended()}
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
	<!-- the strip: the four beats of the half-day the film is on, the one it is at lit with a line filling through it -->
	<div class="film-story" role="group" aria-label={dayHalf ? 'The day, hour by hour' : 'The night, hour by hour'}>
		{#each beats as b, j (b.at + b.who)}<span
				class={cx('fs', j === beat && 'now', j < beat && 'done', b.human && 'human')}
				><span class="fs-at">{b.at}</span><span class="fs-t"><b>{b.who}</b> {b.t}</span><i
					class="fs-bar"
					aria-hidden="true"
					style={j === beat ? `transform: scaleX(${p.toFixed(3)})` : undefined}
				></i></span
			>{/each}
	</div>
	{#if !reduce}
		<div class="film-ctl">
			<button type="button" onclick={toggle} aria-pressed={!playing}
				><Icon name={playing ? 'pause' : 'play'} size={16} />{playing ? 'Pause' : 'Play'}</button
			>
		</div>
	{/if}
</section>
