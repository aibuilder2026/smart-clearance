<script lang="ts">
	import { optLabel, type Client, type Distributor, type Sku } from '@smart-clearance/api/console';
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
	import { useConsole } from '#lib/console.svelte.ts';
	import MoreMenu from '../MoreMenu.svelte';
	import ProfileSheet from './ProfileSheet.svelte';

	// a client's supply chain: who it sells through, its profile, its distributors and their permissions, its SKUs
	let { c }: { c: Client } = $props();
	const app = useApp();
	const k = useConsole();
	let edit = $state(false);
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
			'Quick-commerce gates',
			`Blinkit ${c.gates.blinkitDays}+ days; Zepto and Instamart ${c.gates.qcomPct}% of life`
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
{#snippet product(x: Sku)}<b>{x.name}</b>{/snippet}
{#snippet mrp(x: Sku)}{fmt.inr(x.mrp)}{/snippet}
{#snippet gst(x: Sku)}{fmt.pct(x.gst)}{/snippet}
{#snippet life(x: Sku)}{x.lifeDays} days{/snippet}

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
	<SectionTitle sub={c.skus.length ? 'From the latest stock export' : null}>SKUs</SectionTitle>
	{#if c.skus.length}<DataTable
			label="{c.name} SKUs"
			rows={c.skus}
			initialSort={['name', 'asc']}
			columns={[
				{ key: 'code', label: 'Code', cell: code },
				{ key: 'name', label: 'Product', cell: product },
				{ key: 'brand', label: 'Brand' },
				{ key: 'mrp', label: 'MRP', num: true, cell: mrp },
				{ key: 'gst', label: 'GST', num: true, cell: gst },
				{ key: 'lifeDays', label: 'Shelf life', num: true, cell: life }
			] satisfies Column<Sku>[]}
		/>{:else}<Card><Empty icon="package" title="No SKUs yet" body="SKUs arrive with the first stock export." /></Card
		>{/if}
	<ProfileSheet bind:open={edit} {c} />
</div>
