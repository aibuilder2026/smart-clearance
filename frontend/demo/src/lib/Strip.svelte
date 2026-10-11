<script lang="ts">
	import { cx, fmt, Icon, imgUrl, prefersReducedMotion, SPRINGS, springCurve } from '@smart-clearance/core';
	import { lineName, toneOf } from './map.ts';
	import type { Player } from './player.svelte.ts';

	// the line on play as a strip in the top bar (director.jsx Strip): Map, the line's name and the station on play, its
	// stops on one even track filled to where the story is, the batch as a token travelling it (the console's token
	// spring), and where the line ends
	let { p, onmap }: { p: Player; onmap: () => void } = $props();
	const a = $derived(p.act);
	const n = $derived(a.stations.length);
	const along = $derived(Math.min(n - 1, p.pos.s + Math.min(1, p.pos.b / p.station.beats.length)));
	const curve = springCurve(SPRINGS.token);
	const img = (name: string) => imgUrl(name + '.webp');
</script>

<div class="rb-strip">
	<button type="button" class="rb-mapbtn" onclick={onmap} aria-label="Open the route map" aria-keyshortcuts="M"
		><Icon name="map" size={18} /><span>Map</span></button
	>
	<span class="rb-strip-line"
		>{#if a.console}<span class="rb-badge-ic sm"><Icon name="layout-dashboard" size={14} /></span>{:else}<img
				src={img(a.img ?? '')}
				alt=""
			/>{/if}<span class="rb-strip-t"><b>{lineName(a)}</b><span>{p.station.title} · {p.pos.s + 1} of {n}</span></span></span
	>
	<ol class="rb-stops" style="grid-template-columns: repeat({n}, minmax(0, 1fr)); --n: {n}" aria-label="Stations on this line">
		<span class="rb-track" aria-hidden="true"
			><span style="transform: scaleX({n > 1 ? along / (n - 1) : 1})"></span></span
		>
		{#each a.stations as st, i (st.id)}
			{@const s = i < p.pos.s ? 'done' : i === p.pos.s ? 'now' : ''}
			<li class={cx('rb-stop', s, toneOf(st))}>
				<button
					type="button"
					title={st.title}
					onclick={() => p.go(p.pos.a, i, 0)}
					aria-current={s === 'now' ? 'step' : undefined}
					aria-label="{st.title}{s === 'done' ? ', done' : ''}"
					><span class="rb-dot">{#if s === 'done'}<Icon name="check" size={11} stroke={3} />{/if}</span></button
				>
			</li>
		{/each}
		<!-- the batch, travelling the line on the token spring -->
		<span
			class={cx('rb-tok rb-tok-ride', toneOf(p.station))}
			aria-hidden="true"
			style="left: calc((100% / {n}) * ({p.pos.s} + 0.5)); transition: left {prefersReducedMotion.current
				? 0
				: curve.duration}ms {curve.linear}"
			>{#if a.console}<Icon name="layout-dashboard" size={13} />{:else}<img src={img(a.img ?? '')} alt="" />{/if}</span
		>
	</ol>
	<span class="rb-out-mini"
		>{#if a.outcome.value != null}<span>ends at</span><b>{fmt.inr(a.outcome.value)}</b>{:else}<span
				>ends at Munchly's workspace</span
			>{/if}</span
	>
</div>

<style>
	/* the token rides over the track (in the prototype it moves between the stops' dots by framer-motion's layoutId) */
	.rb-tok-ride {
		position: absolute;
		top: 50%;
		right: auto;
		bottom: auto;
		width: 30px;
		height: 30px;
		margin: -15px 0 0 -15px;
		pointer-events: none;
	}
	.rb-tok-ride.amber {
		box-shadow:
			0 0 0 2.5px var(--amber),
			0 3px 8px rgb(0 0 0 / 0.14);
	}
	.rb-tok-ride.red {
		box-shadow:
			0 0 0 2.5px var(--red),
			0 3px 8px rgb(0 0 0 / 0.14);
	}
</style>
