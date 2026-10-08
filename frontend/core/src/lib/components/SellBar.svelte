<script lang="ts">
	// a batch's projection at today's sell-through (the kit's SellBar, SC-83): the days its packs take to sell, in green,
	// against the days it has left, the last week (when retailers no longer take it) hatched
	type Props = { days: number; sell: number; usable: number };
	let { days, sell, usable }: Props = $props();
	const span = $derived(Math.max(days, 1));
	const plural = (n: number) => (n === 1 ? 'day' : 'days');
</script>

<div
	class="sellbar"
	role="img"
	aria-label="Sells out in {sell} {plural(sell)}; retailers take it for {usable} more {plural(usable)}"
>
	<i style="--p: {Math.min(1, sell / span)}"></i><b style="--at: {Math.min(1, usable / span)}"></b>
</div>
