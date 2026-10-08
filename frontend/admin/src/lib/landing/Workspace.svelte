<script lang="ts">
	import {
		Badge,
		Icon,
		Money,
		PhoneFrame,
		Product,
		WindowFrame,
		WorkspaceMark,
		cx,
		fmt,
		prefersReducedMotion,
		useApp
	} from '@smart-clearance/core';
	import { fly } from 'svelte/transition';
	import { ease, motionMs } from '@smart-clearance/core';
	import type { Figures, Team } from './figures';

	let { f }: { f: Figures } = $props();
	const app = useApp();

	// 6 · a workspace per manufacturer (SC-78): the workspace itself on a browser window (a phone on phones), its
	// address typed in as the section comes into view, and the four teams as its navigation, each showing what it sees
	// of the same batch. The tabs play through once, 2.4 s each, and the rail takes over on a click. No client is
	// named: the workspace is "Your brand"
	const YOURS = { id: 'yours', name: 'Your brand', mark: { from: '#2fbf7f', to: '#0d5a3e', ink: '#ffffff' } };
	const HOST = 'your-brand';
	// Svelte 5 trims the space at the start of an element's text, so these carry theirs in a string
	const LIVE = ' · live';
	const SOON = ' · soon';
	const phone = $derived(app.mounted && app.w < 768);
	const reduce = $derived(app.mounted && prefersReducedMotion.current);

	let stage: HTMLDivElement | undefined = $state();
	let seen = $state(false);
	let typed = $state(HOST.length);
	let tab = $state(0);
	let auto = $state(true);
	let ps = $state(1);
	// the stage comes into view once; the phone frame scales to the stage's width
	$effect(() => {
		const el = stage;
		if (!el) return;
		if (prefersReducedMotion.current || el.getBoundingClientRect().top < innerHeight) seen = true;
		else {
			typed = 0;
			const io = new IntersectionObserver(
				(es) => {
					if (!es.some((e) => e.isIntersecting)) return;
					seen = true;
					io.disconnect();
				},
				{ threshold: 0.4 }
			);
			io.observe(el);
			return () => io.disconnect();
		}
	});
	$effect(() => {
		const el = stage;
		if (!el) return;
		const measure = () => (ps = Math.min(1, Math.max(0.5, (el.clientWidth - 32) / 414)));
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});
	// the address types in once the stage is seen; then the tabs play through once, unless the reader takes the rail
	$effect(() => {
		if (reduce || !seen || typed >= HOST.length) return;
		const t = setTimeout(() => (typed += 1), typed === 0 ? 400 : 70);
		return () => clearTimeout(t);
	});
	$effect(() => {
		if (reduce || !auto || !seen || typed < HOST.length || tab >= f.teams.length - 1) return;
		const t = setTimeout(() => (tab += 1), 2400);
		return () => clearTimeout(t);
	});
	const pick = (i: number) => {
		auto = false;
		tab = i;
	};
	const host = $derived(HOST.slice(0, typed));
	const team: Team = $derived(f.teams[tab]);
	const url = $derived(`https://${host || '·'}.smartclearance.com/${team.route}`);
	const h = $derived(f.how);
	const ledger = $derived(f.ledger.slice(0, 4));
</script>

