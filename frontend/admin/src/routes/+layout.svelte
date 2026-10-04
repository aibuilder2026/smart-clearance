<script lang="ts">
	import '../app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';

	let { data, children } = $props();
</script>

<QueryClientProvider client={data.queryClient}>
	{@render children()}
</QueryClientProvider>
