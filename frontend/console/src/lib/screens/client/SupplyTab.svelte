<script lang="ts">
	import { optLabel, type Client, type Distributor, type Sku } from '@smart-clearance/api/console';
	import { createQuery } from '@tanstack/svelte-query';
	import {
		Badge,
		Button,
		Card,
		Columns,
		DataTable,
		Empty,
		fmt,
		Icon,
		List,
		ListRow,
		SectionTitle,
		useApp,
		type Column,
		type IconName
	} from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { clientBatchesQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import MoreMenu from '../MoreMenu.svelte';
	import GateValue from './GateValue.svelte';
	import ProfileSheet from './ProfileSheet.svelte';
	import SkuSheet from './SkuSheet.svelte';

	// a client's supply chain: who it sells through, its profile, its distributors and their permissions, its SKUs
	let { c }: { c: Client } = $props();
	const app = useApp();
	const k = useConsole();
	let edit = $state(false);
	let skuId: string | null = $state(null);
	// the client's open batches with their gates (SC-47): each SKU's count and overrides, and its sheet's list
	const batchesQ = createQuery(() => clientBatchesQuery(c.id));
	const open = $derived(batchesQ.data ?? []);
	const hasOwn = (x: Sku) => x.gates.blinkitDays != null || x.gates.qcomPct != null;
	const gateOf = (x: Sku, key: 'blinkitDays' | 'qcomPct') => x.gates[key] ?? c.gates[key];
	const differ = $derived(c.skus.filter(hasOwn).length);
	const kiranas = $derived(c.distributors.reduce((t, d) => t + d.kiranas, 0));
	const label = (q: 'route' | 'owner' | 'expiry', id: string) => optLabel(k.config.profile, q, id);
	const rows = $derived<[string, IconName, string, string][]>([
		[
			'route',
			'factory',
			'Route to market',
			label('route', c.profile.route) + (c.distributors.length ? `, ${c.distributors.length} distributors` : '')
		],
		['owner', 'warehouse', 'Who owns short-dated stock', label('owner', c.profile.owner)],
		['expiry', 'undo-2', 'Expiry policy', label('expiry', c.profile.expiry)],
		[
			'gates',
			'shield',
			'Quick-commerce gates, by default',
			`New SKUs start at Blinkit ${c.gates.blinkitDays}+ days, Zepto and Instamart ${c.gates.qcomPct}% of life` +
				(differ ? ` · ${differ} of ${c.skus.length} SKUs differ` : '')
		],
		[
			'guard',
			'map',
			'Territory guard',
			c.agents.lister.settings.territoryGuard
				? "Lots hidden from buyers inside the client's territories"
				: 'Off: lots visible everywhere'
		],
		['window', 'calendar-clock', 'Return window', `${c.returnWindowDays} days`]
	]);
	const ask = (d: Distributor) => k.act(() => api.remindDistributor(c.id, d.id), `Reminder sent to ${d.name}`);
</script>

{#snippet step(icon: IconName, t: string, sub: string)}<div class="wschain-step">
		<span class="icontile"><Icon name={icon} size={17} stroke={2} /></span><b class="t-subhead">{t}</b><span
			class="t-caption subtle">{sub}</span
		>
	</div>{/snippet}
{#snippet code(x: Sku)}<span class="mono t-footnote">{x.code}</span>{/snippet}
<!-- the row opens the SKU (a click, or Enter on the focused row); the prototype's name is a button for that -->
{#snippet product(x: Sku)}<span class="cs-cellbtn">{x.name}</span>{/snippet}
{#snippet mrp(x: Sku)}{fmt.inr(x.mrp)}{/snippet}
{#snippet gst(x: Sku)}{fmt.pct(x.gst)}{/snippet}
{#snippet life(x: Sku)}{x.lifeDays} days{/snippet}
{#snippet blinkit(x: Sku)}<GateValue
		value="{gateOf(x, 'blinkitDays')}+ days"
		own={x.gates.blinkitDays != null}
	/>{/snippet}
{#snippet qcom(x: Sku)}<GateValue value="{gateOf(x, 'qcomPct')}% of life" own={x.gates.qcomPct != null} />{/snippet}
{#snippet openCell(x: Sku)}{@const mine = open.filter((b) => b.sku === x.id)}{@const n = mine.filter(
		(b) => b.override
	).length}<span class="stack tight" style="gap: 2px; justify-items: end"
		><span>{mine.length}</span>{#if n}<span class="cs-gsrc ovr">{n} override{n === 1 ? '' : 's'}</span>{/if}</span
	>{/snippet}

<div class="stack" style="gap: 18px">
	<Card class="wschain-card">
		<div
			class="wschain"
			role="img"
			aria-label="{c.name} sells through {c.distributors.length || 'its'} distributors to {kiranas ||
				'the'} kiranas and the quick-commerce warehouses."
		>
			{@render step(
				'factory',
				c.name,
				`${c.city} · ${c.profile.route === 'distributors' ? 'sells only to distributors' : label('route', c.profile.route).toLowerCase()}`
			)}
			<Icon name="arrow-right" size={16} class="subtle wschain-arrow" />
			{@render step(
				'warehouse',
				c.distributors.length ? `${c.distributors.length} distributors` : 'Distributors',
				c.profile.owner === 'distributor' ? 'own the stock they buy' : "hold the manufacturer's stock"
			)}
			<Icon name="arrow-right" size={16} class="subtle wschain-arrow" />
			<div class="wschain-split">
				{@render step('store', kiranas ? `${kiranas} kiranas` : 'Kiranas', "on the salesmen's beats")}{@render step(
					'shopping-bag',
					'Quick-commerce warehouses',
					'Blinkit, Zepto, Instamart; turn short-dated stock away'
				)}
			</div>
		</div>
	</Card>
	{#snippet main()}
		{#snippet editBtn()}<Button size="sm" icon="sliders-horizontal" onclick={() => (edit = true)}>Edit</Button
			>{/snippet}
		<SectionTitle right={editBtn} sub="Set at onboarding; the exits and agents follow from it">Profile</SectionTitle>
		<List>
			{#each rows as [key, icon, t, v] (key)}
				{#snippet value()}<b class="strong" style="color: var(--fg-2)">{v}</b>{/snippet}
				<ListRow {icon} iconTone="soft" title={t} sub={value} />
			{/each}
		</List>
	{/snippet}
	{#snippet side()}
		<SectionTitle sub="Each gives the agents a one-time permission to act in his name">Distributors</SectionTitle>
		{#if c.distributors.length}
			<List>
				{#each c.distributors as d (d.id)}
					{#snippet permission()}<span class="row tight"
							>{#if d.permission === 'given'}<Badge size="sm" tone="green">given</Badge>{:else}<Badge
									size="sm"
									tone="amber">not yet</Badge
								><MoreMenu
									label="Actions for {d.name}"
									width={240}
									items={[{ label: 'Ask for the permission again', icon: 'send', onclick: () => ask(d) }]}
								/>{/if}</span
						>{/snippet}
					<ListRow
						icon="warehouse"
						iconTone="soft"
						title={d.name}
						sub="{d.city} · {d.kiranas} kiranas · staff sale up to {d.staffCap || c.rules.staffCap}"
						value={permission}
					/>
				{/each}
			</List>
		{:else}<Card
				><Empty
					icon="warehouse"
					title="No distributors yet"
					body="They arrive with the first stock export, and each is invited to give the agents its one-time permission."
				/></Card
			>{/if}
	{/snippet}
	<Columns sideWidth={app.bp === 'desktop' ? 560 : 360} {main} {side} />
	<SectionTitle
		sub={c.skus.length
			? "From the latest stock export · each SKU's quick-commerce gates, and its batches' overrides"
			: null}>SKUs</SectionTitle
	>
	{#if !c.skus.length}<Card
			><Empty icon="package" title="No SKUs yet" body="SKUs arrive with the first stock export." /></Card
		>{:else if app.bp === 'phone'}<List
			>{#each c.skus.slice().sort((a, b) => a.name.localeCompare(b.name)) as x (x.id)}
				{@const own = hasOwn(x)}{@const n = open.filter((b) => b.sku === x.id && b.override).length}
				{#snippet sub()}<span class="stack tight" style="gap: 4px"
						><span><span class="mono">{x.code}</span> · {fmt.inr(x.mrp)} · {x.lifeDays} days</span><span
							class="cs-gline"
							class:own
							>Blinkit {gateOf(x, 'blinkitDays')}+ days · Zepto and Instamart {gateOf(x, 'qcomPct')}%{own
								? ''
								: ' · the default'}{#if n}
								· <span class="cs-gsrc ovr">{n} batch override{n === 1 ? '' : 's'}</span>{/if}</span
						></span
					>{/snippet}
				<ListRow title={x.name} chevron onclick={() => (skuId = x.id)} {sub} />
			{/each}</List
		>{:else}<DataTable
			label="{c.name} SKUs"
			rows={c.skus}
			initialSort={['name', 'asc']}
			onrow={(x) => (skuId = x.id)}
			columns={[
				{ key: 'code', label: 'Code', cell: code },
				{ key: 'name', label: 'Product', cell: product },
				{ key: 'brand', label: 'Brand' },
				{ key: 'mrp', label: 'MRP', num: true, cell: mrp },
				{ key: 'gst', label: 'GST', num: true, cell: gst },
				{ key: 'lifeDays', label: 'Shelf life', num: true, cell: life },
				{
					key: 'blinkit',
					label: 'Blinkit takes',
					num: true,
					sortValue: (x) => gateOf(x, 'blinkitDays'),
					cell: blinkit
				},
				{ key: 'qcom', label: 'Zepto, Instamart take', num: true, sortValue: (x) => gateOf(x, 'qcomPct'), cell: qcom },
				{
					key: 'open',
					label: 'Open batches',
					num: true,
					sortValue: (x) => open.filter((b) => b.sku === x.id).length,
					cell: openCell
				}
			] satisfies Column<Sku>[]}
		/>{/if}
	<ProfileSheet bind:open={edit} {c} />
	<SkuSheet
		bind:open={() => !!skuId, (v) => !v && (skuId = null)}
		{c}
		sku={c.skus.find((x) => x.id === skuId)}
		batches={open.filter((b) => b.sku === skuId)}
	/>
</div>
