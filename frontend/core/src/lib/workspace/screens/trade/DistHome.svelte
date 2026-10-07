<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Aura from '../../../components/Aura.svelte';
	import Badge from '../../../components/Badge.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Mark from '../../../components/Mark.svelte';
	import Product from '../../../components/Product.svelte';
	import Roll from '../../../components/Roll.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { rise } from '../../../motion/transitions';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { D, ES, KL, SHOPS } from '../../data';
	import { batchViews, cartons, distOf, fmt, isRouted } from '../../model';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import ActingFor from './ActingFor.svelte';
	import EndWhole from './EndWhole.svelte';
	import InvoiceDraft from './InvoiceDraft.svelte';
	import PermissionCard from './PermissionCard.svelte';

	// Rakesh bhai's day: the permission, the label photo Vision asks for, the plan once approved, his van round and the
	// ExpireSoon lot, the invoice draft, how he ends whole, and his stock from the nightly DMS export
	let { me }: { me: User } = $props();
	const { go } = useRoute();
	const app = useApp();
	const s = $derived(store.state);
	const h = $derived(s.hero);
	const dist = $derived(distOf(me));
	const hero = $derived(dist.id === 'rakesh');
	const perm = $derived(s.setup.permission);
	const mine = $derived(batchViews(s).filter((v) => v.distributor === dist.id));
	const units = $derived(h.orders.reduce((t, o) => t + o.units, 0));
	const approved = $derived(isRouted(h.phase));
	const settled = $derived(['settled', 'cleared'].includes(h.phase));
	const toVan = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			go('van');
		}
	};
</script>

<Screen {me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
	<div class="stack" style="gap: 16px">
		{#if hero && !perm}<PermissionCard />{/if}
		{#if hero && perm}<ActingFor p={perm} />{/if}
		{#if !hero}<Card class="row wrap" style="gap: 14px"
				><Product name="godown" size={72} />
				<div class="grow">
					<b>Nothing to do today</b>
					<div class="t-footnote muted">
						No photo requests, scheme orders or marketplace lots for {dist.name} right now. The Watcher checks your stock
						every morning at 09:00.
					</div>
				</div></Card
			>{/if}
		{#if hero && h.photo.status === 'requested'}<div class="bezel" in:rise|global={{ y: 8 }}>
				<div class="card raised stack snug" style="padding: 20px">
					<div class="row tight">
						<Mark size={30} /><span class="t-footnote subtle strong">Smart-Clearance · {D.push.verify.at}</span>
					</div>
					<div class="t-title3">{D.push.verify.title}</div>
					<p class="t-body" style="margin: 0">{D.push.verify.body}</p>
					<div class="row" style="gap: 12px">
						<Product name="phone-scan" size={72} /><span class="t-footnote muted"
							>Shelf B4 · one carton of Masala Chips 150 g · batch MF-2409-117</span
						>
					</div>
					<Button variant="primary" size="lg" icon="camera" block onclick={() => go('photo')}>Open camera</Button>
				</div>
			</div>{/if}
		{#if hero && ['reading', 'verified'].includes(h.photo.status) && !approved}<Card class="row" style="gap: 14px"
				><Aura on={h.photo.status === 'reading'} class="icontile" style="border-radius: 12px; width: 40px; height: 40px"
					><Icon name={h.photo.status === 'verified' ? 'check' : 'scan-line'} size={19} stroke={2.2} /></Aura
				>
				<div class="grow">
					<b>{h.photo.status === 'verified' ? 'Label verified · thank you' : 'Photo sent · reading the label'}</b>
					<div class="t-footnote muted">
						{h.photo.status === 'verified'
							? 'Batch, dates and MRP match your DMS record. Munchly gets a plan in a few minutes.'
							: 'Sent at 09:19. Nothing else needed from you.'}
					</div>
				</div></Card
			>{/if}
		{#if hero && approved && !settled}<Card class="stack snug">
				<div class="card-head">
					<span class="card-title">Munchly's plan for your Masala Chips</span><Badge tone="green" icon="check"
						>approved 09:40</Badge
					>
				</div>
				<div class="stack tight t-subhead">
					<div class="row top" style="gap: 10px">
						<span class="dotmark" style="background: var(--ch-kirana)"></span><span
							><b>{KL.units} packets to your kiranas</b> on the scheme: ₹{KL.packPrice!.toFixed(2)} a pack, 2 free with every
							10, delivered on your Tuesday round.</span
						>
					</div>
					<div class="row top" style="gap: 10px">
						<span class="dotmark" style="background: var(--ch-expiresoon)"></span><span
							><b>{ES.units} on ExpireSoon in your name</b> at ₹15, hidden from buyers in Munchly's territories. The buyer
							collects with his own truck.</span
						>
					</div>
				</div>
			</Card>{/if}
		{#if hero && approved}<div
				style="display: grid; gap: 16px; grid-template-columns: {app.bp === 'phone'
					? 'minmax(0,1fr)'
					: 'repeat(2, minmax(0,1fr))'}"
			>
				<Card interactive class="stack snug" onclick={() => go('van')} role="button" tabindex={0} onkeydown={toVan}>
					<div class="card-head">
						<span class="row tight"
							><span class="icontile"><Icon name="truck" size={17} stroke={2} /></span><span class="card-title"
								>Tuesday van round</span
							></span
						><Icon name="chevron-right" size={18} class="subtle" />
					</div>
					<div class="row base" style="gap: 8px">
						<span class="num m"><Roll value={h.orders.length} /></span><span class="muted"
							>shops · {cartons(units)}</span
						>
					</div>
					<span class="t-footnote subtle"
						>{h.van.status === 'done'
							? `Delivered · all ${SHOPS} shops`
							: h.orders.length
								? 'Orders from the Masala Chips scheme join this round'
								: 'Scheme orders will appear here'}</span
					>
				</Card>
				<Card interactive class="stack snug" onclick={() => go('van')} role="button" tabindex={0} onkeydown={toVan}>
					<div class="card-head">
						<span class="row tight"
							><span class="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span class="card-title"
								>{D.buyer.city} lot · ExpireSoon</span
							></span
						><Icon name="chevron-right" size={18} class="subtle" />
					</div>
					<div class="row base" style="gap: 8px">
						<span class="num m">{ES.units}</span><span class="muted">units · {cartons(ES.units)}</span>
					</div>
					<span class="t-footnote subtle"
						>{h.truck.status === 'dispatched'
							? `Collected by ${D.buyer.name}'s truck`
							: h.award
								? `Sold at ₹${D.counter.price.toFixed(2)} · token ${fmt.inr(D.award.token)} paid`
								: h.listing
									? 'Listed at ₹15 in your name · waiting for a buyer'
									: 'Not listed'}</span
					>
				</Card>
			</div>{/if}
		{#if hero && settled}<InvoiceDraft {h} />{/if}
		{#if hero && approved}<EndWhole {settled} />{/if}
		<SectionTitle sub="From your nightly DMS export">Your stock</SectionTitle>
		<div class="list">
			{#each mine as v (v.id)}<BatchRow view={v} compact={app.bp === 'phone'} onopen={() => {}} />{/each}
		</div>
	</div>
</Screen>
