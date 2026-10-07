<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import { distOf } from '../../legacy';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import VanInner from './VanInner.svelte';

	// the van round and the ExpireSoon lot; only Rakesh Traders has scheme orders in the story
	let { me }: { me: User } = $props();
	const dist = $derived(distOf(me));
</script>

{#if dist.id !== 'rakesh'}<Screen {me} title="Van route" sub={dist.cluster}
		><Card style="max-width: 560px"
			><Empty
				img="van"
				title="No scheme orders on the van"
				body="Orders from Smart-Clearance offers join your next round automatically."
			/></Card
		></Screen
	>{:else}<VanInner {me} />{/if}
