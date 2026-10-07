<script lang="ts">
	type Props = {
		/** where the truck is on the haul, 0 to 1 */
		progress?: number;
		from?: string;
		to?: string;
		label?: string;
	};
	let { progress = 0, from = 'Nagpur', to = 'Raipur', label = 'NH 53 · about 290 km' }: Props = $props();

	// the kit's HaulLine: the long haul, Nagpur to Raipur for the ExpireSoon lot in the buyer's own truck, the truck
	// moving along the road as `progress` grows
	const ROAD = 'M60 60 C 220 10, 420 100, 580 40';
</script>

<div class="map" style="height: 96px" role="img" aria-label="{from} to {to}, {label}">
	<svg viewBox="0 0 640 96" preserveAspectRatio="none">
		<rect width="640" height="96" fill="var(--map-ground)" />
		<path d={ROAD} fill="none" stroke="var(--map-road)" stroke-width="10" stroke-linecap="round" />
		<path
			d={ROAD}
			fill="none"
			stroke="var(--violet)"
			stroke-width="3"
			stroke-dasharray="6 7"
			stroke-linecap="round"
			opacity="0.8"
		/>
		<circle cx="60" cy="60" r="7" fill="var(--primary)" stroke="var(--surface)" stroke-width="3" />
		<circle cx="580" cy="40" r="7" fill="var(--violet)" stroke="var(--surface)" stroke-width="3" />
		<circle
			r="9"
			fill="var(--surface)"
			stroke="var(--violet)"
			stroke-width="2.5"
			style={`offset-path: path("${ROAD}"); offset-distance: ${Math.round(progress * 100)}%; transition: offset-distance 1.2s var(--ease)`}
		/>
	</svg>
	<span class="note" style="left: 12px; top: 8px; bottom: auto; font-weight: 600; color: var(--fg-2)">{from}</span>
	<span class="note" style="left: auto; right: 12px; top: 8px; bottom: auto; font-weight: 600; color: var(--fg-2)"
		>{to}</span
	>
	<span class="note" style="left: 50%; transform: translateX(-50%)">{label}</span>
</div>
