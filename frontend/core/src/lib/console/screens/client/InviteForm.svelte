<script lang="ts" module>
	import type { Access } from '@smart-clearance/api/console';

	export const ACCESS: Access[] = ['Approver', 'Admin', 'Member', 'Partner'];
</script>

<script lang="ts">
	import { inviteError, type Client } from '@smart-clearance/api/console';
	import { Button, Field, Input, refusal, Select } from '../../../index';
	import { useConsole } from '../../console.svelte';

	// an invitation to a client's workspace is an email address only (SC-68): staff at its email domain, partners at any
	// address. They sign in with it and the default password, which the operator hands over; nothing is ever mailed
	let { c, ondone }: { c: Client; ondone?: () => void } = $props();
	const k = useConsole();
	let f = $state({ name: '', contact: '', access: 'Member' as Access });
	let err = $state('');
	// Invite waits on the platform and lets go once the invitation is saved (SC-152): a refusal is said under it, with
	// Try again; what the form finds wrong stays beside the email, as before
	let busy = $state(false);
	let refused: string | null = $state(null);

	async function send() {
		if (busy) return;
		const problem = inviteError(f, c);
		if (problem) return void (err = problem);
		const name = f.name.trim();
		refused = null;
		busy = true;
		try {
			await k.act(
				() => k.api.invitePerson(c.id, { ...$state.snapshot(f), contact: f.contact.trim().toLowerCase() }),
				`${name} can sign in with the default password`
			);
		} catch (e) {
			refused = refusal(e);
			busy = false;
			return;
		}
		busy = false;
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
	<Field label="Email" htmlFor="inv-contact" error={err || null}
		><Input
			id="inv-contact"
			icon="mail"
			type="email"
			bind:value={f.contact}
			oninput={() => (err = '')}
			autocomplete="off"
			spellcheck={false}
			autocapitalize="none"
			placeholder="name@{c.emailDomain}"
		/></Field
	>
	<Field label="Access" htmlFor="inv-access"
		><Select id="inv-access" bind:value={f.access}
			>{#each ACCESS as a (a)}<option>{a}</option>{/each}</Select
		></Field
	>
	<p class="t-footnote subtle" style="margin: 0">
		{c.name} staff need a {c.emailDomain} address; partners use any address. They sign in with it and the default password,
		which you hand over. Nothing is sent by email.
	</p>
	<Button
		type="submit"
		variant="primary"
		icon="user-plus"
		loading={busy}
		error={refused}
		onretry={send}
		busy="Inviting…"
		done="Invited">Invite</Button
	>
</form>
