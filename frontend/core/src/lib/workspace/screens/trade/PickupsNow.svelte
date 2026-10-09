<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import { useNotice } from '../../../notice.svelte';
	import Avatar from '../../../components/Avatar.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Mark from '../../../components/Mark.svelte';
	import Product from '../../../components/Product.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import VTracker from '../../../components/VTracker.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { fmt, productName } from '../../model';
	import { useWorkspace } from '../../source';
	import type { PtPickup, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import Receipt from '../finance/Receipt.svelte';
	import PickupHistory from './PickupHistory.svelte';

	// Meera at Feeding India: the donation agent's request for the Mango Drink, her yes, the pickup and the receipt she
	// issues as she collects (SC-110, opened in a sheet), beside the FSSAI checklist and her intake rules; then every
	// pickup she has collected for the client (SC-130). The request goes to the food bank the plan names, so another food
	// bank sees its own history alone
	let { me, past, onopen }: { me: User; past: PtPickup[]; onopen: (p: PtPickup) => void } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const app = useApp();
	const { toast } = useNotice();
	const ours = $derived(me.org === c.donation.partner.name);
	const d = $derived(ours ? ws.state.mango.donation : null);
	let later = $state(false);
	let paper = $state(false);
	// the donation: its batch, its partner (the food bank this person is with) and the pickup's schedule
	const dn = $derived(c.donation);
	const n = $derived(dn.units);
	const what = $derived(productName(dn.sku));
	const days = $derived(dn.batch.daysLeft);
	const bb = $derived(fmt.date(dn.batch.bestBefore));
	const checklist = $derived([
		'Sealed, undamaged packs',
		`Best before ${bb}, ${days} days left`,
		'Ambient storage, away from sunlight',
		`Batch ${dn.batch.id} on every carton`,
		`Donor: ${ws.data.client.short} via ${dn.dist.name}`
	]);
	const slots = $derived(dn.slots);
	// the receipt the food bank issues as it collects (SC-110); its PDF, on the live workspace, once Paperwork has laid it
	// out
	const receipt = $derived(d === 'collected' ? dn.receipt : null);
	const collect = async () => {
		await ws.act('collect');
		const r = ws.case?.donation.receipt;
		toast({ text: r ? `${r.type} ${r.no} issued` : `Receipt issued · ${n} drinks`, tone: 'ok' });
	};
	const pdf = async () => {
		try {
			window.open(await ws.documentUrl!('receipt'), '_blank', 'noopener');
		} catch {
			toast({ text: 'The PDF could not be opened. Try again in a moment.', tone: 'err' });
		}
	};
	const suggest = () => {
		later = false;
		toast({ text: `Sent · the agent will confirm with ${dn.dist.name}` });
	};
</script>

{#snippet pdfFooter()}<Button variant="secondary" block icon="download" onclick={pdf}>Download the PDF</Button
	>{/snippet}

<Screen
	{me}
	title="Pickups"
	sub={ours ? `${me.org} · ${me.city}` : `${me.org} · surplus food from ${ws.data.workspace.short}`}
>
	{#if !d}{@const org = ws.data.setup.partners.find((x) => x.name === me.org)}
		<div class="stack" style="gap: 20px; max-width: 760px">
			<Card
				><Empty
					img="donation-crate"
					title="No pickup requests"
					body={`Brands' donation agents send surplus food here when it fits your intake rules: ${org?.minDays || 15}+ days left, ${org?.minUnits || 50}+ units.`}
				/></Card
			><PickupHistory {past} {onopen} />
		</div>{:else}<Columns sideWidth={340}>
			{#snippet main()}
				<div class="bezel">
					<div class="card raised stack" style="padding: 22px; gap: 16px">
						<div class="row tight">
							<Mark size={28} /><span class="t-footnote subtle strong"
								>Donation agent · {ws.data.client.short} · {dn.asked}</span
							>
						</div>
						<div class="row" style="gap: 16px">
							<Product name={dn.sku.img} size={app.bp === 'phone' ? 80 : 104} float />
							<div class="stack tight" style="gap: 4px">
								<div class="t-title2">{n} packs of {what}</div>
								<span class="row tight wrap"
									><Badge icon="calendar">{days} days left</Badge><Badge icon="map-pin">{dn.from}</Badge><Badge
										tone="green"
										icon="clipboard-check">FSSAI checklist</Badge
									></span
								>
							</div>
						</div>
						<p class="t-body" style="margin: 0">
							{n} packs of {what}, {days} days left, with the FSSAI checklist. Pickup {dn.day}
							{dn.hour} from {dn.from}?
						</p>
						{#if d === 'booked'}<div class="row wrap" style="gap: 10px">
								<Button variant="primary" size="lg" icon="check" onclick={() => ws.act('confirmPickup')}
									>Confirm {dn.day} {dn.time}</Button
								><Button variant="secondary" size="lg" onclick={() => (later = true)}>Suggest another time</Button>
							</div>{:else}<div class="row top" style="gap: 10px; justify-content: flex-end">
								<div
									class="t-subhead"
									style="padding: 9px 12px; border-radius: 16px; border-top-right-radius: 6px; background: var(--primary); color: var(--primary-fg); max-width: 85%"
								>
									{dn.reply}
									<div class="t-caption" style="opacity: 0.9">{me.short} · {dn.confirmed}</div>
								</div>
								<Avatar person={me} size="sm" />
							</div>{/if}
					</div>
				</div>
				{#if d !== 'booked'}<Card class="stack snug"
						><div class="card-head">
							<span class="card-title">Pickup</span><Badge tone="green" icon={d === 'collected' ? 'check' : 'calendar'}
								>{d === 'collected' ? 'collected' : `${dn.date} · ${dn.time}`}</Badge
							>
						</div>
						<VTracker
							items={[
								{ id: 'req', title: 'Requested by the donation agent', time: dn.asked },
								{ id: 'conf', title: `Confirmed by ${me.short}`, time: dn.confirmed },
								{
									id: 'col',
									title: `Collected from ${dn.from}`,
									time: d === 'collected' ? dn.collected : `${dn.date.split(' ')[0]} ${dn.time}`
								},
								{ id: 'serve', title: `Served at ${dn.spot}`, time: 'this week' }
							]}
							done={d === 'collected' ? 3 : 2}
							current={d === 'collected' ? 3 : 2}
						/>
						{#if d === 'confirmed'}<Button variant="primary" size="lg" icon="package-check" onclick={collect}
								>Mark collected</Button
							>{/if}
						{#if receipt}<button type="button" class="receipt-row" onclick={() => (paper = true)}
								><Icon name="receipt" size={20} /><span class="grow"
									><b>{receipt.type} {receipt.no}</b><span class="t-footnote"
										>{fmt.num(receipt.units!)} packs · {fmt.num(receipt.meals!)} meals · shared with {ws.data.workspace
											.short} for its BRSR table</span
									></span
								><span class="receipt-view">View<Icon name="chevron-right" size={16} /></span></button
							>{:else if d === 'collected'}<div
								class="row"
								style="gap: 12px; padding: 12px 14px; border-radius: 14px; background: var(--primary-soft)"
							>
								<Icon name="receipt" size={20} /><span class="grow"
									><b>Collected</b>
									<div class="t-footnote muted">
										{n} packs · {dn.partner.name} issues no receipt in the app
									</div></span
								>
							</div>{/if}
					</Card>{/if}
				<PickupHistory {past} {onopen} />
			{/snippet}
			{#snippet side()}
				<SectionTitle>FSSAI surplus-food checklist</SectionTitle><Card class="paper stack tight" style="padding: 18px"
					>{#each checklist as t (t)}<div class="row top" style="gap: 8px">
							<Icon name="square-check" size={17} style="color: #167a52; margin-top: 1px" /><span class="t-subhead"
								>{t}</span
							>
						</div>{/each}</Card
				>
				<List head="Your intake rules"
					><ListRow title="Days left" value={`${dn.partner.minDays} or more`} /><ListRow
						title="Minimum lot"
						value={`${dn.partner.minUnits} units`}
					/><ListRow title="Logistics" value={dn.partner.pickup} /></List
				>
			{/snippet}
		</Columns>{/if}
	{#if receipt}<Sheet
			bind:open={paper}
			title={receipt.type}
			footer={receipt.pdf && ws.documentUrl ? pdfFooter : undefined}
		>
			<div class="stack snug">
				<Receipt doc={receipt} batch={dn.batch} sku={dn.sku} dist={dn.dist} /><span class="t-footnote muted"
					>The same paper is in {ws.data.workspace.short}'s document pack for {dn.batch.id}.</span
				>
			</div>
		</Sheet>{/if}
	<Sheet bind:open={later} title="Suggest another time" detent="medium"
		>{#snippet footer()}<Button variant="primary" block onclick={suggest}>Send</Button>{/snippet}
		<div class="stack snug">
			{#each slots as t (t)}<label class="list-row" style="grid-template-columns: auto 1fr; cursor: pointer"
					><input type="radio" name="slot" checked={t === slots[0]} /> {t}</label
				>{/each}
		</div>
	</Sheet>
</Screen>
