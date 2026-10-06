<script lang="ts">
	import type { Attention, BatchQuery, BatchRow, DemoRequest } from '@smart-clearance/api/console';
	import { RANGES } from '@smart-clearance/api/console';
	import {
		Badge,
		Button,
		Card,
		cx,
		DataTable,
		Empty,
		fmt,
		Icon,
		List,
		ListRow,
		SectionTitle,
		Segmented,
		useApp,
		WorkspaceMark,
		type Column
	} from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '#lib/api/client.ts';
	import { batchesQuery, clientsQuery, dashboardQuery, overviewQuery, requestsQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import { href } from '#lib/links.ts';
	import { NAV } from '#lib/nav.ts';
	import { apiQuery, readPaused, readView, viewSearch, writePaused, type View } from '#lib/overview.ts';
	import Kpi from '#lib/screens/overview/Kpi.svelte';
	import MoneyFig from '#lib/screens/overview/MoneyFig.svelte';
	import Pager from '#lib/screens/overview/Pager.svelte';
	import RecoveredChart from '#lib/screens/overview/RecoveredChart.svelte';
	import StopBars from '#lib/screens/overview/StopBars.svelte';
	import StopSeg from '#lib/screens/overview/StopSeg.svelte';
	import Screen from '#lib/screens/Screen.svelte';

	// Overview, the platform as a live dashboard (SC-48, option A, the command centre): four figures with their lines,
	// recovered by day beside the batches in flight at each stop, every client's batches a page at a time, and what
	// waits on a person. Every figure comes from backend-api (or the mock); the range, filters and page live in the
	// address. The figures are read again every 30 s, with Pause; nothing on the page moves on its own (WCAG 2.2.2)
	const app = useApp();
	const k = useConsole();
	const phone = $derived(app.bp === 'phone');
	let paused = $state(readPaused());
	const view = $derived(readView(page.url));
	const query = $derived(apiQuery(view));
	const dash = createQuery(() => dashboardQuery(view.days, paused));
	const batches = createQuery(() => batchesQuery(query, paused));
	const overview = createQuery(() => overviewQuery());
	const clients = createQuery(() => clientsQuery());
	const requests = createQuery(() => requestsQuery());

	const all = $derived(clients.data ?? []);
	const client = (id: string) => all.find((c) => c.id === id);
	const live = $derived(all.filter((c) => c.status === 'live'));
	const setup = $derived(all.length - live.length);
	const on = $derived(live.reduce((t, c) => t + k.agentsOn(c), 0));
	const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
	const titles = k.config.stages.map((s) => s.title);
	const d = $derived(dash.data);
	const p = $derived(batches.data);
	const change = $derived(
		d && d.recoveredBefore ? Math.round(((d.recovered - d.recoveredBefore) / d.recoveredBefore) * 100) : null
	);
	const best = $derived(d?.byDay.reduce((a, x) => (x.recovered > a.recovered ? x : a), d.byDay[0]));
	let asTable = $state(false);

	// a change to the view lands in the address, without a new history entry or a jump
	function setView(next: View) {
		void goto(viewSearch(next) || page.url.pathname, { replace: true, reset: false });
	}
	const set = (patch: Partial<BatchQuery>) =>
		setView({ ...view, query: { ...view.query, ...patch, ...('page' in patch ? {} : { page: 1 }) } as View['query'] });
	let typing: ReturnType<typeof setTimeout> | undefined;
	let search = $state(readView(page.url).query.q);
	function onSearch(v: string) {
		search = v;
		clearTimeout(typing);
		typing = setTimeout(() => set({ q: v }), 250);
	}
	function togglePause() {
		paused = !paused;
		writePaused(paused);
		if (!paused) void Promise.all([dash.refetch(), batches.refetch()]);
	}
	const sortBy = (key: NonNullable<BatchQuery['sort']>) =>
		set({ sort: key, dir: view.query.sort === key && view.query.dir === 'asc' ? 'desc' : 'asc' });

	function run(x: Attention) {
		if (x.action.kind === 'remind') {
			const dist = x.action.distributor;
			void k.act(() => api.remindDistributor(x.client, dist), `Reminder sent to ${x.title}`);
		} else void goto(href('clients', x.client, x.action.tab));
	}
	// a demo request starts the setup flow, its company, contact and plan filled in
	const setUp = (r: DemoRequest) => goto(`${href('new-client')}?request=${encodeURIComponent(r.id)}`);
	const openBatch = (r: BatchRow) => goto(href('clients', r.client, 'supply'));
	const stopText = (r: BatchRow) =>
		r.closed
			? r.outcome
				? r.outcome[0].toUpperCase() + r.outcome.slice(1)
				: 'Closed'
			: r.stage === 5
				? 'Waiting for a yes'
				: titles[r.stage];
	const lakh = (v: number) => '₹' + (v / 100000).toFixed(1) + ' lakh';
	const q = $derived(view.query);
	const filtered = $derived(!!(q.q || q.client || q.stop != null));
	const tableTitle = $derived(
		q.stop != null && q.status === 'in-flight'
			? `At ${titles[q.stop]}`
			: q.status === 'waiting'
				? 'Waiting for a yes'
				: q.status === 'closed'
					? 'Closed batches'
					: 'Live batches'
	);
	const tableSub = $derived(
		q.stop != null && q.status === 'in-flight'
			? `${p?.total ?? 0} batch${p?.total === 1 ? '' : 'es'} at this stop`
			: q.status === 'closed'
				? 'What each batch recovered, the newest first'
				: "Every client's batches in flight, the ones waiting for a yes first"
	);
</script>

{#snippet header(label: string, key: NonNullable<BatchQuery['sort']>, num = true)}<th
		class={num ? 'n' : undefined}
		aria-sort={q.sort === key ? (q.dir === 'asc' ? 'ascending' : 'descending') : undefined}
		><button type="button" onclick={() => sortBy(key)}
			>{label}{#if q.sort === key}<Icon name={q.dir === 'asc' ? 'chevron-up' : 'chevron-down'} size={13} />{/if}</button
		></th
	>{/snippet}
{#snippet dayLabel(x: { label: string })}{x.label}{/snippet}
{#snippet dayRecovered(x: { recovered: number })}{fmt.inr(x.recovered)}{/snippet}
{#snippet dayUnits(x: { units: number })}{x.units.toLocaleString('en-IN')}{/snippet}

<Screen
	title="Overview"
	sub="{date} · {live.length} client{live.length === 1 ? '' : 's'} live{setup
		? `, ${setup} setting up`
		: ''} · {on} agents on"
>
	<div class="cs-ov">
		<div class="cs-ov-live" role="status">
			<Badge size="sm" tone={paused ? undefined : 'green'} dot>{paused ? 'Paused' : 'Live'}</Badge><span
				>Read at <span class="tnum">{d?.readAt ?? '…'}</span>{paused ? '' : ' · every 30 s'}</span
			><Button size="sm" variant="ghost" icon={paused ? 'play' : 'pause'} aria-pressed={paused} onclick={togglePause}
				>{paused ? 'Resume updates' : 'Pause updates'}</Button
			>
		</div>
		{#if d}
			<div class="cs-ov-kpis">
				{#snippet recFoot()}{#if change == null}nothing in the {d.days} days before{:else}<span
							class={change >= 0 ? 'up' : 'warn'}
							><Icon name={change >= 0 ? 'trending-up' : 'trending-down'} size={14} />{change >= 1000
								? `${Math.round(d.recovered / d.recoveredBefore)}×`
								: `${Math.abs(change)}%`}</span
						>
						on the {d.days} days before{/if}{/snippet}
				<Kpi label="Recovered, {d.days} days" icon="indian-rupee" spark={d.byDay.map((x) => x.recovered)} foot={recFoot}
					><MoneyFig value={d.recovered} /></Kpi
				>
				<Kpi
					label="Batches in flight"
					icon="boxes"
					spark={d.inFlightSeries}
					foot="across {d.inFlightClients} client{d.inFlightClients === 1 ? '' : 's'}">{d.inFlight}</Kpi
				>
				{#snippet waitFoot()}{#if d.oldestWaiting}<span class="warn">oldest {d.oldestWaiting.hours} h</span> · {d
							.oldestWaiting.client}{:else}nothing waiting{/if}{/snippet}
				<Kpi label="Waiting for a yes" icon="hand" tone={d.waiting ? 'amber' : undefined} foot={waitFoot}
					>{d.waiting}</Kpi
				>
				<Kpi label="Agent runs today" icon="bot" spark={d.byDay.map((x) => x.runs)} foot="{on} agents on"
					>{d.runsToday}</Kpi
				>
			</div>
			<div class="cs-ov-two">
				<section class="cs-ov-card">
					<div class="cs-ov-head">
						<div>
							<div class="t">Recovered, by day</div>
							<div class="s">Every client · what closed batches recovered</div>
						</div>
						<Segmented
							label="Range"
							value={String(view.days)}
							onchange={(v) => setView({ ...view, days: Number(v) })}
							options={RANGES.map((n) => ({ id: String(n), label: `${n} days` }))}
						/>
					</div>
					<div class="cs-ov-big"><MoneyFig value={d.recovered} /> <span class="cs-ov-in">in {d.days} days</span></div>
					{#if asTable}<div class="cs-ov-daytable">
							<DataTable
								label="Recovered, by day"
								rows={d.byDay.slice().reverse()}
								rowKey="date"
								dense
								columns={[
									{ key: 'label', label: 'Day', cell: dayLabel },
									{ key: 'recovered', label: 'Recovered', num: true, cell: dayRecovered },
									{ key: 'closed', label: 'Closed', num: true },
									{ key: 'units', label: 'Packs', num: true, cell: dayUnits },
									{ key: 'runs', label: 'Runs', num: true }
								] satisfies Column<(typeof d.byDay)[number]>[]}
							/>
						</div>{:else}<RecoveredChart byDay={d.byDay} height={phone ? 180 : 210} />{/if}
					<div class="cs-ov-foot">
						<span
							>{best && best.recovered
								? `Highest ${fmt.inr(best.recovered)} on ${best.label}`
								: 'Nothing recovered yet in this range'}{d.recoveredBefore
								? ` · ${lakh(d.recoveredBefore)} the ${d.days} days before`
								: ''}</span
						><Button
							size="sm"
							variant="link"
							icon={asTable ? 'chart-line' : 'file-spreadsheet'}
							onclick={() => (asTable = !asTable)}>{asTable ? 'Show as a chart' : 'Show as a table'}</Button
						>
					</div>
				</section>
				<section class="cs-ov-card">
					<div class="cs-ov-head">
						<div>
							<div class="t">In flight, by stop</div>
							<div class="s">{d.inFlight} batch{d.inFlight === 1 ? '' : 'es'} · choose a stop to list them</div>
						</div>
					</div>
					<StopBars
						{titles}
						byStop={d.byStop}
						value={q.status === 'in-flight' ? (q.stop ?? null) : null}
						onpick={(i) => set({ status: 'in-flight', stop: i })}
					/>
					<div class="cs-ov-foot">
						<span class="cs-ov-legend"
							><span><i style="background: var(--primary)"></i>Agents at work</span><span
								><i style="background: var(--amber)"></i>Waiting for a person</span
							></span
						>
					</div>
				</section>
			</div>
		{/if}
		<div class="stack" style="gap: 12px">
			{#snippet everyStop()}{#if q.stop != null && q.status === 'in-flight'}<Button
						size="sm"
						icon="x"
						onclick={() => set({ stop: null })}>Every stop</Button
					>{/if}{/snippet}
			<SectionTitle sub={tableSub} right={everyStop}>{tableTitle}</SectionTitle>
			<div class="cs-ov-filters">
				<label class="cs-ov-search"
					><Icon name="search" size={16} /><span class="sr-only">Find a batch</span><input
						type="search"
						placeholder="Batch, product or distributor"
						value={search}
						oninput={(e) => onSearch(e.currentTarget.value)}
					/></label
				>
				<select
					class="cs-ov-sel"
					aria-label="Client"
					value={q.client ?? ''}
					onchange={(e) => set({ client: e.currentTarget.value || null })}
					><option value="">All clients</option>{#each all as c (c.id)}<option value={c.id}>{c.name}</option
						>{/each}</select
				>
				{#if q.status !== 'closed'}<select
						class="cs-ov-sel"
						aria-label="Stop"
						value={q.stop == null ? '' : String(q.stop)}
						onchange={(e) => set({ stop: e.currentTarget.value === '' ? null : Number(e.currentTarget.value) })}
						><option value="">All stops</option>{#each titles as t, i (t)}<option value={String(i)}>{t}</option
							>{/each}</select
					>{/if}
				<Segmented
					label="Which batches"
					value={q.status}
					onchange={(v) =>
						set({
							status: v,
							stop: v === 'in-flight' ? q.stop : null,
							sort: v === 'closed' ? 'updated' : 'priority',
							dir: v === 'closed' ? 'desc' : 'asc'
						})}
					options={[
						{ id: 'in-flight', label: `In flight ${p?.counts.inFlight ?? 0}` },
						{ id: 'waiting', label: `Waiting for a yes ${p?.counts.waiting ?? 0}` },
						{ id: 'closed', label: `Closed ${p?.counts.closed ?? 0}` }
					]}
				/>
			</div>
			{#if p && !p.rows.length}<Card
					><Empty
						icon="package"
						title={filtered
							? 'No batches match'
							: q.status === 'closed'
								? 'No closed batches yet'
								: 'Nothing in flight'}
						body={filtered ? 'Try another search, client or stop.' : 'Batches show here once the Watcher flags them.'}
					/></Card
				>{:else if p && phone}<div class="cs-ov-tablecard">
					<div class="list cs-ov-rows">
						{#each p.rows as r (r.ref)}
							{@const c = client(r.client)}
							<button type="button" class="list-row" onclick={() => openBatch(r)}
								>{#if c}<WorkspaceMark ws={c} size={28} />{/if}<span class="lr-main"
									><span class="r1"
										><b>{r.product}</b>{#if r.daysLeft != null && !r.closed}<span
												class={cx('t-footnote tnum', r.daysLeft < 20 && 'cs-ov-low')}
												>{r.daysLeft < 0 ? 'expired' : `${r.daysLeft} d`}</span
											>{/if}</span
									><span class="r2"><span class="mono">{r.ref}</span> · {r.distributor}, {r.city}</span
									>{#if !r.closed}<StopSeg stage={r.stage} />{/if}<span class="r2"
										><b class={cx(r.stage === 5 && !r.closed && 'cs-ov-human')}>{stopText(r)}</b> · {fmt.inr(r.value)}
										{r.valueKind === 'mrp' ? 'at MRP' : 'recovered'}</span
									></span
								></button
							>
						{/each}
					</div>
					<Pager
						phone
						page={p.page}
						size={p.size}
						total={p.total}
						onpage={(n) => set({ page: n })}
						onsize={(n) => set({ size: n })}
					/>
				</div>{:else if p}<div class="cs-ov-tablecard">
					<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls, so the keyboard must reach it) -->
					<div class="table-wrap" tabindex="0" role="region" aria-label={tableTitle}>
						<table class="table cs-ov-table">
							<thead
								><tr
									><th>Batch</th><th>Client</th>{@render header('Stop', 'stop', false)}{@render header(
										'Days left',
										'days'
									)}{@render header('Units', 'units')}{@render header(
										q.status === 'closed' ? 'Recovered' : 'Value',
										'value'
									)}{@render header('Updated', 'updated')}</tr
								></thead
							>
							<tbody>
								{#each p.rows as r (r.ref)}
									{@const c = client(r.client)}
									<tr class="clickable" onclick={(e) => !(e.target as HTMLElement).closest('button, a') && openBatch(r)}
										><td
											><span class="cs-ov-bt"
												><button type="button" class="cs-cellbtn" onclick={() => openBatch(r)}>{r.product}</button><span
													class="t-caption subtle"><span class="mono">{r.ref}</span> · {r.distributor}, {r.city}</span
												></span
											></td
										><td
											><span class="cs-ov-who"
												>{#if c}<WorkspaceMark ws={c} size={22} />{/if}{c ? c.name : r.client}</span
											></td
										><td
											><span class="cs-ov-stage"
												>{#if !r.closed}<StopSeg stage={r.stage} />{/if}<span
													class={cx(r.stage === 5 && !r.closed && 'cs-ov-human')}>{stopText(r)}</span
												></span
											></td
										><td class="n"
											>{#if r.daysLeft == null || r.closed}<span class="subtle">—</span>{:else}<span
													class={cx(r.daysLeft < 20 && 'cs-ov-low')}>{r.daysLeft < 0 ? 'expired' : r.daysLeft}</span
												>{/if}</td
										><td class="n">{r.units.toLocaleString('en-IN')}</td><td class="n"
											>{fmt.inr(r.value)}
											<div class="t-caption subtle">{r.valueKind === 'mrp' ? 'at MRP' : 'recovered'}</div></td
										><td class="n mono t-footnote subtle">{r.updated}</td></tr
									>
								{/each}
							</tbody>
						</table>
					</div>
					<Pager
						page={p.page}
						size={p.size}
						total={p.total}
						onpage={(n) => set({ page: n })}
						onsize={(n) => set({ size: n })}
					/>
				</div>{/if}
		</div>
		<div class="cs-ov-three">
			<div class="stack" style="gap: 12px">
				<SectionTitle sub="Waiting on a person, or on a file">Needs attention</SectionTitle>
				{#if overview.data?.attention.length}
					<List>
						{#each overview.data.attention as x (x.id)}
							{#snippet dot()}<span class={cx('cs-att', x.tone)} aria-hidden="true"></span>{/snippet}
							{#snippet act()}<Button size="sm" variant="secondary" onclick={() => run(x)}>{x.action.label}</Button
								>{/snippet}
							<ListRow
								leading={dot}
								title={x.title}
								sub="{client(x.client)?.name ?? x.client} · {x.text}"
								value={act}
							/>
						{/each}
					</List>
				{:else}<Card
						><Empty
							icon="circle-check"
							title="Nothing is waiting"
							body="Every client's partners have given their permissions."
						/></Card
					>{/if}
			</div>
			<div class="stack" style="gap: 12px">
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
			</div>
			<div class="stack" style="gap: 12px">
				<SectionTitle sub="The latest, as they land">Agent runs today</SectionTitle>
				{#if overview.data?.runs.length}
					<List>
						{#each overview.data.runs.slice(0, 5) as r, i (i)}
							{@const a = k.agent(r.agent)}
							{#snippet time()}<span class="mono t-footnote cs-time">{r.at}</span>{/snippet}
							<ListRow leading={time} title="{a.name} · {client(r.client)?.name ?? r.client}" sub={r.text} />
						{/each}
					</List>
				{:else}<Card
						><Empty icon="bot" title="No runs yet today" body="Each client's agents run on their own schedule." /></Card
					>{/if}
			</div>
		</div>
		{#if phone}<List head="Platform"
				>{#each NAV.filter((n) => n.phoneHidden) as n (n.id)}<ListRow
						icon={n.icon}
						iconTone="soft"
						title={n.label}
						chevron
						onclick={() => goto(n.href!)}
					/>{/each}</List
			>{/if}
	</div>
</Screen>
