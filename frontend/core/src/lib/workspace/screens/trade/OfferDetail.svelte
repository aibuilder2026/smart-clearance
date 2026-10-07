<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Money from '../../../components/Money.svelte';
	import Stepper from '../../../components/Stepper.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { rise } from '../../../motion/transitions';
	import { useRoute } from '../../context';
	import { CHIPS, D } from '../../data';
	import { A } from '../../flow';
	import { fmt } from '../../model';
	import { kOf, offerMath } from '../../legacy';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import OfferCard from './OfferCard.svelte';

	// the scheme in full: how many packets in twelves, what he pays, the free ones, his margin at MRP; then one tap orders
	let { me }: { me: User } = $props();
	const { go } = useRoute();
	const h = $derived(store.state.hero);
	const k = $derived(kOf(me));
	let n = $state(untrack(() => kOf(me).units));
	let busy = $state(false);
	const m = $derived(offerMath(n));
	const mine = $derived(h.orders.find((o) => o.id === k.id));
	const order = () => {
		busy = true;
		setTimeout(() => {
			busy = false;
			store.update((st) => {
				A.order(st, k.id);
				const o = st.hero.orders.find((x) => x.id === k.id);
				if (o) o.units = n;
			});
		}, 650);
	};
	const lines = $derived<[string, string, string][]>([
		['You pay', `${m.paid} × ₹${m.pack.toFixed(2)}`, fmt.inr(m.pay)],
		['Free packets', '2 with every 10', `${m.free}`],
		['You sell at MRP', `${n} × ₹${CHIPS.mrp}`, fmt.inr(m.sell)]
	]);
</script>

<Screen {me} title="Masala Chips 150 g" sub="Rakesh Traders · scheme for 48 hours" back="Offers">
	<div class="stack" style="gap: 16px; max-width: 620px">
		{#if h.offer}<OfferCard compact shop={k.name} />{:else}<Card
				><Empty img="kirana" title="No offer right now" body="This offer has not been sent to your shop yet." /></Card
			>{/if}
		{#if h.offer}{#if mine}<div
					class="card stack"
					style="padding: 22px; justify-items: center; text-align: center"
					in:rise|global={{ y: 0, scale: 0.98 }}
				>
					<span class="icontile" style="width: 56px; height: 56px; border-radius: 18px"
						><Icon name="check" size={28} stroke={2.4} /></span
					>
					<div class="t-title2 hi" lang="hi">ऑर्डर हो गया</div>
					<span class="muted">{mine.units} packets on Tuesday's van · pay on delivery</span>
					<Money value={offerMath(mine.units).margin} size="m" style="color: var(--primary-text)" /><span
						class="t-footnote subtle">your margin at MRP on this order</span
					>
					<Button variant="secondary" onclick={() => go('home')}>Done</Button>
				</div>{:else}<Card class="stack" style="gap: 16px">
					<div class="row between">
						<div class="stack tight" style="gap: 0">
							<b>How many packets?</b><span class="t-footnote subtle">In twelves · your share is up to {k.units}</span>
						</div>
						<Stepper bind:value={n} min={12} max={k.units} step={12} label="Packets" />
					</div>
					<div class="stack tight">
						{#each lines as [t, sub, v] (t)}<div class="row between t-subhead">
								<span>{t} <span class="subtle t-footnote">{sub}</span></span><span class="tnum strong">{v}</span>
							</div>{/each}
					</div>
					<div class="row between" style="padding: 12px 14px; border-radius: 14px; background: var(--primary-soft)">
						<span class="stack tight" style="gap: 0"
							><b>Margin today</b><span class="t-footnote muted"
								>₹{(m.pay / n).toFixed(2)} a packet in effect, sold at ₹{CHIPS.mrp}</span
							></span
						><Money value={m.margin} size="s" roll style="color: var(--primary-text)" />
					</div>
					<Button variant="primary" size="xl" block loading={busy} onclick={order}
						><span class="hi" lang="hi">ऑर्डर करें</span> · {n} packets</Button
					>
					<span class="t-caption subtle" style="text-align: center"
						>Best before 18 Nov 2026 · 47 days on every packet · unsold packs go back to the salesman until {fmt.day(
							D.returnBy
						)}</span
					>
				</Card>{/if}{/if}
	</div>
</Screen>
