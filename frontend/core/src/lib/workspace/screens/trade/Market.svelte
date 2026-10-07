<script lang="ts" module>
	import type { EsListing } from './ListingCard.svelte';

	// the other lots on the marketplace, illustrative
	const OTHER_LISTINGS: EsListing[] = [
		{
			id: 'ES-23988',
			name: 'Cream biscuits 75 g',
			icon: 'cookie',
			units: 2400,
			price: 6,
			mrp: 10,
			days: 88,
			seller: 'FMCG distributor, Bilaspur'
		},
		{
			id: 'ES-24031',
			name: 'Instant noodles 70 g',
			icon: 'soup',
			units: 1800,
			price: 8,
			mrp: 14,
			days: 41,
			seller: 'Wholesaler, Durg'
		},
		{
			id: 'ES-24076',
			name: 'UHT toned milk 1 L',
			icon: 'milk',
			units: 600,
			price: 38,
			mrp: 72,
			days: 34,
			seller: 'Dairy distributor, Bhilai'
		},
		{
			id: 'ES-24102',
			name: 'Whole-wheat atta 5 kg',
			icon: 'wheat',
			units: 240,
			price: 160,
			mrp: 285,
			days: 52,
			seller: 'Mill outlet, Rajnandgaon'
		}
	];
</script>

<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Product from '../../../components/Product.svelte';
	import SearchField from '../../../components/SearchField.svelte';
	import Segmented from '../../../components/Segmented.svelte';
	import { rise } from '../../../motion/transitions';
	import { useRoute } from '../../context';
	import { D, ES } from '../../data';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import EsBar from './EsBar.svelte';
	import EsDate from './EsDate.svelte';
	import ListingCard from './ListingCard.svelte';

	// Agrawal ji on ExpireSoon, another company's marketplace: Rakesh Traders' lot featured once it is listed, the other
	// lots in a grid, a search and the categories
	let { me }: { me: User } = $props();
	const { go } = useRoute();
	const app = useApp();
	const h = $derived(store.state.hero);
	let q = $state('');
	let cat = $state<'all' | 'snacks' | 'staples'>('all');
	const hero = $derived<EsListing | null>(
		h.listing
			? {
					id: 'ES-24117',
					name: 'Munchly Masala Chips 150 g',
					units: ES.units,
					price: 15,
					mrp: 30,
					days: 47,
					seller: 'Rakesh Traders, Nagpur'
				}
			: null
	);
	const list = $derived(
		[hero, ...OTHER_LISTINGS]
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
	<Screen {me} title="Marketplace" sub={`Lots for ${D.buyer.city} · every listing shows its dates`} hideLarge={false}>
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
					<Product name="pack-chips" size={app.bp === 'phone' ? 96 : 132} float />
					<div class="stack tight grow" style="gap: 6px">
						<span class="row tight wrap"
							><Badge tone="violet" solid size="sm">new · {h.listing?.at}</Badge><Badge
								size="sm"
								tone="violet"
								icon="badge-check">label photo verified</Badge
							></span
						>
						<div class="t-title2">Munchly Masala Chips 150 g · {ES.units} units</div>
						<span class="row base wrap" style="gap: 8px"
							><span class="es-price lg">₹15</span><span class="muted">MRP ₹30 · 50% off</span><EsDate
								days={47}
								date="Best before 18 Nov 2026"
							/></span
						>
						<span class="t-footnote subtle">Rakesh Traders, Nagpur · verified seller · dispatch 24 h after balance</span
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
