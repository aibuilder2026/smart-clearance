<script lang="ts" module>
	import type { Kirana } from '../workspace/types';

	// the cluster's areas and the Kalamna godown, in the map's own units (640 × 400)
	const AREAS: Record<string, [number, number]> = {
		Itwari: [392, 196],
		Mahal: [338, 238],
		Sitabuldi: [292, 206],
		Sadar: [300, 150],
		Dharampeth: [226, 184],
		Kamptee: [486, 82],
		'Wardha Road': [208, 304],
		Wardha: [128, 352],
		Kalamna: [522, 214]
	};
	const LABELS = Object.entries(AREAS).filter(([n]) => n !== 'Kalamna');
	/** the kit's seeded generator, so every map draws the same town */
	const rnd = (seed: number) => () => {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};
	// the ground runs past the frame so any card shape shows the whole cluster ("meet") without bare bands
	const BLOCKS = (() => {
		const r = rnd(3);
		const out: [number, number, number, number][] = [];
		for (let y = -398; y < 800; y += 34)
			for (let x = -626; x < 1270; x += 44) {
				if (r() < 0.62) out.push([x + r() * 6, y + r() * 6, 30 + r() * 8, 22 + r() * 6]);
			}
		return out;
	})();

	type Point = { id: string; x: number; y: number; ordered: boolean; k?: Kirana };
	/** the ordered kiranas round their areas, then the rest of the cluster's shops scattered (the kit's useKiranaPoints) */
	function kiranaPoints(kiranas: Kirana[], total: number): Point[] {
		const r = rnd(7);
		const pts: Point[] = [];
		const used: Record<string, number> = {};
		kiranas.forEach((k, i) => {
			const c = AREAS[k.area] || AREAS.Itwari;
			used[k.area] = (used[k.area] || 0) + 1;
			const ang = used[k.area] * 2.4 + i;
			const rad = 14 + used[k.area] * 9;
			pts.push({ id: k.id, x: c[0] + Math.cos(ang) * rad, y: c[1] + Math.sin(ang) * rad * 0.8, ordered: true, k });
		});
		const names = Object.keys(AREAS).filter((a) => a !== 'Kalamna');
		for (let i = pts.length; i < total; i++) {
			const c = AREAS[names[i % names.length]];
			pts.push({ id: 'x' + i, x: c[0] + (r() - 0.5) * 92, y: c[1] + (r() - 0.5) * 70, ordered: false });
		}
		return pts;
	}
</script>

<script lang="ts">
	import { cx } from '../cx';
	import { prefersReducedMotion } from '../motion';

	type Props = {
		kiranas?: Kirana[];
		/** how many of `kiranas` have ordered: those are lit */
		orderedCount?: number;
		/** draw the van's round from the godown, nearest shop first */
		route?: boolean;
		/** where the van is on its round, 0 to 1 */
		vanProgress?: number | null;
		height?: number;
		title?: string;
		/** the shops in the cluster, ordered or not */
		total?: number;
	};
	let {
		kiranas = [],
		orderedCount = 0,
		route = false,
		vanProgress,
		height = 300,
		title = 'Nagpur cluster',
		total = 38
	}: Props = $props();

	// the kit's ClusterMap: the Kalamna godown and the cluster's kiranas on a schematic map, the ordered ones lit and
	// pinging twice; the van's round draws itself once (1.6 s), and reduced motion shows it drawn
	const reduce = $derived(prefersReducedMotion.current);
	const pts = $derived(kiranaPoints(kiranas, total));
	const ordered = $derived(pts.filter((p) => p.ordered));
	const g = AREAS.Kalamna;
	const routeD = $derived.by(() => {
		const left = ordered.map((p): [number, number] => [p.x, p.y]);
		const seq = [g];
		let cur = g;
		while (left.length) {
			let bi = 0,
				bd = 1e9;
			left.forEach((p, i) => {
				const d = (p[0] - cur[0]) ** 2 + (p[1] - cur[1]) ** 2;
				if (d < bd) {
					bd = d;
					bi = i;
				}
			});
			cur = left.splice(bi, 1)[0];
			seq.push(cur);
		}
		seq.push(g);
		return 'M' + seq.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L');
	});
	function draw(node: SVGPathElement) {
		if (prefersReducedMotion.current) return;
		node.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
			duration: 1600,
			easing: 'cubic-bezier(0.65, 0, 0.35, 1)'
		});
	}
