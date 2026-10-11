<script lang="ts">
	import { cx, fmt, Icon, imgUrl, prefersReducedMotion, SPRINGS, springCurve, WorkspaceMark } from '@smart-clearance/core';
	import { WS } from '@smart-clearance/core/workspace';
	import { BADGE, BADGE_AT, BLOCKS, DRAW_ORDER, GEO, HUB, lineName, RIVER, SHARED, short, toneOf } from './map.ts';
	import type { Line, Pos, StoryAct } from './types.ts';

	// the route map (director.jsx RouteMap): the plate (light only), the lines on their roads, the stations, Munchly's
	// workspace as the hub, the outcomes, the lines' badges, and the batch as a token where the story is. A line lights
	// green when it is on play or the visitor points at it; the slow week lights the chips' track to the yes with it. On
	// the start it draws itself once; under reduced motion it is drawn at once
	type Props = {
		acts: StoryAct[];
		/** what each journey's outcome says under its figure */
		outs: Record<Line, string>;
		active?: Line;
		hot?: Line | null;
		pos?: Pos;
		onpick?: (a: number, s: number) => void;
		draw?: boolean;
		compact?: boolean;
	};
	let { acts, outs, active, hot = $bindable(null), pos, onpick, draw, compact }: Props = $props();

	const AI = $derived(Object.fromEntries(acts.map((a, i) => [a.id, i])) as Record<Line, number>);
	const animate = $derived(!!draw && !prefersReducedMotion.current);
	const uid = $props.id();
	const lit = (id: Line): boolean | 'shared' =>
		id === active || id === hot || (id === 'chips' && (active === 'slow' || hot === 'slow') ? 'shared' : false);
	const stateOf = (ai: number, si: number) =>
		pos ? (ai < pos.a || (ai === pos.a && si < pos.s) ? 'done' : ai === pos.a && si === pos.s ? 'now' : '') : '';
	const sideOf = (id: Line, si: number) => {
		const s = GEO[id].side;
		return Array.isArray(s) ? s[si] : s;
	};
	const pick = (a: number, s: number) => onpick?.(a, s);
	const point = (id: Line | null) => (hot = id);
	const token = $derived(pos ? GEO[acts[pos.a].id].st[pos.s] : null);
	const curve = springCurve(SPRINGS.token);
	const img = (n: string) => imgUrl(n + '.webp');
</script>

<svg
	class={cx('rb-map', compact && 'compact', animate && 'drawing')}
	viewBox="40 36 1380 640"
	role="group"
	aria-label="The demo's route map: the platform's line into Munchly's workspace, then three journeys"
