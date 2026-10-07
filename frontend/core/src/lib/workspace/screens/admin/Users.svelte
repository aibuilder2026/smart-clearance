<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Avatar from '../../../components/Avatar.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import DataTable, { type Column } from '../../../components/DataTable.svelte';
	import Field from '../../../components/Field.svelte';
	import Input from '../../../components/Input.svelte';
	import SearchField from '../../../components/SearchField.svelte';
	import Select from '../../../components/Select.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { useNotice } from '../../../notice.svelte';
	import { kinds, providerOf, STATUS_TONE } from '../../model';
	import { useWorkspace } from '../../source';
	import type { RoleId, User, UserStatus } from '../../types';
	import Screen from '../common/Screen.svelte';
	import RowMenu from './RowMenu.svelte';

	// users: the people and partner organisations in the workspace, how each signs in and their status; invite someone,
	// change a role, deactivate or reactivate (screens/admin.jsx Users)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const { toast } = useNotice();

	let q = $state('');
	let invite = $state(false);
	let roleFor = $state<User | null>(null);
	let form = $state<{ name: string; contact: string; role: RoleId }>({ name: '', contact: '', role: 'retailer' });
	const members = $derived(ws.state.users.filter((u) => u.kind !== 'external'));
	const rows = $derived(
		members.filter(
			(u) =>
				!q ||
				(u.name + ' ' + (u.org || '') + ' ' + (ws.data.roles[u.role] || '')).toLowerCase().includes(q.toLowerCase())
		)
	);
	const counts = $derived(
		(Object.keys(STATUS_TONE) as UserStatus[]).map((k) => [k, members.filter((u) => u.status === k).length] as const)
	);
	const choices = $derived((Object.entries(ws.data.roles) as [RoleId, string][]).filter(([k]) => k !== 'buyer'));

	const setStatus = (u: User, status: UserStatus) => {
		void ws.setUserStatus(u.id, status);
		toast({ text: `${u.short || u.name} ${status === 'deactivated' ? 'deactivated' : 'reactivated'}`, tone: 'ok' });
	};
	const send = () => {
		const f = { ...form };
		void ws.invite(f);
		invite = false;
		form = { name: '', contact: '', role: 'retailer' };
		toast({ text: `Invite sent to ${f.contact}`, tone: 'ok' });
	};
	const setRole = (u: User, k: RoleId) => {
		void ws.setUserRole(u.id, k);
		toast({ text: 'Role updated', tone: 'ok' });
		roleFor = null;
	};
	const signInIcon = (u: User): IconName =>
		u.provider === 'google' ? 'google' : u.provider === 'phone' ? 'smartphone' : 'hourglass';
</script>

