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
	import { batchViews, cartons, distOf, fmt, isRouted, productName } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import ActingFor from './ActingFor.svelte';
	import EndWhole from './EndWhole.svelte';
	import InvoiceDraft from './InvoiceDraft.svelte';
	import PermissionCard from './PermissionCard.svelte';
	import StaffSale from './StaffSale.svelte';
	import DistQuiet from '../live/DistQuiet.svelte';

	// Rakesh bhai's day: the permission, the label photo Vision asks for, the plan once approved, his van round and the
	// ExpireSoon lot, the invoice draft, how he ends whole, and his stock from the nightly DMS export
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const { go } = useRoute();
	const app = useApp();
	const s = $derived(ws.state);
	const h = $derived(s.hero);
	const dist = $derived(distOf(me, ws.data, c));
	const hero = $derived(dist.id === c.dist.id);
	const W = $derived(ws.data.workspace);
	const perm = $derived(s.setup.permission);
	const mine = $derived(batchViews(s, ws.data).filter((v) => v.distributor === dist.id));
	const units = $derived(h.orders.reduce((t, o) => t + o.units, 0));
	const approved = $derived(isRouted(h.phase));
	const settled = $derived(['settled', 'cleared'].includes(h.phase));
	// the lines of the plan this distributor runs (SC-85): the van round for a kirana scheme, the lot for ExpireSoon
	const hasKirana = $derived(c.plan.lines.some((l) => l.id === 'kirana' && l.units > 0));
	const hasES = $derived(c.plan.lines.some((l) => l.id === 'expiresoon' && l.units > 0));
	const toVan = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			go('van');
		}
	};
</script>

