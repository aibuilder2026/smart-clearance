<script lang="ts">
	import { Icon, Money, cx, fmt, prefersReducedMotion, useApp } from '@smart-clearance/core';
	import { scroll } from 'motion';
	import type { Figures } from './figures';
	import { EX_AR, activeExit, holdScroll, panX, stickTop } from './pan';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';

	let { f }: { f: Figures } = $props();
	const app = useApp();

	// below 1100 the street is a strip to swipe, opening on the first exit and sliding to the one tapped; on desktops it
	// pans with the page and holds on each exit (CSS gives the track its height and the stage its stick; this moves it)
	const swipe = $derived(app.bp !== 'desktop');
	const panned = $derived(app.mounted && !swipe && !prefersReducedMotion.current);
	const top = $derived(stickTop(app.h));
	let active = $state(0);
	let track: HTMLElement | undefined = $state();
	let pan: HTMLElement | undefined = $state();
	let pano: HTMLElement | undefined = $state();
	const exit = $derived(f.exits[active]);

	$effect(() => {
		if (!panned || !track || !pano) return;
		const el = pano;
		const stop = scroll(
			(p: number) => {
				el.style.transform = `translateX(${panX(p)}%)`;
				const i = activeExit(p);
				if (i !== active) active = i;
			},
			{ target: track, offset: [`start ${top}px`, 'end end'] }
		);
		return () => {
			stop();
			el.style.transform = '';
		};
	});

	// a chip scrolls the page to that exit's hold
	function jump(i: number) {
		if (!track) return;
		const at = track.getBoundingClientRect().top + window.scrollY;
		const from = at - top;
		const to = at + track.offsetHeight - document.documentElement.clientHeight;
		window.scrollTo({ top: holdScroll(i, from, to), behavior: 'smooth' });
	}

	let placed = false;
	$effect(() => {
		const i = active;
		if (!swipe || !pan) return;
		const li = pan.querySelectorAll<HTMLElement>('.ex-chips > li')[i];
		const fig = pan.querySelector<HTMLElement>('.ex-pano');
		if (!li || !fig) return;
		const left = fig.offsetLeft + li.offsetLeft - pan.clientWidth / 2;
		pan.scrollTo({ left: Math.max(0, left), behavior: placed && !prefersReducedMotion.current ? 'smooth' : 'instant' });
		placed = true;
	});
</script>

<!-- 2 · one batch, five exits: the street the packs went down, from the godown to the bin -->
<section id="how" class="sec sec-exits" aria-labelledby="exits-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="exits-h" class="sec-h">Five exits, one batch</h2>
			<p class="sec-sub">
				<span class="mono">{f.batchId}</span>: {fmt.num(f.atRisk)} packs of masala chips that won't sell in the {f.daysLeft}
				days they have left. The agents priced every exit; two of them took the batch.
			</p>
		</header>
	</div>
	<div class="ex-body">
		<div class="ex-track" bind:this={track}>
			<div class="ex-stick" style:top="{top}px">
				<!-- svelte-ignore a11y_no_noninteractive_tabindex (a region to focus only while it scrolls sideways) -->
				<div
					bind:this={pan}
					class="ex-pan panned"
					tabindex={swipe ? 0 : undefined}
					role={swipe ? 'region' : undefined}
					aria-label={swipe ? 'The street from the godown to the bin; scroll sideways' : undefined}
				>
					<figure bind:this={pano} class="ex-pano" style="--ar: {EX_AR}">
						<Plate
							plate={PLATES.exits}
							loading="lazy"
							alt="One miniature street from end to end: the distributor's godown, two kirana shops hung with snack packets, a general store, more small shops, a van, and a smouldering rubbish heap at the far end."
							nightAlt="One miniature street from end to end at night: the distributor's godown, two kirana shops hung with snack packets, a general store, more small shops, a van, and a smouldering rubbish heap at the far end."
						/>
						<ul class="ex-chips">
							{#each f.exits as e, i (e.id)}<li style="--x: {e.x}">
									<button
										type="button"
										class={cx('ex-chip', e.taken && 'taken', e.bin && 'bin', i === active && 'on')}
										aria-pressed={i === active}
										onclick={() => (panned ? jump(i) : (active = i))}
										onfocus={() => {
											if (panned && i !== active) jump(i);
										}}
										><span class="ex-name"
											><i class="ex-dot {e.id}" aria-hidden="true"></i>{e.name}{#if e.taken}<Icon
													name="check"
													size={14}
													stroke={2.6}
													class="ex-took"
												/>{/if}</span
										><span class="ex-line">{e.line}</span></button
									>
								</li>{/each}
						</ul>
					</figure>
				</div>
				<p class="ex-cap" aria-live="polite">
					<i class="ex-dot {exit.id}" aria-hidden="true"></i><span><b>{exit.name}.</b> {exit.detail}</span>
				</p>
			</div>
		</div>
	</div>
	<!-- the batch's ledger: each result beside the arithmetic that makes it -->
	<div class="wrap">
		<div class="ledger" role="group" aria-label="{f.batchId}, the batch's ledger">
			<span class="lg-head"
				><span class="mono">{f.batchId}</span><span
					>{fmt.num(f.atRisk)} packs, five exits priced, one plan approved</span
				></span
			>
			<dl class="lg-rows">
				<div class="lg-row">
					<dt>
						{fmt.inr(f.kl.net)} from {f.shops} kiranas, after the van, <span class="lg-op">+</span>
						{fmt.inr(f.esNet)} from a buyer in Raipur, after the listing fee
					</dt>
					<dd>
						<span class="lg-eq" aria-hidden="true">=</span><Money value={f.actual.net} class="lg-n" /><span class="lg-l"
							>recovered</span
						>
					</dd>
				</div>
				<div class="lg-row">
					<dt>
						{fmt.inr(f.actual.pnl)} on Munchly's books with the plan, price support included, against {fmt.inr(-f.bin)} to
						destroy the batch
					</dt>
					<dd>
						<span class="lg-eq" aria-hidden="true">=</span><Money value={f.actual.swing} class="lg-n" /><span
							class="lg-l">better than the bin</span
						>
					</dd>
				</div>
				<div class="lg-row">
					<dt>
						{fmt.num(f.plan.soldUnits)} packs sold on tax invoices, so the {fmt.inr(f.plan.itcRetained)} GST credit stays
					</dt>
					<dd>
						<span class="lg-eq" aria-hidden="true">=</span><span class="num lg-n">0</span><span class="lg-l"
							>cartons destroyed</span
						>
					</dd>
				</div>
			</dl>
		</div>
	</div>
</section>