{#snippet menu(u: User)}<RowMenu {u} {me} onrole={() => (roleFor = u)} onstatus={setStatus} />{/snippet}
{#snippet inviteAction()}{#if app.bp !== 'phone'}<Button
			variant="primary"
			size="sm"
			icon="user-plus"
			onclick={() => (invite = true)}>Invite</Button
		>{/if}{/snippet}

{#snippet person(u: User)}<span class="row tight"
		><Avatar person={u} size="sm" /><span class="stack tight" style="gap: 0"
			><b>{u.name}</b><span class="t-caption subtle">{u.extra ? u.phone || u.email : u.org}</span></span
		></span
	>{/snippet}
{#snippet role(u: User)}{ws.data.roles[u.role]}{/snippet}
{#snippet kind(u: User)}<span class="t-footnote"
		>{kinds(ws.data.workspace)[u.kind]}{#if u.invitedBy}<span class="subtle">{` · by ${u.invitedBy}`}</span>{/if}</span
	>{/snippet}
{#snippet provider(u: User)}<span class="row tight"><Icon name={signInIcon(u)} size={15} />{providerOf(u)}</span
	>{/snippet}
{#snippet status(u: User)}<Badge size="sm" tone={STATUS_TONE[u.status]} dot>{u.status}</Badge>{/snippet}
{#snippet act(u: User)}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (the span keeps a click on the menu from reaching the row; its button takes the keyboard) -->
	<span style="position: relative; display: inline-block" onclick={(e) => e.stopPropagation()}>{@render menu(u)}</span>
{/snippet}

{#snippet sendInvite()}<Button variant="primary" block icon="send" disabled={!form.name || !form.contact} onclick={send}
		>Send invite</Button
	>{/snippet}

<Screen
	{me}
	title="Users"
	sub={`People and partner organisations in ${ws.data.workspace.name}' workspace`}
	actions={inviteAction}
>
	<div class="stack" style="gap: 16px">
		<div class="row wrap" style="gap: 10px">
			<div class="grow" style="min-width: 220px">
				<SearchField bind:value={q} placeholder="Search people, organisations, roles" />
			</div>
			<span class="row tight wrap"
				>{#each counts as [k, n] (k)}<Badge tone={STATUS_TONE[k]} dot>{n} {k}</Badge>{/each}</span
			>{#if app.bp === 'phone'}<Button variant="primary" icon="user-plus" onclick={() => (invite = true)}>Invite</Button
				>{/if}
		</div>
		{#if app.bp === 'phone'}
			<div class="list">
				{#each rows as u (u.id)}<div class="list-row" style="grid-template-columns: 40px minmax(0,1fr) auto">
						<Avatar person={u} size="sm" /><span class="stack tight" style="gap: 0"
							><b class="t-subhead">{u.name}</b><span class="t-caption subtle"
								>{ws.data.roles[u.role]} · {providerOf(u)}</span
							></span
						><span class="row tight"
							><Badge size="sm" tone={STATUS_TONE[u.status]}>{u.status}</Badge><span style="position: relative"
								>{@render menu(u)}</span
							></span
						>
					</div>{/each}
			</div>
		{:else}
			<DataTable
				label="Users"
				{rows}
				initialSort={['name', 'asc']}
				columns={[
					{ key: 'name', label: 'Person or organisation', cell: person },
					{ key: 'role', label: 'Role', sortValue: (u) => ws.data.roles[u.role], cell: role },
					{ key: 'kind', label: 'Access', sortValue: (u) => kinds(ws.data.workspace)[u.kind], cell: kind },
					{ key: 'provider', label: 'Sign-in', cell: provider },
					{ key: 'status', label: 'Status', cell: status },
					{ key: 'act', label: '', sortable: false, cell: act }
				] satisfies Column<User>[]}
			/>
		{/if}
		<p class="t-footnote subtle" style="margin: 0">{ws.data.workspace.outside}</p>
	</div>
	<Sheet
		bind:open={invite}
		title="Invite someone"
		side={app.bp === 'phone' ? 'bottom' : 'center'}
		detent="medium"
		footer={sendInvite}
	>
		<div class="stack">
			<Field label="Name or organisation" htmlFor="inv-name"
				><Input id="inv-name" bind:value={form.name} placeholder={ws.data.workspace.invite.name} /></Field
			>
			<Field
				label="Email or mobile number"
				htmlFor="inv-contact"
				help={`${ws.data.workspace.short} staff sign in with their ${ws.data.workspace.emailDomain} Google account; the trade signs in with a one-time code at ${ws.data.workspace.domain}.`}
				><Input id="inv-contact" bind:value={form.contact} placeholder={ws.data.workspace.invite.contact} /></Field
			>
			<Field label="Role" htmlFor="inv-role"
				><Select id="inv-role" bind:value={form.role}
					>{#each choices as [k, v] (k)}<option value={k}>{v}</option>{/each}</Select
				></Field
			>
		</div>
	</Sheet>
	<Sheet
		open={!!roleFor}
		onclose={() => (roleFor = null)}
		title={roleFor ? 'Role for ' + (roleFor.short || roleFor.name) : ''}
		side={app.bp === 'phone' ? 'bottom' : 'center'}
		detent="medium"
	>
		{#if roleFor}{@const u = roleFor}
			<div class="list">
				{#each choices as [k, v] (k)}<button
						type="button"
						class="list-row"
						style="grid-template-columns: minmax(0,1fr) auto; width: 100%; text-align: left"
						onclick={() => setRole(u, k)}
						><span>{v}</span>{#if u.role === k}<Icon name="check" size={18} />{/if}</button
					>{/each}
			</div>{/if}
	</Sheet>
</Screen>
