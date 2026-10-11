<script lang="ts">
	import { Button, Card, Empty } from '../../index';
	import { useConsole } from '../console.svelte';
	import Screen from './Screen.svelte';

	// an address the console doesn't have, or a page that could not load
	let { status, message }: { status: number; message?: string } = $props();
	const k = useConsole();
	const missing = $derived(status === 404);
</script>

{#snippet home()}<Button href={k.href({ screen: 'overview' })}>Overview</Button>{/snippet}

<Screen title={missing ? 'Not found' : 'Something went wrong'}>
	<Card
		><Empty
			icon={missing ? 'search' : 'circle-alert'}
			title={missing ? "This page isn't in the console" : "This page didn't load"}
			body={missing ? 'Check the address, or start from the overview.' : message}
			action={home}
		/></Card
	>
</Screen>
