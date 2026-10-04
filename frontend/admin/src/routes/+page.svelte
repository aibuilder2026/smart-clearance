<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	const q = createQuery(() => ({ queryKey: ['spike'], queryFn: async () => ({ net: 0, shops: 0 }) }));
</script>

<main class="app" style="height:auto">
	<h1 class="num l">₹{q.data?.net.toLocaleString('en-IN')}</h1>
	<p id="shops">{q.data?.shops} kiranas</p>
	<p class="font-display text-title1 text-primary-text">Five exits, one batch</p>
</main>
