<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import { distOf } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import CameraInner from './CameraInner.svelte';

	// the label photo Vision asks for; only the distributor of the batch in focus has a request
	let { me, realCamera }: { me: User; realCamera?: boolean } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
</script>

{#if distOf(me, ws.data, c).id !== c.dist.id}<Screen {me} title="Label photo" sub="Requests from the Vision agent"
		><Card style="max-width: 560px"
			><Empty
				img="phone-scan"
				title="No photo requests"
				body="When a batch needs checking, Vision asks for one picture of a carton label here."
			/></Card
		></Screen
	>{:else}<CameraInner {me} {realCamera} />{/if}
