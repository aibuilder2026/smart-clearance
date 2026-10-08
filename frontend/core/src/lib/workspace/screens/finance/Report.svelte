<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import DataTable, { type Column } from '../../../components/DataTable.svelte';
	import MixBar from '../../../components/MixBar.svelte';
	import Money from '../../../components/Money.svelte';
	import MoneyPanel from '../../../components/MoneyPanel.svelte';
	import Product from '../../../components/Product.svelte';
	import Roll from '../../../components/Roll.svelte';
	import Segmented from '../../../components/Segmented.svelte';
	import Tile from '../../../components/Tile.svelte';
	import TrendChart from '../../../components/TrendChart.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { rise } from '../../../motion/transitions';
	import { useNotice } from '../../../notice.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { castOf, csv, download, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Quarter, User } from '../../types';
	import Locked from '../common/Locked.svelte';
	import Screen from '../common/Screen.svelte';
	import Lakh from './Lakh.svelte';

	// S6 Finance & ESG (Vikram, sustainability): one ledger, two readings. The quarter: what was recovered, the tax maths
	// and the BRSR table; this batch: what it posted to the ledger, and the money planned against the money made
	// (screens/finance.jsx Report)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const app = useApp();
	const { toast } = useNotice();
	const Q = $derived(ws.data.quarter);
	const R = $derived(ws.data.rules);
	// the evidence behind the batch's BRSR row: the invoice, the listing, the shops' orders and the credit note
	const EVIDENCE = $derived(
		`${c.invoice.no} · ${c.listing.id} · ${c.kiranas.length} kirana order logs · ${c.docs.find((d) => d.id === 'support')!.no}`
	);
	// what the batch gave to food banks and the meals that made, for its BRSR line and row (SC-106): a batch that
	// donated nothing says so, as the chips do
	const MEALS = $derived(
		c.plan.donated > 0
			? `${fmt.num(c.plan.meals)} meals (${fmt.num(c.plan.donated)} packs donated)`
			: '0 meals (nothing donated)'
	);
	const donatedKg = $derived(Math.round(c.plan.donated * c.sku.kgPerUnit * 100) / 100);
	const tonnes = $derived((Q.kg / 1000).toFixed(1));
	const PERIODS: { id: 'quarter' | 'batch'; label: string }[] = [
		{ id: 'quarter', label: 'Quarter' },
		{ id: 'batch', label: 'This batch' }
	];

	type Row = Quarter['brsr'][number] & { id: string };
	const h = $derived(ws.state.hero);
	let view = $state<'quarter' | 'batch'>('quarter');
	const rows: Row[] = $derived(Q.brsr.map((r, i) => ({ ...r, id: 'r' + i })));
	const grid = $derived(
		`display: grid; gap: 12px; grid-template-columns: ${app.bp === 'phone' ? 'repeat(2, minmax(0,1fr))' : 'repeat(auto-fit, minmax(150px, 1fr))'}`
	);

	const exportBRSR = () => {
		download(
			`BRSR-P6-waste-${Q.label.replace(' ', '-')}.csv`,
			csv([
				['Category', 'Diverted (kg)', 'Resold (kg)', 'Donated (kg)', 'Disposed (kg)', 'Evidence'],
				...Q.brsr.map((r) => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]),
				...(h.posted
					? [
							[
								`This batch ${c.batch.id} (packaged food)`,
								c.plan.kg,
								Math.round((c.plan.kg - donatedKg) * 100) / 100,
								donatedKg,
								0,
								EVIDENCE.replace(/ · /g, '; ')
							]
						]
					: [])
			])
		);
		toast({ text: 'BRSR table exported as CSV', tone: 'ok' });
	};
</script>

