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
	import { isEmail } from '../../../identity';
	import { useNotice } from '../../../notice.svelte';
	import { kinds, PROVIDER_ICONS, providerOf, STATUS_TONE } from '../../model';
	import { useWorkspace } from '../../source';
	import type { RoleId, User, UserStatus } from '../../types';
	import Screen from '../common/Screen.svelte';
	import RowMenu from './RowMenu.svelte';

	// users: the people and partner organisations in the workspace, how each signs in and their status; invite someone,
	// change a role, deactivate or reactivate (screens/admin.jsx Users). An invitation is an email address only, as the
	// console's (SC-68): the workspace's staff on its own domain, partners on any address; they sign in with it and the
	// default password, which the admin hands over, and nothing is emailed
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
	// the roles the client's own staff hold; the others are its partners'
	const STAFF: RoleId[] = ['operator', 'admin'];
	const domain = $derived(ws.data.workspace.emailDomain);
	let err = $state('');
	const send = () => {
		const name = form.name.trim();
		const email = form.contact.trim().toLowerCase();
		err = '';
		if (!name) return void (err = 'Enter a name.');
		if (!isEmail(email)) return void (err = `Enter an email address, such as name@${domain}.`);
		if (STAFF.includes(form.role) && !email.endsWith('@' + domain))
			return void (err = `${ws.data.workspace.short} staff need a ${domain} address. Partners can use any address.`);
		void ws.invite({ name, contact: email, role: form.role });
		invite = false;
		form = { name: '', contact: '', role: 'retailer' };
		toast({ text: `${name} can sign in with the default password`, tone: 'ok' });
	};
	const setRole = (u: User, k: RoleId) => {
		void ws.setUserRole(u.id, k);
		toast({ text: 'Role updated', tone: 'ok' });
		roleFor = null;
	};
	const signInIcon = (u: User): IconName => PROVIDER_ICONS[u.provider];
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

{#snippet sendInvite()}<Button variant="primary" block icon="user-plus" onclick={send}>Invite</Button>{/snippet}

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
		onclose={() => (err = '')}
		title="Invite someone"
		side={app.bp === 'phone' ? 'bottom' : 'center'}
		detent="medium"
		footer={sendInvite}
	>
		<div class="stack">
			<Field label="Name or organisation" htmlFor="inv-name"
				><Input
					id="inv-name"
					bind:value={form.name}
					oninput={() => (err = '')}
					placeholder={ws.data.workspace.invite.name}
				/></Field
			>
			<Field label="Email" htmlFor="inv-contact" error={err || null}
				><Input
					id="inv-contact"
					icon="mail"
					type="email"
					bind:value={form.contact}
					oninput={() => (err = '')}
					autocomplete="off"
					spellcheck={false}
					autocapitalize="none"
					placeholder={`name@${domain}`}
				/></Field
			>
			<Field label="Role" htmlFor="inv-role"
				><Select id="inv-role" bind:value={form.role}
					>{#each choices as [k, v] (k)}<option value={k}>{v}</option>{/each}</Select
				></Field
			>
			<p class="t-footnote subtle" style="margin: 0">
				{ws.data.workspace.short} staff need a {domain} address; partners use any address. They sign in with it and the default
				password, which you hand over. Nothing is sent by email.
			</p>
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
