<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Product from '../../../components/Product.svelte';
	import Skeleton from '../../../components/Skeleton.svelte';
	import { SPRINGS } from '../../../motion';
	import { slideThumb } from '../../../motion/thumb';
	import Columns from '../../../patterns/Columns.svelte';
	import { useRoute } from '../../context';
	import { productName } from '../../model';
	import { useWorkspace } from '../../source';
	import type { StaffSale as StaffSaleT, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import DistStopBadge from './DistStopBadge.svelte';
	import DistStops from './DistStops.svelte';
	import EarlierDeliveries from './EarlierDeliveries.svelte';
	import PickupCard from './PickupCard.svelte';
	import PtHead from './PtHead.svelte';
	import StaffSale from './StaffSale.svelte';
	import TruckCard from './TruckCard.svelte';
	import VanCard from './VanCard.svelte';
	import { distJourneysOf, distOfMe, distWorldOf } from './pt';

	// his Deliveries, batch by batch (SC-133, option A; screens/trade.jsx VanRoute): what leaves his godown for a batch,
	// only the lines its plan has (the van round with its stops, the buyer's truck, the staff sale, the pickup), a batch
	// at a time with a switch between them; then what left his godown for the batches he cleared. On the live workspace
	// a batch is acted on once it is in focus: the address names it, and the app puts it there
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const router = useRoute();
	const dist = $derived(distOfMe(ws, me));
	const w = $derived(distWorldOf(ws));
	const all = $derived(distJourneysOf(ws, dist.id));
	const ref = $derived(router.route.params?.ref ?? null);
	const cur = $derived(all.find((x) => x.j.ref === ref) ?? all.find((x) => x.n.from === 'focus') ?? all[0] ?? null);
	const reading = $derived(cur?.n.from === 'facts');
	$effect(() => {
		if (cur && reading && !ref) router.go('van', { ref: cur.j.ref });
	});
	const has = (id: string) => !!cur && cur.n.lines.some((l) => l.id === id);
	// the staff sale: the batch in focus's own, else the plan's line, open until recorded
	const staff = $derived.by((): StaffSaleT | null => {
		if (!cur || !has('staff')) return null;
		if (cur.n.from === 'focus' && ws.state.hero.staff) return ws.state.hero.staff;
		const st = cur.n.staff;
		if (!st) return null;
		return {
			status: st.status,
			units: st.units,
			price: st.price,
			godown: dist.godown,
			at: '',
			sold: st.sold,
			left: st.sold == null ? null : st.units - st.sold
		};
	});
	const clears = $derived(ws.case?.plan.rows.find((r) => r.id === 'staff')?.clears);
	const side = $derived(has('expiresoon') || !!staff || has('foodbank'));
	let before = $state<string | null>(null);
	let track: HTMLElement | undefined = $state();
	$effect(() => {
		const a = all.findIndex((x) => x.j.ref === before);
		const b = all.findIndex((x) => x.j.ref === cur?.j.ref);
		if (track && a >= 0 && b >= 0 && a !== b)
			slideThumb(track.querySelectorAll<HTMLElement>(':scope > .bh-tab'), a, b, '.bh-tab-thumb', SPRINGS.tabs);
	});
	const pick = (r: string) => {
		before = cur?.j.ref ?? null;
		router.go('van', { ref: r });
	};
</script>

{#if !cur}<Screen {me} title="Deliveries" sub="{dist.name} · {dist.cluster}">
		<div class="stack" style="gap: 20px">
			<Card style="max-width: 560px"
				><Empty
					img="van"
					title="Nothing goes out now"
					body="While a batch is in a journey, its van round, the buyer's truck, the staff sale and the pickup show here."
				/></Card
			>
			<EarlierDeliveries {dist} />
		</div>
	</Screen>{:else}{@const j = cur.j}{@const n = cur.n}<Screen {me} title="Deliveries" hideLarge>
		{#snippet below()}<PtHead
				sku={j.sku}
				id={j.ref}
				where="{dist.godown}, {dist.city}"
				line="What leaves your godown for this batch, line by line"
				>{#snippet badge()}<DistStopBadge {j} />{/snippet}{#if all.length > 1}<nav
						bind:this={track}
						class="bh-tabs"
						aria-label="Batches in a journey"
					>
						{#each all as x (x.j.ref)}<button
								type="button"
								class="bh-tab"
								aria-current={x.j.ref === j.ref ? 'page' : undefined}
								onclick={() => pick(x.j.ref)}
								>{#if x.j.ref === j.ref}<span class="bh-tab-thumb"></span>{/if}<Product
									name={x.j.sku.img}
									size={22}
									alt=""
								/><span>{productName(x.j.sku)}</span></button
							>{/each}
					</nav>{/if}</PtHead
			>{/snippet}
		<div class="stack" style="gap: 24px">
			{#if reading}<Card class="stack snug" style="max-width: 720px"
					><Skeleton h={220} /><Skeleton /><span class="sr-only">Reading the batch</span></Card
				>{:else if !n.approved}<Card style="max-width: 560px"
					><Empty
						img="van"
						title="Nothing leaves yet"
						body="Once {w.short} says yes to the plan for this batch, its van round, the buyer's truck, the staff sale and the pickup show here, each as its plan has it."
					/></Card
				>{:else}
				{#snippet sideCards()}{#if has('expiresoon')}<TruckCard {j} {n} {w} />{/if}{#if staff}<StaffSale
							{staff}
							dist={j.dist}
							product={productName(j.sku)}
							{clears}
						/>{/if}{#if has('foodbank')}<PickupCard {j} {n} />{/if}{/snippet}
				{#snippet mainCards()}<VanCard {j} {n} /><DistStops {n} />{/snippet}
				{#if has('kirana') && side}<Columns sideWidth={380} main={mainCards} side={sideCards} />{:else}<div
						class="stack"
						style="gap: 16px; max-width: 720px"
					>
						{#if has('kirana')}{@render mainCards()}{/if}{@render sideCards()}
					</div>{/if}
			{/if}
			<EarlierDeliveries {dist} skip={all.map((x) => x.j.ref)} />
		</div>
	</Screen>{/if}
