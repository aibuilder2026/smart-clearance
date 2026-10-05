<script lang="ts">
	import type { Client } from '@smart-clearance/api/console';
	import {
		Button,
		Card,
		DataTable,
		fmt,
		Product,
		SearchField,
		useApp,
		WorkspaceMark,
		type Column
	} from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { clientsQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import { href } from '#lib/links.ts';
	import ClientStatus from '#lib/screens/ClientStatus.svelte';
	import Screen from '#lib/screens/Screen.svelte';

	// Clients: every manufacturer's workspace, as a table on tablets and desktops and a list on phones
	const app = useApp();
	const k = useConsole();
	const clients = createQuery(() => clientsQuery());
	let q = $state('');
	const all = $derived(clients.data ?? []);
	const rows = $derived(
		all.filter((c) => !q || `${c.name} ${c.domain} ${c.city}`.toLowerCase().includes(q.toLowerCase()))
	);
	const open = (c: Client) => goto(href('clients', c.id, 'agents'));
</script>

{#snippet name(c: Client)}<span class="row tight"
		><WorkspaceMark ws={c} size={30} /><span class="stack tight" style="gap: 0"
			><b>{c.name}</b><span class="t-caption subtle">{c.city}</span></span
		></span
	>{/snippet}
{#snippet domain(c: Client)}<span class="mono t-footnote">{c.domain}</span>{/snippet}
{#snippet plan(c: Client)}{k.planName(c.plan)}{/snippet}
{#snippet status(c: Client)}<ClientStatus client={c} />{/snippet}
{#snippet distributors(c: Client)}{c.distributors.length}{/snippet}
{#snippet skus(c: Client)}{c.skus.length}{/snippet}
{#snippet agents(c: Client)}{k.agentsOn(c)} of {k.workers} on{/snippet}
{#snippet recovered(c: Client)}{c.recovered ? fmt.inr(c.recovered) : 'none yet'}{/snippet}

<Screen title="Clients" sub="Every manufacturer's workspace on Smart-Clearance">
	{#snippet actions()}{#if app.bp !== 'phone'}<Button variant="primary" size="sm" icon="plus" href={href('new-client')}
				>New client</Button
			>{/if}{/snippet}
	<div class="stack" style="gap: 16px">
		<div class="row wrap" style="gap: 10px">
			<div class="grow" style="min-width: 220px">
				<SearchField bind:value={q} placeholder="Search clients, addresses, people" />
			</div>
			{#if app.bp === 'phone'}<Button variant="primary" icon="plus" href={href('new-client')}>New client</Button>{/if}
		</div>
		{#if app.bp === 'phone'}
			<div class="list">
				{#each rows as c (c.id)}<a
						class="list-row"
						style="grid-template-columns: 40px minmax(0,1fr) auto; width: 100%; text-align: left"
						href={href('clients', c.id, 'agents')}
						><WorkspaceMark ws={c} size={36} /><span class="stack tight" style="gap: 0; min-width: 0"
							><b class="t-subhead">{c.name}</b><span class="t-caption subtle mono" style="overflow-wrap: anywhere"
								>{c.domain}</span
							></span
						><ClientStatus client={c} /></a
					>{/each}
			</div>
		{:else}
			<DataTable
				label="Clients"
				{rows}
				onrow={open}
				initialSort={['name', 'asc']}
				columns={[
					{ key: 'name', label: 'Client', cell: name },
					{ key: 'domain', label: 'Workspace', cell: domain },
					{ key: 'plan', label: 'Plan', sortValue: (c) => k.planName(c.plan), cell: plan },
					{ key: 'status', label: 'Status', cell: status },
					{
						key: 'distributors',
						label: 'Distributors',
						num: true,
						sortValue: (c) => c.distributors.length,
						cell: distributors
					},
					{ key: 'skus', label: 'SKUs', num: true, sortValue: (c) => c.skus.length, cell: skus },
					{ key: 'agents', label: 'Agents', sortValue: k.agentsOn, cell: agents },
					{ key: 'recovered', label: 'Recovered', num: true, cell: recovered }
				] satisfies Column<Client>[]}
			/>
		{/if}
		{#if clients.data && all.length < 3}<Card class="cs-next">
				<Product name="sprout-box" size={app.bp === 'phone' ? 96 : 132} />
				<div class="stack tight" style="gap: 8px">
					<b class="t-title3"
						>{all.length === 1
							? `Only ${all[0].name.split(' ')[0]} is set up so far.`
							: 'Set up the next manufacturer.'}</b
					>
					<p class="t-subhead muted" style="margin: 0; max-width: 52ch">
						Each client starts from its supply-chain profile: route to market, who owns the stock, its expiry policy and
						the exits it allows. The agents and their limits follow from it.
					</p>
					<div><Button variant="primary" icon="plus" href={href('new-client')}>New client</Button></div>
				</div>
			</Card>{/if}
	</div>
</Screen>
