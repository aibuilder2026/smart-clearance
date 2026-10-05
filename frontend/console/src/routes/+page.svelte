<script lang="ts">
	import type { Attention, DemoRequest } from '@smart-clearance/api/console';
	import {
		Badge,
		Button,
		Card,
		Columns,
		cx,
		Empty,
		List,
		ListRow,
		Money,
		SectionTitle,
		Tracker,
		TrackerCompact,
		useApp,
		WorkspaceMark,
		type IconName
	} from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { api } from '#lib/api/client.ts';
	import { clientsQuery, overviewQuery, requestsQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import { href } from '#lib/links.ts';
	import { NAV } from '#lib/nav.ts';
	import Screen from '#lib/screens/Screen.svelte';

	// Overview: batches on the move, what is waiting for a person, today's runs, and the demo requests to set up
	const app = useApp();
	const k = useConsole();
	const overview = createQuery(() => overviewQuery());
	const clients = createQuery(() => clientsQuery());
	const requests = createQuery(() => requestsQuery());

	const all = $derived(clients.data ?? []);
	const client = (id: string) => all.find((c) => c.id === id);
	const live = $derived(all.filter((c) => c.status === 'live'));
	const on = $derived(live.reduce((t, c) => t + k.agentsOn(c), 0));
	const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
	const stages = k.config.stages.map((s) => ({ id: s.id, title: s.title, human: s.human }));
	const steps = k.config.stages.map((s) => ({ id: s.id, title: s.title, human: s.human, time: s.time, text: s.who }));

	function run(x: Attention) {
		if (x.action.kind === 'remind') {
			const d = x.action.distributor;
			void k.act(() => api.remindDistributor(x.client, d), `Reminder sent to ${x.title}`);
		} else void goto(href('clients', x.client, x.action.tab));
	}
	// a demo request starts the setup flow, its company, contact and plan filled in
	const setUp = (r: DemoRequest) => goto(`${href('new-client')}?request=${encodeURIComponent(r.id)}`);
</script>

{#snippet main()}
	<SectionTitle sub="Every client's batches, by the stop they have reached">Batches on the move</SectionTitle>
	<div class="stack" style="gap: 12px">
		{#each overview.data?.tracks ?? [] as t (t.batch)}
			{@const c = client(t.client)}
			<Card class="cs-track">
				<div class="row" style="gap: 12px; align-items: flex-start">
					{#if c}<WorkspaceMark ws={c} size={34} />{/if}
					<div class="stack tight grow" style="gap: 2px; min-width: 0">
						<span class="mono t-footnote subtle">{t.batch}</span><b class="t-subhead"
							>{t.product} · {t.distributor}, {t.city}</b
						>{#if t.note}<span class="t-caption subtle">{t.note}</span>{/if}
					</div>
					<div class="cs-track-out">
						{#if t.money}<Money value={t.money} size="s" style="color: var(--primary-text)" /><span
								class="t-caption subtle">recovered</span
							>{:else}<span class="t-footnote">{t.split}</span>{/if}
					</div>
				</div>
				{#if app.bp === 'phone'}<TrackerCompact stages={steps} done={t.done} current={t.current} label={t.batch} />
				{:else}<Tracker {stages} done={t.done} current={t.current} label="{t.batch} stages" />{/if}
			</Card>
		{/each}
	</div>
	<SectionTitle sub="What each client's agents did today">Agent runs today</SectionTitle>
	<List>
		{#each (overview.data?.runs ?? []).slice(0, 9) as r, i (i)}
			{@const a = k.agent(r.agent)}
			{#snippet time()}<span class="mono t-footnote cs-time">{r.at}</span>{/snippet}
			<ListRow
				leading={time}
				icon={a.icon as IconName}
				iconTone={a.gate ? 'amber' : 'soft'}
				title="{a.name} · {client(r.client)?.name ?? r.client}"
				sub={r.text}
			/>
		{/each}
	</List>
{/snippet}
{#snippet side()}
	<SectionTitle sub="Waiting on a person, or on a file">Needs attention</SectionTitle>
	{#if overview.data?.attention.length}
		<List>
			{#each overview.data.attention as x (x.id)}
				{#snippet dot()}<span class={cx('cs-att', x.tone)} aria-hidden="true"></span>{/snippet}
				{#snippet act()}<Button size="sm" variant="secondary" onclick={() => run(x)}>{x.action.label}</Button>{/snippet}
				<ListRow leading={dot} title={x.title} sub="{client(x.client)?.name ?? x.client} · {x.text}" value={act} />
			{/each}
		</List>
	{:else}<Card
			><Empty
				icon="circle-check"
				title="Nothing is waiting"
				body="Every client's partners have given their permissions."
			/></Card
		>{/if}
	<SectionTitle sub="From Book a demo on smartclearance.com">Demo requests</SectionTitle>
	{#if requests.data?.length}
		<List>
			{#each requests.data as r (r.id)}
				{#snippet value()}{#if r.status === 'set up'}<Badge size="sm" tone="green" icon="check">set up</Badge
						>{:else}<Button size="sm" variant="secondary" onclick={() => setUp(r)}>Set up</Button>{/if}{/snippet}
				<ListRow
					icon="mail"
					iconTone="soft"
					title={r.company}
					sub={[r.name, r.email, r.makes, r.plan && `${r.plan} plan`, r.at].filter(Boolean).join(' · ')}
					{value}
				/>
			{/each}
		</List>
	{:else}<Card
			><Empty
				icon="mail"
				title="No requests yet"
				body="When someone books a demo on smartclearance.com, the request lands here, ready to become a client."
			/></Card
		>{/if}
	{#if app.bp === 'phone'}<List head="Platform"
			>{#each NAV.filter((n) => n.phoneHidden) as n (n.id)}<ListRow
					icon={n.icon}
					iconTone="soft"
					title={n.label}
					chevron
					onclick={() => goto(n.href!)}
				/>{/each}</List
		>{/if}
{/snippet}
<Screen title="Overview" sub="{date} · {live.length} client{live.length === 1 ? '' : 's'} live · {on} agents on">
	<Columns sideWidth={380} {main} {side} />
</Screen>
