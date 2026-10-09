<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Money from '../../../components/Money.svelte';
	import MoneyPanel from '../../../components/MoneyPanel.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { LedgerPage } from '../../types';
	import NotPosted from './NotPosted.svelte';
	import OutcomeBadge from './OutcomeBadge.svelte';
	import { possessive } from './ledger';

	// a batch's money (screens/finance.jsx MoneyTab): what each channel took and what it came to, net of the van, the fee
	// and the credit given away; what destroying it would have cost; and Munchly's side, its credit notes and the
	// distributor's invoice. A batch not posted yet shows its plan against the money made so far
	let { page }: { page: LedgerPage } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const c = $derived(page.c);
	const row = $derived(page.row);
	const W = $derived(ws.data.workspace);
	const wo = $derived(c.plan.writeOff);
	const doc = (id: string) => c.docs.find((d) => d.id === id);
	const planned = $derived(c.plan.lines.find((l) => l.id === 'kirana')?.units ?? 0);
	const partner = $derived(c.donation.units > 0 ? c.donation.partner.name : null);
	const subOf = (l: { id: string; units: number; price: number }) =>
		l.id === 'kirana' && l.units < planned
			? `of ${fmt.num(planned)} offered`
			: l.id === 'foodbank'
				? (partner ?? 'the food bank')
				: `at ${fmt.rate(l.price)}`;
	// what the lines took came to the net less the van, the fee and handling, and the credit given away with a donation
	const gross = $derived(row ? row.lines.reduce((t, l) => t + l.gross, 0) : 0);
	const itcLoss = $derived(row ? Math.round(row.figures.donated * wo.itcPerUnit * 100) / 100 : 0);
	const spent = $derived(row ? Math.round((gross - row.figures.net - itcLoss) * 100) / 100 : 0);
</script>

{#snippet line(k: string, v: string, sub?: string, tone?: string, strong?: boolean)}<div
		class={strong ? 'lg-line strong' : 'lg-line'}
	>
		<span
			>{k}{#if sub}<em>{` ${sub}`}</em>{/if}</span
		><span class={tone ? `tnum ${tone}` : 'tnum'}>{v}</span>
	</div>{/snippet}
{#snippet amount(v: string)}<span class="tnum" style="white-space: nowrap">{v}</span>{/snippet}

{#if !row}
	<div class="stack" style="gap: 16px">
		<NotPosted h={page.h} returnBy={c.returnBy} />
		<SectionTitle sub="Planned on the Route Room; actual after the negotiation">Money reading</SectionTitle>
		<MoneyPanel
			plan={c.plan}
			actual={page.h.award ? c.actual : undefined}
			sku={c.sku}
			rules={ws.data.rules}
			compact={app.bp !== 'desktop'}
		/>
	</div>
{:else}
	{@const F = row.figures}
	{@const cn = doc('support')}
	{@const ex = doc('expiry')}
	{@const inv = doc('invoice')}
	{#snippet main()}<div class="stack" style="gap: 16px">
			<Card class="stack snug">
				<div class="card-head">
					<span class="card-title">What happened</span><OutcomeBadge o={row.outcome} size="sm" />
				</div>
				{#each row.lines as l (l.id)}{@render line(
						`${fmt.num(l.units)} → ${l.short}`,
						l.id === 'foodbank' ? 'given' : fmt.inr(l.gross),
						subOf(l)
					)}{/each}
				{@render line('Van, listing fee and handling', fmt.inr(-spent), undefined, 'neg')}
				{#if itcLoss}{@render line(
						'Input credit given away with the donation',
						fmt.inr(-itcLoss),
						's.17(5)(h)',
						'neg'
					)}{/if}
				{@render line('Recovered', fmt.inr(F.net), undefined, undefined, true)}
				{#if F.godown && c.expiry}<div class="lg-note">
						<Icon name="warehouse" size={16} /><span
							>{fmt.num(F.godown)} packs no channel took expired at {c.dist.godown}. They came back to {W.short} for full
							credit ({fmt.inr(F.credit)}) and {W.short} destroyed them: disposal, EPR and {fmt.inr2(c.expiry.itc)} of credit
							reversed.</span
						>
					</div>{/if}
			</Card>
			<Card class="stack snug">
				<div class="card-head">
					<span class="card-title">If it had been destroyed</span><Badge size="sm" tone="red" icon="trash-2"
						>write-off</Badge
					>
				</div>
				{@render line('Stock at cost', fmt.inr(-wo.stock), `${fmt.num(wo.units)} × ₹${c.sku.cost}`, 'neg')}
				{@render line('Input credit reversed', fmt.inr(-wo.itc), `s.17(5)(h) · ₹${wo.itcPerUnit} a pack`, 'neg')}
				{@render line('Disposal and EPR', fmt.inr(-(wo.disposal + wo.epr)), 'indicative', 'neg')}
				{@render line('Effect on the P&L', fmt.inr(-wo.total), undefined, 'neg', true)}
			</Card>
		</div>{/snippet}
	{#snippet side()}<div class="stack" style="gap: 16px">
			<Card class="stack tight" style="gap: 6px"
				><span class="t-footnote subtle">Better than destroying it</span><Money
					value={F.swing}
					size="m"
					style="color: var(--primary-text)"
				/><span class="t-footnote muted">P&L {fmt.inr(F.pnl)} instead of {fmt.inr(-wo.total)}.</span></Card
			>
			<List head="{possessive(W.short)} side">
				{#if cn}{#snippet v1()}{@render amount(fmt.inr(cn.amount))}{/snippet}<ListRow
						icon="hand-coins"
						title="Price support to {c.dist.short}"
						sub={cn.no}
						value={v1}
					/>{/if}
				{#if ex}{#snippet v2()}{@render amount(fmt.inr(ex.amount))}{/snippet}<ListRow
						icon="warehouse"
						title="Expiry credit"
						sub="{ex.no} · {fmt.num(ex.units ?? 0)} packs"
						value={v2}
					/>{/if}
				{#if inv}{#snippet v3()}{@render amount(fmt.inr(inv.total ?? inv.amount))}{/snippet}<ListRow
						icon="receipt"
						title="{possessive(c.dist.short)} invoice to {c.buyer.short || c.buyer.name}"
						sub={inv.no}
						value={v3}
					/>{/if}
			</List>
		</div>{/snippet}
	<Columns sideWidth={380} {main} {side} />
{/if}