{#snippet rail()}
	<div class="wsd-rail" role="tablist" aria-label="Teams">
		<span class="who"><WorkspaceMark ws={YOURS} size={28} /><span>Your brand</span></span>
		{#each f.teams as t, i (t.id)}<button type="button" role="tab" aria-selected={i === tab} onclick={() => pick(i)}
				><Icon name={t.icon} size={18} />{t.t}</button
			>{/each}
	</div>
{/snippet}

{#snippet screen(id: Team['id'])}
	{#if id === 'supply'}
		<div class="m-card yes" role="group" aria-label="The plan, waiting for one yes">
			<div class="m-head"><b>Approve the plan</b><Badge tone="amber" dot>Waiting for you</Badge></div>
			<div class="m-big flush">
				<Money value={h.plan.net} /><span>recovered, against {fmt.inr(-h.plan.bin)} to destroy it</span>
			</div>
			{#each h.plan.lines as l (l.id)}<div class="m-row">
					<span class="k"><i class="ex-dot {l.id}" aria-hidden="true"></i>{l.label}</span><span class="v"
						>{fmt.inr(l.net)}</span
					>
				</div>{/each}
			<div class="m-go">
				<span class="btn btn-approve btn-lg"><Icon name="check" size={18} />Approve · release the agents</span>
			</div>
			<div class="m-after">
				{#each h.plan.released as w (w)}<span class="chip-agent on"><i aria-hidden="true"></i>{w}</span>{/each}
			</div>
		</div>
	{:else if id === 'finance'}
		<div class="m-card" role="group" aria-label="Paperwork: the documents, drafted">
			<div class="m-head">
				<span class="chip-agent on"><i aria-hidden="true"></i>Paperwork</span><Badge>drafted</Badge>
			</div>
			<div class="m-batch">
				<Product name="documents" size={52} /><span
					><b>Everything finance needs, drafted</b><span>each on paper, with who keeps what</span></span
				>
			</div>
			<div class="m-row">
				<span class="k">The distributor's invoice to the buyer</span><span class="v">IGST 5%</span>
			</div>
			<div class="m-row">
				<span class="k">The brand's price-support credit note</span><span class="v">{fmt.inr(h.work.support)}</span>
			</div>
			<div class="m-row">
				<span class="k">GST input credit memo</span><span class="v">{fmt.inr(h.work.itcRetained)}</span>
			</div>
		</div>
	{:else if id === 'impact'}
		<div class="m-card" role="group" aria-label="Impact's ledger for the batch">
			<div class="m-head">
				<span class="chip-agent on"><i aria-hidden="true"></i>Impact</span><Badge>BRSR Principle 6</Badge>
			</div>
			{#each ledger as l (l.k)}<div class="m-row">
					<span class="k">{l.k}</span><span class="v"
						>{#if l.kind === 'money'}<Money value={l.v} />{:else}<span class="num">{fmt.num(l.v)} kg</span>{/if}</span
					>
				</div>{/each}
		</div>
	{:else}
		<div class="m-card" role="group" aria-label="The distributor's permission">
			<div class="m-head"><b>The distributor's permission</b><Badge tone="green" icon="check">given once</Badge></div>
			<div class="m-batch">
				<span class="wsd-avatar" aria-hidden="true"><Icon name="handshake" size={22} /></span><span
					><b>Asked on the distributor's own phone, once</b><span
						>nothing is listed or offered in their name before it</span
					></span
				>
			</div>
			{#each [['List short-dated stock on ExpireSoon in our name', 'allowed'], ["Send kirana offers from our godown's stock", 'allowed'], ['Share our stock export every morning', 'allowed'], ['Sell below the reserve', 'never']] as [k, v] (k)}<div
					class="m-row"
				>
					<span class="k">{k}</span><span class={cx('v', v === 'never' && 'red')}>{v}</span>
				</div>{/each}
		</div>
	{/if}
{/snippet}

{#snippet main()}
	<div class="wsd-main" role="tabpanel">
		<div class="wsd-title">
			<h3>{team.t}</h3>
			<p>{team.d}</p>
		</div>
		{#key team.id}
			<div class="wsd-body" in:fly={{ y: 10, duration: motionMs(280), easing: ease }}>
				{@render screen(team.id)}
				{#if !phone}
					<aside class="wsd-side" aria-label="Today, for this team">
						<b>Today</b>
						{#each team.today as [at, a] (at + a)}{@const ag = f.agents[a]}<span class="wsd-line"
								><i aria-hidden="true"><Icon name={ag.icon} size={12} stroke={2.4} /></i><span
									><b>{ag.name}</b> · {ag.did}</span
								><span class="at">{at}</span></span
							>{/each}
					</aside>
				{/if}
			</div>
		{/key}
	</div>
{/snippet}

<section id="teams" class="sec sec-ws" aria-labelledby="ws-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="ws-h" class="sec-h plain">Your own workspace, set up for your supply chain.</h2>
			<p class="sec-sub">Each manufacturer gets its own address, configured for how its stock really moves.</p>
		</header>
	</div>
	<div class="wsd-stage" bind:this={stage}>
		<div class="wsd-ground" aria-hidden="true"></div>
		{#if phone}
			<div class="wsd-phone" style="height: {868 * ps}px">
				<div class="wsd-phone-in" style="transform: scale({ps})">
					<PhoneFrame time="09:41">
						<div class="wsd phone">
							<div class="wsd-addr"><Icon name="lock" size={11} stroke={2.2} />{host || '·'}.smartclearance.com</div>
							{@render rail()}
							{@render main()}
						</div>
					</PhoneFrame>
				</div>
			</div>
		{:else}
			<WindowFrame {url} style="width: 100%">
				<div class="wsd">
					{@render rail()}
					{@render main()}
				</div>
			</WindowFrame>
		{/if}
	</div>
	<div class="wrap">
		<ul class="isl-urls below" aria-label="Workspace addresses">
			{#each f.addresses as a (a.id)}<li class={cx('isl-url', a.live && 'live')}>
					<i aria-hidden="true"></i>{a.url}{#if a.live}<span class="isl-live">{LIVE}</span>{/if}
				</li>{/each}
		</ul>
		<ul class="teams" aria-label="What each team gets">
			{#each f.teams as t (t.id)}<li class="team">
					<Icon name={t.icon} size={26} /><b>{t.t}</b>
					<p>{t.d}</p>
				</li>{/each}
		</ul>
		<div class="conn">
			<ul class="conn-list" aria-label="Works with">
				{#each f.connectors as c (c.id)}<li>
						{c.name}{#if c.status === 'soon'}<span class="soon">{SOON}</span>{/if}
					</li>{/each}
			</ul>
		</div>
	</div>
</section>
