<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import { useRoute } from '../../context';
	import { pickupsFor } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import PickupHistory from './PickupHistory.svelte';
	import PickupPage from './PickupPage.svelte';
	import PickupsNow from './PickupsNow.svelte';
	import { worldOf } from './pt';

	// a food bank's pickups (SC-130, option A; screens/trade.jsx Pickups): the request in front of it, then every pickup
	// it has collected for the client, each opening on its tracker, its receipt and its FSSAI checklist
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const router = useRoute();
	const ref = $derived(router.route.params?.ref ?? null);
	// the pickups collected: those of the batch in a journey show in front of it, the rest here
	const past = $derived(
		pickupsFor(me.org ?? '', ws.partners?.cases ?? [], worldOf(ws), ws.case?.donation.batch.id ?? null)
	);
	const hit = $derived(ref ? past.find((p) => p.ref === ref) : undefined);
	const open = (p: { ref: string }) => router.go('pickups', { ref: p.ref });
</script>

{#if hit}<PickupPage {me} p={hit} />{:else if ws.case}<PickupsNow {me} {past} onopen={open} />{:else}<Screen
		{me}
		title="Pickups"
		sub={`${me.org} · surplus food from ${ws.data.workspace.short}`}
		><div class="stack" style="gap: 20px; max-width: 760px">
			<Card
				><Empty
					img="donation-crate"
					title="No pickups yet"
					body="When a batch is donated to you, its pickup appears here to confirm."
				/></Card
			><PickupHistory {past} onopen={open} />
		</div></Screen
	>{/if}
