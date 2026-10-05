<script lang="ts">
	import { ApiError, staffInviteError, type Staff, type StaffRole } from '@smart-clearance/api/console';
	import {
		Avatar,
		Badge,
		Button,
		DataTable,
		Field,
		Input,
		Select,
		Sheet,
		useApp,
		type Column
	} from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '#lib/api/client.ts';
	import { refresh, staffQuery } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import Screen from '#lib/screens/Screen.svelte';

	// Smart-Clearance's own people who can sign in to the console, and an invitation for a colleague
	const ROLES: StaffRole[] = ['Super admin', 'Platform engineer', 'Support'];
	const app = useApp();
	const k = useConsole();
	const staff = createQuery(() => staffQuery());
	let invite = $state(false);
	let f = $state({ name: '', email: '', role: 'Support' as StaffRole });
	let err = $state('');
	let busy = $state(false);

	async function send() {
		const problem = staffInviteError(f);
		if (problem) return void (err = problem);
		const name = f.name.trim();
		busy = true;
		try {
			await api.inviteStaff($state.snapshot(f));
		} catch (e) {
			err = e instanceof ApiError ? e.message : 'The invitation did not go out. Try again.';
			return;
		} finally {
			busy = false;
		}
		await refresh();
		k.notices.toast({ text: `Invitation sent to ${name}`, tone: 'ok' });
		invite = false;
		f = { name: '', email: '', role: 'Support' };
		err = '';
	}
</script>

{#snippet person(x: Staff)}<span class="row tight"
		><Avatar person={x} size="sm" /><span class="stack tight" style="gap: 0"
			><b>{x.name}</b><span class="t-caption subtle">{x.email}</span></span
		></span
	>{/snippet}
{#snippet status(x: Staff)}<Badge size="sm" tone={x.status === 'active' ? 'green' : undefined} dot>{x.status}</Badge
	>{/snippet}

<Screen title="Staff" sub="Smart-Clearance people who can sign in to the console">
	{#snippet actions()}<Button variant="primary" size="sm" icon="user-plus" onclick={() => (invite = true)}
			>Invite</Button
		>{/snippet}
	<DataTable
		label="Console staff"
		rows={staff.data ?? []}
		columns={[
			{ key: 'name', label: 'Person', cell: person },
			{ key: 'role', label: 'Role' },
			{ key: 'team', label: 'Team' },
			{ key: 'passkey', label: 'Passkey' },
			{ key: 'status', label: 'Status', cell: status }
		] satisfies Column<Staff>[]}
	/>
	<Sheet bind:open={invite} title="Invite a colleague" side={app.bp === 'phone' ? 'bottom' : 'center'} detent="large">
		{#snippet footer()}<Button variant="primary" size="lg" block icon="send" loading={busy} onclick={send}
				>Send invitation</Button
			>{/snippet}
		<div class="stack" style="gap: 12px">
			<Field label="Name" htmlFor="st-name"><Input id="st-name" bind:value={f.name} oninput={() => (err = '')} /></Field
			>
			<Field label="smartclearance.com email" htmlFor="st-email" error={err || null}
				><Input
					id="st-email"
					type="email"
					bind:value={f.email}
					oninput={() => (err = '')}
					spellcheck={false}
					autocapitalize="none"
					placeholder="name@smartclearance.com"
				/></Field
			>
			<Field label="Role" htmlFor="st-role"
				><Select id="st-role" bind:value={f.role}
					>{#each ROLES as x (x)}<option>{x}</option>{/each}</Select
				></Field
			>
			<p class="t-footnote subtle" style="margin: 0">They sign in with Google and set up a passkey on first sign-in.</p>
		</div>
	</Sheet>
</Screen>
