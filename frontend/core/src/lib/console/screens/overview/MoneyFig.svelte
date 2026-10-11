<script lang="ts">
	import { fmt, Roll } from '@smart-clearance/core';
	// a big rupee figure: the symbol set small and high, the digits rolling to their value (SC-49), read out once
	let { value }: { value: number } = $props();
</script>

<span class="cur" aria-hidden="true">₹</span><Roll value={Math.round(value)} from={0} hidden /><span class="sr-only"
	>{fmt.inr(value)}</span
>