</script>

<div
	class="map"
	style="height: {height}px"
	role="img"
	aria-label="{title}: Kalamna godown and {total} kiranas, {orderedCount} ordered"
>
	<svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" style="overflow: visible">
		<rect x="-640" y="-400" width="1920" height="1200" fill="var(--map-ground)" />
		{#each BLOCKS as [x, y, w, h], i (i)}<rect {x} {y} width={w} height={h} rx="5" fill="var(--map-block)" />{/each}
		<path
			d="M-660 280 L-10 262 C 90 238, 160 280, 250 252 S 400 226, 470 248 S 590 270, 660 236 L1300 210"
			fill="none"
			stroke="var(--map-water)"
			stroke-width="9"
			stroke-linecap="round"
		/>
		<g class="road-g">
			<ellipse cx="330" cy="212" rx="210" ry="140" fill="none" stroke="var(--map-road)" stroke-width="9" />
			<path class="road" d="M330 212 L540 214 L660 222 L1300 236" stroke-width="10" />
			<path class="road" d="M330 212 L486 82 L560 -10 L760 -420" stroke-width="10" />
			<path class="road" d="M330 212 L208 304 L128 352 L60 410 L-260 820" stroke-width="10" />
			<path class="road" d="M330 212 L120 170 L-10 150 L-660 110" stroke-width="8" />
			<path class="road" d="M330 212 L300 40 L292 -10 L270 -420" stroke-width="8" />
			<path class="road" d="M330 212 L420 380 L440 410 L560 820" stroke-width="8" />
			<path class="road" d="M226 184 L392 196 M300 150 L338 238" stroke-width="5" stroke="var(--map-road-2)" />
		</g>
		{#if route}
			<path class="route-shadow" d={routeD} />
			<path class="route" d={routeD} pathLength="1" stroke-dasharray="1" use:draw />
		{/if}
		{#each pts as p (p.id)}
			{@const on = p.k !== undefined && kiranas.indexOf(p.k) < orderedCount}
			<g>
				{#if on && !reduce}<circle class="pulse" cx={p.x} cy={p.y} r="6" />{/if}
				<circle class={cx('kirana', on && 'on')} cx={p.x} cy={p.y} r={on ? 5.5 : 4} />
			</g>
		{/each}
		<g transform="translate({g[0]} {g[1]})">
			{#if !reduce}<circle r="16" fill="var(--primary)" opacity="0.18"
					><animate attributeName="r" values="12;24;12" dur="2.4s" repeatCount="2" fill="freeze" /><animate
						attributeName="opacity"
						values="0.28;0;0.28"
						dur="2.4s"
						repeatCount="2"
						fill="freeze"
					/></circle
				>{/if}
			<rect
				x="-14"
				y="-14"
				width="28"
				height="28"
				rx="9"
				fill="var(--primary)"
				stroke="var(--surface)"
				stroke-width="3"
			/>
			<path
				d="M-7 5 V-1 L0 -6 L7 -1 V5 M-4 5 V1 H4 V5"
				fill="none"
				stroke="var(--primary-fg)"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</g>
		{#if route && vanProgress != null}
			<g>
				<circle
					r="11"
					fill="var(--surface)"
					stroke="var(--primary)"
					stroke-width="2.5"
					style={`offset-path: path("${routeD}"); offset-distance: ${Math.round(vanProgress * 100)}%; transition: offset-distance 600ms var(--ease)`}
				/>
			</g>
		{/if}
		<!-- labels last, haloed in the ground colour, so routes and dots never strike through them -->
		{#each LABELS as [n, [x, y]] (n)}<text
				class="pin-label"
				{x}
				y={y - 22}
				text-anchor="middle"
				style="font-size: 10.5px">{n}</text
			>{/each}
		<text class="pin-label" x={g[0]} y={g[1] - 22} text-anchor="middle">Kalamna godown</text>
	</svg>
	<span class="note">Schematic map · not to scale</span>
</div>
