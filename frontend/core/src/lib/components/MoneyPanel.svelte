<script lang="ts">
	import { cx } from '../cx';
	import { fmt } from '../format';
	import type { Actual, MoneyRules, Plan, Sku } from '../workspace/types';
	import Badge from './Badge.svelte';
	import Money from './Money.svelte';

	// the money panel, set out the way a challan would be: what destroying does to the P&L, what the split recovers and
	// its P&L effect. The book cost of the stock appears once on each side, so the swing does not count it twice.
	// actual: the result after the negotiation, when there is one (the kit's MoneyPanel)
	// sku: the product the plan is for, its cost and MRP; rules: the write-off's disposal and EPR factors
	type Props = {
		plan: Plan;
		sku: Pick<Sku, 'cost' | 'mrp'>;
		rules: Pick<MoneyRules, 'disposalPerUnit' | 'eprPerKg'>;
		actual?: Actual;
		compact?: boolean;
	};
	let { plan, sku, rules, actual, compact }: Props = $props();
	const wo = $derived(plan.writeOff);
	const net = $derived(actual ? actual.net : plan.net);
	const pnl = $derived(actual ? actual.pnl : plan.pnl);
	const swing = $derived(actual ? actual.swing : plan.swing);
	const lineNote = (l: Plan['lines'][number]) =>
		l.packPrice
			? `at ₹${l.price} effective, ${fmt.num(l.charged)} charged at ₹${l.packPrice.toFixed(2)}`
			: `at ₹${l.price}${actual && l.id === 'expiresoon' ? `, sold at ₹${(actual.esActual / l.units).toFixed(2)}` : ''}`;
</script>

{#snippet row(k: string, n: string, v: number, tone: string)}<div class="row between">
		<span><span>{k}</span> <span class="subtle t-caption">{n}</span></span><span class={cx('tnum', tone)}
			>{fmt.inr(v)}</span
		>
	</div>{/snippet}

<div class="stack" style="gap: 12px">
	<div
		style="display: grid; gap: 12px; grid-template-columns: {compact
			? 'minmax(0,1fr)'
			: 'repeat(auto-fit, minmax(280px, 1fr))'}"
	>
		<div class="card pad stack snug">
			<div class="card-head">
				<span class="card-title">If destroyed</span><Badge tone="red" icon="trash-2">write-off</Badge>
			</div>
			<div class="stack tight t-subhead">
				{@render row('Stock at cost', `${fmt.num(plan.units)} × ₹${sku.cost}`, -wo.stock, 'neg')}
				{@render row('GST credit reversed', `s.17(5)(h) · ₹${wo.itcPerUnit.toFixed(2)} a unit`, -wo.itc, 'neg')}
				{@render row(
					'Disposal and transport',
					`${fmt.rate(rules.disposalPerUnit)} a unit, indicative`,
					-wo.disposal,
					'neg'
				)}
				{@render row('EPR and waste liability', `${fmt.kg(wo.kg)} × ₹${rules.eprPerKg}, indicative`, -wo.epr, 'neg')}
				<div class="hairline" style="margin: 4px 0"></div>
				<div class="row between">
					<b>Effect on the P&amp;L</b><Money value={-wo.total} size="s" style="color: var(--red-text)" />
				</div>
			</div>
		</div>
		<div class="card pad stack snug">
			<div class="card-head">
				<span class="card-title">If routed</span><Badge tone="green" icon="route">recommended</Badge>
			</div>
			<div class="stack tight t-subhead">
				{#each plan.lines as l (l.id)}{@render row(
						`${fmt.num(l.units)} → ${l.short}`,
						lineNote(l),
						actual && l.id === 'expiresoon' ? actual.esActual : l.gross,
						'pos'
					)}{/each}
				{@render row('Van delivery and listing fee', '', -plan.costs, 'neg')}
				<div class="row between">
					<b
						>Net recovered <span class="subtle t-caption" style="font-weight: 500"
							>{Math.round((net / (plan.units * sku.mrp)) * 100)}% of MRP</span
						></b
					><Money value={net} size="s" style="color: var(--primary-text)" />
				</div>
				{@render row('Book cost of the stock sold', `${fmt.num(plan.units)} × ₹${sku.cost}`, -plan.bookCost, 'neg')}
				<div class="hairline" style="margin: 4px 0"></div>
				<div class="row between">
					<b>Effect on the P&amp;L</b><span class={cx('tnum strong', pnl < 0 ? 'neg' : 'pos')}>{fmt.signed(pnl)}</span>
				</div>
			</div>
		</div>
	</div>
	<div class="card row wrap" style="padding: 14px 18px; gap: 12px">
		<Money value={swing} size="s" style="color: var(--primary-text)" /><span
			class="grow t-subhead muted"
			style="min-width: 220px"
			><b style="color: var(--fg)">better than destroying it{actual ? ', after the haggle' : ''}:</b>
			{fmt.signed(pnl)} instead of {fmt.inr(-wo.total)}. In cash, the {fmt.inr(net)} recovered plus {fmt.inr(
				plan.cashAvoided
			)} of credit reversal, disposal and EPR never spent.</span
		>
	</div>
</div>
