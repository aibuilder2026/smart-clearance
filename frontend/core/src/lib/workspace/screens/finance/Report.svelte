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
	import { CHIPS, D, INVOICE, PLAN, SHOPS } from '../../data';
	import { csv, download, fmt } from '../../model';
	import { store } from '../../store.svelte';
	import type { Quarter, User } from '../../types';
	import Locked from '../common/Locked.svelte';
	import Screen from '../common/Screen.svelte';
	import Lakh from './Lakh.svelte';

	// S6 Finance & ESG (Vikram, sustainability): one ledger, two readings. The quarter: what was recovered, the tax maths
	// and the BRSR table; this batch: what it posted to the ledger, and the money planned against the money made
	// (screens/finance.jsx Report)
	let { me }: { me: User } = $props();
	const app = useApp();
	const { toast } = useNotice();
	const Q = D.quarter;
	const CH_NAMES = {
		kirana: 'Kirana scheme',
		expiresoon: 'ExpireSoon',
		staff: 'Staff sale',
		foodbank: 'Food bank',
		writeoff: 'Write-off'
	};
	const EVIDENCE = `${INVOICE.no} · ES-24117 · ${SHOPS} kirana order logs · CN/0117`;
	const PERIODS: { id: 'quarter' | 'batch'; label: string }[] = [
		{ id: 'quarter', label: 'Quarter' },
		{ id: 'batch', label: 'This batch' }
	];

	type Row = Quarter['brsr'][number] & { id: string };
	const h = $derived(store.state.hero);
	let view = $state<'quarter' | 'batch'>('quarter');
	const rows: Row[] = Q.brsr.map((r, i) => ({ ...r, id: 'r' + i }));
	const grid = $derived(
		`display: grid; gap: 12px; grid-template-columns: ${app.bp === 'phone' ? 'repeat(2, minmax(0,1fr))' : 'repeat(auto-fit, minmax(150px, 1fr))'}`
	);

	const exportBRSR = () => {
		download(
			'BRSR-P6-waste-Q3-FY27.csv',
			csv([
				['Category', 'Diverted (kg)', 'Resold (kg)', 'Donated (kg)', 'Disposed (kg)', 'Evidence'],
				...Q.brsr.map((r) => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]),
				...(h.posted
					? [['This batch MF-2409-117 (packaged food)', PLAN.kg, PLAN.kg, 0, 0, EVIDENCE.replace(/ · /g, '; ')]]
					: [])
			])
		);
		toast({ text: 'BRSR table exported as CSV', tone: 'ok' });
	};
</script>

