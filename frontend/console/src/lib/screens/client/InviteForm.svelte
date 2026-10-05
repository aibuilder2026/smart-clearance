<script lang="ts" module>
	import type { Access } from '@smart-clearance/api/console';

	export const ACCESS: Access[] = ['Approver', 'Admin', 'Member', 'Partner'];
</script>

<script lang="ts">
	import { ApiError, inviteError, type Client } from '@smart-clearance/api/console';
	import { Button, Field, Input, Select } from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { refresh } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';

	// an invitation to a client's workspace: staff at its email domain, partners at any address or a mobile number
	let { c, ondone }: { c: Client; ondone?: () => void } = $props();
	const k = useConsole();
	let f = $state({ name: '', contact: '', access: 'Member' as Access });
	let err = $state('');
	let busy = $state(false);

	async function send() {
		const problem = inviteError(f, c);
		if (problem) return void (err = problem);
		busy = true;
		const name = f.name.trim();
		try {
			await api.invitePerson(c.id, $state.snapshot(f));
		} catch (e) {
			err = e instanceof ApiError ? e.message : 'The invitation did not go out. Try again.';
			return;
		} finally {
			busy = false;
		}
		await refresh();
		k.notices.toast({ text: `Invitation sent to ${name}`, tone: 'ok' });
		f = { name: '', contact: '', access: 'Member' };
		err = '';
		ondone?.();
	}
</script>

<form
	class="stack"
	style="gap: 12px"
	novalidate
	onsubmit={(e) => {
		e.preventDefault();
		void send();
	}}
>
	<Field label="Name" htmlFor="inv-name"
		><Input id="inv-name" bind:value={f.name} oninput={() => (err = '')} placeholder="Name or organisation" /></Field
	>
	<Field label="Work email or mobile number" htmlFor="inv-contact" error={err || null}
		><Input
			id="inv-contact"
			bind:value={f.contact}
			oninput={() => (err = '')}
			autocomplete="off"
			spellcheck={false}
			placeholder="name@{c.emailDomain}"
		/></Field
	>
	<Field label="Access" htmlFor="inv-access"
		><Select id="inv-access" bind:value={f.access}
			>{#each ACCESS as a (a)}<option>{a}</option>{/each}</Select
		></Field
	>
	<p class="t-footnote subtle" style="margin: 0">
		{c.name} staff need a {c.emailDomain} address; partners sign in with a code or by invitation.
	</p>
	<Button type="submit" variant="primary" icon="send" loading={busy}>Send invitation</Button>
</form>
