<script lang="ts">
	import {
		agentDefaults,
		exitsFor,
		optLabel,
		setupErrors,
		slug as slugOf,
		type ExitId,
		type PresetId,
		type Profile,
		type ProfileQuestion
	} from '@smart-clearance/api/console';
	import {
		Badge,
		Button,
		Card,
		Check,
		cx,
		Field,
		Icon,
		Input,
		List,
		ListRow,
		Progress,
		SectionTitle,
		Segmented,
		Select,
		Switch,
		useApp,
		WorkspaceMark,
		type IconName
	} from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '#lib/api/client.ts';
	import { clientsQuery, requestsQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import { href } from '#lib/links.ts';
	import Choice from '#lib/screens/Choice.svelte';
	import PlanScope from '#lib/screens/PlanScope.svelte';
	import ProfileSummary from '#lib/screens/ProfileSummary.svelte';
	import Screen from '#lib/screens/Screen.svelte';

	// a new client, step by step: its company, its workspace, its supply chain and the exits that follow, how far its
	// agents go at first, its admin, and a review with the plan. A demo request can start it (?request=…): its company,
	// contact and plan come along
	const COLOURS: [string, string][] = [
		['#2563eb', 'Blue'],
		['#7c3aed', 'Violet'],
		['#db2777', 'Pink'],
		['#0891b2', 'Teal'],
		['#b45309', 'Brown']
	];
	const STEPS = ['Company', 'Workspace', 'Supply chain', 'Exits', 'Agents', 'People', 'Review'];
	const INDUSTRIES = ['Snacks and drinks', 'Personal care', 'Dairy', 'Staples', 'Home care'];

	const app = useApp();
	const k = useConsole();
	const clients = createQuery(() => clientsQuery());
	const requests = createQuery(() => requestsQuery());
	const questions = Object.keys(k.config.profile) as ProfileQuestion[];
	const plans = k.catalog.plans.map((p) => ({ id: p.id, label: p.name }));
	const presets = k.config.presets.map((p) => ({ id: p.id, label: p.label }));

	type Form = Profile & {
		name: string;
		city: string;
		industry: string;
		colour: string;
		slug: string;
		slugTouched: boolean;
		emailDomain: string;
		signGoogle: boolean;
		signPhone: boolean;
		exitOff: Partial<Record<ExitId, boolean>>;
		preset: PresetId;
		adminName: string;
		adminEmail: string;
		plan: string;
		request: string | null;
	};
	const fromRequest = untrack(() => {
		const r = requests.data?.find((x) => x.id === page.url.searchParams.get('request') && x.status === 'new');
		if (!r) return {};
		return {
			name: r.company,
			industry: INDUSTRIES.includes(r.makes) ? r.makes : INDUSTRIES[0],
			emailDomain: (r.email.split('@')[1] || '').toLowerCase(),
			adminName: r.name,
			adminEmail: r.email,
			plan: (k.catalog.plans.find((p) => p.name === r.plan) ?? k.catalog.plans[0]).id,
			request: r.id
		};
	});
	let f: Form = $state({
		name: '',
		city: '',
		industry: INDUSTRIES[0],
		colour: COLOURS[0][0],
		slug: '',
		slugTouched: false,
		emailDomain: '',
		signGoogle: true,
		signPhone: true,
		route: 'distributors',
		owner: 'distributor',
		expiry: 'full-credit',
		exitOff: {},
		preset: 'standard',
		adminName: '',
		adminEmail: '',
		plan: 'pilot',
		request: null,
		...fromRequest
	});
	let step = $state(0);
	let tried = $state(false);
	let busy = $state(false);

	const slug = $derived(f.slugTouched ? f.slug : slugOf(f.name));
	const profile = $derived<Profile>({ route: f.route, owner: f.owner, expiry: f.expiry });
	const exits = $derived.by(() => {
		const ex = exitsFor(profile, k.config.defaults.staffCap);
		for (const key of Object.keys(f.exitOff) as ExitId[])
			if (ex[key] && !ex[key].locked && f.exitOff[key]) ex[key].on = false;
		return ex;
	});
	const errs = $derived(setupErrors({ ...f, slug, exits }, (s) => (clients.data ?? []).some((c) => c.id === s)));
	const preview = $derived({
		id: slug || 'new',
		name: f.name || '?',
		mark: { from: f.colour, to: f.colour, ink: '#ffffff' }
	});
	const autonomy = $derived(agentDefaults(f.preset, k.catalog.agents, k.config.defaults));
	const label = (q: ProfileQuestion) => optLabel(k.config.profile, q, f[q]);
	const set = (patch: Partial<Form>) => (f = { ...f, ...patch });

	// each step starts at the top of the page
	async function to(n: number) {
		step = n;
		await tick();
		document.getElementById('main')?.scrollTo(0, 0);
	}
	function next() {
		if (errs[step]) return void (tried = true);
		tried = false;
		void to(Math.min(STEPS.length - 1, step + 1));
	}
	function back() {
		tried = false;
		void to(Math.max(0, step - 1));
	}
	async function create() {
		busy = true;
		const client = await k.act(
			() =>
				api.createClient({
					name: f.name,
					city: f.city,
					industry: f.industry,
					colour: f.colour,
					slug,
					emailDomain: f.emailDomain,
					signGoogle: f.signGoogle,
					signPhone: f.signPhone,
					profile,
					exits,
					preset: f.preset,
					adminName: f.adminName,
					adminEmail: f.adminEmail,
					plan: f.plan,
					request: f.request
				}),
			(c) => `${c.name}'s workspace is set up`
		);
		busy = false;
		if (client) await goto(href('clients', client.id, 'agents'), { replace: true });
	}
</script>

{#snippet mark(size: number)}<WorkspaceMark ws={preview} {size} />{/snippet}
{#snippet address()}<span class="mono t-footnote">{slug}.smartclearance.com</span>{/snippet}

<Screen
	title="New client"
	sub="Step {step + 1} of {STEPS.length} · {STEPS[step]}"
	back="Clients"
	onback={() => goto(href('clients'))}
>
	<div class="cs-wizard">
		{#if app.bp !== 'phone'}<ol class="cs-steps" aria-label="Steps">
				{#each STEPS as t, i (t)}<li
						class={cx(i < step && 'done', i === step && 'now')}
						aria-current={i === step ? 'step' : undefined}
					>
						<span class="cs-sn" aria-hidden="true"
							>{#if i < step}<Icon name="check" size={13} stroke={2.8} />{:else}{i + 1}{/if}</span
						>{#if i < step}<button type="button" class="btn-link" onclick={() => to(i)}>{t}</button>{:else}<span
								>{t}</span
							>{/if}
					</li>{/each}
			</ol>{:else}<Progress value={(step + 1) / STEPS.length} label="Step {step + 1} of {STEPS.length}" />{/if}
		<section class="cs-step" aria-labelledby="cs-step-h">
			<h2 id="cs-step-h" class="t-title3">{STEPS[step]}</h2>
			{#if step === 0}
				<div class="stack cs-form" style="gap: 14px">
					<Field label="Company name" htmlFor="nc-name"
						><Input id="nc-name" bind:value={f.name} placeholder="Kesari Foods" /></Field
					>
					<Field label="Home city" htmlFor="nc-city"
						><Input id="nc-city" bind:value={f.city} placeholder="Indore" /></Field
					>
					<Field label="What it makes" htmlFor="nc-ind"
						><Select id="nc-ind" bind:value={f.industry}
							>{#each INDUSTRIES as x (x)}<option>{x}</option>{/each}</Select
						></Field
					>
					<fieldset class="cs-choice">
						<legend>Workspace mark</legend>
						<div class="row wrap" style="gap: 14px">
							{@render mark(52)}
							<div class="cs-swatches">
								{#each COLOURS as [hex, name] (hex)}<label
										class={cx('cs-swatch', f.colour === hex && 'on')}
										style="--sw: {hex}"
										><input
											type="radio"
											name="nc-colour"
											checked={f.colour === hex}
											onchange={() => set({ colour: hex })}
										/><span class="sr-only">{name}</span></label
									>{/each}
							</div>
						</div>
						<span class="t-footnote subtle"
							>The client's colour stays inside its mark; the workspace keeps Smart-Clearance's theming.</span
						>
					</fieldset>
				</div>
			{:else if step === 1}
				<div class="stack cs-form" style="gap: 14px">
					<Field label="Workspace address" htmlFor="nc-slug" help="Where its people sign in"
						><span class="cs-slug"
							><Input
								id="nc-slug"
								value={slug}
								oninput={(e) => {
									const v = e.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
									e.currentTarget.value = v;
									set({ slug: v, slugTouched: true });
								}}
								spellcheck={false}
							/><span class="mono t-footnote subtle">.smartclearance.com</span></span
						></Field
					>
					<Field
						label="Staff email domain"
						htmlFor="nc-domain"
						help="Only addresses at this domain can sign in as staff"
						><Input
							id="nc-domain"
							bind:value={f.emailDomain}
							spellcheck={false}
							autocapitalize="none"
							placeholder="kesari.in"
						/></Field
					>
					<fieldset class="cs-choice">
						<legend>How people sign in</legend>
						<div class="stack tight" style="gap: 8px">
							<Check bind:checked={f.signGoogle}>Google Workspace, for staff</Check><Check bind:checked={f.signPhone}
								>Mobile number and a one-time code, for invited distributors and kiranas</Check
							>
						</div>
					</fieldset>
				</div>
			{:else if step === 2}
				<div class="cs-two">
					<div class="stack" style="gap: 18px">
						{#each questions as q (q)}<Choice
								name="nc-{q}"
								label={k.config.profile[q].label}
								options={k.config.profile[q].options}
								value={f[q]}
								onchange={(v) => set({ [q]: v, exitOff: {} })}
							/>{/each}
					</div>
					<ProfileSummary {profile} />
				</div>
			{:else if step === 3}
				<div class="stack cs-form" style="gap: 14px">
					<List foot="The bin is always priced as the baseline, so every plan shows what it saves.">
						{#each k.config.exits as e (e.id)}
							{#snippet toggle()}<Switch
									checked={!!exits[e.id].on}
									disabled={!!exits[e.id].locked}
									onchange={(v) => set({ exitOff: { ...f.exitOff, [e.id]: !v } })}
									label={e.name}
								/>{/snippet}
							<ListRow
								icon={e.icon as IconName}
								iconTone="soft"
								title={e.name}
								sub={exits[e.id].locked || undefined}
								value={toggle}
							/>
						{/each}
					</List>
				</div>
			{:else if step === 4}
				<div class="cs-two">
					<Choice
						name="nc-preset"
						label="How far the agents go at first"
						options={presets}
						value={f.preset}
						onchange={(v) => set({ preset: v })}
					/>
					<Card class="cs-summary"
						><b class="t-subhead">{k.config.presets.find((p) => p.id === f.preset)?.text}</b>
						<ul>
							{#each k.catalog.agents as a (a.id)}
								{@const auto = autonomy[a.id].autonomy}
								<li>
									<Icon name={a.icon as IconName} size={16} stroke={2} /><span>{a.name}</span><span class="grow"
									></span>{#if a.gate}<Badge size="sm" tone="amber" icon="lock">Always on</Badge>{:else}<Badge
											size="sm"
											tone={auto === 'act' ? 'green' : undefined}>{k.level(auto).label}</Badge
										>{/if}
								</li>
							{/each}
						</ul>
						<span class="t-footnote subtle">Each agent can be changed later, one at a time.</span></Card
					>
				</div>
			{:else if step === 5}
				<div class="stack cs-form" style="gap: 14px">
					<Field label="Workspace admin's name" htmlFor="nc-admin"
						><Input id="nc-admin" bind:value={f.adminName} placeholder="Full name" /></Field
					>
					<Field
						label="Admin's work email"
						htmlFor="nc-admin-email"
						help="Must be an @{f.emailDomain || 'company'} address; the invitation goes there"
						><Input
							id="nc-admin-email"
							type="email"
							bind:value={f.adminEmail}
							spellcheck={false}
							autocapitalize="none"
							placeholder="name@{f.emailDomain || 'company.in'}"
						/></Field
					>
					<p class="t-footnote subtle" style="margin: 0">
						The admin invites the rest of the team and the distributors, and approves plans until they name an approver.
					</p>
				</div>
			{:else}
				{#snippet lead()}{@render mark(32)}{/snippet}
				<div class="cs-two">
					<List head="Summary">
						<ListRow leading={lead} title={f.name} sub="{f.city} · {f.industry}" />
						<ListRow title="Address" value={address} />
						<ListRow
							title="Staff sign in with"
							sub={[f.signGoogle && `Google (${f.emailDomain})`, f.signPhone && 'a one-time code, by invitation']
								.filter(Boolean)
								.join('; ')}
						/>
						<ListRow
							title="Supply chain"
							sub="{label('route')} · {label('owner')} owns the stock · {label('expiry')}"
						/>
						<ListRow
							title="Exits"
							sub={k.config.exits
								.filter((e) => exits[e.id].on)
								.map((e) => e.name)
								.join(', ')}
						/>
						<ListRow
							title="Agents"
							sub="{k.config.presets.find((p) => p.id === f.preset)?.label}; the approval is always on"
						/>
						<ListRow title="Admin" sub="{f.adminName} · {f.adminEmail}" />
					</List>
					<div class="stack" style="gap: 12px">
						<SectionTitle sub="Prices on request">Plan</SectionTitle><Segmented
							label="Plan"
							options={plans}
							value={f.plan}
							onchange={(v) => set({ plan: v })}
						/><PlanScope scope={(k.catalog.plans.find((p) => p.id === f.plan) ?? k.catalog.plans[0]).scope} />
					</div>
				</div>
			{/if}
			{#if tried && errs[step]}<p class="cs-err" role="alert">{errs[step]}</p>{/if}
			<div class="row" style="gap: 10px; justify-content: flex-end; padding-top: 6px">
				{#if step > 0}<Button onclick={back}>Back</Button>{/if}{#if step < STEPS.length - 1}<Button
						variant="primary"
						iconRight="arrow-right"
						onclick={next}>Continue</Button
					>{:else}<Button variant="primary" icon="check" loading={busy} onclick={create}>Create workspace</Button>{/if}
			</div>
		</section>
	</div>
</Screen>
