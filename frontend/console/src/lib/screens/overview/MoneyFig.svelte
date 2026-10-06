<script lang="ts">
	import { fmt } from '@smart-clearance/core';
	// a big rupee figure: the symbol set small and high, the digits read out once
	let { value }: { value: number } = $props();
</script>

<span class="cur" aria-hidden="true">₹</span><span aria-hidden="true">{Math.round(value).toLocaleString('en-IN')}</span
><span class="sr-only">{fmt.inr(value)}</span>