{#snippet period()}<Segmented options={PERIODS} bind:value={view} label="Period" />{/snippet}
{#snippet periodAction()}{#if app.bp !== 'phone'}{@render period()}{/if}{/snippet}

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
		><MixBar mix={Q.mix} names={CH_NAMES} /></Card
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
			<Badge size="sm" icon="info">Disposal ₹1.50 a unit, indicative</Badge><Badge size="sm" icon="info"
				>EPR ₹6 a kg, indicative</Badge
			><Badge size="sm" icon="info">CO₂e 2.5 kg per kg, indicative</Badge>
		</div>
	</Card>
	<Card class="row top" style="gap: 14px; background: var(--surface-2)"
		><span class="icontile"><Icon name="quote" size={17} /></span>
		<div>
			<p class="t-body" style="margin: 0">
				5.7 tonnes kept out of landfill this quarter, with invoices behind every kilo. That goes straight into the
				annual report.
			</p>
			<span class="t-footnote subtle">Vikram · sustainability</span>
		</div></Card
	>{/snippet}
{#snippet brsrRight()}<Button variant="primary" size="sm" icon="download" onclick={exportBRSR}>Export BRSR table</Button
	>{/snippet}

<Screen
	{me}
	title="Finance & ESG"
	sub={`${Q.label} · Oct to Dec 2026 · one ledger, two readings`}
	actions={periodAction}
>
	<div class="stack" style="gap: 20px">
		{#if app.bp === 'phone'}{@render period()}{/if}
		{#if view === 'quarter'}
			{#if h.posted}<button
					type="button"
					in:rise={{ y: -6 }}
					class="card row wrap"
					onclick={() => (view = 'batch')}
					style="padding: 12px 16px; gap: 12px; text-align: left; box-shadow: var(--shadow-1), 0 0 0 1.5px color-mix(in oklab, var(--primary) 40%, transparent)"
					><Product name="pack-chips" size={36} /><span class="grow t-subhead"
						><b>MF-2409-117 posted</b> · {fmt.inr(D.actual.net)} recovered · {fmt.kg(PLAN.kg)} out of landfill · BRSR row
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
				<Tile label="CO₂e avoided" icon="cloud" foot="indicative · 2.5 kg a kg"
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
			<SectionTitle sub="Principle 6, waste management · the quarter's 5.7 t, split illustrative" right={brsrRight}
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
								><Product name="pack-chips" size={48} /><span class="stack tight" style="gap: 0"
									><b>MF-2409-117 · Masala Chips 150 g</b><span class="t-footnote subtle"
										>Rakesh Traders, Nagpur · trued up after {fmt.day(D.returnBy)}</span
									></span
								></span
							><Badge tone="green" icon="check">posted to the ledger</Badge>
						</div>
						<div style={grid}>
							<Tile label="Recovered" icon="indian-rupee"
								><Money value={D.actual.net} size="s" roll from={0} style="color: var(--primary-text)" /></Tile
							>
							<Tile label="Better than destroying" icon="scale"
								><Money value={D.actual.swing} size="s" roll from={0} /></Tile
							>
							<Tile label="GST credit kept" icon="badge-check"
								><Money value={PLAN.itcRetained} size="s" roll from={0} /></Tile
							>
							<Tile label="Out of landfill" icon="leaf"
								><span class="num s"><Roll value={PLAN.kg} format={(v) => v.toFixed(1)} /> kg</span></Tile
							>
							<Tile label="CO₂e avoided" icon="cloud" foot="indicative"
								><span class="num s"><Roll value={PLAN.co2} format={(v) => fmt.num(Math.round(v))} /> kg</span></Tile
							>
						</div>
						<div class="stack tight">
							<b class="t-subhead">BRSR line</b><span
								class="mono t-footnote"
								style="padding: 10px 12px; border-radius: 12px; background: var(--fill)"
								>{fmt.kg(PLAN.kg)} diverted from disposal · {fmt.num(PLAN.co2)} kg CO₂e avoided (indicative) · 0 meals (nothing
								donated)</span
							><span class="t-caption subtle">Evidence: {EVIDENCE}</span>
						</div>
					</div>
				</div>{:else}<Locked
					icon="book-open-check"
					agent="Impact agent"
					live={h.phase === 'settled' && !!h.shelf}
					text={h.phase === 'settled'
						? 'Posts the ledger once the return window closes on ' +
							fmt.day(D.returnBy) +
							', and writes the BRSR row with evidence links.'
						: 'Posts this batch to the ledger once the paperwork is done and the return window closes.'}
				/>{/if}
			<SectionTitle sub="Planned on the Route Room; actual after the negotiation">Money reading</SectionTitle>
			<MoneyPanel plan={PLAN} sku={CHIPS} actual={h.award ? D.actual : undefined} compact={app.bp !== 'desktop'} />
			{#if h.award}<Card class="row wrap" style="gap: 14px"
					><span class="icontile violet"><Icon name="trending-down" size={17} /></span>
					<div class="grow">
						<b>{fmt.inr(D.actual.delta)} under plan</b>
						<div class="t-footnote muted">
							The ExpireSoon lot sold at ₹{D.counter.price.toFixed(2)} against ₹15.00 planned: {fmt.inr(
								D.actual.esPlanned
							)} became
							{fmt.inr(D.actual.esActual)}. Kiranas came in as planned; they are final once the return window closes.
						</div>
					</div></Card
				>{/if}
		{/if}
	</div>
</Screen>
