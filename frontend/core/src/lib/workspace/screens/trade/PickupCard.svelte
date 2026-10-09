<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import type { DistJourney, DistNow } from '../../dist';
	import { fmt } from '../../model';
	import DistChan from './DistChan.svelte';

	// the food bank collects a batch's packs from his godown: nothing goes on his van (SC-133, screens/trade.jsx
	// PickupCard)
	let { j, n }: { j: DistJourney; n: DistNow } = $props();
	const fb = $derived(n.lines.find((l) => l.id === 'foodbank')!);
	const d = $derived(n.donation);
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><DistChan id="foodbank" /><span class="card-title">{d ? `${d.partner} collects` : "The food bank's pickup"}</span
			></span
		><Badge
			tone={d?.status === 'collected' ? 'green' : undefined}
			icon={d?.status === 'collected' ? 'check' : 'calendar'}
			>{!d
				? 'being booked'
				: d.status === 'collected'
					? 'collected'
					: d.status === 'declined'
						? 'declined'
						: d.date
							? `${d.date}${d.time ? ` · ${d.time}` : ''}`
							: d.status === 'confirmed'
								? 'confirmed'
								: 'booked'}</Badge
		>
	</div>
	<span class="t-subhead"
		>{fmt.num(fb.units)} packs from {j.dist.godown}, with the FSSAI checklist. {d?.status === 'declined'
			? 'The food bank declined, so the packs stay at your godown.'
			: 'Their volunteers collect; nothing goes on your van.'}</span
	>
</Card>
