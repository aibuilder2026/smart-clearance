<script lang="ts">
	import { Button, Card, Empty } from '@smart-clearance/core';
	import { page } from '$app/state';
	import { href } from '#lib/links.ts';
	import Screen from '#lib/screens/Screen.svelte';

	// an address the console doesn't have, or a page that could not load
	const missing = $derived(page.status === 404);
</script>

{#snippet home()}<Button href={href('overview')}>Overview</Button>{/snippet}

<Screen title={missing ? 'Not found' : 'Something went wrong'}>
	<Card
		><Empty
			icon={missing ? 'search' : 'circle-alert'}
			title={missing ? "This page isn't in the console" : "This page didn't load"}
			body={missing ? 'Check the address, or start from the overview.' : page.error?.message}
			action={home}
		/></Card
	>
</Screen>
