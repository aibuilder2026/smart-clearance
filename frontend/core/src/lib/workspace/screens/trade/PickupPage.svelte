<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import VTracker from '../../../components/VTracker.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { fmt } from '../../model';
	import { fssaiItems } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { Batch, PtPickup, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import PaperSheet from './PaperSheet.svelte';
	import PtHead from './PtHead.svelte';
	import { when } from './pt';

	// a collected pickup's own page (SC-130, screens/trade.jsx PickupPage): its tracker, its receipt and the FSSAI
	// checklist that came with it
	let { me, p }: { me: User; p: PtPickup } = $props();
	const ws = useWorkspace();
	let open = $state(false);
	const batch = $derived({ id: p.ref, bestBefore: p.bestBefore } as Batch);
</script>

{#snippet badge()}<Badge size="sm" tone="green" icon="check">collected</Badge>{/snippet}
{#snippet head()}<PtHead
		sku={p.sku}
		id={p.ref}
		where={p.from}
		{badge}
		line={`Donor: ${ws.data.client.name} via ${p.dist.name}`}
	/>{/snippet}
<Screen {me} title={p.sku.name} back="Pickups" hideLarge below={head}>
	<Columns sideWidth={340}>
		{#snippet main()}<Card class="stack snug"
				><div class="card-head">
					<span class="card-title">Pickup</span><Badge tone="green" icon="check">{fmt.num(p.units)} packs</Badge>
				</div>
				<VTracker
					items={[
						{ id: 'req', title: 'Requested by the donation agent', time: p.asked ? when(p.asked) : '' },
						{ id: 'conf', title: 'Confirmed by you', time: p.confirmed ? when(p.confirmed) : '' },
						{ id: 'col', title: `Collected from ${p.from}`, time: when(p.collected) },
						{ id: 'serve', title: `Served at ${p.spot}`, time: 'that week' }
					]}
					done={4}
				/>
				<button type="button" class="receipt-row" onclick={() => (open = true)}
					><Icon name="receipt" size={20} /><span class="grow"
						><b>{p.receipt.type} {p.receipt.no}</b><span class="t-footnote"
							>{fmt.num(p.units)} packs · {fmt.num(p.meals)} meals · shared with {ws.data.workspace.short} for its BRSR table</span
						></span
					><span class="receipt-view">View<Icon name="chevron-right" size={16} /></span></button
				></Card
			>{/snippet}
		{#snippet side()}<SectionTitle>FSSAI surplus-food checklist</SectionTitle><Card
				class="paper stack tight"
				style="padding: 18px"
				>{#each fssaiItems(p, ws.data.client.name) as t (t)}<div class="row top" style="gap: 8px">
						<Icon name="square-check" size={17} style="color: #167a52; margin-top: 1px" /><span class="t-subhead"
							>{t}</span
						>
					</div>{/each}</Card
			>{/snippet}
	</Columns>
	<PaperSheet bind:open ref={p.ref} receipt={{ doc: p.receipt, batch, sku: p.sku, dist: p.dist }} />
</Screen>
