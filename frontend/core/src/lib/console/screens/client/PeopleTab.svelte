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
		Wait,
		type Column
	} from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import MoreMenu, { type MoreItem } from '../MoreMenu.svelte';
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
	// the access pressed waits in its row (SC-152): a spinner in the tick's place, the sheet closing once it is saved,
	// and a refusal under the list
	const accessWait = new Wait();
	let pressed: Access | null = $state(null);
	function setAccess(p: ClientPerson, a: Access) {
		if (accessWait.working) return;
		pressed = a;
		void accessWait.run(async () => {
			await k.act(() => api.updatePerson(c.id, p.id, { access: a }), `${p.name}: ${a}`);
			accessFor = null;
		});
	}
	$effect(() => {
		if (!accessFor) accessWait.refuse(null);
	});
	// the menu's items that call the platform wait at its "…" button (MoreMenu)
	const menuFor = (p: ClientPerson): (MoreItem | null)[] => [
		{ label: 'Change access', icon: 'user-cog', onclick: () => (accessFor = p) },
		p.status === 'invited'
			? {
					label: 'Resend invitation',
					icon: 'send',
					action: () => k.act(() => api.resendInvite(c.id, p.id), `Invitation resent to ${p.name}`),
					busy: 'Resending the invitation…',
					done: 'Invitation resent'
				}
			: null,
		p.status === 'deactivated'
			? {
					label: 'Reactivate',
					icon: 'user-check',
					action: () => setStatus(p, 'active'),
					busy: 'Reactivating…',
					done: 'Reactivated'
				}
			: {
					label: 'Deactivate',
					icon: 'user-x',
					danger: true,
					action: () => setStatus(p, 'deactivated'),
					busy: 'Deactivating…',
					done: 'Deactivated'
				}
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
				{#each ACCESS as a (a)}{@const waiting = accessWait.working && pressed === a}<button
						type="button"
						class="list-row"
						style="grid-template-columns: minmax(0,1fr) auto; width: 100%; text-align: left"
						aria-busy={waiting || undefined}
						aria-disabled={accessWait.working || undefined}
						onclick={() => setAccess(p, a)}
						><span class="stack tight" style="gap: 0"
							><b class="t-subhead">{a}</b><span class="t-caption subtle"
								>{waiting && accessWait.face === 'busy' ? 'Saving…' : ACCESS_TEXT[a]}</span
							></span
						>{#if waiting && accessWait.face === 'busy'}<svg
								class="btn-arc"
								width="18"
								height="18"
								viewBox="0 0 20 20"
								aria-hidden="true"
								><circle
									cx="10"
									cy="10"
									r="7.5"
									fill="none"
									stroke="currentColor"
									stroke-opacity="0.28"
									stroke-width="2.25"
								/><path
									d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5"
									fill="none"
									stroke="currentColor"
									stroke-width="2.25"
									stroke-linecap="round"
								/></svg
							>{:else if p.access === a}<Icon name="check" size={18} />{/if}</button
					>{/each}
			</div>
			{#if accessWait.phase === 'error'}<p class="btn-note err" role="alert" style="max-width: none">
					<Icon name="circle-alert" size={14} /><span>{accessWait.error}</span>
				</p>{/if}{/if}
	</Sheet>
</div>
