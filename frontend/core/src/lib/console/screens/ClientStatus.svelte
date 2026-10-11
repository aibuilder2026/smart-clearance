<script lang="ts">
	import type { Client } from '@smart-clearance/api/console';
	import { Badge } from '@smart-clearance/core';

	let { client }: { client: Pick<Client, 'status'> } = $props();
</script>

{#if client.status === 'live'}<Badge size="sm" tone="green" dot>Live</Badge>{:else}<Badge size="sm" dot
		>Setting up</Badge
	>{/if}
