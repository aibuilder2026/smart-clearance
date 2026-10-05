<script lang="ts">
	import { EASE, Icon, Money, Product, cx, fmt, prefersReducedMotion, useApp } from '@smart-clearance/core';
	import { animate } from 'motion';
	import type { Figures } from './figures';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';
	import { CROSS, DOOR, DOT, EX_AR, PH, PW, TRUNK, endY, exX, leaves, route, spur, travel } from './street';

	let { f }: { f: Figures } = $props();
	const app = useApp();
	const street = $derived(f.street);
	const N = $derived(f.atRisk);
	const bezier = `cubic-bezier(${EASE.join(', ')})`;

	// below 1100 the street is a strip to swipe, and a region to focus
	const swipe = $derived(app.bp !== 'desktop');

	// The street: waiting for the reader, its packs on their way, or all of them arrived, which is how the page rests and
	// how the server sends it. The split is drawn for a run of the street (Replay starts another), or waits for its packs.
	// `tween` is on once the section has been set to wait for the reader, so its parts ease in when they play.
	let stage = $state<'wait' | 'play' | 'done'>('done');
	let left = $state(0);
	const none = () => Object.fromEntries(street.taken.map((e) => [e.id, 0]));
	// svelte-ignore state_referenced_locally (the counts start full, as the page rests)
	let got: Record<string, number> = $state(Object.fromEntries(f.street.taken.map((e) => [e.id, e.packs])));
	let run = $state(0);
	let splitRun = $state(0);
	let tween = $state(false);
	let streetSeen = $state(false);
	let splitSeen = $state(false);
	const drawn = $derived(stage !== 'wait');
	const split = $derived(splitRun === run);

	let pan: HTMLElement | undefined = $state();
	let box: HTMLElement | undefined = $state();
	const dotEls: SVGCircleElement[] = [];
	const ways: Record<string, SVGPathElement> = {};

	// it plays as the reader reaches it, unless it is on screen when the page starts or the reader asks for less motion:
	// the street once nearly all of its strip is in view (its road runs along the strip's foot; on a phone the strip is
	// a window onto a street about three screens wide), the split once its packs have arrived, or as soon as it is seen
	// if the street hasn't started
	$effect(() => {
		const el = pan;
		const b = box;
		if (!el || !b || prefersReducedMotion.current || el.getBoundingClientRect().top < innerHeight) return;
		stage = 'wait';
		left = N;
		got = none();
		splitRun = -1;
		tween = true;
		const seen = (target: Element, amount: number, then: () => void) => {
			const io = new IntersectionObserver(
				(entries) => {
					if (!entries.some((e) => e.isIntersecting)) return;
					io.disconnect();
					then();
				},
				{ threshold: amount }
			);
			io.observe(target);
			return io;
		};
		const a = seen(el, 0.9, () => (streetSeen = true));
		const c = seen(b, 0.4, () => (splitSeen = true));
		return () => {
			a.disconnect();
			c.disconnect();
		};
	});

	// the batch leaves the godown as dots of about 50 packs, interleaved, one every 0.105 s, and each takes the road to
	// its exit; the godown's count drains as they leave and each exit's count fills as they arrive (design3 Exits)
	$effect(() => {
		if (!streetSeen) return;
		void run;
		stage = 'play';
		left = N;
		got = none();
		const total = street.dots.length;
		const per: Record<string, number> = {};
		for (const id of street.dots) per[id] = (per[id] ?? 0) + 1;
		const arrived: Record<string, number> = none();
		const controls: { stop: () => void }[] = [];
		const timers: number[] = [];
		const el = pan!;
		const fig = el.querySelector<HTMLElement>('.ex-pano')!;
		const x0 = fig.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
		let gone = 0;
		let lead = 0;
		let all = 0;
		street.dots.forEach((id, i) => {
			const way = ways[id];
			const c = dotEls[i];
			if (!way || !c) return;
			const L = way.getTotalLength();
			timers.push(window.setTimeout(() => (left = Math.round(N * (1 - ++gone / total))), leaves(i) * 1000));
			controls.push(
				animate(0, 1, {
					duration: travel(L),
					delay: leaves(i),
					ease: [0.45, 0, 0.4, 1],
					onUpdate: (v) => {
						const pt = way.getPointAtLength(v * L);
						c.setAttribute('cx', String(pt.x));
						c.setAttribute('cy', String(pt.y));
						c.setAttribute('opacity', String(v < 0.05 ? v * 20 : v > 0.93 ? Math.max(0, (1 - v) * 14) : 1));
						// where the street is a strip that scrolls, it follows the leading dot, this once
						if (el.scrollWidth > el.clientWidth + 4 && pt.x > lead) {
							lead = pt.x;
							el.scrollLeft = Math.max(0, x0 + (pt.x / PW) * fig.clientWidth - el.clientWidth * 0.6);
						}
					},
					onComplete: () => {
						arrived[id] += 1;
						got = Object.fromEntries(
							street.taken.map((e) => [e.id, Math.round((e.packs * arrived[e.id]) / per[e.id])])
						);
						if (++all === total) stage = 'done';
					}
				})
			);
		});
		return () => {
			controls.forEach((c) => c.stop());
			timers.forEach(clearTimeout);
		};
	});
	$effect(() => {
		if (splitSeen && splitRun !== run && stage !== 'play') splitRun = run;
	});
	// the street is set going in the same update as the new run, so the split waits for its packs
	function replay() {
		stage = 'play';
		left = N;
		got = none();
		run += 1;
	}

	// where the street is a strip, it opens on the godown, where the packs start; with nothing to follow under reduced
	// motion, it opens on the kiranas, the first exit that took some
	$effect(() => {
		const el = pan;
		const li = el?.querySelector<HTMLElement>('.ex-chips > li');
		const fig = el?.querySelector<HTMLElement>('.ex-pano');
		if (!swipe || !el || !li || !fig) return;
		el.scrollLeft = prefersReducedMotion.current ? Math.max(0, fig.offsetLeft + li.offsetLeft - el.clientWidth / 2) : 0;
	});

	// the split: ribbons as wide as the packs each exit took meet the rows wherever they wrap to, measured, and measured
	// again on resize; on a phone the ribbons give way to a bar of each exit's share
	let svg: SVGSVGElement | undefined = $state();
	let src: HTMLElement | undefined = $state();
	const rows: HTMLElement[] = [];
	type Band = { id: string; packs: number; a: number; t: number; cy: number };
	let geo: { w: number; h: number; rows: Band[] } | null = $state(null);
	$effect(() => {
		const b = box;
		if (!b) return;
		const measure = () => {
			if (!svg || !src || getComputedStyle(svg).display === 'none') return (geo = null);
			const r = svg.getBoundingClientRect();
			const br = src.getBoundingClientRect();
			const band = Math.min(150, br.height * 0.8);
			let y0 = br.top + br.height / 2 - band / 2 - r.top;
			geo = {
				w: r.width,
				h: r.height,
				rows: street.exits.map((e, i) => {
					const q = rows[i].getBoundingClientRect();
					const t = (e.packs / N) * band;
					const g = { id: e.id, packs: e.packs, a: y0, t, cy: q.top + q.height / 2 - r.top };
					y0 += t;
					return g;
				})
			};
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(b);
		return () => ro.disconnect();
	});
	const ribbon = (g: Band, w: number) => {
		const c = w * 0.55;
		const h = g.t / 2;
		const ya = g.a + h;
		return `M12 ${ya - h} C${c} ${ya - h} ${c} ${g.cy - h} ${w} ${g.cy - h} L${w} ${g.cy + h} C${c} ${g.cy + h} ${c} ${ya + h} 12 ${ya + h} Z`;
	};
	const thread = (g: Band, w: number) => {
		const c = w * 0.55;
		return `M12 ${g.a} C${c} ${g.a} ${c} ${g.cy} ${w} ${g.cy}`;
	};
	// an eased transition, only while the section plays (design3: the same durations and delays)
	const ease = (props: string[], s: number, delay = 0) =>
		tween ? props.map((p) => `${p} ${s}s ${bezier} ${delay}s`).join(', ') : 'none';
</script>

<!-- 3 · five exits, one batch: the packs take the street, then the batch is split by exit (SC-28, options 1 and 2) -->
<section id="exits" class="sec sec-exits" aria-labelledby="exits-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="exits-h" class="sec-h">Five exits, one batch</h2>
			<p class="sec-sub">
				One batch: {fmt.num(N)} packs of masala chips that won't sell in the {f.daysLeft} days they have left. The agents
				priced every exit, the bin included, and sent the packs where they recover the most.
			</p>
		</header>
	</div>
	<div class="ex-body">
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (a region to focus only while it scrolls sideways) -->
		<div
			bind:this={pan}
			class="ex-pan"
			tabindex={swipe ? 0 : undefined}
			role={swipe ? 'region' : undefined}
			aria-label={swipe ? 'The street from the godown to the bin; scroll sideways' : undefined}
		>
			<figure class="ex-pano" style="--ar: {EX_AR}">
				<Plate
					plate={PLATES.exits}
					loading="lazy"
					alt="One miniature street from end to end: the distributor's godown, two kirana shops hung with snack packets, a general store, more small shops, a van, and a smouldering rubbish heap at the far end."
					nightAlt="One miniature street from end to end at night: the distributor's godown, two kirana shops hung with snack packets, a general store, more small shops, a van, and a smouldering rubbish heap at the far end."
				/>
				<!-- the street's drawing, in the plate's own coordinates: the road the packs take, each exit's way in (solid
				     where packs went, dashed where none did, a cross on the bin's), the dots, and the godown's count -->
				<div class={cx('flow-layer', stage)} aria-hidden="true">
					<svg viewBox="0 0 {PW} {PH}" preserveAspectRatio="none">
						<defs
							><filter id="fl-glow" x="-20%" y="-60%" width="140%" height="220%"
								><feGaussianBlur stdDeviation="14" /></filter
							></defs
						>
						<path class="fl-glow" d={TRUNK} style:opacity={drawn ? 1 : 0} style:transition={ease(['opacity'], 0.6)} />
						<path
							class="fl-trunk"
							d={TRUNK}
							pathLength="1"
							stroke-dasharray="1 1"
							style:stroke-dashoffset={drawn ? 0 : 1}
							style:transition={ease(['stroke-dashoffset'], 0.7)}
						/>
						{#each street.exits as e, i (e.id)}{#if e.taken}<path
									class="fl-spur {e.id}"
									d={spur(e)}
									pathLength="1"
									stroke-dasharray="1 1"
									style:stroke-dashoffset={drawn ? 0 : 1}
									style:transition={ease(['stroke-dashoffset'], 0.35, 0.3 + i * 0.12)}
								/>{:else}<path
									class="fl-spur none {e.id}"
									d={spur(e)}
									style:opacity={drawn ? 1 : 0}
									style:transition={ease(['opacity'], 0.4, 0.5 + i * 0.08)}
								/>{/if}{/each}
						{#each street.exits as e (e.id)}<circle
								class={cx('fl-drop', e.id, e.taken && 'taken')}
								cx={exX(e)}
								cy={endY(e)}
								r={e.taken ? 30 : 24}
							/>{/each}
						<path class="fl-x" d={CROSS} />
						{#each street.taken as e (e.id)}<path
								bind:this={ways[e.id]}
								d={route(e)}
								fill="none"
								stroke="none"
							/>{/each}
						{#each street.dots as id, i (i)}<circle
								bind:this={dotEls[i]}
								class="fl-dot {id}"
								r="22"
								cx={DOOR.x}
								cy={DOOR.y}
								opacity="0"
							/>{/each}
					</svg>
					<div class="fl-tag" style:left="{(DOOR.x / PW) * 100}%">
						<b>{fmt.num(left)}</b><span>{left ? ' packs at the godown' : ' packs left at the godown'}</span>
					</div>
				</div>
				<!-- each taken exit counts its packs in as they arrive; the spoken count is the final one throughout -->
				<ul class="ex-chips">
					{#each street.exits as e (e.id)}<li style="--x: {e.x}">
							<span class={cx('ex-chip', e.id, e.taken && 'taken', e.bin && 'bin', e.taken && got[e.id] > 0 && 'in')}
								><span class="ex-name"
									><i class="ex-dot {e.id}" aria-hidden="true"></i>{e.name}{#if e.taken}<Icon
											name="check"
											size={14}
											stroke={2.6}
											class="ex-took"
										/>{/if}</span
								>{#if e.taken}<span class="ex-line"
										><span aria-hidden="true">{e.line(got[e.id])}</span><span class="sr-only">{e.line(e.packs)}</span
										></span
									>{:else}<span class="ex-line">{e.line(0)}</span>{/if}</span
							>
						</li>{/each}
				</ul>
			</figure>
		</div>
		<div class="flow-key">
			<span class="fk-dots" aria-hidden="true"><i class="kirana"></i><i class="expiresoon"></i></span>
			<p>
				Each dot is about {DOT} packs: green to {f.shops} kiranas, violet to one buyer on ExpireSoon. The staff sale and the
				food bank were priced and not needed, and nothing went to the bin.
			</p>
			{#if app.mounted && !prefersReducedMotion.current}<button type="button" class="replay" onclick={replay}
					><Icon name="rotate-ccw" size={16} />{stage === 'wait' ? 'Send the batch' : 'Send the batch again'}</button
				>{/if}
		</div>
	</div>
	<div class="wrap">
		<!-- the batch split by exit: each exit's render, its price a pack and what it came to -->
		<div bind:this={box} class="split" role="group" aria-label="Where the batch went">
			<div bind:this={src} class="split-src">
				<Product name="pack-snack-plain" size={72} /><span class="split-n">{fmt.num(N)}</span><span class="split-cap"
					>packs of masala chips with {f.daysLeft} days left, at the distributor's godown</span
				>
			</div>
			<svg
				bind:this={svg}
				class="split-svg"
				aria-hidden="true"
				viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : '0 0 1 1'}
				preserveAspectRatio="none"
			>
				{#if geo}<defs
						><clipPath id="sp-wipe"
							><rect
								x="0"
								y="0"
								width={geo.w}
								height={geo.h}
								style:transform="scaleX({split ? 1 : 0})"
								style:transition={split ? ease(['transform'], 1.1, 0.2) : 'none'}
							/></clipPath
						></defs
					><g clip-path="url(#sp-wipe)"
						>{#each geo.rows as g (g.id)}<path
								class={cx(g.packs ? 'sp-band' : 'sp-none', g.id)}
								d={g.packs ? ribbon(g, geo.w) : thread(g, geo.w)}
							/>{/each}</g
					>{#each geo.rows.filter((g) => g.packs) as g (g.id)}<rect
							class="sp-src {g.id}"
							x="0"
							y={g.a}
							width="12"
							height={g.t}
						/>{/each}{/if}
			</svg>
			<ol class="split-rows">
				{#each street.exits as e, i (e.id)}<li
						bind:this={rows[i]}
						class={cx('split-row', e.id, e.taken ? 'taken' : 'none', e.bin && 'bin')}
					>
						<Product name={e.art} size={52} class="sr-art" /><span class="sr-main"
							><b>{e.name}</b><span>{e.taken ? `${fmt.num(e.packs)} packs · ${e.per}` : e.per}</span><span
								class="sr-share"
								aria-hidden="true"
								><i
									style:transform="scaleX({split ? e.packs / N : 0})"
									style:transition={split ? ease(['transform'], 0.7, 0.3 + i * 0.12) : 'none'}
								></i></span
							></span
						><span
							class="sr-v"
							style:opacity={split || !e.taken ? 1 : 0}
							style:transform="translateY({split || !e.taken ? 0 : 6}px)"
							style:transition={split && e.taken ? ease(['opacity', 'transform'], 0.4, 1 + i * 0.12) : 'none'}
							>{#if e.taken}{fmt.inr(e.total!)}{:else if e.bin}<span class="sr-no">{e.note}</span><span class="sr-cost"
									>{fmt.inr(e.total!)} if destroyed</span
								>{:else}<span class="sr-no">{e.note}</span>{/if}</span
						>
					</li>{/each}
			</ol>
		</div>
		<!-- what the batch came to: the board's three cards (L2), each with the arithmetic that makes it -->
		<div class="results" role="group" aria-label="What the batch came to">
			{#each f.results as r (r.l)}<div class="result">
					{#if r.n}<Money value={r.n} class="r-n" />{:else}<span class="num r-n">0</span>{/if}<span class="r-l"
						>{r.l}</span
					><span class="r-w">{r.w}</span>
				</div>{/each}
		</div>
		<p class="results-note">An illustrative batch. Every figure is worked out from the journey map.</p>
	</div>
</section>
