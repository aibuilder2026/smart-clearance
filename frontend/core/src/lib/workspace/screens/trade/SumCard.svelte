<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Money from '../../../components/Money.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import { useRoute } from '../../context';
	import { fmt } from '../../model';
	import type { PtSums } from '../../types';
	import { shownSum } from './pt';

	// how his figures add up (SC-145, option A; screens/trade.jsx SumCard): the same card on Batches and Orders, what the
	// batches he cleared cost him = what he sold (Orders) + what the client credited him (Batches), the page's own part
	// marked, the other linking to its page, and a bar for the split. On Orders, what has sold from a batch still in a
	// journey joins the sum once it clears
	type Props = { t: PtSums; page: 'batches' | 'orders'; short: string; live?: number; liveN?: number };
	let { t, page, short, live = 0, liveN = 0 }: Props = $props();
	const { go } = useRoute();
	const x = $derived(shownSum(t));
	const one = $derived(t.n === 1);
</script>

{#snippet term(v: number, what: string, sub: string, here: boolean, to: string | null)}{#if to && !here}<button
			type="button"
			class="pt-term link"
			onclick={() => go(to)}
			><Money value={v} size="m" /><span class="pt-term-what">{what}</span><span class="pt-term-sub">{sub}</span><Icon
				name="arrow-right"
				size={14}
				class="pt-term-go"
			/></button
		>{:else}<span class={cx('pt-term', here && 'here')}
			><Money value={v} size="m" /><span class="pt-term-what">{what}</span><span class="pt-term-sub"
				>{here ? 'this page' : sub}</span
			></span
		>{/if}{/snippet}

<Card class="stack" style="gap: 14px">
	<span class="card-title">How your {t.n} cleared {one ? 'batch adds' : 'batches add'} up</span>
	<div class="pt-sum">
		{@render term(
			x.cost,
			one ? 'what it cost you' : 'what they cost you',
			`${fmt.num(t.n)} ${one ? 'batch' : 'batches'} at the dealer price`,
			false,
			null
		)}
		<span class="pt-op" aria-hidden="true">=</span>
		{@render term(x.sold, 'you sold', 'to your kiranas, buyers and staff · on Orders', page === 'orders', 'orders')}
		<span class="pt-op" aria-hidden="true">+</span>
		{@render term(
			x.credit,
			`${short} credited you`,
			`${t.notes} credit ${t.notes === 1 ? 'note' : 'notes'} · on Batches`,
			page === 'batches',
			'batches'
		)}
	</div>
	<span
		class="pt-split"
		role="img"
		aria-label="{fmt.inr(x.sold)} sold and {fmt.inr(x.credit)} credited, of {fmt.inr(x.cost)}"
		><i class="sold" style="width: {(x.sold / (x.cost || 1)) * 100}%"></i><i
			class="credit"
			style="width: {(x.credit / (x.cost || 1)) * 100}%"
		></i></span
	>
	<p class="lg-working">
		So you ended whole on every batch: {fmt.inr(0)} gained or lost. Each batch below shows its own sum, and its Money tab
		every line of it.{page === 'orders' && live
			? ` The ${fmt.inr(live)} sold from ${liveN === 1 ? 'the batch' : 'the batches'} still in a journey joins the sum once ${liveN === 1 ? 'it clears' : 'they clear'}.`
			: ''}
	</p>
</Card>
