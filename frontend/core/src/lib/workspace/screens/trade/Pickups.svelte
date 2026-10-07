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
	import { D } from '../../data';
	import { act } from '../../flow';
	import { fmt } from '../../model';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// Meera at Feeding India: the donation agent's request for the Mango Drink, her yes, the pickup and the receipt, beside
	// the FSSAI checklist and her intake rules
	let { me }: { me: User } = $props();
	const app = useApp();
	const { toast } = useNotice();
	const d = $derived(store.state.mango.donation);
	let later = $state(false);
	const n = D.mangoFb;
	const bb = fmt.date(D.batches[1].bestBefore);
	const checklist = [
		'Sealed, undamaged packs',
		`Best before ${bb}, 22 days left`,
		'Ambient storage, away from sunlight',
		'Batch MF-2410-118 on every carton',
		'Donor: Munchly Foods via Lakshmi Agencies'
	];
	const slots = ['Wednesday 10:00', 'Wednesday 16:00', 'Thursday 11:00'];
	const collect = () => {
		act('collect');
		toast({ text: `Receipt issued · ${n} drinks`, tone: 'ok' });
	};
	const suggest = () => {
		later = false;
		toast({ text: 'Sent · the agent will confirm with Lakshmi Agencies' });
	};
</script>

<Screen {me} title="Pickups" sub="Feeding India · Hyderabad">
	{#if !d}<Card style="max-width: 640px"
			><Empty
				img="donation-crate"
				title="No pickup requests"
				body="Brands' donation agents send surplus food here when it fits your intake rules: 15+ days left, 50+ units."
			/></Card
		>{:else}<Columns sideWidth={340}>
			{#snippet main()}
				<div class="bezel">
					<div class="card raised stack" style="padding: 22px; gap: 16px">
						<div class="row tight">
							<Mark size={28} /><span class="t-footnote subtle strong">Donation agent · Munchly Foods · Day 0</span>
						</div>
						<div class="row" style="gap: 16px">
							<Product name="pack-mango" size={app.bp === 'phone' ? 80 : 104} float />
							<div class="stack tight" style="gap: 4px">
								<div class="t-title2">{n} packs of Mango Drink</div>
								<span class="row tight wrap"
									><Badge icon="calendar">22 days left</Badge><Badge icon="map-pin">Begum Bazaar</Badge><Badge
										tone="green"
										icon="clipboard-check">FSSAI checklist</Badge
									></span
								>
							</div>
						</div>
						<p class="t-body" style="margin: 0">
							{n} packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup Tuesday 10 am from Begum Bazaar?
						</p>
						{#if d === 'booked'}<div class="row wrap" style="gap: 10px">
								<Button variant="primary" size="lg" icon="check" onclick={() => act('confirmPickup')}
									>Confirm Tuesday 10:00</Button
								><Button variant="secondary" size="lg" onclick={() => (later = true)}>Suggest another time</Button>
							</div>{:else}<div class="row top" style="gap: 10px; justify-content: flex-end">
								<div
									class="t-subhead"
									style="padding: 9px 12px; border-radius: 16px; border-top-right-radius: 6px; background: var(--primary); color: var(--primary-fg); max-width: 85%"
								>
									Tuesday works. We'll serve them at the Charminar hunger spot this week.
									<div class="t-caption" style="opacity: 0.9">Meera · Day 1</div>
								</div>
								<Avatar person={D.people.meera} size="sm" />
							</div>{/if}
					</div>
				</div>
				{#if d !== 'booked'}<Card class="stack snug"
						><div class="card-head">
							<span class="card-title">Pickup</span><Badge tone="green" icon={d === 'collected' ? 'check' : 'calendar'}
								>{d === 'collected' ? 'collected' : 'Tue 6 Oct · 10:00'}</Badge
							>
						</div>
						<VTracker
							items={[
								{ id: 'req', title: 'Requested by the donation agent', time: 'Day 0' },
								{ id: 'conf', title: 'Confirmed by Meera', time: 'Day 1' },
								{ id: 'col', title: 'Collected from Begum Bazaar', time: d === 'collected' ? 'Day 4' : 'Tue 10:00' },
								{ id: 'serve', title: 'Served at the Charminar hunger spot', time: 'this week' }
							]}
							done={d === 'collected' ? 3 : 2}
							current={d === 'collected' ? 3 : 2}
						/>
						{#if d === 'confirmed'}<Button variant="primary" size="lg" icon="package-check" onclick={collect}
								>Mark collected</Button
							>{/if}
						{#if d === 'collected'}<div
								class="row"
								style="gap: 12px; padding: 12px 14px; border-radius: 14px; background: var(--primary-soft)"
							>
								<Icon name="receipt" size={20} /><span class="grow"
									><b>In-app receipt issued</b>
									<div class="t-footnote muted">{n} drinks served · shared with Munchly for its BRSR table</div></span
								>
							</div>{/if}
					</Card>{/if}
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
					><ListRow title="Days left" value="15 or more" /><ListRow title="Minimum lot" value="50 units" /><ListRow
						title="Logistics"
						value="volunteer pickup in 48 h"
					/></List
				>
			{/snippet}
		</Columns>{/if}
	<Sheet bind:open={later} title="Suggest another time" detent="medium"
		>{#snippet footer()}<Button variant="primary" block onclick={suggest}>Send</Button>{/snippet}
		<div class="stack snug">
			{#each slots as t (t)}<label class="list-row" style="grid-template-columns: auto 1fr; cursor: pointer"
					><input type="radio" name="slot" checked={t.startsWith('Wednesday 10')} /> {t}</label
				>{/each}
		</div>
	</Sheet>
</Screen>
