<script lang="ts">
	import type { ClientTab } from '@smart-clearance/api/console';
	import { Alert, Badge, Button, Card, Empty, Icon, Tabs, useApp, WorkspaceMark } from '../../index';
	import { createQuery } from '@tanstack/svelte-query';
	import { untrack } from 'svelte';
	import { useConsole } from '../console.svelte';
	import AuditList from './AuditList.svelte';
	import AgentsTab from './client/AgentsTab.svelte';
	import IntegrationsTab from './client/IntegrationsTab.svelte';
	import JourneyBadge from './client/JourneyBadge.svelte';
	import JourneyDaySheet from './client/JourneyDaySheet.svelte';
	import PeopleTab from './client/PeopleTab.svelte';
	import PlanTab from './client/PlanTab.svelte';
	import ResetJourneySheet from './client/ResetJourneySheet.svelte';
	import RulesTab from './client/RulesTab.svelte';
	import SupplyTab from './client/SupplyTab.svelte';
	import ClientStatus from './ClientStatus.svelte';
	import Placeholder from './loading/Placeholder.svelte';
	import RouteBar from './loading/RouteBar.svelte';
	import { SLOW_MS, TAB_SHAPE } from './loading/shapes.ts';
	import MoreMenu from './MoreMenu.svelte';
	import Screen from './Screen.svelte';

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
	const id = $derived(k.route.id!);
	const query = createQuery(() => k.q.client(id));
	// whether the client's journey is live, which offers its reset (SC-79)
	const journey = createQuery(() => k.q.journey(id));
	let reset = $state(false);
	const c = $derived(query.data);
	const tab = $derived<ClientTab>(TABS.find((t) => t.id === k.route.tab)?.id ?? 'agents');
	const allOff = $derived(c ? k.agentsOn(c) === 0 : false);
	let pause = $state(false);
	let clock = $state(false);

	// another tab is being read (SC-49): the route runs under the tabs at once, the tab's shape after SLOW_MS. The first
	// tab arrives with the page, under the screen's own route
	const next = $derived.by((): ClientTab | null => {
		const p = k.pending;
		if (!p || p.screen !== 'clients' || (p.id ?? null) !== id) return null;
		const t = TABS.find((x) => x.id === p.tab)?.id ?? 'agents';
		return t === tab ? null : t;
	});
	let run = $state(0);
	let slow = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const t = next;
		untrack(() => {
			clearTimeout(timer);
			slow = false;
			if (!t) return;
			run += 1;
			timer = setTimeout(() => (slow = true), SLOW_MS);
		});
	});

	const back = () => k.go({ screen: 'clients' });
	const show = (t: ClientTab) => k.go({ screen: 'clients', id, tab: t }, { replace: true, keep: true });
	// each waits on the platform where it was pressed (SC-152): the menu's "…" button, Pause's alert, Plan's Go live
	const setAll = (on: boolean) =>
		c &&
		k.act(() => k.api.setAllAgents(c.id, on), on ? `Agents resumed for ${c.name}` : `Every agent paused for ${c.name}`);
	const goLive = () => c && k.act(() => k.api.goLive(c.id), `${c.name} is live`);
	const items = $derived(
		c
			? [
					c.id === 'munchly'
						? { label: 'Open the workspace', icon: 'external-link' as const, href: k.links.app }
						: null,
					c.status !== 'live'
						? { label: 'Go live', icon: 'circle-play' as const, action: goLive, busy: 'Going live…', done: 'Live' }
						: null,
					allOff
						? {
								label: 'Resume every agent',
								icon: 'play' as const,
								action: () => setAll(true),
								busy: 'Resuming agents…',
								done: 'Agents resumed'
							}
						: {
								label: 'Pause every agent',
								icon: 'pause' as const,
								danger: true,
								onclick: (): void => {
									pause = true;
								}
							},
					journey.data?.live
						? {
								label: 'Reset journey…',
								icon: 'rotate-ccw' as const,
								danger: true,
								onclick: (): void => {
									reset = true;
								}
							}
						: null
				]
			: []
	);
</script>

{#snippet all()}<Button href={k.href({ screen: 'clients' })}>All clients</Button>{/snippet}

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
		<ResetJourneySheet bind:open={reset} {c} />
		<Alert
			bind:open={pause}
			title="Pause every agent for {c.name}?"
			message="Nothing new is detected, priced, listed or sent until you resume. Plans already approved stay where they are."
			actions={[
				{ label: 'Cancel' },
				{ label: 'Pause', busy: 'Pausing…', danger: true, strong: true, onclick: () => setAll(false) }
			]}
		/>
	</Screen>
{/if}
