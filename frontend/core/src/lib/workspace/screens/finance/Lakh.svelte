<script lang="ts">
	import Roll from '../../../components/Roll.svelte';

	// quarter-sized rupees read in lakh, the way an Indian finance team says them (screens/finance.jsx Lakh)
	let { value, style }: { value: number; style?: string } = $props();
</script>

<span class="num s money" {style}
	><span class="sr-only">{'₹' + (value / 1e5).toFixed(1) + ' lakh'}</span><span class="cur" aria-hidden="true">₹</span
	><Roll value={value / 1e5} format={(v) => v.toFixed(1)} hidden /><span
		aria-hidden="true"
		style="align-self: flex-end; font-size: 0.46em; font-weight: 600; margin-left: 0.2em; margin-bottom: 0.16em; letter-spacing: 0"
		>lakh</span
	></span
>
