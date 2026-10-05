<script lang="ts">
	import type { Access, Client, ClientPerson, PersonStatus } from '@smart-clearance/api/console';
	import {
		Avatar,
		Badge,
		Button,
		Card,
		DataTable,
		Icon,
		SearchField,
		Sheet,
		useApp,
		type Column,
		type MenuItem
	} from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import MoreMenu from '../MoreMenu.svelte';
	import InviteForm, { ACCESS } from './InviteForm.svelte';

	// the people in a client's workspace: who they are, how they sign in, their access; invite, change access, deactivate
	let { c }: { c: Client } = $props();
	const app = useApp();
	const k = useConsole();
	let q = $state('');
	let invite = $state(false);
	let accessFor: ClientPerson | null = $state(null);
	const rows = $derived(
		c.people.filter((p) => !q || `${p.name} ${p.org} ${p.role}`.toLowerCase().includes(q.toLowerCase()))
	);
	const count = (s: PersonStatus) => c.people.filter((p) => p.status === s).length;
	const tone = (s: PersonStatus) => (s === 'active' ? 'green' : undefined);
	const ACCESS_TEXT: Record<Access, string> = {
		Approver: 'Approves plans with one tap',
		Admin: "Runs the workspace's people and guardrails",
		Member: 'Sees batches, money and reports',
		Partner: 'A distributor, kirana or food bank'
	};

	const setStatus = (p: ClientPerson, status: 'active' | 'deactivated') =>
		k.act(
			() => api.updatePerson(c.id, p.id, { status }),
			`${p.name} ${status === 'deactivated' ? 'deactivated' : 'reactivated'}`
		);
	async function setAccess(p: ClientPerson, access: Access) {
		await k.act(() => api.updatePerson(c.id, p.id, { access }), `${p.name}: ${access}`);
		accessFor = null;
	}
	const menuFor = (p: ClientPerson): (MenuItem | null)[] => [
		{ label: 'Change access', icon: 'user-cog', onclick: () => (accessFor = p) },
		p.status === 'invited'
			? {
					label: 'Resend invitation',
					icon: 'send',
					onclick: () => k.act(() => api.resendInvite(c.id, p.id), `Invitation resent to ${p.name}`)
				}
			: null,
		p.status === 'deactivated'
			? { label: 'Reactivate', icon: 'user-check', onclick: () => setStatus(p, 'active') }
			: { label: 'Deactivate', icon: 'user-x', danger: true, onclick: () => setStatus(p, 'deactivated') }
	];
</script>

{#snippet person(p: ClientPerson)}<span class="row tight"
		><Avatar person={p} size="sm" /><span class="stack tight" style="gap: 0"
			><b>{p.name}</b><span class="t-caption subtle">{p.org}</span></span
		></span
	>{/snippet}
{#snippet access(p: ClientPerson)}{#if p.access === 'Approver'}<Badge size="sm" tone="amber">Approver</Badge
		>{:else}{p.access}{/if}{/snippet}
{#snippet status(p: ClientPerson)}<Badge size="sm" tone={tone(p.status)} dot>{p.status}</Badge>{/snippet}
{#snippet actions(p: ClientPerson)}<MoreMenu
		label="Actions for {p.name}"
		width={210}
		style="position: relative; display: inline-block"
		items={menuFor(p)}
	/>{/snippet}

<div class="stack" style="gap: 16px">
	<div class="row wrap" style="gap: 10px">
		<div class="grow" style="min-width: 220px"><SearchField bind:value={q} placeholder="Search people" /></div>
		<span class="row tight wrap"
			><Badge tone="green" dot>{count('active')} active</Badge><Badge dot>{count('invited')} invited</Badge></span
		>{#if app.bp !== 'desktop'}<Button variant="primary" icon="user-plus" onclick={() => (invite = true)}>Invite</Button
			>{/if}
	</div>
	<div class={app.bp === 'desktop' ? 'cs-people' : ''}>
		{#if app.bp === 'phone'}
			<div class="list">
				{#each rows as p (p.id)}<div class="list-row" style="grid-template-columns: 36px minmax(0,1fr) auto">
						<Avatar person={p} size="sm" /><span class="stack tight" style="gap: 0; min-width: 0"
							><b class="t-subhead">{p.name}</b><span class="t-caption subtle">{p.role} · {p.provider}</span></span
						><span class="row tight"
							><Badge size="sm" tone={tone(p.status)} dot>{p.status}</Badge><MoreMenu
								label="Actions for {p.name}"
								width={210}
								items={menuFor(p)}
							/></span
						>
					</div>{/each}
			</div>
		{:else}
			<DataTable
				label="People in {c.name}'s workspace"
				{rows}
				initialSort={['name', 'asc']}
				columns={[
					{ key: 'name', label: 'Person', cell: person },
					{ key: 'role', label: 'Role' },
					{ key: 'provider', label: 'Signs in with' },
					{ key: 'access', label: 'Access', cell: access },
					{ key: 'status', label: 'Status', cell: status },
					{ key: 'act', label: '', sortable: false, cell: actions }
				] satisfies Column<ClientPerson>[]}
			/>
		{/if}
		{#if app.bp === 'desktop'}<Card class="cs-invite"><b class="t-headline">Invite a person</b><InviteForm {c} /></Card
			>{/if}
	</div>
	{#if app.bp !== 'desktop'}<Sheet
			bind:open={invite}
			title="Invite a person"
			side={app.bp === 'phone' ? 'bottom' : 'center'}
			detent="large"><InviteForm {c} ondone={() => (invite = false)} /></Sheet
		>{/if}
	<Sheet
		open={!!accessFor}
		onclose={() => (accessFor = null)}
		title={accessFor ? `Access for ${accessFor.name}` : ''}
		side={app.bp === 'phone' ? 'bottom' : 'center'}
		detent="medium"
	>
		{#if accessFor}{@const p = accessFor}
			<div class="list">
				{#each ACCESS as a (a)}<button
						type="button"
						class="list-row"
						style="grid-template-columns: minmax(0,1fr) auto; width: 100%; text-align: left"
						onclick={() => setAccess(p, a)}
						><span class="stack tight" style="gap: 0"
							><b class="t-subhead">{a}</b><span class="t-caption subtle">{ACCESS_TEXT[a]}</span></span
						>{#if p.access === a}<Icon name="check" size={18} />{/if}</button
					>{/each}
			</div>{/if}
	</Sheet>
</div>
