<script lang="ts">
	// a lot's date and the days left, as ExpireSoon shows them on every listing
	let { days, date }: { days: number; date?: string } = $props();
</script>

<span class="es-date">{date ? date + ' · ' : ''}{days} days</span>
