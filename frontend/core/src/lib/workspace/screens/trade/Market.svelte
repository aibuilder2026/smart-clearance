<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Product from '../../../components/Product.svelte';
	import SearchField from '../../../components/SearchField.svelte';
	import Segmented from '../../../components/Segmented.svelte';
	import { rise } from '../../../motion/transitions';
	import { fmt } from '../../../format';
	import { useRoute } from '../../context';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import EsBar from './EsBar.svelte';
	import EsDate from './EsDate.svelte';
	import ListingCard, { type EsListing } from './ListingCard.svelte';

	// the buyer on ExpireSoon, another company's marketplace: the lot of the batch in focus featured once it is listed,
	// the marketplace's other lots in a grid, a search and the categories
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const { go } = useRoute();
	const app = useApp();
	const h = $derived(ws.state.hero);
	let q = $state('');
	let cat = $state<'all' | 'snacks' | 'staples'>('all');
	const hero = $derived<EsListing | null>(
		h.listing
			? {
					id: c.listing.id,
					name: `${c.sku.brand} ${c.sku.name}`,
					units: c.lines.expiresoon.units,
					price: c.lines.expiresoon.price,
					mrp: c.sku.mrp,
					days: c.batch.daysLeft,
					seller: `${c.dist.name}, ${c.dist.city}`
				}
			: null
	);
	const list = $derived(
		[hero, ...ws.data.market.lots]
			.filter((l): l is EsListing => !!l)
			.filter(
				(l) =>
					(!q || l.name.toLowerCase().includes(q.toLowerCase())) &&
					(cat === 'all' ||
						(cat === 'snacks'
							? /chips|biscuit|noodle/i.test(l.name)
							: cat === 'staples'
								? /atta|milk/i.test(l.name)
								: true))
			)
	);
	const others = $derived(list.filter((l) => l !== hero));
</script>

<div class="esw">
	<Screen {me} title="Marketplace" sub={`Lots for ${c.buyer.city} · every listing shows its dates`} hideLarge={false}>
		<div class="stack" style="gap: 16px">
			<EsBar />
			<div class="row wrap" style="gap: 10px">
				<div class="grow" style="min-width: 200px"><SearchField bind:value={q} placeholder="Search lots" /></div>
				<Segmented
					options={[
						{ id: 'all', label: 'All' },
						{ id: 'snacks', label: 'Snacks' },
						{ id: 'staples', label: 'Staples' }
					]}
					bind:value={cat}
					label="Category"
				/>
			</div>
			{#if hero}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (the whole feature opens the lot, as its View lot button does by keyboard) -->
				<div class="es-feature" onclick={() => go('listing')} in:rise|global={{ y: 8 }}>
					<Product name={c.sku.img} size={app.bp === 'phone' ? 96 : 132} float />
					<div class="stack tight grow" style="gap: 6px">
						<span class="row tight wrap"
							><Badge tone="violet" solid size="sm">new · {h.listing?.at}</Badge><Badge
								size="sm"
								tone="violet"
								icon="badge-check">label photo verified</Badge
							></span
						>
						<div class="t-title2">{hero.name} · {hero.units} units</div>
						<span class="row base wrap" style="gap: 8px"
							><span class="es-price lg">₹{hero.price}</span><span class="muted"
								>MRP ₹{hero.mrp} · {Math.round((1 - hero.price / hero.mrp) * 100)}% off</span
							><EsDate days={hero.days} date={`Best before ${fmt.date(c.batch.bestBefore)}`} /></span
						>
						<span class="t-footnote subtle"
							>{hero.seller} · verified seller · dispatch {ws.data.market.dispatchHours} h after balance</span
						>
					</div>
					<Button variant="violet" iconRight="arrow-right">View lot</Button>
				</div>
			{/if}
			<div class="es-grid">
				{#each others as l (l.id)}<ListingCard {l} onopen={() => {}} />{/each}
			</div>
			<p class="t-caption subtle" style="margin: 0">
				ExpireSoon is mocked in this prototype; the other lots are illustrative.
			</p>
		</div>
	</Screen>
</div>
