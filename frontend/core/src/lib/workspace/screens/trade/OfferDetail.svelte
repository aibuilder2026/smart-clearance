<script lang="ts">
	import { useRoute } from '../../context';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import OfferOrder from './OfferOrder.svelte';
	import OfferPage from './OfferPage.svelte';
	import { offersOf } from './pt';

	// the offer route (SC-130): an earlier offer by its ref opens its page; otherwise the open offer, to order from
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const router = useRoute();
	const ref = $derived(router.route.params?.ref ?? null);
	const o = $derived(ref ? offersOf(ws, me).find((x) => x.ref === ref) : undefined);
</script>

{#if o && o.status !== 'open'}<OfferPage {me} {o} />{:else if ws.case}<OfferOrder {me} />{/if}
