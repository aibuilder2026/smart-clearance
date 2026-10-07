<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import PoweredBy from '../../../components/PoweredBy.svelte';
	import WorkspaceMark from '../../../components/WorkspaceMark.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { useRoute } from '../../context';
	import { permissionOf } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// the workspace: how Munchly's instance of Smart-Clearance is set up — who signs in and how, its branding, the supply
	// chain it was set up for and its distributors (screens/admin.jsx WorkspaceSettings)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case);
	const app = useApp();
	const router = useRoute();

	const members = $derived(ws.state.users.filter((u) => u.kind !== 'external' && u.status === 'active'));
	const staff = $derived(members.filter((u) => u.kind === 'staff').length);
	const partners = $derived(members.filter((u) => u.kind === 'partner').length);
	const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
	const distributors = $derived(Object.values(ws.data.distributors));
</script>

{#snippet step(icon: IconName, t: string, sub: string)}<div class="wschain-step">
		<span class="icontile"><Icon name={icon} size={17} stroke={2} /></span><b class="t-subhead">{t}</b><span
			class="t-caption subtle">{sub}</span
		>
	</div>{/snippet}
{#snippet on()}<Badge size="sm" tone="green">on</Badge>{/snippet}
{#snippet outside()}<Badge size="sm">outside</Badge>{/snippet}
{#snippet mark()}<WorkspaceMark ws={ws.data.workspace} size={32} />{/snippet}
{#snippet address()}<span class="mono t-footnote">{ws.data.workspace.domain}</span>{/snippet}

{#snippet main()}<SectionTitle sub="Each workspace sets its own; these are {ws.data.workspace.short}'s"
		>How people sign in</SectionTitle
	>
	<List foot="Everyone signs in at the same address with an email or a phone number; the workspace picks the method.">
		{#each ws.data.workspace.signIn as m (m.id)}<ListRow
				icon={(m.icon === 'google' ? 'key-round' : m.icon) as IconName}
				iconTone={m.id === 'google' ? 'blue' : undefined}
				title={m.title}
				sub={`${m.who} · ${m.rule}`}
				value={on}
			/>{/each}
		<ListRow icon="ban" iconTone="gray" title="Marketplace buyers" sub={ws.data.workspace.outside} value={outside} />
	</List>
	<SectionTitle sub="The client's colours stay inside its mark">Branding</SectionTitle>
	<List>
		<ListRow
			leading={mark}
			title="Workspace mark"
			sub="Shown under the Smart-Clearance mark, on the sign-in page and in the workspace sheet"
		/>
		<ListRow title="Name" value={ws.data.workspace.name} />
		<ListRow title="Address" value={address} />
		<ListRow title="Notifications arrive as" value="Smart-Clearance" />
	</List>
	{#if app.bp === 'phone'}<Button variant="secondary" icon="plug" onclick={() => router.go('integrations')}
			>Integrations</Button
		>{/if}{/snippet}

{#snippet side()}<SectionTitle sub="Another manufacturer's workspace is set up for its own chain"
		>Supply chain, as set up for {ws.data.workspace.short}</SectionTitle
	>
	<Card class="wschain-card">
		<div
			class="wschain"
			role="img"
			aria-label={`${ws.data.client.short} sells to ${distributors.length} distributors, who supply ${ws.data.client.kiranas} kiranas and the Blinkit, Zepto and Instamart warehouses in their cities.`}
		>
			{@render step('factory', ws.data.client.short, `${ws.data.client.city} · sells only to distributors`)}
			<Icon name="arrow-right" size={16} class="subtle wschain-arrow" />
			{@render step('warehouse', `${distributors.length} distributors`, 'own the stock they buy')}
			<Icon name="arrow-right" size={16} class="subtle wschain-arrow" />
			<div class="wschain-split">
				{@render step('store', `${ws.data.client.kiranas} kiranas`, "on the salesmen's beats")}{@render step(
					'shopping-bag',
					'Quick-commerce warehouses',
					'Blinkit, Zepto, Instamart; turn short-dated stock away'
				)}
			</div>
		</div>
	</Card>
	<List
		>{#each ws.data.workspace.profile as p (p.id)}{#snippet psub()}<b class="strong" style="color: var(--fg-2)"
					>{cap(p.value)}.</b
				>
				{p.text}{/snippet}<ListRow icon={p.icon} iconTone="gray" title={p.title} sub={psub} />{/each}</List
	>
	<List
		head="Distributors"
		foot="Territories are matched by pincode for the territory guard; a godown may set its own staff-sale cap."
	>
		{#each distributors as d (d.id)}{@const p = permissionOf(ws.state, d.id, ws.data, c)}{#snippet granted()}<Badge
					size="sm"
					tone={p.tone}
					dot={!p.tone}>{p.label}</Badge
				>{/snippet}<ListRow
				icon="warehouse"
				iconTone="gray"
				title={d.name}
				sub={`${d.territory} · pincodes ${d.pins}… · staff sale up to ${d.staffCap || ws.data.rules.staffCap}`}
				value={granted}
			/>{/each}
	</List>{/snippet}

<Screen
	{me}
	title="Workspace"
	sub={`${ws.data.workspace.domain} · set up by Smart-Clearance for ${ws.data.workspace.short}'s supply chain`}
>
	<div class="stack" style="gap: 20px">
		<div class="bezel">
			<div class="card raised row wrap" style="padding: {app.bp === 'phone' ? 18 : 24}px; gap: 18px">
				<WorkspaceMark ws={ws.data.workspace} size={app.bp === 'phone' ? 56 : 72} />
				<div class="stack tight grow" style="gap: 6px; min-width: 0">
					<div class="t-title2">{ws.data.workspace.name}</div>
					<span class="si-url" style="justify-self: start"
						><Icon name="lock" size={12} stroke={2.2} />{ws.data.workspace.domain}</span
					>
					<span class="row tight wrap"
						><Badge size="sm" tone="green" dot>live since {ws.data.workspace.since}</Badge><Badge size="sm"
							>{ws.data.workspace.plan}</Badge
						><Badge size="sm" icon="map-pin">{ws.data.workspace.region}</Badge><Badge size="sm" icon="users"
							>{staff} staff · {partners} partners</Badge
						></span
					>
				</div>
				<PoweredBy />
			</div>
		</div>
		<Columns sideWidth={app.bp === 'desktop' ? 520 : 360} {main} {side} />
		<p class="t-footnote subtle" style="margin: 0; max-width: 72ch">
			Smart-Clearance sets up each manufacturer's workspace for its own supply chain: who owns short-dated stock, which
			exits exist, who approves and how people sign in. Changes to this profile go through Smart-Clearance onboarding;
			the guardrails, users and integrations are {ws.data.workspace.short}'s to run.
		</p>
	</div>
</Screen>
