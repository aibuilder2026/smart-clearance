<script lang="ts">
	import { Button, Icon, cx, ease, motionMs, prefersReducedMotion, useApp, useTheme } from '@smart-clearance/core';
	import { animate, type AnimationPlaybackControls } from 'motion';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { Figures } from './figures';
	import { DEMO_FILM, FILM } from './media';
	import { PLATES } from './plates';
	import Watch from './Watch.svelte';

	// `hold`: the demo film is playing over the page (SC-164), and the hero's own film holds where it is till it closes
	let {
		f,
		ondemo,
		onwatch,
		hold = false
	}: { f: Figures; ondemo: () => void; onwatch: () => void; hold?: boolean } = $props();

	// The first viewport (SC-154): the journey through one day, live action, on film under the heading. One film of
	// four chapters with real people (every one fictional, every pack unbranded, no client named) that loops through a
	// dissolve: dawn at the factory's bay, the brand's planner and the distributor; a high sun at the godown's counter,
	// a kirana owner; a violet dusk in the yard, the food bank's van and the staff-sale table; evening in the office,
	// Paperwork. Both themes start on its first frame. It loops under its Pause control (WCAG 2.2.2), drifts with the
	// scroll rather than the clock, and the page's own camera leans in on each chapter's subject; the strip under the
	// copy reads the chapters. The heading's last word turns once, through what a carton gets, and rests on "chance",
	// which is also what the server sends and what is read out. A reader who asks for less motion gets the poster, the
	// final word and the last chapter.
	const WORDS = ['buyer', 'shelf', 'invoice', 'ledger line', 'chance'];
	const app = useApp();
	const theme = useTheme();
	const night = $derived(app.mounted && theme.resolved === 'dark');
	const reduce = $derived(app.mounted && prefersReducedMotion.current);
	const poster = $derived(night ? PLATES.hero.night : PLATES.hero.day);
	const preview = $derived(night ? PLATES.preview.night : PLATES.preview.day);
	// the film waits for the loader to lift, so the first screen's files have the line to themselves (SC-131)
	let go = $state(false);
	onMount(() => {
		const loader = window.SC3_LOADER;
		if (!loader || loader.lifted) go = true;
		else window.addEventListener('sc3:loader-lifted', () => (go = true), { once: true });
	});

	let w = $state(WORDS.length - 1);
	let em = $state(96);
	let heading: HTMLHeadingElement | undefined = $state();
	let media: HTMLDivElement | undefined = $state();
	let lean: HTMLDivElement | undefined = $state();
	let vid: HTMLVideoElement | undefined = $state();
	let playing = $state(true);
	// the film's clock: which chapter it is at, and how far through it
	let chapter = $state(3);
	let p = $state(1);
	onMount(() => {
		if (heading) em = parseFloat(getComputedStyle(heading).fontSize) || em;
		if (!prefersReducedMotion.current) {
			w = 0;
			chapter = 0;
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
	// both themes start on the same frame; the poster swaps with the theme, and the film plays once the loader lifts
	$effect(() => {
		playing = !reduce;
		const v = vid;
		if (!v) return;
		if (!reduce && go) v.play().catch(() => {});
	});
	$effect(() => {
		const v = vid;
		if (!v || reduce) return;
		if (hold) v.pause();
		else if (playing && go) v.play().catch(() => {});
	});
	const toggle = () => {
		if (!vid) return;
		if (playing) {
			vid.pause();
			playing = false;
		} else {
			vid.play().catch(() => {});
			playing = true;
		}
	};
	// the clock runs while the film plays, one frame at a time: which chapter its time falls in, by the chapters' starts
	$effect(() => {
		if (reduce || !playing) return;
		let raf = 0;
		const tick = () => {
			const v = vid;
			if (v && v.duration) {
				const b = FILM.bounds;
				let i = 0;
				while (i + 1 < b.length && v.currentTime >= b[i + 1]) i += 1;
				const a = b[i];
				const z = i + 1 < b.length ? b[i + 1] : v.duration;
				chapter = i;
				p = Math.max(0, Math.min(1, (v.currentTime - a) / (z - a)));
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
	// the page's camera: the film leans in on the chapter's subject, as far as its scale allows (design3's useLean). The
	// player is the stage's own box (object-fit crops inside it), so the subject lands in the clear part of the
	// stage: right of the copy on desktops, above it on phones
	let box = $state({ w: 0, h: 0 });
	$effect(() => {
		const el = media;
		if (!el) return;
		const ro = new ResizeObserver(([e]) => (box = { w: e.contentRect.width, h: e.contentRect.height }));
		ro.observe(el);
		return () => ro.disconnect();
	});
	const cam = $derived.by(() => {
		const at = FILM.at[chapter];
		if (!at || reduce || !box.w) return { scale: 1, x: 0, y: 0 };
		const { w: W, h: H } = box;
		const s = FILM.lean;
		const k = Math.max(W / FILM.ar, H); // object-fit: cover
		const dw = k * FILM.ar;
		const dh = k;
		const px = W >= 1024 ? 0.5 : 0.44;
		const py = W >= 1024 ? 0.54 : 0.56;
		const ox = (W - dw) * px;
		const oy = (H - dh) * py;
		const P = { x: ox + at.x * dw, y: oy + at.y * dh };
		const C = { x: W / 2, y: H / 2 };
		const T = { x: W >= 1024 ? W * 0.68 : W * 0.5, y: W >= 1024 ? H * 0.5 : H * 0.4 };
		const tx = T.x - (C.x + (P.x - C.x) * s);
		const ty = T.y - (C.y + (P.y - C.y) * s);
		return {
			scale: s,
			x: Math.min((s - 1) * C.x, Math.max(-(s - 1) * C.x, tx)),
			y: Math.min((s - 1) * C.y, Math.max(-(s - 1) * C.y, ty))
		};
	});
	$effect(() => {
		const el = lean;
		if (!el) return;
		const { scale, x, y } = cam;
		let run: AnimationPlaybackControls | undefined;
		if (reduce) el.style.transform = '';
		else run = animate(el, { x, y, scale }, { duration: 1.8, ease });
		return () => run?.stop();
	});
</script>

<!-- the first screen first (SC-131): the film's poster, before anything else; the page is always in day (SC-165) -->
<svelte:head>
	<link rel="preload" as="image" href={PLATES.hero.day} fetchpriority="high" />
</svelte:head>

<section class="hero film" id="top-hero" aria-labelledby="hero-h">
	<div class="film-media" aria-hidden="true" bind:this={media}>
		<div class="film-lean" bind:this={lean}>
			<img class="film-preview" src={preview} alt="" />
			{#if reduce}
				<img src={poster} alt="" />
			{:else}
				<video
					bind:this={vid}
					class="fx front"
					src={FILM.src}
					{poster}
					muted
					playsinline
					loop
					preload={go ? 'auto' : 'none'}
				></video>
			{/if}
		</div>
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
			<Button variant="primary" size="lg" pill onclick={() => ondemo()}>Book a demo</Button><Watch
				{onwatch}
				class="btn btn-lg btn-pill film-ghost"
				><i aria-hidden="true"><Icon name="play" size={12} stroke={2.6} /></i>{DEMO_FILM.label}</Watch
			>
		</div>
	</div>
	<!-- the strip: the four chapters of the journey's day, the one the film is at lit with a line filling through it -->
	<div class="film-story" role="group" aria-label="The journey, through one day">
		{#each f.story as b, j (b.at)}<span
				class={cx('fs', j === chapter && 'now', j < chapter && 'done', b.human && 'human')}
				><span class="fs-at">{b.at}</span><span class="fs-t"><b>{b.who}</b> {b.t}</span><i
					class="fs-bar"
					aria-hidden="true"
					style={j === chapter ? `transform: scaleX(${p.toFixed(3)})` : undefined}
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
