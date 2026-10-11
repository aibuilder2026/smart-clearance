<script lang="ts">
	import { Button, cx, Icon, IconButton, Mark, ModeMenuButton, Sheet, useApp, Wordmark } from '@smart-clearance/core';
	import { Agents, provideAccount } from '@smart-clearance/core/workspace';
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import End from './End.svelte';
	import MapOver from './MapOver.svelte';
	import Notes from './Notes.svelte';
	import Stage from './Stage.svelte';
	import Strip from './Strip.svelte';
	import { lineName, toneOf } from './map.ts';
	import { Player } from './player.svelte.ts';
	import { ACTS, OUTS, doneAt, runAt, sceneAt } from './story.ts';
	import type { Pos } from './types.ts';

	// the guided demo playing (design3/demo/director.jsx Director, option B of SC-167): the line on play as a strip in the
	// top bar, the station's notes beside the stage, the laptop and the phone running the real screens (the console on
	// its own), the map between lines and on Map, and the end. On a real phone the person in focus fills the screen under
	// a slim bar. The data is the workspace app's stub and the console's demo world: nothing is called, nothing is kept
	type Props = { start: Pos; autoplay?: boolean; onhome: () => void };
	let { start, autoplay, onhome }: Props = $props();
	provideAccount({}); // the demo has no account controls: no switching person, no sign-out, no install

	const app = useApp();
	const p = new Player(
		ACTS,
		{ scene: sceneAt, run: runAt, done: doneAt },
		untrack(() => start)
	);
	let map = $state<'hop' | 'map' | null>(null);
	let phoneOnly = $state(false);
	// beside the stage on a laptop; on a real phone the notes wait in their sheet until the station is tapped
	let notes = $state(window.innerWidth >= 768);
	$effect(() => {
		p.hold = !!map;
	});
	p.effects();

	onMount(() => {
		untrack(() => {
			p.go(start.a, start.s, start.b);
			if (autoplay) p.playing = true;
		});
		return () => Agents.setLive(false);
	});

	// the address keeps the place (#at=act.station.beat), replacing the entry: a shallow change, nothing is loaded again
	$effect(() => {
		const { a, s, b } = p.pos;
		const at = `#at=${a}.${s}.${Math.min(b, p.station.beats.length - 1)}`;
		untrack(() =>
			goto(at, { replace: true, shallow: true, reset: false, state: {} }).catch(() => {
				/* before the router has started: the address catches up on the next beat */
			})
		);
	});

	// the story moves on to a new line: the map shows the token hopping to it; playing, the stage comes back on its own
	$effect(() => {
		if (p.hops) untrack(() => (map = 'hop'));
	});
	$effect(() => {
		if (map !== 'hop' || !p.playing) return;
		const t = setTimeout(() => (map = null), 2600);
		return () => clearTimeout(t);
	});

	// the keys: → and ← by beats, 1 to 4 to a line's start, M the map, P the phone alone, N the notes
	function onkeydown(e: KeyboardEvent) {
		if (map || (e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
		if (e.key === 'ArrowRight' || e.key === 'PageDown') {
			e.preventDefault();
			p.next();
		} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
			e.preventDefault();
			p.back();
		} else if (e.key === 'm' || e.key === 'M') map = 'map';
		else if (/^[1-4]$/.test(e.key)) p.go(+e.key - 1, 0, 0);
		else if (e.key === 'p' || e.key === 'P') phoneOnly = !phoneOnly;
		else if (e.key === 'n' || e.key === 'N') notes = !notes;
	}

	// the canvas's content box, which the devices are fitted into
	let canvas: HTMLElement | undefined = $state();
	let W = $state(0);
	let H = $state(0);
	$effect(() => {
		const el = canvas;
		if (!el) return;
		const ro = new ResizeObserver(([e]) => {
			W = e.contentRect.width;
			H = e.contentRect.height;
		});
		ro.observe(el);
		return () => ro.disconnect();
	});

	// while a dialog is up, what it covers is inert, so Tab stays in it (WCAG 2.4.3, 2.4.11)
	let shell: HTMLElement | undefined = $state();
	const dialog = $derived(!!map || p.end);
	$effect(() => {
		const el = shell;
		if (!el || !dialog) return;
		const behind = [...el.children].filter((c) => !c.classList.contains('rb-over') && !c.classList.contains('finale'));
		for (const c of behind) c.setAttribute('inert', '');
		return () => behind.forEach((c) => c.removeAttribute('inert'));
	});

	// what a beat does in the devices besides the store: open the approve sheet (its window event), or press a button in
	// the laptop by its words
	$effect(() => {
		void p.pos.a;
		void p.pos.s;
		void p.pos.b;
		const b = untrack(() => (p.complete || p.act.console ? null : p.beat));
		if (!b || (!b.event && !b.click)) return;
		const t = setTimeout(() => {
			if (b.event) window.dispatchEvent(new Event(b.event));
			if (b.click)
				[...document.querySelectorAll<HTMLButtonElement>('.device-window button')]
					.find((x) => x.textContent?.trim() === b.click)
					?.click();
		}, 900);
		return () => clearTimeout(t);
	});
	const real = $derived(app.bp === 'phone');
</script>

<svelte:window {onkeydown} />

{#snippet overlays()}
	{#if map}<MapOver {p} outs={OUTS} hop={map === 'hop'} onclose={() => (map = null)} />{/if}
	{#if p.end}<End acts={ACTS} onrestart={() => p.go(0, 0, 0)} onclose={() => (p.end = false)} />{/if}
{/snippet}

{#if real}
	<div class="demo-real rb-real" bind:this={shell}>
		<div class="real-bar">
			<button type="button" class="iconbtn" aria-label="Back" onclick={p.back}
				><Icon name="chevron-left" size={22} /></button
			><button type="button" class="real-stage" onclick={() => (notes = !notes)} aria-label="Station notes"
				><span class={cx('rb-card-n sm', toneOf(p.station))}>{p.pos.s + 1}</span><span
					class="stack tight"
					style="gap: 0"
					><b>{lineName(p.act)} · {p.station.title}</b><span>{p.complete ? 'Station done' : p.beat.text}</span></span
				></button
			><button
				type="button"
				class={cx('iconbtn real-next', !p.complete && p.beat.human && 'amber')}
				aria-label="Next"
				onclick={p.next}><Icon name="arrow-right" size={22} /></button
			>
		</div>
		<Stage {p} w={0} h={0} real />
		<Sheet open={notes} onclose={() => (notes = false)} title="{lineName(p.act)} · {p.station.title}" detent="medium"
			><Notes {p} compact />
			<div class="row" style="gap: 8px; margin-top: 12px">
				<Button
					variant="secondary"
					icon="map"
					onclick={() => {
						notes = false;
						map = 'map';
					}}>The route map</Button
				><Button variant="secondary" icon="layout-grid" onclick={onhome}>All lines</Button>
			</div></Sheet
		>
		{@render overlays()}
	</div>
{:else}
	<div class={cx('demo rb-demo', !notes && 'no-notes')} bind:this={shell}>
		<header class="demo-top rb-top">
			<span class="row tight demo-brand"
				><button type="button" class="rb-home" onclick={onhome} aria-label="Back to the route map"
					><Mark size={30} /></button
				><Wordmark size={17} /><span class="demo-tag">Guided demo</span></span
			>
			<Strip {p} onmap={() => (map = 'map')} />
			<span class="row tight demo-tools">
				<IconButton
					icon={p.playing ? 'pause' : 'play'}
					label={p.playing ? 'Pause' : 'Play the route'}
					onclick={() => (p.playing = !p.playing)}
				/>
				<IconButton
					icon={phoneOnly ? 'monitor' : 'smartphone'}
					label={phoneOnly ? 'Laptop and phone' : 'Phone only'}
					onclick={() => (phoneOnly = !phoneOnly)}
				/>
				<IconButton icon="presentation" label={notes ? 'Hide notes' : 'Show notes'} onclick={() => (notes = !notes)} />
				<ModeMenuButton />
			</span>
		</header>
		<div class="demo-body">
			{#if notes}<Notes {p} />{/if}
			<main class="demo-canvas" bind:this={canvas}><Stage {p} w={W} h={H} {phoneOnly} /></main>
		</div>
		{@render overlays()}
	</div>
{/if}
