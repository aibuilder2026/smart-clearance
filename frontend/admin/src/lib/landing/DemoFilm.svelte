<script lang="ts">
	import { Icon, SPRINGS, cx, motionMs, springCurve, useApp } from '@smart-clearance/core';
	import { Dialog, mergeProps } from 'bits-ui';
	import { fade } from 'svelte/transition';
	import { LINKS, linkProps } from './links';
	import { DEMO_FILM, type FilmWords } from './media';
	import { chapterAt, clock, filmPlayer, loadYouTube, type YouTubePlayer } from './youtube';

	// The demo film's theatre (SC-164, design3's Theatre): a dark room over the page, whatever the theme, with the film
	// as large as the window allows, its chapters as chips under it and its words on request. Escape, Close or the scrim
	// put focus back on the Watch that opened it; the page never scrolls behind it. The film is YouTube's, on its
	// no-cookie host, made only once the theatre opens. Where it ends: the guided demo, Book a demo and Watch again.
	let { open = $bindable(false), onbook }: { open?: boolean; onbook: () => void } = $props();

	const app = useApp();
	let ended = $state(false);
	let t = $state(0);
	let chapters: FilmWords['chapters'] = $state([]);
	let host: HTMLDivElement | null = $state(null);
	let player: YouTubePlayer | null = null;

	// the words are read once, when the theatre first opens
	let words: Promise<FilmWords | null> | null = null;
	const readWords = () =>
		(words ??= fetch(DEMO_FILM.words)
			.then((r) => r.json() as Promise<FilmWords>)
			.catch(() => ((words = null), null)));
	$effect.pre(() => {
		if (!open) return;
		ended = false;
		t = 0;
		readWords().then((w) => {
			if (w) chapters = w.chapters;
		});
	});

	// the player lives while the film plays: made when its frame is drawn, gone with the end card or the theatre
	$effect(() => {
		const el = host;
		const id = DEMO_FILM.youtube;
		if (!el || !id) return;
		let live = true;
		let poll = 0;
		loadYouTube().then((api) => {
			if (!live) return;
			const mount = document.createElement('div');
			el.appendChild(mount);
			player = filmPlayer(api, mount, id, () => (ended = true));
			poll = window.setInterval(() => {
				if (player?.getCurrentTime) t = player.getCurrentTime();
			}, 500);
		});
		return () => {
			live = false;
			clearInterval(poll);
			player?.destroy();
			player = null;
		};
	});

	const now = $derived(
		ended
			? chapters.length - 1
			: chapterAt(
					t,
					chapters.map((c) => c.at)
				)
	);
	// a chapter plays from its start; from the end card, once the player is back
	const pick = (at: number) => {
		const seek = () => {
			player?.seekTo(at, true);
			player?.playVideo();
		};
		if (!ended) return seek();
		ended = false;
		setTimeout(seek, 600);
	};

	// the end card takes focus only when it was in the player, which the card replaces
	let go: HTMLAnchorElement | null = $state(null);
	let frame: HTMLDivElement | null = $state(null);
	$effect(() => {
		if (!ended || !go) return;
		const a = document.activeElement;
		if (!a || a === document.body || frame?.contains(a) || a.tagName === 'IFRAME') go.focus({ preventScroll: true });
	});
	const close = () => (open = false);
	const book = () => {
		open = false;
		onbook();
	};

	// the panel takes focus as it opens, so a screen reader names the dialog first (as core's Sheet)
	let panelEl: HTMLElement | null = $state(null);
	const focusPanel = (e: Event) => {
		e.preventDefault();
		panelEl?.focus({ preventScroll: true });
	};
	const opened = (details: HTMLDetailsElement) => {
		if (details.open) requestAnimationFrame(() => details.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
	};

	const spring = springCurve(SPRINGS.sheet);
	function rise(_node: HTMLElement) {
		return {
			duration: motionMs(spring.duration) || 10,
			easing: spring.easing,
			css: (k: number) => `opacity: ${k}; transform: translateY(${(1 - k) * 12}px) scale(${0.96 + k * 0.04})`
		};
	}
	const scrim = (_node: Element) => ({ duration: motionMs(240), css: (k: number) => `opacity: ${k}` });
</script>

<Dialog.Root bind:open>
	<Dialog.Portal to={app.overlays ?? undefined}>
		<Dialog.Overlay forceMount>
			{#snippet child({ props, open: shown })}
				{#if shown}<div {...props} class="th-scrim" transition:scrim></div>{/if}
			{/snippet}
		</Dialog.Overlay>
		<!-- no scroll lock on a page that scrolls the window, as core's Sheet (SC-65) -->
		<Dialog.Content forceMount onOpenAutoFocus={focusPanel} preventScroll={app.scroll !== 'window'}>
			{#snippet child({ props, open: shown })}
				{#if shown}
					<div {...mergeProps(props, { tabindex: -1, class: 'th' })} bind:this={panelEl} transition:rise>
						<div class="th-head">
							<div class="th-t">
								<Dialog.Title
									>{#snippet child({ props: titleProps })}<h2 id={titleProps.id as string}>
											{DEMO_FILM.title}
										</h2>{/snippet}</Dialog.Title
								>
								<p>{DEMO_FILM.sub} · {DEMO_FILM.runtime}</p>
							</div>
							<button type="button" class="th-x" onclick={close} aria-label="Close the film"
								><Icon name="x" size={20} /></button
							>
						</div>
						<div class="th-frame" bind:this={frame}>
							{#if ended}
								<div class="fp-end" role="group" aria-labelledby="fp-end-h" in:fade={{ duration: motionMs(420) }}>
									<img class="fp-end-bg" src={DEMO_FILM.poster} alt="" />
									<div class="fp-end-in">
										<h3 id="fp-end-h">One platform. Ten agents. One yes.</h3>
										<p>
											Now play each part yourself. The guided demo runs the same journey in your browser, a beat at a
											time.
										</p>
										<div class="fp-end-ctas">
											<a bind:this={go} class="btn btn-lg btn-pill fp-go" {...linkProps(LINKS.demo)}
												>Try the guided demo<Icon name="arrow-up-right" size={16} stroke={2.4} /></a
											>
											<button type="button" class="btn btn-lg btn-pill film-ghost" onclick={book}>Book a demo</button>
											<button type="button" class="btn fp-again" onclick={() => (ended = false)}
												><Icon name="rotate-ccw" size={16} />Watch again</button
											>
										</div>
									</div>
								</div>
							{:else}
								<div class="fp-media">
									<img class="fp-poster" src={DEMO_FILM.poster} alt="" />
									<div bind:this={host}></div>
								</div>
							{/if}
						</div>
						<div class="th-foot">
							{#if chapters.length}
								<nav class="fp-ch" aria-label="Chapters">
									<ol>
										{#each chapters as c, i (c.id)}<li>
												<button
													type="button"
													class={cx(i === now && 'now')}
													aria-current={i === now ? 'true' : undefined}
													onclick={() => pick(c.at)}
													><span class="fp-ch-at">{clock(c.at)}</span><span class="fp-ch-t">{c.title}</span></button
												>
											</li>{/each}
									</ol>
								</nav>
								<details class="fp-read" ontoggle={(e) => opened(e.currentTarget)}>
									<summary><Icon name="scroll-text" size={16} />Read the film instead</summary>
									<div class="fp-read-in">
										{#each chapters as c (c.id)}<section>
												<h4><span>{clock(c.at)}</span>{c.title}</h4>
												{#each c.lines as l (l.at)}<p>{l.text}</p>{/each}
											</section>{/each}
									</div>
								</details>
							{/if}
						</div>
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