{#if !ws.case}<DistQuiet
		{me}
		dist={Object.values(ws.data.distributors).find((d) => d.name === me.org) ?? Object.values(ws.data.distributors)[0]}
	/>{:else}<Screen {me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
		<div class="stack" style="gap: 16px">
			{#if hero && !perm}<PermissionCard />{/if}
			{#if hero && perm}<ActingFor p={perm} />{/if}
			{#if !hero}<Card class="row wrap" style="gap: 14px"
					><Product name="godown" size={72} />
					<div class="grow">
						<b>Nothing to do today</b>
						<div class="t-footnote muted">
							No photo requests, scheme orders or marketplace lots for {dist.name} right now. The Watcher checks your stock
							every morning at {s.rules.watchTime}.
						</div>
					</div></Card
				>{/if}
			{#if hero && h.photo.status === 'requested'}<div class="bezel" in:rise|global={{ y: 8 }}>
					<div class="card raised stack snug" style="padding: 20px">
						<div class="row tight">
							<Mark size={30} /><span class="t-footnote subtle strong">Smart-Clearance · {c.push.verify.at}</span>
						</div>
						<div class="t-title3">{c.push.verify.title}</div>
						<p class="t-body" style="margin: 0">{c.push.verify.body}</p>
						<div class="row" style="gap: 12px">
							<Product name="phone-scan" size={72} /><span class="t-footnote muted"
								>{c.batch.shelf ? `Shelf ${c.batch.shelf} · one` : 'One'} carton of {c.sku.name} · batch {c.batch
									.id}</span
							>
						</div>
						<Button variant="primary" size="lg" icon="camera" block onclick={() => go('photo')}>Open camera</Button>
					</div>
				</div>{/if}
			{#if hero && ['reading', 'verified'].includes(h.photo.status) && !approved}<Card class="row" style="gap: 14px"
					><Aura
						on={h.photo.status === 'reading'}
						class="icontile"
						style="border-radius: 12px; width: 40px; height: 40px"
						><Icon name={h.photo.status === 'verified' ? 'check' : 'scan-line'} size={19} stroke={2.2} /></Aura
					>
					<div class="grow">
						<b>{h.photo.status === 'verified' ? 'Label verified · thank you' : 'Photo sent · reading the label'}</b>
						<div class="t-footnote muted">
							{h.photo.status === 'verified'
								? `Batch, dates and MRP match your DMS record. ${W.short} gets a plan in a few minutes.`
								: `Sent at ${h.photo.at}. Nothing else needed from you.`}
						</div>
					</div></Card
				>{/if}
			{#if hero && approved && !settled}<Card class="stack snug">
					<div class="card-head">
						<span class="card-title">{W.short}'s plan for your {productName(c.sku)}</span><Badge
							tone="green"
							icon="check">approved {h.plan?.at}</Badge
						>
					</div>
					<div class="stack tight t-subhead">
						{#each c.plan.lines as ln (ln.id)}<div class="row top" style="gap: 10px">
								<span class="dotmark" style="background: var(--ch-{ln.id})"></span>{#if ln.id === 'kirana'}<span
										><b>{c.lines.kirana.units} packets to your kiranas</b> on the scheme: {fmt.rate(
											c.lines.kirana.packPrice ?? 0
										)} a pack,
										{c.scheme.free} free with every {c.scheme.buy}, delivered on your {c.van.day} round.</span
									>{:else if ln.id === 'expiresoon'}<span
										><b>{c.lines.expiresoon.units} on ExpireSoon in your name</b> at ₹{c.lines.expiresoon.price}, hidden
										from buyers in
										{W.short}'s territories. The buyer collects with his own truck.</span
									>{:else if ln.id === 'staff'}<span
										><b>{ln.units} packets for your staff sale</b> at ₹{ln.price}, at {dist.godown}: sell them to your
										staff and record what sold.</span
									>{:else if ln.id === 'foodbank'}<span
										><b>{ln.units} packets to a food bank</b>: the Donation agent books the pickup from your godown.</span
									>{:else}<span><b>{ln.units} packets written off</b>: no exit takes them in time.</span>{/if}
							</div>
							<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a space Svelte would trim at the block's edge, between one line and the next -->
							{' '}{/each}
					</div>
				</Card>{/if}
			{#if hero && h.staff}<StaffSale
					staff={h.staff}
					{dist}
					product={productName(c.sku)}
					clears={c.plan.rows.find((r) => r.id === 'staff')?.clears}
				/>{/if}
			{#if hero && approved && (hasKirana || hasES)}<div
					style="display: grid; gap: 16px; grid-template-columns: {app.bp === 'phone' || !(hasKirana && hasES)
						? 'minmax(0,1fr)'
						: 'repeat(2, minmax(0,1fr))'}"
				>
					{#if hasKirana}<Card
							interactive
							class="stack snug"
							onclick={() => go('van')}
							role="button"
							tabindex={0}
							onkeydown={toVan}
						>
							<div class="card-head">
								<span class="row tight"
									><span class="icontile"><Icon name="truck" size={17} stroke={2} /></span><span class="card-title"
										>{c.van.day} van round</span
									></span
								><Icon name="chevron-right" size={18} class="subtle" />
							</div>
							<div class="row base" style="gap: 8px">
								<span class="num m"><Roll value={h.orders.length} /></span><span class="muted"
									>shops · {cartons(units, c.sku.perCarton)}</span
								>
							</div>
							<span class="t-footnote subtle"
								>{h.van.status === 'done'
									? `Delivered · all ${c.kiranas.length} shops`
									: h.orders.length
										? `Orders from the ${productName(c.sku)} scheme join this round`
										: 'Scheme orders will appear here'}</span
							>
						</Card>{/if}
					{#if hasES}<Card
							interactive
							class="stack snug"
							onclick={() => go('van')}
							role="button"
							tabindex={0}
							onkeydown={toVan}
						>
							<div class="card-head">
								<span class="row tight"
									><span class="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span
										class="card-title">{c.buyer.city} lot · ExpireSoon</span
									></span
								><Icon name="chevron-right" size={18} class="subtle" />
							</div>
							<div class="row base" style="gap: 8px">
								<span class="num m">{c.lines.expiresoon.units}</span><span class="muted"
									>units · {cartons(c.lines.expiresoon.units, c.sku.perCarton)}</span
								>
							</div>
							<span class="t-footnote subtle"
								>{h.truck.status === 'dispatched'
									? `Collected by ${c.buyer.name}'s truck`
									: h.award
										? `Sold at ₹${c.counter.price.toFixed(2)} · token ${fmt.inr(c.award.token)} paid`
										: h.listing
											? `Listed at ₹${c.lines.expiresoon.price} in your name · waiting for a buyer`
											: 'Not listed'}</span
							>
						</Card>{/if}
				</div>{/if}
			{#if hero && settled && c.docs.some((d) => d.id === 'invoice')}<InvoiceDraft {h} />{/if}
			{#if hero && approved && c.sku.dp}<EndWhole {settled} />{/if}
			<SectionTitle sub="From your nightly DMS export">Your stock</SectionTitle>
			<div class="list">
				<!-- a batch in a journey opens its page under Batches (SC-130) -->
				{#each mine as v (v.id)}<BatchRow
						view={v}
						compact={app.bp === 'phone'}
						onopen={() => (v.phase && v.phase !== 'watching' ? go('batches', { ref: v.id }) : undefined)}
					/>{/each}
			</div>
		</div>
	</Screen>{/if}