>
	<g class="rb-plate" aria-hidden="true">
		<defs>
			<pattern id="{uid}d" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" class="rb-dot" /></pattern>
			<clipPath id="{uid}c"><rect x="44" y="40" width="1372" height="632" rx="36" /></clipPath>
		</defs>
		<rect x="44" y="40" width="1372" height="632" rx="36" class="rb-ground" />
		<g clip-path="url(#{uid}c)">
			<rect x="44" y="40" width="1372" height="632" fill="url(#{uid}d)" class="rb-dots" />
			{#each BLOCKS as [x, y], i (i)}<rect {x} {y} width="54" height="38" rx="9" class="rb-block" />{/each}
			<path d={RIVER} class="rb-water" />
		</g>
	</g>
	{#each DRAW_ORDER as id, k (id)}
		{@const on = lit(id) === true}
		<!-- svelte-ignore a11y_no_static_element_interactions (pointing at a line only lights it; its badge and stations are the controls) -->
		<g onmouseenter={() => point(id)} onmouseleave={() => point(null)} style="--k: {k}">
			<path d={GEO[id].d} pathLength="1" class={cx('rb-line-road', on && 'on')} />
			<path d={GEO[id].d} pathLength="1" class={cx('rb-line-shadow', on && 'on')} />
			<path d={GEO[id].d} pathLength="1" class={cx('rb-line', on && 'on')} />
		</g>
	{/each}
	{#if lit('chips') === 'shared'}<path d={SHARED} class="rb-line-road on" /><path d={SHARED} class="rb-line on" />{/if}
	{#each ['console', 'chips', 'slow', 'mango'] as const as id (id)}
		{@const a = acts[AI[id]]}
		{#each a.stations as st, si (st.id)}
			{@const [x, y] = GEO[id].st[si]}
			{@const side = sideOf(id, si)}
			{@const on = lit(id) === true || (id === 'chips' && lit('chips') === 'shared' && si <= 5)}
			{@const s = stateOf(AI[id], si)}
			<g
				class={cx('rb-st', on && 'on', s, toneOf(st))}
				role="button"
				tabindex={compact ? -1 : 0}
				aria-label="{lineName(a)}: {st.title}"
				onclick={() => pick(AI[id], si)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						pick(AI[id], si);
					}
				}}
				onfocus={() => point(id)}
				onblur={() => point(null)}
				style="--d: {0.5 + 0.12 * DRAW_ORDER.indexOf(id) + si * 0.03}s; transform-origin: {x}px {y}px"
			>
				<circle cx={x} cy={y} r="9" />
				{#if s === 'done'}<path d="M{x - 4} {y} l3 3 l5 -6" class="rb-tick" />{/if}
				{#if !compact}<text
						x={side === 'left' ? x - 18 : x}
						y={side === 'up' ? y - 23 : side === 'down' ? y + 35 : y + 5}
						text-anchor={side === 'left' ? 'end' : 'middle'}
						class="rb-lbl">{short(st.title)}</text
					>{/if}
			</g>
		{/each}
	{/each}
	<g class="rb-hub">
		<circle cx={HUB[0]} cy={HUB[1]} r="24" />
		<foreignObject x={HUB[0] - 14} y={HUB[1] - 14} width="28" height="28"
			><div class="rb-hub-mark"><WorkspaceMark ws={WS} size={28} /></div></foreignObject
		>
		{#if !compact}<text x={HUB[0] - 34} y={HUB[1] + 5} text-anchor="end" class="rb-lbl strong">Munchly's workspace</text>{/if}
	</g>
	{#if !compact}
		{#each ['chips', 'slow', 'mango'] as const as id, k (id)}
			{@const a = acts[AI[id]]}
			{@const [x, y] = GEO[id].end!}
			{@const [ox, dy, anchor] = GEO[id].out!}
			<g class={cx('rb-end', a.outcome.red && 'red', lit(id) === true && 'on')} style="--d: {1.1 + 0.12 * k}s">
				<circle cx={x} cy={y} r="11" class="rb-pin" />
				{#if animate}<circle cx={x} cy={y} r="11" class="rb-ping" style="transform-origin: {x}px {y}px" />{/if}
				<text x={ox} y={y + dy + 9} text-anchor={anchor} class="rb-out">{fmt.inr(a.outcome.value ?? 0)}</text>
				<text x={ox} y={y + dy + 28} text-anchor={anchor} class="rb-out-sub">{outs[id]}</text>
			</g>
		{/each}
		{#each BADGE_AT as [id, x, y] (id)}
			{@const a = acts[AI[id]]}
			<foreignObject x={x - 10} y={y - 10} width="380" height="76"
				><div class="rb-badge-pad">
					<button
						type="button"
						class={cx('rb-badge', lit(id) === true && 'on')}
						onmouseenter={() => point(id)}
						onmouseleave={() => point(null)}
						onfocus={() => point(id)}
						onblur={() => point(null)}
						onclick={() => pick(AI[id], 0)}
					>
						{#if a.console}<span class="rb-badge-ic"><Icon name="layout-dashboard" size={18} /></span>{:else}<img
								src={img(a.img ?? '')}
								alt=""
							/>{/if}
						<span class="rb-badge-t"><b>{lineName(a)}</b><span>{BADGE[id]} · {a.minutes} min</span></span>
					</button>
				</div></foreignObject
			>
		{/each}
	{/if}
	{#if pos && token}
		{@const a = acts[pos.a]}
		<g
			class="rb-token"
			aria-hidden="true"
			style="transform: translate({token[0]}px, {token[1]}px); transition: transform {prefersReducedMotion.current
				? 0
				: curve.duration}ms {curve.linear}"
		>
			<circle r="17" />
			<foreignObject x="-13" y="-13" width="26" height="26"
				><div class="rb-token-in">
					{#if a.console}<Icon name="layout-dashboard" size={15} />{:else}<img src={img(a.img ?? '')} alt="" />{/if}
				</div></foreignObject
			>
		</g>
	{/if}
</svg>

<style>
	/* the start's draw: each line traced once, its stations popping in after it, the outcomes rising, the pins pinging
	   twice (framer-motion's pathLength and springs in the prototype); nothing repeats, and reduced motion skips it all */
	.drawing :global(.rb-line),
	.drawing :global(.rb-line-road),
	.drawing :global(.rb-line-shadow) {
		stroke-dasharray: 1;
		animation: rb-trace 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: calc(var(--k) * 0.12s);
	}
	.drawing :global(.rb-st circle) {
		animation: rb-pop 0.24s ease-out both;
		animation-delay: var(--d);
		transform-origin: inherit;
		transform-box: fill-box;
	}
	.drawing :global(.rb-end) {
		animation: rb-rise 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: var(--d);
	}
	.drawing :global(.rb-ping) {
		animation: rb-ping 1.1s ease-out 2 both;
		animation-delay: calc(var(--d) + 0.2s);
		transform-box: fill-box;
		transform-origin: center;
	}
	@keyframes rb-trace {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes rb-pop {
		from {
			transform: scale(0);
			opacity: 0;
		}
	}
	@keyframes rb-rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
	@keyframes rb-ping {
		from {
			transform: scale(1);
			opacity: 0.6;
		}
		to {
			transform: scale(2.4);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.drawing :global(*) {
			animation: none !important;
		}
	}
</style>
