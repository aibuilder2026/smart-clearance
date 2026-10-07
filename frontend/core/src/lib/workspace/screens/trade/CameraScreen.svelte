<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import { distOf } from '../../legacy';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import CameraInner from './CameraInner.svelte';

	// the label photo Vision asks for; only Rakesh Traders has a request in the story
	let { me, realCamera }: { me: User; realCamera?: boolean } = $props();
</script>

{#if distOf(me).id !== 'rakesh'}<Screen {me} title="Label photo" sub="Requests from the Vision agent"
		><Card style="max-width: 560px"
			><Empty
				img="phone-scan"
				title="No photo requests"
				body="When a batch needs checking, Vision asks for one picture of a carton label here."
			/></Card
		></Screen
	>{:else}<CameraInner {me} {realCamera} />{/if}
