<script lang="ts">
	import type { ClientTab } from '@smart-clearance/api/console';
	import { Alert, Badge, Button, Card, Empty, Icon, Tabs, useApp, WorkspaceMark } from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { api } from '#lib/api/client.ts';
	import { clientQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import { href, LINKS } from '#lib/links.ts';
	import AuditList from '#lib/screens/AuditList.svelte';
	import AgentsTab from '#lib/screens/client/AgentsTab.svelte';
	import IntegrationsTab from '#lib/screens/client/IntegrationsTab.svelte';
	import JourneyBadge from '#lib/screens/client/JourneyBadge.svelte';
	import JourneyDaySheet from '#lib/screens/client/JourneyDaySheet.svelte';
	import PeopleTab from '#lib/screens/client/PeopleTab.svelte';
	import PlanTab from '#lib/screens/client/PlanTab.svelte';
	import RulesTab from '#lib/screens/client/RulesTab.svelte';
	import SupplyTab from '#lib/screens/client/SupplyTab.svelte';
	import ClientStatus from '#lib/screens/ClientStatus.svelte';
	import Placeholder from '#lib/screens/loading/Placeholder.svelte';
	import RouteBar from '#lib/screens/loading/RouteBar.svelte';
	import { SLOW_MS, TAB_SHAPE } from '#lib/screens/loading/shapes.ts';
	import MoreMenu from '#lib/screens/MoreMenu.svelte';
	import Screen from '#lib/screens/Screen.svelte';

	// one client: its header, and a tab for each part of its workspace, named in the address
	const TABS: { id: ClientTab; label: string }[] = [
		{ id: 'agents', label: 'Agents' },
		{ id: 'supply', label: 'Supply chain' },
		{ id: 'rules', label: 'Channels & rules' },
		{ id: 'people', label: 'People' },
		{ id: 'integrations', label: 'Integrations' },
		{ id: 'plan', label: 'Plan' },
		{ id: 'audit', label: 'Audit' }
	];
	const app = useApp();
	const k = useConsole();
	const id = $derived(page.params.id!);
	const query = createQuery(() => clientQuery(id));
	const c = $derived(query.data);
	const tab = $derived<ClientTab>(TABS.find((t) => t.id === page.params.tab)?.id ?? 'agents');
	const allOff = $derived(c ? k.agentsOn(c) === 0 : false);
	let pause = $state(false);
	let clock = $state(false);

	// another tab is being read (SC-49): the route runs under the tabs at once, the tab's shape after SLOW_MS. The first
	// tab arrives with the page, under the screen's own route
	let run = $state(0);
	let next = $state<ClientTab | null>(null);
	let slow = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	beforeNavigate(({ to }) => {
		if (to?.route.id !== page.route.id || to.params?.id !== id) return;
		const t = TABS.find((x) => x.id === to.params?.tab)?.id ?? 'agents';
		if (t === tab) return;
		next = t;
		run += 1;
		slow = false;
		clearTimeout(timer);
		timer = setTimeout(() => (slow = true), SLOW_MS);
	});
	const settle = () => {
		next = null;
		slow = false;
		clearTimeout(timer);
	};
	afterNavigate(settle);
	$effect(() => {
		if (!navigating.to && next) settle();
	});

	const back = () => goto(href('clients'));
	const show = (t: ClientTab) => goto(href('clients', id, t), { replace: true, reset: false });
	const setAll = (on: boolean) =>
		c &&
		k.act(() => api.setAllAgents(c.id, on), on ? `Agents resumed for ${c.name}` : `Every agent paused for ${c.name}`);
	const goLive = () => c && k.act(() => api.goLive(c.id), `${c.name} is live`);
	const items = $derived(
		c
			? [
					c.id === 'munchly' ? { label: 'Open the workspace', icon: 'external-link' as const, href: LINKS.app } : null,
					c.status !== 'live' ? { label: 'Go live', icon: 'circle-play' as const, onclick: goLive } : null,
					allOff
						? { label: 'Resume every agent', icon: 'play' as const, onclick: () => setAll(true) }
						: { label: 'Pause every agent', icon: 'pause' as const, danger: true, onclick: () => (pause = true) }
				]
			: []
	);
</script>

{#snippet all()}<Button href={href('clients')}>All clients</Button>{/snippet}

{#if query.data === null}
	<Screen title="No such client" back="Clients" onback={back}>
		<Card
			><Empty
				icon="search"
				title="This client isn't set up"
				body="It may have been removed when the prototype's data was reset."
				action={all}
			/></Card
		>
	</Screen>
{:else if c}
	<Screen
		title={c.name}
		sub="{c.domain} · {k.planName(c.plan)}{c.since ? ' since ' + c.since : ''}"
		back="Clients"
		onback={back}
	>
		{#snippet actions()}<MoreMenu label="Actions for {c.name}" width={230} {items} />{/snippet}
		<div class="stack" style="gap: 18px">
			<div class="cs-head">
				<WorkspaceMark ws={c} size={app.bp === 'phone' ? 48 : 60} />
				<div class="stack tight grow" style="gap: 6px; min-width: 0">
					<span class="si-url" style="justify-self: start"><Icon name="lock" size={12} stroke={2.2} />{c.domain}</span>
					<span class="row tight wrap"
						><ClientStatus client={c} /><Badge size="sm">{k.planName(c.plan)}</Badge><Badge size="sm" icon="map-pin"
							>{c.city}{c.region && c.region !== 'India' ? ' · ' + c.region : ''}</Badge
						><Badge size="sm" icon="bot">{k.agentsOn(c)} of {k.workers} agents on</Badge><JourneyBadge
							{c}
							onopen={() => (clock = true)}
						/></span
					>
				</div>
			</div>
			<div class="cs-tabs"><Tabs tabs={TABS} value={tab} onchange={show} /></div>
			<div class="cs-loading">
				{#if run}{#key run}<RouteBar done={!next} />{/key}{/if}
				{#if next && slow}<Placeholder shape={TAB_SHAPE[next]} label="the tab" />
				{:else}{#key tab}<div class="cs-in" data-kind="tab">
							{#if tab === 'agents'}<AgentsTab {c} />
							{:else if tab === 'supply'}<SupplyTab {c} />
							{:else if tab === 'rules'}<RulesTab {c} />
							{:else if tab === 'people'}<PeopleTab {c} />
							{:else if tab === 'integrations'}<IntegrationsTab {c} />
							{:else if tab === 'plan'}<PlanTab {c} onlive={goLive} />
							{:else}<AuditList filter={c.id} />{/if}
						</div>{/key}{/if}
			</div>
		</div>
		<JourneyDaySheet bind:open={clock} {c} />
		<Alert
			bind:open={pause}
			title="Pause every agent for {c.name}?"
			message="Nothing new is detected, priced, listed or sent until you resume. Plans already approved stay where they are."
			actions={[{ label: 'Cancel' }, { label: 'Pause', danger: true, strong: true, onclick: () => setAll(false) }]}
		/>
	</Screen>
{/if}