{#snippet period()}<Segmented options={PERIODS} bind:value={view} label="Period" />{/snippet}
{#snippet periodAction()}{#if app.bp !== 'phone' && ws.case}{@render period()}{/if}{/snippet}

{#snippet cat(r: Row)}<span class="strong">{r.cat}</span>{/snippet}
{#snippet diverted(r: Row)}{fmt.num(r.diverted)}{/snippet}
{#snippet resold(r: Row)}{fmt.num(r.resold)}{/snippet}
{#snippet donated(r: Row)}{fmt.num(r.donated)}{/snippet}
{#snippet disposed(r: Row)}{fmt.num(r.disposed)}{/snippet}
{#snippet evidence(r: Row)}<span class="t-footnote muted">{r.evidence}</span>{/snippet}

{#snippet quarterMain()}<SectionTitle sub="Illustrative weekly split of the quarter"
		>Recovered against the would-be write-off</SectionTitle
	><Card><TrendChart weeks={Q.weeks} height={app.bp === 'phone' ? 190 : 240} /></Card>
	<SectionTitle sub="Share of units by where they went · illustrative">Channel mix</SectionTitle><Card
		><MixBar mix={Q.mix} names={Q.mixNames} /></Card
	>{/snippet}
{#snippet quarterSide()}<SectionTitle>How the tax maths works</SectionTitle><Card class="stack snug t-subhead">
		<p style="margin: 0">
			<b>Destroying stock costs more than the stock.</b> You lose it at cost, reverse the GST input credit under Section 17(5)(h),
			pay to dispose of it, and owe EPR on the product and pack.
		</p>
		<p style="margin: 0">
			<b>Selling it under a tax invoice keeps the credit.</b> That is why every routed batch protects its ITC, even at half
			the MRP.
		</p>
		<p style="margin: 0">
			<b>Donations reverse it.</b> Section 17(5)(h) blocks credit on gifts, and since 1 October 2023 section 17(5)(fa) blocks
			it on CSR donations too, so a food-bank route costs the credit on every pack.
		</p>
		<div class="row tight wrap">
			<Badge size="sm" icon="info">Disposal {fmt.rate(R.disposalPerUnit)} a unit, indicative</Badge><Badge
				size="sm"
				icon="info">EPR ₹{R.eprPerKg} a kg, indicative</Badge
			><Badge size="sm" icon="info">CO₂e {R.co2PerKg} kg per kg, indicative</Badge>
		</div>
	</Card>
	<Card class="row top" style="gap: 14px; background: var(--surface-2)"
		><span class="icontile"><Icon name="quote" size={17} /></span>
		<div>
			<p class="t-body" style="margin: 0">
				{tonnes} tonnes kept out of landfill this quarter, with invoices behind every kilo. That goes straight into the annual
				report.
			</p>
			<span class="t-footnote subtle">{castOf(ws.state, c).sustainability.short} · sustainability</span>
		</div></Card
	>{/snippet}
{#snippet brsrRight()}<Button variant="primary" size="sm" icon="download" onclick={exportBRSR}>Export BRSR table</Button
	>{/snippet}

<Screen {me} title="Finance & ESG" sub={`${Q.label} · ${Q.period} · one ledger, two readings`} actions={periodAction}>
	<div class="stack" style="gap: 20px">
		{#if app.bp === 'phone' && ws.case}{@render period()}{/if}
		{#if view === 'quarter' || !ws.case}
			{#if h.posted}<button
					type="button"
					in:rise={{ y: -6 }}
					class="card row wrap"
					onclick={() => (view = 'batch')}
					style="padding: 12px 16px; gap: 12px; text-align: left; box-shadow: var(--shadow-1), 0 0 0 1.5px color-mix(in oklab, var(--primary) 40%, transparent)"
					><Product name={c.sku.img} size={36} /><span class="grow t-subhead"
						><b>{c.batch.id} posted</b> · {fmt.inr(c.actual.net)} recovered · {fmt.kg(c.plan.kg)} out of landfill · BRSR row
						added</span
					><Badge tone="green" icon="check">ledger</Badge></button
				>{/if}
			<div style={grid}>
				<Tile label="Recovered" icon="indian-rupee"
					><Lakh value={Q.recovered} style="color: var(--primary-text)" /></Tile
				>
				<Tile label="GST credit protected" icon="badge-check"><Money value={Q.itc} size="s" roll /></Tile>
				<Tile label="Kept out of landfill" icon="leaf"
					><span class="num s"><Roll value={Q.kg / 1000} format={(v) => v.toFixed(1)} /> t</span></Tile
				>
				<Tile label="CO₂e avoided" icon="cloud" foot="indicative · {R.co2PerKg} kg a kg"
					><span class="num s"><Roll value={Q.co2 / 1000} format={(v) => v.toFixed(2)} /> t</span></Tile
				>
				<Tile label="Meals served" icon="heart-handshake"
					><span class="num s"><Roll value={Q.meals} format={(v) => fmt.num(Math.round(v))} /></span></Tile
				>
			</div>
			<p class="t-footnote subtle" style="margin: -8px 0 0">
				A synthetic quarter: the totals are the walkthrough's; the weekly split, the channel mix and the BRSR split
				below are illustrative. Week 1 is this batch.
			</p>
			<Columns sideWidth={380} main={quarterMain} side={quarterSide} />
			<SectionTitle sub="Principle 6, waste management · the quarter's {tonnes} t, split illustrative" right={brsrRight}
				>BRSR Core</SectionTitle
			>
			<DataTable
				label="BRSR waste table"
				{rows}
				columns={[
					{ key: 'cat', label: 'Category', cell: cat },
					{ key: 'diverted', label: 'Diverted, kg', num: true, cell: diverted },
					{ key: 'resold', label: 'Resold', num: true, cell: resold },
					{ key: 'donated', label: 'Donated', num: true, cell: donated },
					{ key: 'disposed', label: 'Disposed', num: true, cell: disposed },
					{ key: 'evidence', label: 'Evidence', sortable: false, cell: evidence }
				] satisfies Column<Row>[]}
			/>
		{:else}
			{#if h.posted}<div in:rise={{ y: 8 }} class="bezel">
					<div class="card raised stack" style="padding: {app.bp === 'phone' ? 18 : 26}px; gap: 16px">
						<div class="row between wrap" style="gap: 8px">
							<span class="row tight"
								><Product name={c.sku.img} size={48} /><span class="stack tight" style="gap: 0"
									><b>{c.batch.id} · {c.sku.name}</b><span class="t-footnote subtle"
										>{c.dist.name}, {c.dist.city} · trued up after {fmt.day(c.returnBy)}</span
									></span
								></span
							><Badge tone="green" icon="check">posted to the ledger</Badge>
						</div>
						<div style={grid}>
							<Tile label="Recovered" icon="indian-rupee"
								><Money value={c.actual.net} size="s" roll from={0} style="color: var(--primary-text)" /></Tile
							>
							<Tile label="Better than destroying" icon="scale"
								><Money value={c.actual.swing} size="s" roll from={0} /></Tile
							>
							<Tile label="GST credit kept" icon="badge-check"
								><Money value={c.plan.itcRetained} size="s" roll from={0} /></Tile
							>
							<Tile label="Out of landfill" icon="leaf"
								><span class="num s"><Roll value={c.plan.kg} format={(v) => v.toFixed(1)} /> kg</span></Tile
							>
							<Tile label="CO₂e avoided" icon="cloud" foot="indicative"
								><span class="num s"><Roll value={c.plan.co2} format={(v) => fmt.num(Math.round(v))} /> kg</span></Tile
							>
						</div>
						<div class="stack tight">
							<b class="t-subhead">BRSR line</b><span
								class="mono t-footnote"
								style="padding: 10px 12px; border-radius: 12px; background: var(--fill)"
								>{fmt.kg(c.plan.kg)} diverted from disposal · {fmt.num(c.plan.co2)} kg CO₂e avoided (indicative) · {MEALS}</span
							><span class="t-caption subtle">Evidence: {EVIDENCE}</span>
						</div>
					</div>
				</div>{:else}<Locked
					icon="book-open-check"
					agent="Impact agent"
					live={h.phase === 'settled' && h.van.status === 'done'}
					text={h.phase === 'settled'
						? 'Posts the ledger once the return window closes on ' +
							fmt.day(c.returnBy) +
							', and writes the BRSR row with evidence links.'
						: 'Posts this batch to the ledger once the paperwork is done and the return window closes.'}
				/>{/if}
			<SectionTitle sub="Planned on the Route Room; actual after the negotiation">Money reading</SectionTitle>
			<MoneyPanel
				plan={c.plan}
				sku={c.sku}
				rules={ws.data.rules}
				actual={h.award ? c.actual : undefined}
				compact={app.bp !== 'desktop'}
			/>
			{#if h.award}<Card class="row wrap" style="gap: 14px"
					><span class="icontile violet"><Icon name="trending-down" size={17} /></span>
					<div class="grow">
						<b>{fmt.inr(c.actual.delta)} under plan</b>
						<div class="t-footnote muted">
							The ExpireSoon lot sold at ₹{c.counter.price.toFixed(2)} against {fmt.rate(c.lines.expiresoon.price)} planned:
							{fmt.inr(c.actual.esPlanned)} became
							{fmt.inr(c.actual.esActual)}. Kiranas came in as planned; they are final once the return window closes.
						</div>
					</div></Card
				>{/if}
		{/if}
	</div>
</Screen>
